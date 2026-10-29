// * Primary Atlas Client Entry Point
// * Aggregates domain modules and exposes strongly-typed methods for all 78 Atlas MCP tools.

import { IngestBuilder } from "./ingest.js";
import { MediaModule } from "./media.js";
import { OrganizeModule } from "./organize.js";
import { QueryModule } from "./query.js";
import { type AtlasTransport, type FetchFn, HttpAtlasTransport } from "./transport.js";
import type {
  AddColorParams,
  AddColorResult,
  AddLinkParams,
  AddLinkResult,
  AddTagsParams,
  AddTagsResult,
  AddToCollectionParams,
  AddToCollectionResult,
  AppInfoParams,
  AppInfoResult,
  ArchiveCollectionParams,
  ArchiveCollectionResult,
  ArrangeBoardParams,
  ArrangeBoardResult,
  AtlasItemDetail,
  ConnectFolderParams,
  ConnectFolderResult,
  CreateCollectionFolderParams,
  CreateCollectionFolderResult,
  CreateCollectionParams,
  CreateCollectionResult,
  CreateLibraryParams,
  CreateLibraryResult,
  CreateSmartFolderParams,
  CreateSmartFolderResult,
  CreateTagFolderParams,
  CreateTagFolderResult,
  CreateTagParams,
  CreateTagResult,
  DeleteCollectionFolderParams,
  DeleteCollectionFolderResult,
  DeleteCollectionParams,
  DeleteCollectionResult,
  DeletePermanentlyParams,
  DeletePermanentlyResult,
  DeleteSmartFolderParams,
  DeleteSmartFolderResult,
  DeleteTagFolderParams,
  DeleteTagFolderResult,
  DeleteTagParams,
  DeleteTagResult,
  DisconnectFolderParams,
  DisconnectFolderResult,
  EditColorParams,
  EditColorResult,
  EditImageParams,
  EditImageResult,
  EditLinkParams,
  EditLinkResult,
  EmptyTrashParams,
  EmptyTrashResult,
  FindSimilarParams,
  FindSimilarResult,
  GetBoardParams,
  GetBoardResult,
  GetCurrentViewParams,
  GetCurrentViewResult,
  GetFileParams,
  GetFileResult,
  GetItemParams,
  GetSettingsParams,
  GetSettingsResult,
  ImportFilesParams,
  ImportFilesResult,
  LibraryInfoParams,
  LibraryInfoResult,
  ListCollectionFoldersParams,
  ListCollectionFoldersResult,
  ListCollectionsParams,
  ListCollectionsResult,
  ListConnectedFoldersParams,
  ListConnectedFoldersResult,
  ListLibrariesParams,
  ListLibrariesResult,
  ListSmartFoldersParams,
  ListSmartFoldersResult,
  ListTagsParams,
  ListTagsResult,
  McpListResourcesResult,
  McpListToolsResult,
  McpReadResourceResult,
  MoveCollectionFolderParams,
  MoveCollectionFolderResult,
  MoveCollectionToFolderParams,
  MoveCollectionToFolderResult,
  MoveGroupParams,
  MoveGroupResult,
  MoveTagsToFolderParams,
  MoveTagsToFolderResult,
  MoveToGroupParams,
  MoveToGroupResult,
  OpenItemParams,
  OpenItemResult,
  OpenSettingsParams,
  OpenSettingsResult,
  QueryEmbeddingsParams,
  QueryEmbeddingsResult,
  RefreshThumbnailParams,
  RefreshThumbnailResult,
  RemoveFromCollectionParams,
  RemoveFromCollectionResult,
  RemoveTagsParams,
  RemoveTagsResult,
  RenameCollectionFolderParams,
  RenameCollectionFolderResult,
  RenameCollectionParams,
  RenameCollectionResult,
  RenameTagFolderParams,
  RenameTagFolderResult,
  RenameTagParams,
  RenameTagResult,
  RescanFolderParams,
  RescanFolderResult,
  ResetBoardLayoutParams,
  ResetBoardLayoutResult,
  RestoreItemsParams,
  RestoreItemsResult,
  RunMaintenanceParams,
  RunMaintenanceResult,
  RunSmartFolderParams,
  RunSmartFolderResult,
  SaveMediaFromUrlParams,
  SaveMediaFromUrlResult,
  SearchByDescriptionParams,
  SearchByDescriptionResult,
  SearchItemsParams,
  SearchItemsResult,
  SelectItemsParams,
  SelectItemsResult,
  SetCollectionOrderParams,
  SetCollectionOrderResult,
  SetLikedParams,
  SetLikedResult,
  SetMetadataParams,
  SetMetadataResult,
  SetSettingParams,
  SetSettingResult,
  SetTagsParams,
  SetTagsResult,
  SetViewModeParams,
  SetViewModeResult,
  ShowInAppParams,
  ShowInAppResult,
  ShowInFinderParams,
  ShowInFinderResult,
  ShowItemsParams,
  ShowItemsResult,
  StoreEmbeddingsParams,
  StoreEmbeddingsResult,
  SwitchLibraryParams,
  SwitchLibraryResult,
  TrashItemsParams,
  TrashItemsResult,
  UndoBoardLayoutParams,
  UndoBoardLayoutResult,
  UpdateSmartFolderParams,
  UpdateSmartFolderResult,
  ViewItemsParams,
  ViewItemsResult,
} from "./types.js";
import { UiModule } from "./ui.js";

// * Options for instantiating an AtlasClient
export interface AtlasClientOptions {
  // * Local or remote MCP endpoint URL (default: http://127.0.0.1:50473/mcp)
  endpoint?: string;
  // * Explicit Bearer token for authentication
  token?: string;
  // * Map of library names or paths to specific Bearer tokens
  libraryTokens?: Record<string, string>;
  // * Automatically discover token from env, CLI, or filesystem (default: true)
  autoDiscoverToken?: boolean;
  // * Automatically launch Atlas app if connection is refused (macOS only, default: true)
  autoLaunch?: boolean;
  // * HTTP request timeout in milliseconds (default: 15000)
  timeoutMs?: number;
  // * Custom transport instance (e.g. MockAtlasTransport for testing)
  transport?: AtlasTransport;
  // * Custom fetch implementation
  fetchFn?: FetchFn;
}

export class AtlasClient {
  /** Domain module or transport instance for transport. */
  public readonly transport: AtlasTransport;
  /** Domain module or transport instance for query. */
  public readonly query: QueryModule;
  /** Domain module or transport instance for media. */
  public readonly media: MediaModule;
  /** Domain module or transport instance for organize. */
  public readonly organize: OrganizeModule;
  /** Domain module or transport instance for ui. */
  public readonly ui: UiModule;

  constructor(options: AtlasClientOptions = {}) {
    if (options.transport) {
      this.transport = options.transport;
    } else {
      this.transport = new HttpAtlasTransport({
        endpoint: options.endpoint,
        token: options.token,
        libraryTokens: options.libraryTokens,
        autoDiscoverToken: options.autoDiscoverToken,
        autoLaunch: options.autoLaunch,
        timeoutMs: options.timeoutMs,
        fetchFn: options.fetchFn,
      });
    }

    this.query = new QueryModule(this.transport);
    this.media = new MediaModule(this.transport);
    this.organize = new OrganizeModule(this.transport);
    this.ui = new UiModule(this.transport);
  }

  // * Server health check ping
  /**
   * Check whether the Atlas MCP server is reachable and responsive.
   */
  ping(): Promise<boolean> {
    return this.transport.ping();
  }

  /**
   * Create a fluent, chainable builder for one-shot compound media ingestion.
   */
  ingest(): IngestBuilder {
    return new IngestBuilder(this);
  }

  // * ========================================================================
  // * MCP Protocol Methods (tools/list, resources/list, resources/read)
  // * ========================================================================

  /**
   * List available tools and their schemas from the Atlas MCP server.
   */
  listTools(): Promise<McpListToolsResult> {
    return this.transport.listTools();
  }
  /**
   * Alias for listTools (List available tools and their schemas from the Atlas MCP server.)
   */
  list_tools(): Promise<McpListToolsResult> {
    return this.listTools();
  }

  /**
   * List available resources from the Atlas MCP server.
   */
  listResources(): Promise<McpListResourcesResult> {
    return this.transport.listResources();
  }
  /**
   * Alias for listResources (List available resources from the Atlas MCP server.)
   */
  list_resources(): Promise<McpListResourcesResult> {
    return this.listResources();
  }

  /**
   * Read the content of an MCP resource by URI (e.g. atlas://skill or atlas://item/<id>).
   */
  readResource(uri: string): Promise<McpReadResourceResult> {
    return this.transport.readResource(uri);
  }
  /**
   * Alias for readResource (Read the content of an MCP resource by URI.)
   */
  read_resource(uri: string): Promise<McpReadResourceResult> {
    return this.readResource(uri);
  }

  // * ========================================================================
  // * Query Methods (11 Tools)
  // * ========================================================================

  /**
   * Search library items. All filters are optional and combine with AND. With NO filters, `total_matches` is the exact count of all non-trashed items in the library — use that for "how many items" questions. `query` matches name, link title/description, tags, annotation, author, location, and source URL, case-insensitively — it reads METADATA only, so for "find pictures of X" use search_by_description, which matches what items actually show. Scope with `collection`, `collection_folder`, `smart_folder`, `connected_folder`, or `source` (instagram / x). Filter by kind, tags (all / any), format, size, dimensions, duration, orientation, liked, untagged, date ranges (ISO 8601). Sort by date_added (default), date_created, name, bytes, duration, width, height, or random. Trashed items are excluded unless you search `collection: "Trash"`. For library-wide totals (how many images / videos / items) library_info answers in one cheap call. Enum filters accept "" for "no filter"; 0 on an optional number also means "not set". Returns compact metadata; `verbose: true` adds paths, notes and file facts; use view_items to actually see items.
   */
  searchItems(params: SearchItemsParams = {}): Promise<SearchItemsResult> {
    return this.query.searchItems(params);
  }
  /**
   * Alias for searchItems (Search library items. All filters are optional and combine with AND. With NO filters, `total_matches` is the exact count of all non-trashed items in the library — use that for "how many items" questions. `query` matches name, link title/description, tags, annotation, author, location, and source URL, case-insensitively — it reads METADATA only, so for "find pictures of X" use search_by_description, which matches what items actually show. Scope with `collection`, `collection_folder`, `smart_folder`, `connected_folder`, or `source` (instagram / x). Filter by kind, tags (all / any), format, size, dimensions, duration, orientation, liked, untagged, date ranges (ISO 8601). Sort by date_added (default), date_created, name, bytes, duration, width, height, or random. Trashed items are excluded unless you search `collection: "Trash"`. For library-wide totals (how many images / videos / items) library_info answers in one cheap call. Enum filters accept "" for "no filter"; 0 on an optional number also means "not set". Returns compact metadata; `verbose: true` adds paths, notes and file facts; use view_items to actually see items.)
   */
  search_items(params: SearchItemsParams = {}): Promise<SearchItemsResult> {
    return this.searchItems(params);
  }

  /**
   * Find items by what they SHOW, from a plain-language description — "a red sports car at night", "hand-drawn arrow sketch", "brutalist concrete facade". Atlas embeds the description on this Mac with the same model that indexed every thumbnail, and returns the closest items, best first, each with a cosine `score`. Reach for this whenever the request is about what's IN the picture rather than what it's called: search_items only matches names, tags, notes and URLs, so it misses everything nobody happened to label. Narrow with `kind` / `collection`. Colors and preview-less links are never indexed. Pass the ids to show_items to put the results on the user's screen. Needs Settings ▸ General ▸ "Semantic search" on; the first query after launch loads the text model and can take a few seconds.
   */
  searchByDescription(params: SearchByDescriptionParams): Promise<SearchByDescriptionResult> {
    return this.query.searchByDescription(params);
  }
  /**
   * Alias for searchByDescription (Find items by what they SHOW, from a plain-language description — "a red sports car at night", "hand-drawn arrow sketch", "brutalist concrete facade". Atlas embeds the description on this Mac with the same model that indexed every thumbnail, and returns the closest items, best first, each with a cosine `score`. Reach for this whenever the request is about what's IN the picture rather than what it's called: search_items only matches names, tags, notes and URLs, so it misses everything nobody happened to label. Narrow with `kind` / `collection`. Colors and preview-less links are never indexed. Pass the ids to show_items to put the results on the user's screen. Needs Settings ▸ General ▸ "Semantic search" on; the first query after launch loads the text model and can take a few seconds.)
   */
  search_by_description(params: SearchByDescriptionParams): Promise<SearchByDescriptionResult> {
    return this.searchByDescription(params);
  }

  /**
   * Find items visually similar to a given item, using on-device image embeddings (Apple Vision feature prints). Purely visual — no text understanding. The index builds in the background after launch; results note how much of the library is indexed.
   */
  findSimilar(params: FindSimilarParams): Promise<FindSimilarResult> {
    return this.query.findSimilar(params);
  }
  /**
   * Alias for findSimilar (Find items visually similar to a given item, using on-device image embeddings (Apple Vision feature prints). Purely visual — no text understanding. The index builds in the background after launch; results note how much of the library is indexed.)
   */
  find_similar(params: FindSimilarParams): Promise<FindSimilarResult> {
    return this.findSimilar(params);
  }

  /**
   * Full metadata for one item by id, including which collections it belongs to.
   */
  getItem(params: GetItemParams): Promise<AtlasItemDetail> {
    return this.query.getItem(params);
  }
  /**
   * Alias for getItem (Full metadata for one item by id, including which collections it belongs to.)
   */
  get_item(params: GetItemParams): Promise<AtlasItemDetail> {
    return this.getItem(params);
  }

  /**
   * Look at items: returns each item's thumbnail as an image (preceded by a text line naming the item id) so you can see the actual content. Up to 20 items per call. `size` caps the longest edge in pixels (default 512, max 1024) — keep it small when scanning many items.
   */
  viewItems(params: ViewItemsParams): Promise<ViewItemsResult> {
    return this.query.viewItems(params);
  }
  /**
   * Alias for viewItems (Look at items: returns each item's thumbnail as an image (preceded by a text line naming the item id) so you can see the actual content. Up to 20 items per call. `size` caps the longest edge in pixels (default 512, max 1024) — keep it small when scanning many items.)
   */
  view_items(params: ViewItemsParams): Promise<ViewItemsResult> {
    return this.viewItems(params);
  }

  /**
   * Read an item's original file. Images come back as an image block (downscaled to `size` px on the long edge, default 2048, max 4096 — pass `size: 0` for the untouched bytes, any format); videos and other non-image files return their path, size, and MIME type (read them with a file tool — the path is local to this Mac). `page` picks a carousel slide (0 = cover). The same bytes are available as the MCP resource atlas://item/<id>/original.
   */
  getFile(params: GetFileParams): Promise<GetFileResult> {
    return this.query.getFile(params);
  }
  /**
   * Alias for getFile (Read an item's original file. Images come back as an image block (downscaled to `size` px on the long edge, default 2048, max 4096 — pass `size: 0` for the untouched bytes, any format); videos and other non-image files return their path, size, and MIME type (read them with a file tool — the path is local to this Mac). `page` picks a carousel slide (0 = cover). The same bytes are available as the MCP resource atlas://item/<id>/original.)
   */
  get_file(params: GetFileParams): Promise<GetFileResult> {
    return this.getFile(params);
  }

  /**
   * Store semantic-embedding vectors for library items, keyed by `content_hash` (from search_items / get_item file facts). `model` names the embedding model that produced them (e.g. "siglip2-base-patch16-256") — vectors from different models don't mix, so storing under a new model id DISCARDS the previously stored index. Vectors are L2-normalized on the way in and persisted with the library. Send items in batches (max 1000 per call). Entries whose hash is unknown to the library are still stored (the item may sync in later); use `prune: true` on a final batch to drop vectors whose hash no longer matches any item.
   */
  storeEmbeddings(params: StoreEmbeddingsParams): Promise<StoreEmbeddingsResult> {
    return this.query.storeEmbeddings(params);
  }
  /**
   * Alias for storeEmbeddings (Store semantic-embedding vectors for library items, keyed by `content_hash` (from search_items / get_item file facts). `model` names the embedding model that produced them (e.g. "siglip2-base-patch16-256") — vectors from different models don't mix, so storing under a new model id DISCARDS the previously stored index. Vectors are L2-normalized on the way in and persisted with the library. Send items in batches (max 1000 per call). Entries whose hash is unknown to the library are still stored (the item may sync in later); use `prune: true` on a final batch to drop vectors whose hash no longer matches any item.)
   */
  store_embeddings(params: StoreEmbeddingsParams): Promise<StoreEmbeddingsResult> {
    return this.storeEmbeddings(params);
  }

  /**
   * Semantic search over the vectors stored with store_embeddings, for clients that bring their own model: pass a query vector (a text or image embedding from the SAME model) and get the closest items back, best first, scored by cosine similarity. To search Atlas's own on-device index from plain language — no model needed — use search_by_description instead. Trashed items are excluded. With no vector, returns index status only (model, count, dimension). Combine with select_items / show_in_app to surface the hits in the Atlas window.
   */
  queryEmbeddings(params: QueryEmbeddingsParams): Promise<QueryEmbeddingsResult> {
    return this.query.queryEmbeddings(params);
  }
  /**
   * Alias for queryEmbeddings (Semantic search over the vectors stored with store_embeddings, for clients that bring their own model: pass a query vector (a text or image embedding from the SAME model) and get the closest items back, best first, scored by cosine similarity. To search Atlas's own on-device index from plain language — no model needed — use search_by_description instead. Trashed items are excluded. With no vector, returns index status only (model, count, dimension). Combine with select_items / show_in_app to surface the hits in the Atlas window.)
   */
  query_embeddings(params: QueryEmbeddingsParams): Promise<QueryEmbeddingsResult> {
    return this.queryEmbeddings(params);
  }

  /**
   * The items a saved smart folder currently matches (newest first). Paged like search_items.
   */
  runSmartFolder(params: RunSmartFolderParams): Promise<RunSmartFolderResult> {
    return this.query.runSmartFolder(params);
  }
  /**
   * Alias for runSmartFolder (The items a saved smart folder currently matches (newest first). Paged like search_items.)
   */
  run_smart_folder(params: RunSmartFolderParams): Promise<RunSmartFolderResult> {
    return this.runSmartFolder(params);
  }

  /**
   * A collection's canvas layout: its groups (spatial clusters) with positions and the ordered items inside each.
   */
  getBoard(params: GetBoardParams): Promise<GetBoardResult> {
    return this.query.getBoard(params);
  }
  /**
   * Alias for getBoard (A collection's canvas layout: its groups (spatial clusters) with positions and the ordered items inside each.)
   */
  get_board(params: GetBoardParams): Promise<GetBoardResult> {
    return this.getBoard(params);
  }

  /**
   * What the user is looking at right now: the collection (if any), the items on screen (ids, newest-first is not implied — this is display order), and which are selected. Use it to act on "these" / "the selected ones".
   */
  getCurrentView(params: GetCurrentViewParams = {}): Promise<GetCurrentViewResult> {
    return this.query.getCurrentView(params);
  }
  /**
   * Alias for getCurrentView (What the user is looking at right now: the collection (if any), the items on screen (ids, newest-first is not implied — this is display order), and which are selected. Use it to act on "these" / "the selected ones".)
   */
  get_current_view(params: GetCurrentViewParams = {}): Promise<GetCurrentViewResult> {
    return this.getCurrentView(params);
  }

  // * ========================================================================
  // * Media Methods (14 Tools)
  // * ========================================================================

  /**
   * Import media files from absolute paths on this Mac into a collection (defaults to the Inbox). Files are copied into the library; originals are untouched. Returns how many were imported, skipped as duplicates (`skipped_duplicate`) or skipped as unsupported types, plus `failed` (path + reason) for files macOS couldn't read, such as AV1 or VP9 videos.
   */
  importFiles(params: ImportFilesParams): Promise<ImportFilesResult> {
    return this.media.importFiles(params);
  }
  /**
   * Alias for importFiles (Import media files from absolute paths on this Mac into a collection (defaults to the Inbox). Files are copied into the library; originals are untouched. Returns how many were imported, skipped as duplicates (`skipped_duplicate`) or skipped as unsupported types, plus `failed` (path + reason) for files macOS couldn't read, such as AV1 or VP9 videos.)
   */
  import_files(params: ImportFilesParams): Promise<ImportFilesResult> {
    return this.importFiles(params);
  }

  /**
   * Save a URL as a link card (no media download). Files it into the given collection, or just into the library.
   */
  addLink(params: AddLinkParams): Promise<AddLinkResult> {
    return this.media.addLink(params);
  }
  /**
   * Alias for addLink (Save a URL as a link card (no media download). Files it into the given collection, or just into the library.)
   */
  add_link(params: AddLinkParams): Promise<AddLinkResult> {
    return this.addLink(params);
  }

  /**
   * Edit a link card's title, description, or URL. Only the fields you pass change; empty title/description clear the field.
   */
  editLink(params: EditLinkParams): Promise<EditLinkResult> {
    return this.media.editLink(params);
  }
  /**
   * Alias for editLink (Edit a link card's title, description, or URL. Only the fields you pass change; empty title/description clear the field.)
   */
  edit_link(params: EditLinkParams): Promise<EditLinkResult> {
    return this.editLink(params);
  }

  /**
   * Save a HEX color as a color card (e.g. #FF6B35, also 3/4/8-digit forms).
   */
  addColor(params: AddColorParams): Promise<AddColorResult> {
    return this.media.addColor(params);
  }
  /**
   * Alias for addColor (Save a HEX color as a color card (e.g. #FF6B35, also 3/4/8-digit forms).)
   */
  add_color(params: AddColorParams): Promise<AddColorResult> {
    return this.addColor(params);
  }

  /**
   * Change a color card's HEX value.
   */
  editColor(params: EditColorParams): Promise<EditColorResult> {
    return this.media.editColor(params);
  }
  /**
   * Alias for editColor (Change a color card's HEX value.)
   */
  edit_color(params: EditColorParams): Promise<EditColorResult> {
    return this.editColor(params);
  }

  /**
   * Download the media behind a web URL and import it — a direct image/video URL, or a social post (X/Twitter, Instagram, Pinterest, …) whose photos and videos are fetched, every carousel slide included. Falls back to saving a link card for social posts with no downloadable media. Slow tool — it performs real downloads.
   */
  saveMediaFromUrl(params: SaveMediaFromUrlParams): Promise<SaveMediaFromUrlResult> {
    return this.media.saveMediaFromUrl(params);
  }
  /**
   * Alias for saveMediaFromUrl (Download the media behind a web URL and import it — a direct image/video URL, or a social post (X/Twitter, Instagram, Pinterest, …) whose photos and videos are fetched, every carousel slide included. Falls back to saving a link card for social posts with no downloadable media. Slow tool — it performs real downloads.)
   */
  save_media_from_url(params: SaveMediaFromUrlParams): Promise<SaveMediaFromUrlResult> {
    return this.saveMediaFromUrl(params);
  }

  /**
   * Crop or rotate images without touching the imported file (it is kept; `revert: true` puts it back). `rotate` turns the picture a quarter turn "left" or "right" on top of its current edit; `crop` replaces the kept region with a rectangle in the TURNED picture's unit square — x, y, width, height in 0…1, top-left origin — so {"x":0, "y":0, "width":1, "height":0.5} keeps the top half. Rotate and crop can be combined. Managed still images only: connected-folder files, vectors and animations are skipped. Returns each image's new pixel size.
   */
  editImage(params: EditImageParams): Promise<EditImageResult> {
    return this.media.editImage(params);
  }
  /**
   * Alias for editImage (Crop or rotate images without touching the imported file (it is kept; `revert: true` puts it back). `rotate` turns the picture a quarter turn "left" or "right" on top of its current edit; `crop` replaces the kept region with a rectangle in the TURNED picture's unit square — x, y, width, height in 0…1, top-left origin — so {"x":0, "y":0, "width":1, "height":0.5} keeps the top half. Rotate and crop can be combined. Managed still images only: connected-folder files, vectors and animations are skipped. Returns each image's new pixel size.)
   */
  edit_image(params: EditImageParams): Promise<EditImageResult> {
    return this.editImage(params);
  }

  /**
   * Regenerate the thumbnails of items whose files changed on disk (edited in another app, or a connected-folder file replaced), so tiles and the open item show the current picture. Links and colors have no thumbnail to refresh and are skipped.
   */
  refreshThumbnail(params: RefreshThumbnailParams): Promise<RefreshThumbnailResult> {
    return this.media.refreshThumbnail(params);
  }
  /**
   * Alias for refreshThumbnail (Regenerate the thumbnails of items whose files changed on disk (edited in another app, or a connected-folder file replaced), so tiles and the open item show the current picture. Links and colors have no thumbnail to refresh and are skipped.)
   */
  refresh_thumbnail(params: RefreshThumbnailParams): Promise<RefreshThumbnailResult> {
    return this.refreshThumbnail(params);
  }

  /**
   * Like or unlike items (membership in the Likes collection).
   */
  setLiked(params: SetLikedParams): Promise<SetLikedResult> {
    return this.media.setLiked(params);
  }
  /**
   * Alias for setLiked (Like or unlike items (membership in the Likes collection).)
   */
  set_liked(params: SetLikedParams): Promise<SetLikedResult> {
    return this.setLiked(params);
  }

  /**
   * Set an item's annotation (note), author, location, or source URL. Only the fields you pass change; pass an empty string to clear a field.
   */
  setMetadata(params: SetMetadataParams): Promise<SetMetadataResult> {
    return this.media.setMetadata(params);
  }
  /**
   * Alias for setMetadata (Set an item's annotation (note), author, location, or source URL. Only the fields you pass change; pass an empty string to clear a field.)
   */
  set_metadata(params: SetMetadataParams): Promise<SetMetadataResult> {
    return this.setMetadata(params);
  }

  /**
   * Move items to the Trash. Recoverable — restore_items puts them back; nothing is permanently deleted by this tool.
   */
  trashItems(params: TrashItemsParams): Promise<TrashItemsResult> {
    return this.media.trashItems(params);
  }
  /**
   * Alias for trashItems (Move items to the Trash. Recoverable — restore_items puts them back; nothing is permanently deleted by this tool.)
   */
  trash_items(params: TrashItemsParams): Promise<TrashItemsResult> {
    return this.trashItems(params);
  }

  /**
   * Restore trashed items — puts them back into the collections they were trashed from (Put Back). Find trashed items with search_items collection:"Trash".
   */
  restoreItems(params: RestoreItemsParams): Promise<RestoreItemsResult> {
    return this.media.restoreItems(params);
  }
  /**
   * Alias for restoreItems (Restore trashed items — puts them back into the collections they were trashed from (Put Back). Find trashed items with search_items collection:"Trash".)
   */
  restore_items(params: RestoreItemsParams): Promise<RestoreItemsResult> {
    return this.restoreItems(params);
  }

  /**
   * Permanently delete items that are already in the Trash. Irreversible. Requires Settings ▸ Developers ▸ "Allow permanent deletion". Items not in the Trash are skipped — trash_items them first.
   */
  deletePermanently(params: DeletePermanentlyParams): Promise<DeletePermanentlyResult> {
    return this.media.deletePermanently(params);
  }
  /**
   * Alias for deletePermanently (Permanently delete items that are already in the Trash. Irreversible. Requires Settings ▸ Developers ▸ "Allow permanent deletion". Items not in the Trash are skipped — trash_items them first.)
   */
  delete_permanently(params: DeletePermanentlyParams): Promise<DeletePermanentlyResult> {
    return this.deletePermanently(params);
  }

  /**
   * Permanently delete everything in the Trash. Irreversible (a metadata snapshot is kept, the files are not). Requires Settings ▸ Developers ▸ "Allow permanent deletion".
   */
  emptyTrash(params: EmptyTrashParams): Promise<EmptyTrashResult> {
    return this.media.emptyTrash(params);
  }
  /**
   * Alias for emptyTrash (Permanently delete everything in the Trash. Irreversible (a metadata snapshot is kept, the files are not). Requires Settings ▸ Developers ▸ "Allow permanent deletion".)
   */
  empty_trash(params: EmptyTrashParams): Promise<EmptyTrashResult> {
    return this.emptyTrash(params);
  }

  // * ========================================================================
  // * Organization Methods (42 Tools)
  // * ========================================================================

  /**
   * List every collection (board) in the Atlas library: id, name, sidebar folder, item count. System collections (Inbox, Likes, Trash) are marked. Per-collection counts are PLACEMENTS, not unique items — one item can live in several collections, and links / connected-folder items live outside collections entirely — so never sum them. The `library` object carries the exact unique totals.
   */
  listCollections(params: ListCollectionsParams = {}): Promise<ListCollectionsResult> {
    return this.organize.listCollections(params);
  }
  /**
   * Alias for listCollections (List every collection (board) in the Atlas library: id, name, sidebar folder, item count. System collections (Inbox, Likes, Trash) are marked. Per-collection counts are PLACEMENTS, not unique items — one item can live in several collections, and links / connected-folder items live outside collections entirely — so never sum them. The `library` object carries the exact unique totals.)
   */
  list_collections(params: ListCollectionsParams = {}): Promise<ListCollectionsResult> {
    return this.listCollections(params);
  }

  /**
   * Create a new collection (board). Returns its id.
   */
  createCollection(params: CreateCollectionParams): Promise<CreateCollectionResult> {
    return this.organize.createCollection(params);
  }
  /**
   * Alias for createCollection (Create a new collection (board). Returns its id.)
   */
  create_collection(params: CreateCollectionParams): Promise<CreateCollectionResult> {
    return this.createCollection(params);
  }

  /**
   * Rename a collection (board). System collections (Inbox, Likes, Trash) can't be renamed.
   */
  renameCollection(params: RenameCollectionParams): Promise<RenameCollectionResult> {
    return this.organize.renameCollection(params);
  }
  /**
   * Alias for renameCollection (Rename a collection (board). System collections (Inbox, Likes, Trash) can't be renamed.)
   */
  rename_collection(params: RenameCollectionParams): Promise<RenameCollectionResult> {
    return this.renameCollection(params);
  }

  /**
   * Put a collection away (archived) or bring it back. Archived collections keep every item but leave the sidebar and the ⌘K palette; list_collections still shows them with `archived: true`.
   */
  archiveCollection(params: ArchiveCollectionParams): Promise<ArchiveCollectionResult> {
    return this.organize.archiveCollection(params);
  }
  /**
   * Alias for archiveCollection (Put a collection away (archived) or bring it back. Archived collections keep every item but leave the sidebar and the ⌘K palette; list_collections still shows them with `archived: true`.)
   */
  archive_collection(params: ArchiveCollectionParams): Promise<ArchiveCollectionResult> {
    return this.archiveCollection(params);
  }

  /**
   * Delete a collection. By default its items are kept (re-filed into the Inbox if they're in no other collection). `delete_items: true` also removes items that live only in this collection — that is permanent and requires Settings ▸ Developers ▸ "Allow permanent deletion".
   */
  deleteCollection(params: DeleteCollectionParams): Promise<DeleteCollectionResult> {
    return this.organize.deleteCollection(params);
  }
  /**
   * Alias for deleteCollection (Delete a collection. By default its items are kept (re-filed into the Inbox if they're in no other collection). `delete_items: true` also removes items that live only in this collection — that is permanent and requires Settings ▸ Developers ▸ "Allow permanent deletion".)
   */
  delete_collection(params: DeleteCollectionParams): Promise<DeleteCollectionResult> {
    return this.deleteCollection(params);
  }

  /**
   * Reorder the user's collections in the sidebar. Pass every collection id in the wanted order; ids you leave out keep their relative order after the listed ones.
   */
  setCollectionOrder(params: SetCollectionOrderParams): Promise<SetCollectionOrderResult> {
    return this.organize.setCollectionOrder(params);
  }
  /**
   * Alias for setCollectionOrder (Reorder the user's collections in the sidebar. Pass every collection id in the wanted order; ids you leave out keep their relative order after the listed ones.)
   */
  set_collection_order(params: SetCollectionOrderParams): Promise<SetCollectionOrderResult> {
    return this.setCollectionOrder(params);
  }

  /**
   * File items into a collection. By default items are added (kept everywhere they already are); pass move=true to move them out of the source collections instead.
   */
  addToCollection(params: AddToCollectionParams): Promise<AddToCollectionResult> {
    return this.organize.addToCollection(params);
  }
  /**
   * Alias for addToCollection (File items into a collection. By default items are added (kept everywhere they already are); pass move=true to move them out of the source collections instead.)
   */
  add_to_collection(params: AddToCollectionParams): Promise<AddToCollectionResult> {
    return this.addToCollection(params);
  }

  /**
   * Take items out of one collection without trashing them. Items in no other collection are re-filed into the Inbox so nothing is lost.
   */
  removeFromCollection(params: RemoveFromCollectionParams): Promise<RemoveFromCollectionResult> {
    return this.organize.removeFromCollection(params);
  }
  /**
   * Alias for removeFromCollection (Take items out of one collection without trashing them. Items in no other collection are re-filed into the Inbox so nothing is lost.)
   */
  remove_from_collection(params: RemoveFromCollectionParams): Promise<RemoveFromCollectionResult> {
    return this.removeFromCollection(params);
  }

  /**
   * Sidebar folders that group collections: id, name, the collections filed directly inside each, and — since folders nest — `parent_id` (null at the top level) and `path` ("Parent ▸ Child").
   */
  listCollectionFolders(
    params: ListCollectionFoldersParams = {},
  ): Promise<ListCollectionFoldersResult> {
    return this.organize.listCollectionFolders(params);
  }
  /**
   * Alias for listCollectionFolders (Sidebar folders that group collections: id, name, the collections filed directly inside each, and — since folders nest — `parent_id` (null at the top level) and `path` ("Parent ▸ Child").)
   */
  list_collection_folders(
    params: ListCollectionFoldersParams = {},
  ): Promise<ListCollectionFoldersResult> {
    return this.listCollectionFolders(params);
  }

  /**
   * Create a sidebar folder that groups collections — at the top level, or nested inside another folder (`parent`). Returns its id. Optionally file collections into it right away.
   */
  createCollectionFolder(
    params: CreateCollectionFolderParams,
  ): Promise<CreateCollectionFolderResult> {
    return this.organize.createCollectionFolder(params);
  }
  /**
   * Alias for createCollectionFolder (Create a sidebar folder that groups collections — at the top level, or nested inside another folder (`parent`). Returns its id. Optionally file collections into it right away.)
   */
  create_collection_folder(
    params: CreateCollectionFolderParams,
  ): Promise<CreateCollectionFolderResult> {
    return this.createCollectionFolder(params);
  }

  /**
   * Nest a sidebar collection folder inside another folder, or move it back to the top level (omit `parent`). Everything inside it moves along. A folder can't go inside itself or one of its own folders.
   */
  moveCollectionFolder(params: MoveCollectionFolderParams): Promise<MoveCollectionFolderResult> {
    return this.organize.moveCollectionFolder(params);
  }
  /**
   * Alias for moveCollectionFolder (Nest a sidebar collection folder inside another folder, or move it back to the top level (omit `parent`). Everything inside it moves along. A folder can't go inside itself or one of its own folders.)
   */
  move_collection_folder(params: MoveCollectionFolderParams): Promise<MoveCollectionFolderResult> {
    return this.moveCollectionFolder(params);
  }

  /**
   * Rename a sidebar collection folder.
   */
  renameCollectionFolder(
    params: RenameCollectionFolderParams,
  ): Promise<RenameCollectionFolderResult> {
    return this.organize.renameCollectionFolder(params);
  }
  /**
   * Alias for renameCollectionFolder (Rename a sidebar collection folder.)
   */
  rename_collection_folder(
    params: RenameCollectionFolderParams,
  ): Promise<RenameCollectionFolderResult> {
    return this.renameCollectionFolder(params);
  }

  /**
   * Delete a sidebar collection folder, folders nested inside it included. Its collections move up to the folder above it (or the top level) — unless `delete_collections: true`, which deletes them too (their items are kept, re-filed into the Inbox where needed).
   */
  deleteCollectionFolder(
    params: DeleteCollectionFolderParams,
  ): Promise<DeleteCollectionFolderResult> {
    return this.organize.deleteCollectionFolder(params);
  }
  /**
   * Alias for deleteCollectionFolder (Delete a sidebar collection folder, folders nested inside it included. Its collections move up to the folder above it (or the top level) — unless `delete_collections: true`, which deletes them too (their items are kept, re-filed into the Inbox where needed).)
   */
  delete_collection_folder(
    params: DeleteCollectionFolderParams,
  ): Promise<DeleteCollectionFolderResult> {
    return this.deleteCollectionFolder(params);
  }

  /**
   * File a collection into a sidebar collection folder (nested folders included — pass a path like "Projekte/Clients" to pick one by its parents), or pull it back to the top level (omit `folder`).
   */
  moveCollectionToFolder(
    params: MoveCollectionToFolderParams,
  ): Promise<MoveCollectionToFolderResult> {
    return this.organize.moveCollectionToFolder(params);
  }
  /**
   * Alias for moveCollectionToFolder (File a collection into a sidebar collection folder (nested folders included — pass a path like "Projekte/Clients" to pick one by its parents), or pull it back to the top level (omit `folder`).)
   */
  move_collection_to_folder(
    params: MoveCollectionToFolderParams,
  ): Promise<MoveCollectionToFolderResult> {
    return this.moveCollectionToFolder(params);
  }

  /**
   * List every tag in the library with how many items carry it. A tag filed in a sidebar tag folder carries `folder` (name) and `folder_id`; `tag_folders` lists the folders themselves with their member tags. Loose tags have no `folder`.
   */
  listTags(params: ListTagsParams = {}): Promise<ListTagsResult> {
    return this.organize.listTags(params);
  }
  /**
   * Alias for listTags (List every tag in the library with how many items carry it. A tag filed in a sidebar tag folder carries `folder` (name) and `folder_id`; `tag_folders` lists the folders themselves with their member tags. Loose tags have no `folder`.)
   */
  list_tags(params: ListTagsParams = {}): Promise<ListTagsResult> {
    return this.listTags(params);
  }

  /**
   * Create an empty tag (shows in the Tags list with 0 items) so it exists before anything carries it. Tagging items with add_tags creates tags implicitly — this is only for preparing a vocabulary.
   */
  createTag(params: CreateTagParams): Promise<CreateTagResult> {
    return this.organize.createTag(params);
  }
  /**
   * Alias for createTag (Create an empty tag (shows in the Tags list with 0 items) so it exists before anything carries it. Tagging items with add_tags creates tags implicitly — this is only for preparing a vocabulary.)
   */
  create_tag(params: CreateTagParams): Promise<CreateTagResult> {
    return this.createTag(params);
  }

  /**
   * Rename a tag everywhere it's used (trashed items included). Renaming onto an existing tag merges the two.
   */
  renameTag(params: RenameTagParams): Promise<RenameTagResult> {
    return this.organize.renameTag(params);
  }
  /**
   * Alias for renameTag (Rename a tag everywhere it's used (trashed items included). Renaming onto an existing tag merges the two.)
   */
  rename_tag(params: RenameTagParams): Promise<RenameTagResult> {
    return this.renameTag(params);
  }

  /**
   * Remove a tag from the library: strips it from every item carrying it (trashed ones too) and drops it from the tag list. Items themselves are untouched.
   */
  deleteTag(params: DeleteTagParams): Promise<DeleteTagResult> {
    return this.organize.deleteTag(params);
  }
  /**
   * Alias for deleteTag (Remove a tag from the library: strips it from every item carrying it (trashed ones too) and drops it from the tag list. Items themselves are untouched.)
   */
  delete_tag(params: DeleteTagParams): Promise<DeleteTagResult> {
    return this.deleteTag(params);
  }

  /**
   * Add one or more tags to a set of items (existing tags are kept; duplicates ignored). Batched: one library save regardless of item count.
   */
  addTags(params: AddTagsParams): Promise<AddTagsResult> {
    return this.organize.addTags(params);
  }
  /**
   * Alias for addTags (Add one or more tags to a set of items (existing tags are kept; duplicates ignored). Batched: one library save regardless of item count.)
   */
  add_tags(params: AddTagsParams): Promise<AddTagsResult> {
    return this.addTags(params);
  }

  /**
   * Remove one or more tags from a set of items (case-insensitive).
   */
  removeTags(params: RemoveTagsParams): Promise<RemoveTagsResult> {
    return this.organize.removeTags(params);
  }
  /**
   * Alias for removeTags (Remove one or more tags from a set of items (case-insensitive).)
   */
  remove_tags(params: RemoveTagsParams): Promise<RemoveTagsResult> {
    return this.removeTags(params);
  }

  /**
   * Replace an item's tags wholesale (an empty array clears them). Use add_tags / remove_tags to edit incrementally across many items.
   */
  setTags(params: SetTagsParams): Promise<SetTagsResult> {
    return this.organize.setTags(params);
  }
  /**
   * Alias for setTags (Replace an item's tags wholesale (an empty array clears them). Use add_tags / remove_tags to edit incrementally across many items.)
   */
  set_tags(params: SetTagsParams): Promise<SetTagsResult> {
    return this.setTags(params);
  }

  /**
   * File tags into a sidebar tag folder, or pull them back out to the loose list (omit `folder`). A tag sits in one folder at a time, so filing moves it out of any other folder.
   */
  moveTagsToFolder(params: MoveTagsToFolderParams): Promise<MoveTagsToFolderResult> {
    return this.organize.moveTagsToFolder(params);
  }
  /**
   * Alias for moveTagsToFolder (File tags into a sidebar tag folder, or pull them back out to the loose list (omit `folder`). A tag sits in one folder at a time, so filing moves it out of any other folder.)
   */
  move_tags_to_folder(params: MoveTagsToFolderParams): Promise<MoveTagsToFolderResult> {
    return this.moveTagsToFolder(params);
  }

  /**
   * Create a sidebar folder that groups tags (the Tags section nests them under it). Returns its id. Optionally file existing tags into it right away; a tag sits in one folder at a time.
   */
  createTagFolder(params: CreateTagFolderParams): Promise<CreateTagFolderResult> {
    return this.organize.createTagFolder(params);
  }
  /**
   * Alias for createTagFolder (Create a sidebar folder that groups tags (the Tags section nests them under it). Returns its id. Optionally file existing tags into it right away; a tag sits in one folder at a time.)
   */
  create_tag_folder(params: CreateTagFolderParams): Promise<CreateTagFolderResult> {
    return this.createTagFolder(params);
  }

  /**
   * Rename a sidebar tag folder.
   */
  renameTagFolder(params: RenameTagFolderParams): Promise<RenameTagFolderResult> {
    return this.organize.renameTagFolder(params);
  }
  /**
   * Alias for renameTagFolder (Rename a sidebar tag folder.)
   */
  rename_tag_folder(params: RenameTagFolderParams): Promise<RenameTagFolderResult> {
    return this.renameTagFolder(params);
  }

  /**
   * Delete a sidebar tag folder. Its tags stay on every item and read as loose tags again — nothing is untagged.
   */
  deleteTagFolder(params: DeleteTagFolderParams): Promise<DeleteTagFolderResult> {
    return this.organize.deleteTagFolder(params);
  }
  /**
   * Alias for deleteTagFolder (Delete a sidebar tag folder. Its tags stay on every item and read as loose tags again — nothing is untagged.)
   */
  delete_tag_folder(params: DeleteTagFolderParams): Promise<DeleteTagFolderResult> {
    return this.deleteTagFolder(params);
  }

  /**
   * List saved smart folders (rule-based live searches): id, name, match count, and their rules.
   */
  listSmartFolders(params: ListSmartFoldersParams = {}): Promise<ListSmartFoldersResult> {
    return this.organize.listSmartFolders(params);
  }
  /**
   * Alias for listSmartFolders (List saved smart folders (rule-based live searches): id, name, match count, and their rules.)
   */
  list_smart_folders(params: ListSmartFoldersParams = {}): Promise<ListSmartFoldersResult> {
    return this.listSmartFolders(params);
  }

  /**
   * Save a rule-based live search as a smart folder. `match` any/all of the rules must be true (`expect: false` inverts the whole set). Rule format is the same one list_smart_folders returns under `definition.rules`, e.g. {"field":"type","op":"is","text":"video"}, {"field":"tag","op":"contains","text":"logo"}, {"field":"dateAdded","op":"inLast","number":7,"unit":"days"}, {"field":"fileSize","op":"greaterThan","number":5,"unit":"MB"}, {"field":"collection","op":"isIn","refID":"<collection id>"}.
   */
  createSmartFolder(params: CreateSmartFolderParams): Promise<CreateSmartFolderResult> {
    return this.organize.createSmartFolder(params);
  }
  /**
   * Alias for createSmartFolder (Save a rule-based live search as a smart folder. `match` any/all of the rules must be true (`expect: false` inverts the whole set). Rule format is the same one list_smart_folders returns under `definition.rules`, e.g. {"field":"type","op":"is","text":"video"}, {"field":"tag","op":"contains","text":"logo"}, {"field":"dateAdded","op":"inLast","number":7,"unit":"days"}, {"field":"fileSize","op":"greaterThan","number":5,"unit":"MB"}, {"field":"collection","op":"isIn","refID":"<collection id>"}.)
   */
  create_smart_folder(params: CreateSmartFolderParams): Promise<CreateSmartFolderResult> {
    return this.createSmartFolder(params);
  }

  /**
   * Change a smart folder's name, match mode, expect flag, or rules (rules replace the whole set). Only the fields you pass change.
   */
  updateSmartFolder(params: UpdateSmartFolderParams): Promise<UpdateSmartFolderResult> {
    return this.organize.updateSmartFolder(params);
  }
  /**
   * Alias for updateSmartFolder (Change a smart folder's name, match mode, expect flag, or rules (rules replace the whole set). Only the fields you pass change.)
   */
  update_smart_folder(params: UpdateSmartFolderParams): Promise<UpdateSmartFolderResult> {
    return this.updateSmartFolder(params);
  }

  /**
   * Delete a smart folder (just the saved search — no items are touched).
   */
  deleteSmartFolder(params: DeleteSmartFolderParams): Promise<DeleteSmartFolderResult> {
    return this.organize.deleteSmartFolder(params);
  }
  /**
   * Alias for deleteSmartFolder (Delete a smart folder (just the saved search — no items are touched).)
   */
  delete_smart_folder(params: DeleteSmartFolderParams): Promise<DeleteSmartFolderResult> {
    return this.deleteSmartFolder(params);
  }

  /**
   * Rearrange a collection's canvas: each entry creates a group of the given items at (x, y) world coordinates (groups flow their items in a cluster around their center; a spacing of ~400–800 units between group centers reads well). Items must already be in the collection; items not mentioned keep their current groups. The user can undo this from the canvas.
   */
  arrangeBoard(params: ArrangeBoardParams): Promise<ArrangeBoardResult> {
    return this.organize.arrangeBoard(params);
  }
  /**
   * Alias for arrangeBoard (Rearrange a collection's canvas: each entry creates a group of the given items at (x, y) world coordinates (groups flow their items in a cluster around their center; a spacing of ~400–800 units between group centers reads well). Items must already be in the collection; items not mentioned keep their current groups. The user can undo this from the canvas.)
   */
  arrange_board(params: ArrangeBoardParams): Promise<ArrangeBoardResult> {
    return this.arrangeBoard(params);
  }

  /**
   * Move items into an existing canvas group (from get_board) at a position in its order. Items leave whatever group they were in.
   */
  moveToGroup(params: MoveToGroupParams): Promise<MoveToGroupResult> {
    return this.organize.moveToGroup(params);
  }
  /**
   * Alias for moveToGroup (Move items into an existing canvas group (from get_board) at a position in its order. Items leave whatever group they were in.)
   */
  move_to_group(params: MoveToGroupParams): Promise<MoveToGroupResult> {
    return this.moveToGroup(params);
  }

  /**
   * Move a canvas group to new (x, y) world coordinates.
   */
  moveGroup(params: MoveGroupParams): Promise<MoveGroupResult> {
    return this.organize.moveGroup(params);
  }
  /**
   * Alias for moveGroup (Move a canvas group to new (x, y) world coordinates.)
   */
  move_group(params: MoveGroupParams): Promise<MoveGroupResult> {
    return this.moveGroup(params);
  }

  /**
   * Undo all hand arrangement on a board: every item back into one cluster at the origin, following the grid sort order again.
   */
  resetBoardLayout(params: ResetBoardLayoutParams): Promise<ResetBoardLayoutResult> {
    return this.organize.resetBoardLayout(params);
  }
  /**
   * Alias for resetBoardLayout (Undo all hand arrangement on a board: every item back into one cluster at the origin, following the grid sort order again.)
   */
  reset_board_layout(params: ResetBoardLayoutParams): Promise<ResetBoardLayoutResult> {
    return this.resetBoardLayout(params);
  }

  /**
   * Step a board's layout back (or forward with `redo: true`) through its arrangement history — the same undo the canvas offers.
   */
  undoBoardLayout(params: UndoBoardLayoutParams): Promise<UndoBoardLayoutResult> {
    return this.organize.undoBoardLayout(params);
  }
  /**
   * Alias for undoBoardLayout (Step a board's layout back (or forward with `redo: true`) through its arrangement history — the same undo the canvas offers.)
   */
  undo_board_layout(params: UndoBoardLayoutParams): Promise<UndoBoardLayoutResult> {
    return this.undoBoardLayout(params);
  }

  /**
   * Folders on disk that Atlas watches (the sidebar's Folders section): id, name, path, whether it's mounted on this Mac, and how many library items come from it. The iPhone folder (iCloud) is included. Items from connected folders carry `connected_folder_id`.
   */
  listConnectedFolders(
    params: ListConnectedFoldersParams = {},
  ): Promise<ListConnectedFoldersResult> {
    return this.organize.listConnectedFolders(params);
  }
  /**
   * Alias for listConnectedFolders (Folders on disk that Atlas watches (the sidebar's Folders section): id, name, path, whether it's mounted on this Mac, and how many library items come from it. The iPhone folder (iCloud) is included. Items from connected folders carry `connected_folder_id`.)
   */
  list_connected_folders(
    params: ListConnectedFoldersParams = {},
  ): Promise<ListConnectedFoldersResult> {
    return this.listConnectedFolders(params);
  }

  /**
   * Watch a folder on this Mac: its media shows up in the sidebar's Folders section and becomes searchable (files stay where they are). Scans it right away.
   */
  connectFolder(params: ConnectFolderParams): Promise<ConnectFolderResult> {
    return this.organize.connectFolder(params);
  }
  /**
   * Alias for connectFolder (Watch a folder on this Mac: its media shows up in the sidebar's Folders section and becomes searchable (files stay where they are). Scans it right away.)
   */
  connect_folder(params: ConnectFolderParams): Promise<ConnectFolderResult> {
    return this.connectFolder(params);
  }

  /**
   * Stop watching a connected folder. Files on disk are untouched; the folder's items leave the library, including their places in collections and the Trash. The iPhone folder can't be disconnected.
   */
  disconnectFolder(params: DisconnectFolderParams): Promise<DisconnectFolderResult> {
    return this.organize.disconnectFolder(params);
  }
  /**
   * Alias for disconnectFolder (Stop watching a connected folder. Files on disk are untouched; the folder's items leave the library, including their places in collections and the Trash. The iPhone folder can't be disconnected.)
   */
  disconnect_folder(params: DisconnectFolderParams): Promise<DisconnectFolderResult> {
    return this.disconnectFolder(params);
  }

  /**
   * Re-index a connected folder now: picks up new files, drops ones deleted on disk. Returns the item count.
   */
  rescanFolder(params: RescanFolderParams): Promise<RescanFolderResult> {
    return this.organize.rescanFolder(params);
  }
  /**
   * Alias for rescanFolder (Re-index a connected folder now: picks up new files, drops ones deleted on disk. Returns the item count.)
   */
  rescan_folder(params: RescanFolderParams): Promise<RescanFolderResult> {
    return this.rescanFolder(params);
  }

  /**
   * Which library is open and its totals: name, path, read-only state, unique item counts by kind, trash size, tag / collection / smart folder / connected folder counts, how much of the library the visual-similarity index covers. Pass `include_bytes: true` to also total the originals on disk (walks every file — slow on big libraries).
   */
  libraryInfo(params: LibraryInfoParams = {}): Promise<LibraryInfoResult> {
    return this.organize.libraryInfo(params);
  }
  /**
   * Alias for libraryInfo (Which library is open and its totals: name, path, read-only state, unique item counts by kind, trash size, tag / collection / smart folder / connected folder counts, how much of the library the visual-similarity index covers. Pass `include_bytes: true` to also total the originals on disk (walks every file — slow on big libraries).)
   */
  library_info(params: LibraryInfoParams = {}): Promise<LibraryInfoResult> {
    return this.libraryInfo(params);
  }

  /**
   * Every library Atlas knows on this Mac (the open one is marked). Use switch_library to open another.
   */
  listLibraries(params: ListLibrariesParams = {}): Promise<ListLibrariesResult> {
    return this.organize.listLibraries(params);
  }
  /**
   * Alias for listLibraries (Every library Atlas knows on this Mac (the open one is marked). Use switch_library to open another.)
   */
  list_libraries(params: ListLibrariesParams = {}): Promise<ListLibrariesResult> {
    return this.listLibraries(params);
  }

  /**
   * Create a new, empty Atlas library at a path (a folder ending in .atlaslibrary is created) and switch to it.
   */
  createLibrary(params: CreateLibraryParams): Promise<CreateLibraryResult> {
    return this.organize.createLibrary(params);
  }
  /**
   * Alias for createLibrary (Create a new, empty Atlas library at a path (a folder ending in .atlaslibrary is created) and switch to it.)
   */
  create_library(params: CreateLibraryParams): Promise<CreateLibraryResult> {
    return this.createLibrary(params);
  }

  /**
   * Open another Atlas library (from list_libraries, or any path to a .atlaslibrary folder). The whole app switches — every later tool call sees that library.
   */
  async switchLibrary(params: SwitchLibraryParams): Promise<SwitchLibraryResult> {
    // * Switch active library to path, updating the transport active library state
    const result = await this.organize.switchLibrary(params);
    if (this.transport instanceof HttpAtlasTransport) {
      this.transport.setActiveLibrary(params.path);
    }
    return result;
  }
  /**
   * Alias for switchLibrary (Open another Atlas library (from list_libraries, or any path to a .atlaslibrary folder). The whole app switches — every later tool call sees that library.)
   */
  switch_library(params: SwitchLibraryParams): Promise<SwitchLibraryResult> {
    return this.switchLibrary(params);
  }

  // * ========================================================================
  // * UI and Settings Methods (11 Tools)
  // * ========================================================================

  /**
   * Navigate Atlas's window to a destination: a collection, collection folder, tag, smart folder, connected folder, or one of the built-in views (`all`, `links`, `colors`, `instagram`, `x`, `inbox`, `likes`, `trash`). Pass exactly one of `collection`, `collection_folder`, `tag`, `smart_folder`, `connected_folder`, or `view`. Brings the app to the front unless `front: false`. To show a set of individual items instead — search results, your own picks — use show_items.
   */
  showInApp(params: ShowInAppParams = {}): Promise<ShowInAppResult> {
    return this.ui.showInApp(params);
  }
  /**
   * Alias for showInApp (Navigate Atlas's window to a destination: a collection, collection folder, tag, smart folder, connected folder, or one of the built-in views (`all`, `links`, `colors`, `instagram`, `x`, `inbox`, `likes`, `trash`). Pass exactly one of `collection`, `collection_folder`, `tag`, `smart_folder`, `connected_folder`, or `view`. Brings the app to the front unless `front: false`. To show a set of individual items instead — search results, your own picks — use show_items.)
   */
  show_in_app(params: ShowInAppParams = {}): Promise<ShowInAppResult> {
    return this.showInApp(params);
  }

  /**
   * Put an arbitrary set of items on screen: the same results view in-app search and Find Similar use — grid, in the order you pass them, with a Back button to wherever the user was. This is how you show a result set that matches no collection (search hits, a filtered subset, the ones you picked); show_in_app only navigates to a whole collection, tag, smart folder, or built-in view. `title` names the set in the header — pass what you searched for. `select: true` also selects them so the user can act on them right away. Up to 500 items; trashed ones are skipped.
   */
  showItems(params: ShowItemsParams): Promise<ShowItemsResult> {
    return this.ui.showItems(params);
  }
  /**
   * Alias for showItems (Put an arbitrary set of items on screen: the same results view in-app search and Find Similar use — grid, in the order you pass them, with a Back button to wherever the user was. This is how you show a result set that matches no collection (search hits, a filtered subset, the ones you picked); show_in_app only navigates to a whole collection, tag, smart folder, or built-in view. `title` names the set in the header — pass what you searched for. `select: true` also selects them so the user can act on them right away. Up to 500 items; trashed ones are skipped.)
   */
  show_items(params: ShowItemsParams): Promise<ShowItemsResult> {
    return this.showItems(params);
  }

  /**
   * Open an item in Atlas's focused (full-size) view so the user sees it. Navigates to the item's collection first unless it's already on screen (pass `collection` to pick which one). Links open in the browser and color cards search the library by their color instead — that's what opening them means in Atlas.
   */
  openItem(params: OpenItemParams): Promise<OpenItemResult> {
    return this.ui.openItem(params);
  }
  /**
   * Alias for openItem (Open an item in Atlas's focused (full-size) view so the user sees it. Navigates to the item's collection first unless it's already on screen (pass `collection` to pick which one). Links open in the browser and color cards search the library by their color instead — that's what opening them means in Atlas.)
   */
  open_item(params: OpenItemParams): Promise<OpenItemResult> {
    return this.openItem(params);
  }

  /**
   * Select items in the current grid/canvas view (replacing the selection) so the user can act on them. Items not on screen are ignored — land on them first: show_in_app for a whole collection, show_items for a set of your own (which can select them in the same call).
   */
  selectItems(params: SelectItemsParams): Promise<SelectItemsResult> {
    return this.ui.selectItems(params);
  }
  /**
   * Alias for selectItems (Select items in the current grid/canvas view (replacing the selection) so the user can act on them. Items not on screen are ignored — land on them first: show_in_app for a whole collection, show_items for a set of your own (which can select them in the same call).)
   */
  select_items(params: SelectItemsParams): Promise<SelectItemsResult> {
    return this.selectItems(params);
  }

  /**
   * Switch the current view between its display modes: `grid` (packed rows), `infinite` (endless zoomable plane), and `canvas` (free-form board). Some destinations are grid-only (Trash, smart folders, tags, sources, connected folders, Links, Colors) and All Items has no canvas — the result reports the mode actually in effect.
   */
  setViewMode(params: SetViewModeParams): Promise<SetViewModeResult> {
    return this.ui.setViewMode(params);
  }
  /**
   * Alias for setViewMode (Switch the current view between its display modes: `grid` (packed rows), `infinite` (endless zoomable plane), and `canvas` (free-form board). Some destinations are grid-only (Trash, smart folders, tags, sources, connected folders, Links, Colors) and All Items has no canvas — the result reports the mode actually in effect.)
   */
  set_view_mode(params: SetViewModeParams): Promise<SetViewModeResult> {
    return this.setViewMode(params);
  }

  /**
   * Reveal items' original files in the Finder (up to 50).
   */
  showInFinder(params: ShowInFinderParams): Promise<ShowInFinderResult> {
    return this.ui.showInFinder(params);
  }
  /**
   * Alias for showInFinder (Reveal items' original files in the Finder (up to 50).)
   */
  show_in_finder(params: ShowInFinderParams): Promise<ShowInFinderResult> {
    return this.showInFinder(params);
  }

  /**
   * Every user-tweakable app setting with its current value, type, and allowed values or range: appearance (light/dark, window style, backgrounds, tile radius/spacing, selection color), behavior (open/hover/playback, sort orders), general, sidebar visibility, download services, update channels, MCP, and — while the Debug tab is unlocked — every Debug knob. Change them with set_setting.
   */
  getSettings(params: GetSettingsParams = {}): Promise<GetSettingsResult> {
    return this.ui.getSettings(params);
  }
  /**
   * Alias for getSettings (Every user-tweakable app setting with its current value, type, and allowed values or range: appearance (light/dark, window style, backgrounds, tile radius/spacing, selection color), behavior (open/hover/playback, sort orders), general, sidebar visibility, download services, update channels, MCP, and — while the Debug tab is unlocked — every Debug knob. Change them with set_setting.)
   */
  get_settings(params: GetSettingsParams = {}): Promise<GetSettingsResult> {
    return this.getSettings(params);
  }

  /**
   * Change one app setting by name (from get_settings) — validated, applied live, and persisted, the same paths the Settings window drives. Numbers are clamped to their range. The MCP safety gates (mcp_enabled, allow_permanent_deletion, debug_unlocked) are read-only for agents; Debug knobs need the Debug tab unlocked.
   */
  setSetting(params: SetSettingParams): Promise<SetSettingResult> {
    return this.ui.setSetting(params);
  }
  /**
   * Alias for setSetting (Change one app setting by name (from get_settings) — validated, applied live, and persisted, the same paths the Settings window drives. Numbers are clamped to their range. The MCP safety gates (mcp_enabled, allow_permanent_deletion, debug_unlocked) are read-only for agents; Debug knobs need the Debug tab unlocked.)
   */
  set_setting(params: SetSettingParams): Promise<SetSettingResult> {
    return this.setSetting(params);
  }

  /**
   * Open Atlas's Settings window, optionally on a specific page. The license page only exists while licensing is active and the debug page while it's unlocked.
   */
  openSettings(params: OpenSettingsParams = {}): Promise<OpenSettingsResult> {
    return this.ui.openSettings(params);
  }
  /**
   * Alias for openSettings (Open Atlas's Settings window, optionally on a specific page. The license page only exists while licensing is active and the debug page while it's unlocked.)
   */
  open_settings(params: OpenSettingsParams = {}): Promise<OpenSettingsResult> {
    return this.openSettings(params);
  }

  /**
   * Facts about the running app: version, build, release channel (an `a` version suffix = internal alpha, `b` = beta, plain = stable), update-channel toggles, macOS version, MCP endpoint, and the open library.
   */
  appInfo(params: AppInfoParams = {}): Promise<AppInfoResult> {
    return this.ui.appInfo(params);
  }
  /**
   * Alias for appInfo (Facts about the running app: version, build, release channel (an `a` version suffix = internal alpha, `b` = beta, plain = stable), update-channel toggles, macOS version, MCP endpoint, and the open library.)
   */
  app_info(params: AppInfoParams = {}): Promise<AppInfoResult> {
    return this.appInfo(params);
  }

  /**
   * Library housekeeping. `remove_duplicates` runs File ▸ Clean up library: byte-identical files collapse onto one stored copy, a collection holding several keeps one entry (an item left in no collection goes to the Trash), and every other copy stays in place as a virtual copy, deleting the freed files; `remove_missing_originals` forgets items whose files are gone from disk; `purge_expired_trash` deletes trashed items older than `days`. Those three are permanent and require Settings ▸ Developers ▸ "Allow permanent deletion". `repair_thumbnails` regenerates missing previews and is always allowed.
   */
  runMaintenance(params: RunMaintenanceParams): Promise<RunMaintenanceResult> {
    return this.ui.runMaintenance(params);
  }
  /**
   * Alias for runMaintenance (Library housekeeping. `remove_duplicates` runs File ▸ Clean up library: byte-identical files collapse onto one stored copy, a collection holding several keeps one entry (an item left in no collection goes to the Trash), and every other copy stays in place as a virtual copy, deleting the freed files; `remove_missing_originals` forgets items whose files are gone from disk; `purge_expired_trash` deletes trashed items older than `days`. Those three are permanent and require Settings ▸ Developers ▸ "Allow permanent deletion". `repair_thumbnails` regenerates missing previews and is always allowed.)
   */
  run_maintenance(params: RunMaintenanceParams): Promise<RunMaintenanceResult> {
    return this.runMaintenance(params);
  }
}
