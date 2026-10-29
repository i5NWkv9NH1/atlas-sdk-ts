// * One-Shot Compound Media Ingestion Builder
// * Facilitates fluent, chainable ingestion from bytes, base64, file paths, or URLs with metadata and tags.

import { AtlasError, AtlasToolError } from "./transport.js";
import type {
  AddTagsParams,
  AddToCollectionParams,
  ImportFilesParams,
  ImportFilesResult,
  SaveMediaFromUrlParams,
  SearchItemsParams,
  SetLikedParams,
  SetMetadataParams,
} from "./types.js";

/**
 * Result returned by IngestBuilder.send().
 */
export interface IngestResult {
  /** Unique ID of the ingested library item (first item ID) */
  itemId: string;
  /** Alias for itemId conforming to snake_case */
  item_id: string;
  /** List of all unique IDs of the ingested library items */
  itemIds: string[];
  /** Alias for itemIds conforming to snake_case */
  item_ids: string[];
  /** Whether the media was successfully ingested */
  imported: boolean;
  /** Whether the item was skipped because it is an existing duplicate */
  skippedDuplicate: boolean;
  /** Alias for skippedDuplicate conforming to snake_case */
  skipped_duplicate: boolean;
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
  | { type: "filePaths"; paths: string[] }
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
   * Set base64 string as input source (automatically strips data URL headers and detects MIME).
   */
  base64(b64: string, ext?: string): this {
    let detectedExt: string | undefined;
    const match = b64.match(/^data:([^;]+);base64,/i);
    if (match?.[1]) {
      const mime = match[1].toLowerCase();
      switch (mime) {
        case "image/webp":
          detectedExt = "webp";
          break;
        case "image/gif":
          detectedExt = "gif";
          break;
        case "video/mp4":
          detectedExt = "mp4";
          break;
        case "video/quicktime":
          detectedExt = "mov";
          break;
        case "image/jpeg":
        case "image/jpg":
          detectedExt = "jpg";
          break;
        case "image/svg+xml":
          detectedExt = "svg";
          break;
        case "image/heic":
        case "image/heif":
          detectedExt = "heic";
          break;
        case "image/avif":
          detectedExt = "avif";
          break;
        case "image/png":
          detectedExt = "png";
          break;
        default:
          detectedExt = mime.split("/")[1] || "png";
          break;
      }
    }
    const cleanB64 = b64.replace(/^data:[^;]+;base64,/i, "").trim();
    const finalExt = ext && ext !== "png" ? ext : detectedExt || ext || "png";
    this.source = { type: "base64", b64: cleanB64, ext: finalExt };
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
   * Set multiple existing local absolute file paths as input source for batch ingestion.
   */
  filePaths(absPaths: string[]): this {
    this.source = { type: "filePaths", paths: absPaths };
    return this;
  }

  /**
   * Alias for filePaths.
   */
  file_paths(absPaths: string[]): this {
    return this.filePaths(absPaths);
  }

  /**
   * Set web media URL as input source.
   */
  url(mediaUrl: string): this {
    this.source = { type: "url", url: mediaUrl };
    return this;
  }

  /**
   * Specify a custom filename for the ingested item (cleans slashes to prevent subpath errors).
   */
  filename(name: string): this {
    this.customFilename = name.replace(/[/\\]/g, "_");
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
   * Attach a tag to the ingested item.
   */
  tag(t: string): this {
    if (!this.targetTags.includes(t)) {
      this.targetTags.push(t);
    }
    return this;
  }

  /**
   * Attach multiple tags to the ingested item.
   */
  tags(ts: string[]): this {
    for (const t of ts) {
      this.tag(t);
    }
    return this;
  }

  /**
   * Set item text annotation / description.
   */
  annotation(note: string): this {
    this.metaAnnotation = note;
    return this;
  }

  /**
   * Set item author name.
   */
  author(name: string): this {
    this.metaAuthor = name;
    return this;
  }

  /**
   * Set item source URL.
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
   * Set item location metadata.
   */
  location(loc: string): this {
    this.metaLocation = loc;
    return this;
  }

  /**
   * Set item favorite / liked status.
   */
  liked(isLiked = true): this {
    this.isLiked = isLiked;
    return this;
  }

  /**
   * Set board canvas position coordinates.
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
        "IngestBuilder: No media source specified. Call .bytes(), .base64(), .filePath(), .filePaths(), or .url() first.",
      );
    }

    let tempDir: string | undefined;
    let tempFilePath: string | undefined;

    try {
      let pathsToImport: string[] = [];

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
        pathsToImport = [tempFilePath];
      } else if (this.source.type === "filePath") {
        pathsToImport = [this.source.path];
      } else if (this.source.type === "filePaths") {
        pathsToImport = this.source.paths;
      }

      let allItemIds: string[] = [];
      let isImported = false;
      let isDuplicate = false;
      const firstCol = this.targetCollections[0];

      // * 2. Ingest file into Atlas via appropriate tool
      if (this.source.type === "url") {
        const urlRes = (await this.client.saveMediaFromUrl({
          url: this.source.url,
          collection: firstCol,
        })) as { item_ids?: string[]; item_id?: string };

        if (Array.isArray(urlRes.item_ids) && urlRes.item_ids.length > 0) {
          allItemIds = urlRes.item_ids.map(String);
        } else if (urlRes.item_id) {
          allItemIds = [urlRes.item_id];
        }

        // ? Fallback search by filename or URL if item_id not directly returned
        if (allItemIds.length === 0) {
          const search = await this.client.searchItems({
            query: this.customFilename || this.source.url,
            limit: 1,
            sort: "date_added",
            order: "desc",
          });
          allItemIds = search.items.map((i) => i.id);
        }
        isImported = allItemIds.length > 0;
      } else {
        if (pathsToImport.length === 0) {
          throw new AtlasToolError("ingest", "No file paths provided to import");
        }
        const importRes = (await this.client.importFiles({
          paths: pathsToImport,
          collection: firstCol,
          x: this.canvasX,
          y: this.canvasY,
        })) as ImportFilesResult;

        // ! 1. Check for failed array
        if (importRes.failed && importRes.failed.length > 0 && importRes.failed[0]) {
          const firstFail = importRes.failed[0];
          throw new AtlasToolError(
            "import_files",
            `Import failed for '${firstFail.path}': ${firstFail.reason}`,
          );
        }

        // ! 2. Check for unsupported format
        if ((importRes.skipped_unsupported ?? 0) > 0 && (importRes.imported ?? 0) === 0) {
          throw new AtlasToolError("import_files", "File format is unsupported by Atlas");
        }

        if (Array.isArray(importRes.item_ids) && importRes.item_ids.length > 0) {
          allItemIds = importRes.item_ids.map(String);
        }

        isImported = (importRes.imported ?? 0) > 0 || (allItemIds.length > 0 && !isDuplicate);
        isDuplicate = (importRes.skipped_duplicate ?? 0) > 0;

        // ? 3. Fallback search by filename only if imported > 0 or skipped_duplicate > 0
        if (allItemIds.length === 0 && (isImported || isDuplicate)) {
          const queryTerm = this.customFilename || pathsToImport[0]?.split(/[/\\]/).pop();
          if (queryTerm) {
            const search = await this.client.searchItems({
              query: queryTerm,
              limit: Math.max(pathsToImport.length, 1),
              sort: "date_added",
              order: "desc",
            });
            allItemIds = search.items.map((i) => i.id);
          }
        }
      }

      // ! Fatal: failed to locate item_id
      const primaryItemId = allItemIds[0];
      if (!primaryItemId) {
        throw new AtlasToolError(
          "ingest",
          "Failed to resolve imported item ID from Atlas response.",
        );
      }

      // * 3. Add to remaining collections
      const additionalCollections = this.targetCollections.slice(1);
      for (const col of additionalCollections) {
        await this.client.addToCollection({ collection: col, item_ids: allItemIds });
      }

      // * 4. Attach tags to ALL items
      if (this.targetTags.length > 0) {
        await this.client.addTags({ item_ids: allItemIds, tags: this.targetTags });
      }

      // * 5. Update metadata for ALL items
      if (
        this.metaAnnotation !== undefined ||
        this.metaAuthor !== undefined ||
        this.metaSourceUrl !== undefined ||
        this.metaLocation !== undefined
      ) {
        for (const id of allItemIds) {
          await this.client.setMetadata({
            item_id: id,
            annotation: this.metaAnnotation,
            author: this.metaAuthor,
            source_url: this.metaSourceUrl,
            location: this.metaLocation,
          });
        }
      }

      // * 6. Set liked state for ALL items
      if (this.isLiked !== undefined) {
        await this.client.setLiked({ item_ids: allItemIds, liked: this.isLiked });
      }

      return {
        itemId: primaryItemId,
        item_id: primaryItemId,
        itemIds: allItemIds,
        item_ids: allItemIds,
        imported: isImported,
        skippedDuplicate: isDuplicate,
        skipped_duplicate: isDuplicate,
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
}
