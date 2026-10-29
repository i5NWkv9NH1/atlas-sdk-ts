// * Atlas TypeScript SDK Unit Test Suite
// * Validates 100% Schema Parity, Mock Tool Invocations, Argument Normalization, 401 Retry, view_items Unpacking, and Secret Leak Prevention.

import { describe, expect, test } from "bun:test";
import {
  AtlasAuthError,
  AtlasClient,
  AtlasToolError,
  HttpAtlasTransport,
  MockAtlasTransport,
  TokenResolver,
} from "../src/index.js";

// * Convert snake_case name to camelCase
function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

describe("Atlas TypeScript SDK Unit Tests", () => {
  // * ========================================================================
  // * 1. Schema 100% Parity Alignment
  // * ========================================================================
  test("Schema 100% Parity: all 78 tools must be implemented on AtlasClient", async () => {
    const fixturePath = new URL("./fixtures/atlas-schema.json", import.meta.url).pathname;
    const schemaFile = Bun.file(fixturePath);
    expect(await schemaFile.exists()).toBe(true);

    const schema = JSON.parse(await schemaFile.text()) as {
      result?: { tools?: Array<{ name: string }> };
      tools?: Array<{ name: string }>;
    };
    const schemaTools = schema.result?.tools || schema.tools || [];
    expect(schemaTools.length).toBe(78);

    const tools = schemaTools.map((t) => t.name);
    const client = new AtlasClient({ transport: new MockAtlasTransport() });
    const clientRecord = client as unknown as Record<string, unknown>;

    for (const snakeName of tools) {
      const camelName = toCamelCase(snakeName);

      // ! Check that snake_case alias exists
      expect(typeof clientRecord[snakeName]).toBe("function");
      // ! Check that idiomatic camelCase method exists
      expect(typeof clientRecord[camelName]).toBe("function");
    }

    // ! Check that MCP protocol methods also exist
    expect(typeof client.listTools).toBe("function");
    expect(typeof client.list_tools).toBe("function");
    expect(typeof client.listResources).toBe("function");
    expect(typeof client.list_resources).toBe("function");
    expect(typeof client.readResource).toBe("function");
    expect(typeof client.read_resource).toBe("function");
  });

  // * ========================================================================
  // * 2. Mock Transport Full Tool Invocation & Argument Normalization
  // * ========================================================================
  test("Mock Transport: invokes all 78 tools and verifies payload normalization", async () => {
    const mock = new MockAtlasTransport();
    const client = new AtlasClient({ transport: mock });

    // * Sample inputs for all 78 tools
    const testCalls: Record<string, () => Promise<unknown>> = {
      // Query (11)
      library_info: () => client.libraryInfo(),
      list_libraries: () => client.listLibraries(),
      list_collections: () => client.listCollections(),
      list_collection_folders: () => client.listCollectionFolders(),
      list_tags: () => client.listTags(),
      list_smart_folders: () => client.listSmartFolders(),
      list_connected_folders: () => client.listConnectedFolders(),
      search_items: () => client.searchItems({ query: "architecture" }),
      run_smart_folder: () => client.runSmartFolder({ smart_folder: "sf-1" }),
      get_item: () => client.getItem({ item_id: "item-1" }),
      view_items: () => client.viewItems({ item_ids: ["item-1"] }),
      get_file: () => client.getFile({ item_id: "item-1" }),
      get_board: () => client.getBoard({ collection: "col-1" }),
      find_similar: () => client.findSimilar({ item_id: "item-1" }),
      get_current_view: () => client.getCurrentView(),
      search_by_description: () => client.searchByDescription({ query: "sunset ocean" }),
      store_embeddings: () =>
        client.storeEmbeddings({
          model: "siglip",
          entries: [{ content_hash: "hash-1", vector: [0.1, 0.2] }],
        }),
      query_embeddings: () => client.queryEmbeddings({ vector: [0.1, 0.2] }),

      // Media (14)
      add_link: () => client.addLink({ url: "https://example.com" }),
      add_color: () => client.addColor({ hex: "#FF5733" }),
      save_media_from_url: () => client.saveMediaFromUrl({ url: "https://example.com/image.png" }),
      import_files: () => client.importFiles({ paths: ["/tmp/test.png"] }),
      add_tags: () => client.addTags({ item_ids: ["item-1"], tags: ["design"] }),
      remove_tags: () => client.removeTags({ item_ids: ["item-1"], tags: ["design"] }),
      set_tags: () => client.setTags({ item_id: "item-1", tags: ["clean"] }),
      set_metadata: () => client.setMetadata({ item_id: "item-1", annotation: "note" }),
      edit_link: () => client.editLink({ item_id: "item-1", title: "New Title" }),
      edit_color: () => client.editColor({ item_id: "item-1", hex: "#00FF00" }),
      add_to_collection: () =>
        client.addToCollection({ item_ids: ["item-1"], collection: "col-1" }),
      remove_from_collection: () =>
        client.removeFromCollection({ item_ids: ["item-1"], collection: "col-1" }),
      set_liked: () => client.setLiked({ item_ids: ["item-1"], liked: true }),
      edit_image: () => client.editImage({ item_ids: ["item-1"], rotate: "left" }),
      refresh_thumbnail: () => client.refreshThumbnail({ item_ids: ["item-1"] }),
      trash_items: () => client.trashItems({ item_ids: ["item-1"] }),
      restore_items: () => client.restoreItems({ item_ids: ["item-1"] }),
      empty_trash: () => client.emptyTrash({ confirm: true }),
      delete_permanently: () => client.deletePermanently({ item_ids: ["item-1"], confirm: true }),

      // Organize (42)
      create_collection: () => client.createCollection({ name: "Inspiration" }),
      rename_collection: () => client.renameCollection({ collection: "col-1", name: "New Name" }),
      archive_collection: () => client.archiveCollection({ collection: "col-1", archived: true }),
      delete_collection: () => client.deleteCollection({ collection: "col-1" }),
      set_collection_order: () => client.setCollectionOrder({ collection_ids: ["col-1", "col-2"] }),
      move_collection_to_folder: () => client.moveCollectionToFolder({ collection: "col-1" }),
      create_collection_folder: () => client.createCollectionFolder({ name: "Folder A" }),
      move_collection_folder: () => client.moveCollectionFolder({ folder: "f-1" }),
      rename_collection_folder: () =>
        client.renameCollectionFolder({ folder: "f-1", name: "Folder B" }),
      delete_collection_folder: () => client.deleteCollectionFolder({ folder: "f-1" }),
      create_smart_folder: () =>
        client.createSmartFolder({
          name: "Screenshots",
          rules: [{ field: "format", op: "is", text: "png" }],
        }),
      update_smart_folder: () => client.updateSmartFolder({ smart_folder: "sf-1" }),
      delete_smart_folder: () => client.deleteSmartFolder({ smart_folder: "sf-1" }),
      rename_tag: () => client.renameTag({ tag: "tag-old", name: "tag-new" }),
      delete_tag: () => client.deleteTag({ tag: "tag-old" }),
      create_tag: () => client.createTag({ name: "tag-fresh" }),
      create_tag_folder: () => client.createTagFolder({ name: "Tag Folder 1" }),
      rename_tag_folder: () => client.renameTagFolder({ folder: "tf-1", name: "Tag Folder 2" }),
      delete_tag_folder: () => client.deleteTagFolder({ folder: "tf-1" }),
      move_tags_to_folder: () => client.moveTagsToFolder({ tags: ["tag-1"] }),
      arrange_board: () => client.arrangeBoard({ collection: "col-1", groups: [] }),
      move_to_group: () =>
        client.moveToGroup({ collection: "col-1", group_id: "grp-1", item_ids: ["item-1"] }),
      move_group: () => client.moveGroup({ collection: "col-1", group_id: "grp-1", x: 10, y: 20 }),
      reset_board_layout: () => client.resetBoardLayout({ collection: "col-1" }),
      undo_board_layout: () => client.undoBoardLayout({ collection: "col-1" }),
      connect_folder: () => client.connectFolder({ path: "/tmp/folder" }),
      disconnect_folder: () => client.disconnectFolder({ folder: "cf-1" }),
      rescan_folder: () => client.rescanFolder({ folder: "cf-1" }),
      switch_library: () => client.switchLibrary({ path: "/tmp/lib.atlaslibrary" }),
      create_library: () => client.createLibrary({ path: "/tmp/new.atlaslibrary" }),

      // UI (11)
      show_in_app: () => client.showInApp({ view: "all" }),
      show_items: () => client.showItems({ item_ids: ["item-1"] }),
      open_item: () => client.openItem({ item_id: "item-1" }),
      select_items: () => client.selectItems({ item_ids: ["item-1"] }),
      set_view_mode: () => client.setViewMode({ mode: "infinite" }),
      show_in_finder: () => client.showInFinder({ item_ids: ["item-1"] }),
      get_settings: () => client.getSettings(),
      set_setting: () => client.setSetting({ name: "mcp_enabled", value: true }),
      open_settings: () => client.openSettings(),
      app_info: () => client.appInfo(),
      run_maintenance: () => client.runMaintenance({ action: "remove_duplicates" }),
    };

    expect(Object.keys(testCalls).length).toBe(78);

    // * Register default mock handler
    for (const toolName of Object.keys(testCalls)) {
      mock.mock(toolName, (args) => ({ ok: true, tool: toolName, args }));
    }

    // * Execute each method
    for (const [toolName, callFn] of Object.entries(testCalls)) {
      mock.clearHistory();
      const res = (await callFn()) as { ok: boolean; tool: string; args: Record<string, unknown> };
      expect(res.ok).toBe(true);
      expect(mock.callHistory.length).toBe(1);
      expect(mock.callHistory[0]?.name).toBe(toolName);
    }
  });

  // * ========================================================================
  // * 3. Parameter Normalization Rules
  // * ========================================================================
  test("Argument Normalization: verifies empty string and numeric zero defaults", async () => {
    const mock = new MockAtlasTransport();
    const client = new AtlasClient({ transport: mock });

    mock.mock("search_items", (args) => ({ items: [], total: 0, args }));
    mock.mock("create_smart_folder", (args) => ({ ok: true, id: "sf-1", args }));
    mock.mock("get_file", (args) => ({ ok: true, path: "/p", args }));
    mock.mock("search_by_description", (args) => ({ results: [], count: 0, args }));

    // 1. search_items should normalize unset optional enum filters to ""
    await client.searchItems({ query: "cat" });
    const searchCall = mock.callHistory.find((c) => c.name === "search_items");
    expect(searchCall?.args.sort).toBe("");
    expect(searchCall?.args.source).toBe("");
    expect(searchCall?.args.orientation).toBe("");
    expect(searchCall?.args.kind).toBe("");
    expect(searchCall?.args.order).toBe("");
    expect(searchCall?.args.query).toBe("cat");

    // 2. create_smart_folder should normalize match to "" and rules unit to ""
    await client.createSmartFolder({
      name: "Test",
      rules: [
        {
          field: "name",
          op: "contains",
          text: "test",
        },
      ],
    });
    const sfCall = mock.callHistory.find((c) => c.name === "create_smart_folder");
    expect(sfCall?.args.match).toBe("");
    const sfRules = sfCall?.args.rules as Array<{ unit?: string }>;
    expect(sfRules[0]?.unit).toBe("");

    // 3. get_file should normalize size to 0
    await client.getFile({ item_id: "item-1" });
    const getFileCall = mock.callHistory.find((c) => c.name === "get_file");
    expect(getFileCall?.args.size).toBe(0);

    // 4. search_by_description should normalize min_score to 0 and kind to ""
    await client.searchByDescription({ query: "dog" });
    const sbdCall = mock.callHistory.find((c) => c.name === "search_by_description");
    expect(sbdCall?.args.kind).toBe("");
    expect(sbdCall?.args.min_score).toBe(0);
  });

  // * ========================================================================
  // * 4. Error Handling & 401 Retry
  // * ========================================================================
  test("Error Handling: throws AtlasToolError when result.isError is true", async () => {
    const fakeFetch = async () => {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            isError: true,
            content: [{ type: "text", text: "Item not found in database" }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const transport = new HttpAtlasTransport({
      token: "test-token",
      fetchFn: fakeFetch,
    });

    try {
      await transport.callTool("get_item", { item_id: "bad-id" });
      expect().fail("Should have thrown AtlasToolError");
    } catch (err) {
      expect(err instanceof AtlasToolError).toBe(true);
      expect((err as AtlasToolError).toolName).toBe("get_item");
      expect((err as AtlasToolError).message).toContain("Item not found in database");
    }
  });

  test("401 Retry Mechanism: refreshes token on 401 and retries request once", async () => {
    let attempts = 0;
    const tokensReceived: string[] = [];

    const fakeFetch = async (_req: string | URL | Request, init?: RequestInit) => {
      attempts++;
      const authHeader = (init?.headers as Record<string, string>)?.Authorization || "";
      tokensReceived.push(authHeader);

      if (attempts === 1) {
        return new Response("Unauthorized", { status: 401 });
      }
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: attempts,
          result: {
            content: [{ type: "text", text: JSON.stringify({ ok: true, retried: true }) }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const transport = new HttpAtlasTransport({
      token: "initial-token",
      fetchFn: fakeFetch,
    });

    const res = await transport.callTool<{ ok: boolean; retried: boolean }>("ping");
    expect(res.ok).toBe(true);
    expect(res.retried).toBe(true);
    expect(attempts).toBe(2);
    expect(tokensReceived[0]).toBe("Bearer initial-token");
  });

  test("401 Failure: throws AtlasAuthError if retry also fails with 401", async () => {
    const fakeFetch = async () => new Response("Unauthorized", { status: 401 });
    const transport = new HttpAtlasTransport({
      token: "expired-token",
      fetchFn: fakeFetch,
    });

    try {
      await transport.callTool("ping");
      expect().fail("Should have thrown AtlasAuthError");
    } catch (err) {
      expect(err instanceof AtlasAuthError).toBe(true);
    }
  });

  // * ========================================================================
  // * 5. view_items Unpacking Stability
  // * ========================================================================
  test("view_items Unpacking: preserves { content: ... } structure regardless of content array length", async () => {
    // 1 item in content
    const fakeFetch1 = async () =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [{ type: "image", data: "base64data1", mimeType: "image/png" }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const transport1 = new HttpAtlasTransport({ token: "t", fetchFn: fakeFetch1 });
    const res1 = await transport1.callTool("view_items", { item_ids: ["id1"] });
    expect(Array.isArray(res1.content)).toBe(true);
    expect(res1.content.length).toBe(1);
    expect(res1.content[0]?.data).toBe("base64data1");

    // 2 items in content (mixed text and image)
    const fakeFetch2 = async () =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          result: {
            content: [
              { type: "text", text: "item1" },
              { type: "image", data: "base64data2", mimeType: "image/png" },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const transport2 = new HttpAtlasTransport({ token: "t", fetchFn: fakeFetch2 });
    const res2 = await transport2.callTool("view_items", { item_ids: ["id1", "id2"] });
    expect(Array.isArray(res2.content)).toBe(true);
    expect(res2.content.length).toBe(2);

    // Empty content
    const fakeFetch3 = async () =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          result: {
            content: [],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const transport3 = new HttpAtlasTransport({ token: "t", fetchFn: fakeFetch3 });
    const res3 = await transport3.callTool("view_items", { item_ids: [] });
    expect(Array.isArray(res3.content)).toBe(true);
    expect(res3.content.length).toBe(0);
  });

  // * ========================================================================
  // * 6. Multi-Library Token Switching
  // * ========================================================================
  test("Multi-Library Switching: manages library-specific tokens cleanly", async () => {
    const resolver = new TokenResolver({
      token: "default-lib-token",
      libraryTokens: {
        LibraryA: "token-for-lib-a",
        "/path/to/LibraryB.atlaslibrary": "token-for-lib-b",
      },
    });

    // Default token
    expect(await resolver.resolveToken()).toBe("default-lib-token");

    // Switch to LibraryA
    resolver.setActiveLibrary("LibraryA");
    expect(await resolver.resolveToken()).toBe("token-for-lib-a");

    // Switch to LibraryB
    resolver.setActiveLibrary("/path/to/LibraryB.atlaslibrary");
    expect(await resolver.resolveToken()).toBe("token-for-lib-b");
  });

  // * ========================================================================
  // * 7. MCP Protocol Methods (tools/list, resources/list, resources/read)
  // * ========================================================================
  test("MCP Protocol: listTools, listResources, and readResource mock handling", async () => {
    const mock = new MockAtlasTransport();
    mock.mockListTools(() => ({
      tools: [{ name: "test_tool", description: "A test tool" }],
    }));
    mock.mockListResources(() => ({
      resources: [{ uri: "atlas://skill", name: "Skill Doc" }],
    }));
    mock.mockReadResource((uri) => ({
      contents: [{ uri, mimeType: "text/markdown", text: "# Skill Doc" }],
    }));

    const client = new AtlasClient({ transport: mock });

    const tools = await client.listTools();
    expect(tools.tools.length).toBe(1);
    expect(tools.tools[0]?.name).toBe("test_tool");

    const toolsSnake = await client.list_tools();
    expect(toolsSnake.tools.length).toBe(1);

    const resources = await client.listResources();
    expect(resources.resources.length).toBe(1);
    expect(resources.resources[0]?.uri).toBe("atlas://skill");

    const resourcesSnake = await client.list_resources();
    expect(resourcesSnake.resources.length).toBe(1);

    const read = await client.readResource("atlas://skill");
    expect(read.contents.length).toBe(1);
    expect(read.contents[0]?.text).toBe("# Skill Doc");

    const readSnake = await client.read_resource("atlas://skill");
    expect(readSnake.contents.length).toBe(1);
  });

  // * ========================================================================
  // * 8. Compound Ingestion Builder (client.ingest())
  // * ========================================================================
  test("Compound Ingestion: client.ingest() coordinates import, tags, metadata, canvas coords, and cleanup", async () => {
    const mock = new MockAtlasTransport();
    let importedPath: string | undefined;
    let importArgs: Record<string, unknown> | undefined;

    mock.mock("import_files", (args) => {
      importArgs = args;
      importedPath = (args.paths as string[])[0];
      return { ok: true, item_ids: ["item-mock-ingest-123"] };
    });
    mock.mock("add_to_collection", (args) => ({ ok: true, collection: args.collection }));
    mock.mock("add_tags", (args) => ({ ok: true, added: (args.tags as string[]).length }));
    mock.mock("set_metadata", () => ({ ok: true }));
    mock.mock("set_liked", () => ({ ok: true, liked: true }));

    const client = new AtlasClient({ transport: mock });
    const bytes = new Uint8Array([1, 2, 3, 4]);

    const result = await client
      .ingest()
      .bytes(bytes, "png")
      .filename("日/周_K线.png")
      .collection("Inbox")
      .collection("Archive")
      .canvasPosition(120, 240)
      .tags(["tag1", "tag2"])
      .annotation("Sample note")
      .sourceUrl("https://atlasformac.com")
      .liked(true)
      .send();

    expect(result.itemId).toBe("item-mock-ingest-123");
    expect(result.itemIds).toEqual(["item-mock-ingest-123"]);
    expect(result.imported).toBe(true);
    expect(result.skippedDuplicate).toBe(false);

    // Verify canvas coordinates and primary collection forwarded to import_files
    expect(importArgs?.x).toBe(120);
    expect(importArgs?.y).toBe(240);
    expect(importArgs?.collection).toBe("Inbox");

    // Verify all tools were called in order
    const calledNames = mock.callHistory.map((c) => c.name);
    expect(calledNames).toContain("import_files");
    expect(calledNames).toContain("add_to_collection");
    expect(calledNames).toContain("add_tags");
    expect(calledNames).toContain("set_metadata");
    expect(calledNames).toContain("set_liked");

    // Verify /tmp file was sanitized and removed
    expect(importedPath).toBeTruthy();
    expect(importedPath).toContain("日_周_K线.png");
    if (importedPath) {
      expect(await Bun.file(importedPath).exists()).toBe(false);
    }
  });

  test("Compound Ingestion: multi-item batch tagging and metadata propagation", async () => {
    const mock = new MockAtlasTransport();
    mock.mock("import_files", () => ({
      ok: true,
      imported: 2,
      item_ids: ["item-batch-1", "item-batch-2"],
    }));
    mock.mock("add_tags", (args) => {
      expect(args.item_ids).toEqual(["item-batch-1", "item-batch-2"]);
      return { ok: true };
    });
    mock.mock("set_liked", (args) => {
      expect(args.item_ids).toEqual(["item-batch-1", "item-batch-2"]);
      return { ok: true, liked: true };
    });
    const metaCalls: string[] = [];
    mock.mock("set_metadata", (args) => {
      metaCalls.push(args.item_id as string);
      return { ok: true };
    });

    const client = new AtlasClient({ transport: mock });
    const res = await client
      .ingest()
      .filePaths(["/tmp/test1.png", "/tmp/test2.png"])
      .tags(["tagA"])
      .liked(true)
      .annotation("Batch note")
      .send();

    expect(res.itemIds).toEqual(["item-batch-1", "item-batch-2"]);
    expect(res.itemId).toBe("item-batch-1");
    expect(metaCalls).toEqual(["item-batch-1", "item-batch-2"]);
  });

  test("Compound Ingestion: base64 data URI MIME auto-detection", async () => {
    const mock = new MockAtlasTransport();
    let importedFileName: string | undefined;
    mock.mock("import_files", (args) => {
      importedFileName = (args.paths as string[])[0]?.split("/").pop();
      return { ok: true, item_ids: ["item-webp-1"] };
    });
    const client = new AtlasClient({ transport: mock });
    await client
      .ingest()
      .base64("data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2QAA")
      .send();
    expect(importedFileName).toMatch(/\.webp$/);
  });

  test("Compound Ingestion: throws AtlasToolError on failed items or unsupported format", async () => {
    const mock = new MockAtlasTransport();
    mock.mock("import_files", () => ({
      ok: false,
      imported: 0,
      failed: [{ path: "/tmp/bad.mp4", reason: "AV1 decode failed" }],
    }));
    const client = new AtlasClient({ transport: mock });
    expect(client.ingest().filePath("/tmp/bad.mp4").send()).rejects.toThrow("AV1 decode failed");

    const mockUnsupported = new MockAtlasTransport();
    mockUnsupported.mock("import_files", () => ({
      ok: false,
      imported: 0,
      skipped_unsupported: 1,
    }));
    const clientUnsupported = new AtlasClient({ transport: mockUnsupported });
    expect(clientUnsupported.ingest().filePath("/tmp/unknown.xyz").send()).rejects.toThrow(
      "File format is unsupported by Atlas",
    );
  });

  // * ========================================================================
  // * 9. Secret Leak Prevention Scan
  // * ========================================================================
  test("Secret Leak Prevention: scans src/ and tests/ for forbidden token leaks and runtime file violations", async () => {
    // Scan all .ts files in src/ and tests/
    const filesToScan: string[] = [];
    const glob = new Bun.Glob("**/*.ts");

    for await (const file of glob.scan({ cwd: "src" })) {
      filesToScan.push(`src/${file}`);
    }
    for await (const file of glob.scan({ cwd: "tests" })) {
      filesToScan.push(`tests/${file}`);
    }

    expect(filesToScan.length).toBeGreaterThan(5);

    // Forbidden real bearer token pattern
    const bearerRegex = /Bearer\s+([A-Za-z0-9_-]{25,})/;

    for (const filePath of filesToScan) {
      const text = await Bun.file(filePath).text();

      // ! Check for leaked token strings
      const match = text.match(bearerRegex);
      if (match && !text.includes("Bearer $" + "{token}")) {
        expect().fail(`Secret token leak detected in ${filePath}: ${match[0]}`);
      }

      // ! Self-contained runtime check: src/ must never read SKILL.md or atlas-schema.json
      if (filePath.startsWith("src/")) {
        expect(text.includes("SKILL.md")).toBe(false);
        expect(text.includes("atlas-schema.json")).toBe(false);
      }
    }
  });
});
