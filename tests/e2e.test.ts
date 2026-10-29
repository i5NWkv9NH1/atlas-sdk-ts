// * Atlas TypeScript SDK Live E2E Test Suite
// * Strictly adheres to Section 5.2 safety redlines: non-destructive, isolated temporary test item only.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { unlinkSync } from "node:fs";
import { AtlasClient } from "../src/index.js";

const TEST_IMAGE_PATH = "/tmp/atlas-sdk-e2e-test.png";

// * Minimal valid 1x1 PNG base64 representation
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("Atlas TypeScript SDK Live E2E Tests (Non-Destructive)", () => {
  let client: AtlasClient;
  let isServerRunning = false;
  let testItemId: string | undefined;

  beforeAll(async () => {
    client = new AtlasClient();
    isServerRunning = await client.ping();
    // ! Mandatory assertion: Atlas MCP server must be running and responsive
    expect(isServerRunning).toBe(true);
  });

  afterAll(async () => {
    // ! 5.2 Teardown: Safely move temporary test item to Trash if not already cleaned
    try {
      if (testItemId) {
        const idToTrash = testItemId;
        testItemId = undefined;
        await client.trashItems({ item_ids: [idToTrash] });
      }
    } catch {
      // ? Suppress teardown errors
    }

    // ! Delete temporary disk file
    try {
      const file = Bun.file(TEST_IMAGE_PATH);
      if (await file.exists()) {
        unlinkSync(TEST_IMAGE_PATH);
      }
    } catch {
      // ? Suppress file deletion errors
    }
  });

  // * ========================================================================
  // * 1. Safe Read-Only Queries
  // * ========================================================================
  test("Safe Read-Only Invocations: verifies live server metadata and structure", async () => {
    // ! Strictly assert live connection without skipping
    expect(isServerRunning).toBe(true);

    // 1. Ping
    const pingOk = await client.ping();
    expect(pingOk).toBe(true);

    // 2. App Info
    const appInfo = await client.appInfo();
    expect(appInfo.name).toBe("Atlas");
    expect(typeof appInfo.version).toBe("string");
    expect(typeof appInfo.build).toBe("number");

    // 3. Library Info
    const libInfo = await client.libraryInfo();
    expect(libInfo.name).toBeTruthy();
    expect(typeof libInfo.unique_items).toBe("number");
    expect(libInfo.unique_items).toBeGreaterThan(0);

    // 4. List Libraries
    const libraries = await client.listLibraries();
    expect(Array.isArray(libraries.libraries)).toBe(true);
    expect(libraries.libraries.length).toBeGreaterThan(0);

    // 5. List Collections
    const collections = await client.listCollections();
    expect(Array.isArray(collections.collections)).toBe(true);

    // 6. List Tags
    const tags = await client.listTags();
    expect(Array.isArray(tags.tags)).toBe(true);
  });

  // * ========================================================================
  // * 2. Live Schema Parity & Skill Resource
  // * ========================================================================
  test("Live Schema Parity & Skill Resource: server reports 78 tools and non-empty atlas://skill", async () => {
    expect(isServerRunning).toBe(true);

    // 1. List tools and assert all 78 live tools are implemented on client
    const toolsRes = await client.listTools();
    expect(Array.isArray(toolsRes.tools)).toBe(true);
    expect(toolsRes.tools.length).toBe(78);

    const clientRecord = client as unknown as Record<string, unknown>;
    for (const tool of toolsRes.tools) {
      const snakeName = tool.name;
      const camelName = snakeName.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
      expect(typeof clientRecord[snakeName]).toBe("function");
      expect(typeof clientRecord[camelName]).toBe("function");
    }

    // 2. Read official skill resource
    const skillRes = await client.readResource("atlas://skill");
    expect(Array.isArray(skillRes.contents)).toBe(true);
    expect(skillRes.contents.length).toBeGreaterThan(0);
    const skillDoc = skillRes.contents[0];
    expect(skillDoc?.uri).toBe("atlas://skill");
    expect(typeof skillDoc?.text).toBe("string");
    expect((skillDoc?.text ?? "").length).toBeGreaterThan(50);
  });

  // * ========================================================================
  // * 3. Isolated Temporary Ingestion, Mutation, and Teardown Verification
  // * ========================================================================
  test("Isolated Temporary Ingestion: imports /tmp test PNG, mutates metadata/tags, and trashes", async () => {
    expect(isServerRunning).toBe(true);

    // * Step 1: Dynamically generate temporary 1x1 PNG file
    const buffer = Buffer.from(TINY_PNG_BASE64, "base64");
    await Bun.write(TEST_IMAGE_PATH, buffer);
    expect(await Bun.file(TEST_IMAGE_PATH).exists()).toBe(true);

    try {
      // * Step 2: Import temporary file into active library
      const importResult = await client.importFiles({ paths: [TEST_IMAGE_PATH] });
      expect(importResult.ok).toBe(true);

      // * Step 3: Capture created testItemId from import result or recent search
      const resultObj = importResult as unknown as Record<string, unknown>;
      let extractedId: string | undefined;

      if (Array.isArray(resultObj.item_ids) && resultObj.item_ids[0]) {
        extractedId = String(resultObj.item_ids[0]);
      } else if (Array.isArray(resultObj.items) && (resultObj.items[0] as { id?: string })?.id) {
        extractedId = (resultObj.items[0] as { id: string }).id;
      } else if (typeof resultObj.item_id === "string") {
        extractedId = resultObj.item_id;
      }

      if (!extractedId) {
        const recent = await client.searchItems({
          query: "atlas-sdk-e2e-test.png",
          limit: 1,
          sort: "date_added",
          order: "desc",
        });
        extractedId = recent.items[0]?.id;
      }

      expect(extractedId).toBeTruthy();
      testItemId = extractedId;

      if (!testItemId) {
        throw new Error("Failed to capture imported test item ID");
      }

      // * Step 4: Mutate metadata and tags strictly on testItemId
      const metaRes = await client.setMetadata({
        item_id: testItemId,
        annotation: "atlas-sdk-e2e-verification-ok",
      });
      expect(metaRes.ok).toBe(true);

      const tagRes = await client.addTags({
        item_ids: [testItemId],
        tags: ["e2e-test-tag"],
      });
      expect(tagRes.ok).toBe(true);

      // * Step 5: Read back item details and verify mutated state
      const itemDetail = await client.getItem({ item_id: testItemId });
      expect(itemDetail.id).toBe(testItemId);
      expect(itemDetail.annotation).toBe("atlas-sdk-e2e-verification-ok");
      expect(itemDetail.tags).toContain("e2e-test-tag");
    } finally {
      // * Step 6: Move test item to trash in teardown (set testItemId = undefined to avoid double trash)
      if (testItemId) {
        const idToTrash = testItemId;
        testItemId = undefined;
        const trashRes = await client.trashItems({ item_ids: [idToTrash] });
        expect(trashRes.ok).toBe(true);
      }
    }
  });
});
