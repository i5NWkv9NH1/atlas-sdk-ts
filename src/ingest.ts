// * One-Shot Compound Media Ingestion Builder
// * Facilitates fluent, chainable ingestion from bytes, base64, file paths, or URLs with metadata and tags.

import { AtlasError, AtlasToolError } from "./transport.js";
import type {
  AddTagsParams,
  AddToCollectionParams,
  ImportFilesParams,
  SaveMediaFromUrlParams,
  SearchItemsParams,
  SetLikedParams,
  SetMetadataParams,
} from "./types.js";

/**
 * Result returned by IngestBuilder.send().
 */
export interface IngestResult {
  /** Unique ID of the ingested library item */
  itemId: string;
  /** Alias for itemId conforming to snake_case */
  item_id: string;
  /** Whether the media was successfully ingested */
  imported: boolean;
  /** Collections the item was placed into */
  collections?: string[];
  /** Tags assigned to the item */
  tags?: string[];
  [key: string]: unknown;
}

type IngestSource =
  | { type: "bytes"; data: Uint8Array | ArrayBuffer | Buffer; ext: string }
  | { type: "base64"; b64: string; ext: string }
  | { type: "filePath"; path: string }
  | { type: "url"; url: string };

/**
 * Minimal client interface required by IngestBuilder.
 */
export interface IngestClientInterface {
  importFiles(params: ImportFilesParams): Promise<unknown>;
  saveMediaFromUrl(params: SaveMediaFromUrlParams): Promise<unknown>;
  searchItems(params?: SearchItemsParams): Promise<{ items: Array<{ id: string; name?: string }> }>;
  addToCollection(params: AddToCollectionParams): Promise<unknown>;
  addTags(params: AddTagsParams): Promise<unknown>;
  setMetadata(params: SetMetadataParams): Promise<unknown>;
  setLiked(params: SetLikedParams): Promise<unknown>;
}

/**
 * High-level builder for composite media ingestion in a single transaction.
 */
export class IngestBuilder {
  private readonly client: IngestClientInterface;
  private source?: IngestSource;
  private customFilename?: string;
  private targetCollections: string[] = [];
  private targetTags: string[] = [];
  private metaAnnotation?: string;
  private metaAuthor?: string;
  private metaSourceUrl?: string;
  private metaLocation?: string;
  private isLiked?: boolean;
  private canvasX?: number;
  private canvasY?: number;

  constructor(client: IngestClientInterface) {
    this.client = client;
  }

  /**
   * Set binary bytes as input source with file extension.
   */
  bytes(data: Uint8Array | ArrayBuffer | Buffer, ext = "png"): this {
    this.source = { type: "bytes", data, ext };
    return this;
  }

  /**
   * Set base64 string as input source (automatically strips data URL headers).
   */
  base64(b64: string, ext = "png"): this {
    // * Strip optional data:image/...;base64, header prefix
    const cleanB64 = b64.replace(/^data:[^;]+;base64,/, "").trim();
    this.source = { type: "base64", b64: cleanB64, ext };
    return this;
  }

  /**
   * Set an existing local absolute file path as input source.
   */
  filePath(absPath: string): this {
    this.source = { type: "filePath", path: absPath };
    return this;
  }

  /**
   * Alias for filePath.
   */
  file_path(absPath: string): this {
    return this.filePath(absPath);
  }

  /**
   * Set web media URL as input source.
   */
  url(mediaUrl: string): this {
    this.source = { type: "url", url: mediaUrl };
    return this;
  }

  /**
   * Specify a custom filename for the ingested item.
   */
  filename(name: string): this {
    this.customFilename = name;
    return this;
  }

  /**
   * Assign item to a single collection.
   */
  collection(col: string): this {
    if (!this.targetCollections.includes(col)) {
      this.targetCollections.push(col);
    }
    return this;
  }

  /**
   * Assign item to multiple collections.
   */
  collections(cols: string[]): this {
    for (const c of cols) {
      this.collection(c);
    }
    return this;
  }

  /**
   * Assign tags to the item.
   */
  tags(tags: string[]): this {
    this.targetTags = [...this.targetTags, ...tags];
    return this;
  }

  /**
   * Set item text annotation / notes.
   */
  annotation(note: string): this {
    this.metaAnnotation = note;
    return this;
  }

  /**
   * Set item author or creator.
   */
  author(author: string): this {
    this.metaAuthor = author;
    return this;
  }

  /**
   * Set media origin or source URL.
   */
  sourceUrl(url: string): this {
    this.metaSourceUrl = url;
    return this;
  }

  /**
   * Alias for sourceUrl.
   */
  source_url(url: string): this {
    return this.sourceUrl(url);
  }

  /**
   * Set item geographical or physical location.
   */
  location(loc: string): this {
    this.metaLocation = loc;
    return this;
  }

  /**
   * Mark item as liked / favorite.
   */
  liked(liked = true): this {
    this.isLiked = liked;
    return this;
  }

  /**
   * Set board canvas placement coordinates.
   */
  canvasPosition(x: number, y: number): this {
    this.canvasX = x;
    this.canvasY = y;
    return this;
  }

  /**
   * Alias for canvasPosition.
   */
  canvas_position(x: number, y: number): this {
    return this.canvasPosition(x, y);
  }

  /**
   * Get target canvas coordinates if specified.
   */
  get canvasCoordinates(): { x?: number; y?: number } {
    return { x: this.canvasX, y: this.canvasY };
  }

  /**
   * Execute the compound ingestion pipeline and return the created item summary.
   */
  async send(): Promise<IngestResult> {
    if (!this.source) {
      throw new AtlasError(
        "IngestBuilder: No media source specified. Call .bytes(), .base64(), .filePath(), or .url() first.",
      );
    }

    let tempDir: string | undefined;
    let tempFilePath: string | undefined;

    try {
      let resolvedPath: string | undefined;

      // * 1. Prepare temporary disk file when input is in-memory bytes or base64
      if (this.source.type === "bytes" || this.source.type === "base64") {
        const ext = this.source.ext.replace(/^\./, "") || "png";
        const uuid = crypto.randomUUID();
        tempDir = `/tmp/atlas-ingest-${uuid}`;

        const fs = await import("node:fs");
        fs.mkdirSync(tempDir, { recursive: true });

        const fileName = this.customFilename
          ? this.customFilename.includes(".")
            ? this.customFilename
            : `${this.customFilename}.${ext}`
          : `ingest-${uuid}.${ext}`;

        tempFilePath = `${tempDir}/${fileName}`;

        let bufferData: Uint8Array;
        if (this.source.type === "bytes") {
          bufferData =
            this.source.data instanceof Uint8Array
              ? this.source.data
              : new Uint8Array(this.source.data);
        } else {
          bufferData = Buffer.from(this.source.b64, "base64");
        }

        await Bun.write(tempFilePath, bufferData);
        resolvedPath = tempFilePath;
      } else if (this.source.type === "filePath") {
        resolvedPath = this.source.path;
      }

      let itemId: string | undefined;

      // * 2. Ingest file into Atlas via appropriate tool
      if (this.source.type === "url") {
        const urlRes = await this.client.saveMediaFromUrl({ url: this.source.url });
        itemId = this.extractItemId(urlRes);

        // ? Fallback search by filename or URL if item_id not directly returned
        if (!itemId) {
          const search = await this.client.searchItems({
            query: this.customFilename || this.source.url,
            limit: 1,
            sort: "date_added",
            order: "desc",
          });
          itemId = search.items[0]?.id;
        }
      } else {
        if (!resolvedPath) {
          throw new AtlasToolError("ingest", "Resolved file path is unexpectedly missing");
        }
        const firstCol = this.targetCollections[0];
        const importRes = await this.client.importFiles({
          paths: [resolvedPath],
          collection: firstCol,
        });
        itemId = this.extractItemId(importRes);

        // ? Fallback search by filename if duplicate skipped or item_id not directly returned
        if (!itemId) {
          const queryTerm =
            this.customFilename || (resolvedPath ? resolvedPath.split("/").pop() : undefined);
          if (queryTerm) {
            const search = await this.client.searchItems({
              query: queryTerm,
              limit: 1,
              sort: "date_added",
              order: "desc",
            });
            itemId = search.items[0]?.id;
          }
        }
      }

      // ! Fatal: failed to locate item_id
      if (!itemId) {
        throw new AtlasError("Failed to resolve imported item ID from Atlas response.");
      }

      // * 3. Add to remaining collections
      const additionalCollections =
        this.source.type === "url" ? this.targetCollections : this.targetCollections.slice(1);

      for (const col of additionalCollections) {
        await this.client.addToCollection({ collection: col, item_ids: [itemId] });
      }

      // * 4. Attach tags
      if (this.targetTags.length > 0) {
        await this.client.addTags({ item_ids: [itemId], tags: this.targetTags });
      }

      // * 5. Update metadata
      if (
        this.metaAnnotation !== undefined ||
        this.metaAuthor !== undefined ||
        this.metaSourceUrl !== undefined ||
        this.metaLocation !== undefined
      ) {
        await this.client.setMetadata({
          item_id: itemId,
          annotation: this.metaAnnotation,
          author: this.metaAuthor,
          source_url: this.metaSourceUrl,
          location: this.metaLocation,
        });
      }

      // * 6. Set liked state
      if (this.isLiked !== undefined) {
        await this.client.setLiked({ item_ids: [itemId], liked: this.isLiked });
      }

      return {
        itemId,
        item_id: itemId,
        imported: true,
        collections: this.targetCollections,
        tags: this.targetTags,
      };
    } finally {
      // ! Guaranteed cleanup of temporary directories and files
      if (tempDir) {
        try {
          const fs = await import("node:fs");
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {
          // ? Suppress cleanup error
        }
      }
    }
  }

  // * Helper to extract item_id across varying MCP response structures
  private extractItemId(res: unknown): string | undefined {
    if (!res || typeof res !== "object") return undefined;
    const obj = res as Record<string, unknown>;

    if (Array.isArray(obj.item_ids) && obj.item_ids[0]) {
      return String(obj.item_ids[0]);
    }
    if (typeof obj.item_id === "string") {
      return obj.item_id;
    }
    if (Array.isArray(obj.items) && (obj.items[0] as { id?: string })?.id) {
      return String((obj.items[0] as { id: string }).id);
    }
    return undefined;
  }
}
