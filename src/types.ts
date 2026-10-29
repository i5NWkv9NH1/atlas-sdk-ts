/**
 * Atlas MCP Strongly-Typed Protocol Definitions and Contracts
 *
 * Strictly aligned with official Atlas MCP schema and specification.
 * All enums use string literal unions to eliminate runtime overhead.
 */

// * ============================================================================
// * 1. Fundamental Enumerations and Union Types (String Literals)
// * ============================================================================

/**
 * Supported library item kinds
 */
export type ItemKind = "image" | "video" | "gif" | "link" | "color";

/**
 * Item kinds supported by semantic description search
 */
export type SearchDescriptionKind = "image" | "video" | "gif" | "link";

/**
 * Sort fields for library queries
 */
export type ItemSortField =
  | "date_added"
  | "date_created"
  | "name"
  | "bytes"
  | "duration"
  | "width"
  | "height"
  | "random";

/**
 * Sort ordering direction
 */
export type SortOrder = "desc" | "asc";

/**
 * Supported social network sources
 */
export type SocialSource = "instagram" | "x";

/**
 * Media aspect ratio orientation
 */
export type MediaOrientation = "portrait" | "landscape" | "square";

/**
 * Image rotation direction (90-degree steps)
 */
export type RotateDirection = "left" | "right";

/**
 * Smart folder match mode: match all rules or any rule
 */
export type SmartFolderMatch = "any" | "all";

/**
 * Target field for smart folder rules
 */
export type SmartFolderRuleField =
  | "type"
  | "name"
  | "format"
  | "fileSize"
  | "width"
  | "height"
  | "orientation"
  | "duration"
  | "dateAdded"
  | "dateCreated"
  | "tag"
  | "url"
  | "liked"
  | "collection"
  | "sourceFolder";

/**
 * Comparison operator for smart folder rules
 */
export type SmartFolderRuleOp =
  | "is"
  | "isNot"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "equals"
  | "before"
  | "after"
  | "inLast"
  | "hasAny"
  | "hasNone"
  | "isIn"
  | "isNotIn";

/**
 * Numeric units for smart folder rule thresholds
 */
export type SmartFolderUnit = "KB" | "MB" | "seconds" | "minutes" | "days" | "weeks" | "months";

/**
 * Built-in application preset views
 */
export type BuiltinAppView =
  | "all"
  | "links"
  | "colors"
  | "instagram"
  | "x"
  | "inbox"
  | "likes"
  | "trash";

/**
 * Item list display modes
 */
export type ViewDisplayMode = "grid" | "infinite" | "canvas";

/**
 * Application settings section identifiers
 */
export type SettingsSection =
  | "appearance"
  | "behavior"
  | "general"
  | "services"
  | "sidebar"
  | "updates"
  | "mcp"
  | "debug";

/**
 * Settings window tab pages
 */
export type SettingsPage =
  | "general"
  | "appearance"
  | "shortcuts"
  | "collections"
  | "importing"
  | "media"
  | "galleries"
  | "services"
  | "extensions"
  | "mcp"
  | "updates"
  | "license"
  | "about"
  | "experimental"
  | "debug"
  | "library"
  | "developers";

/**
 * Library maintenance action types
 */
export type MaintenanceAction =
  | "remove_duplicates"
  | "remove_missing_originals"
  | "purge_expired_trash"
  | "repair_thumbnails";

// * ============================================================================
// * 2. Common Domain Entities and Structures
// * ============================================================================

/**
 * Normalized crop rectangle (0 to 1 range, top-left origin)
 */
export interface CropRect {
  /** Normalized left X coordinate (0 to 1) */
  x: number;
  /** Normalized top Y coordinate (0 to 1) */
  y: number;
  /** Normalized width (0 to 1) */
  width: number;
  /** Normalized height (0 to 1) */
  height: number;
}

/**
 * Single smart folder rule criteria
 */
export interface SmartFolderRule {
  /** Rule comparison field */
  field: SmartFolderRuleField;
  /** Rule comparison operator */
  op: SmartFolderRuleOp;
  /** Text value (for type, name, format, orientation, url, tag, etc.) */
  text?: string;
  /** Numeric value (for fileSize, width, height, duration, inLast, etc.) */
  number?: number;
  /** Unit for numeric value (e.g. KB, MB, days) */
  unit?: SmartFolderUnit;
  /** ISO 8601 datetime string (for before, after) */
  date?: string;
  /** Referenced collection ID or connected folder ID */
  refID?: string;
  /** Unique identifier of the saved rule */
  id?: string;
}

/**
 * Complete smart folder definition
 */
export interface SmartFolderDefinition {
  /** Smart folder identifier */
  id?: string;
  /** Smart folder name */
  name: string;
  /** Match mode: 'all' to require all rules, 'any' for any rule */
  match: SmartFolderMatch;
  /** Whether condition must match; false indicates inverted NOT match */
  expect: boolean;
  /** List of rule definitions */
  rules: SmartFolderRule[];
  /** Creation timestamp in ISO 8601 format */
  dateCreated?: string;
}

/**
 * Canvas group layout item
 */
export interface BoardGroupInput {
  /** List of member item IDs in the group */
  item_ids: string[];
  /** Group center X coordinate on canvas */
  x: number;
  /** Group center Y coordinate on canvas */
  y: number;
}

/**
 * Vector embedding entry keyed by content_hash
 */
export interface EmbeddingEntry {
  /** Content SHA-256 hash of the item */
  content_hash: string;
  /** Embedding float vector array */
  vector: number[];
}

/**
 * Standard generic operation response
 */
export interface SimpleOkResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Additional dynamic response properties */
  [key: string]: unknown;
}

/**
 * Summary metadata for a library item
 */
export interface AtlasItemSummary {
  /** Item unique identifier (UUID) */
  id: string;
  /** Display name or original filename */
  name: string;
  /** Kind of the item */
  kind: ItemKind;
  /** Timestamp when added to library (ISO 8601) */
  date_added: string;
  /** Width in pixels if applicable */
  width?: number;
  /** Height in pixels if applicable */
  height?: number;
  /** File size in bytes if requested */
  bytes?: number;
  /** File format extension, e.g. jpeg, png, mp4 */
  format?: string;
  /** Video duration in seconds */
  duration?: number;
  /** Absolute path to the raw original file on disk */
  path?: string;
  /** Absolute path to the thumbnail file on disk */
  thumbnail_path?: string;
}

/**
 * Comprehensive item details returned by get_item
 */
export type AtlasItem = AtlasItemDetail;

export interface AtlasItemDetail extends AtlasItemSummary {
  /** Original creation / capture timestamp (ISO 8601) */
  date_created?: string;
  /** SHA-256 hash of the content */
  content_hash?: string;
  /** MIME type string */
  mime_type?: string;
  /** Whether the raw original file is currently present on disk */
  original_available?: boolean;
  /** Original source URL */
  source_url?: string;
  /** User annotation or notes */
  annotation?: string;
  /** Author or creator attribution */
  author?: string;
  /** Geographic location string */
  location?: string;
  /** List of associated tags */
  tags?: string[];
  /** List of collections containing this item */
  collections?: Array<{ id: string; name: string }>;
  /** Hex color code for color card items */
  hex?: string;
  /** Title for link items */
  title?: string;
  /** Description for link items */
  description?: string;
  /** Connected folder ID if indexed from disk directory */
  connected_folder_id?: string;
  /** Whether this item is liked (in Likes collection) */
  liked?: boolean;
  /** Individual page details for multi-image albums or carousels */
  pages?: Array<{ page: number; path: string; width: number; height: number }>;
}

// * ============================================================================
// * 3. Strongly-Typed Parameters and Results for all 78 MCP Tools
// * ============================================================================

// --- 1. library_info ---
/**
 * Parameters for the library_info tool
 */
export interface LibraryInfoParams {
  /**
   * Whether to recursively compute total byte size of all original files on disk.
   * Note: recursive disk traversal on large libraries can be slow.
   */
  include_bytes?: boolean;
}

/**
 * Result of the library_info tool
 */
export interface LibraryInfoResult {
  /** Name of the currently active library */
  name: string;
  /** Local filesystem path to the active .atlas library bundle */
  path: string;
  /** Whether the active library is read-only */
  read_only: boolean;
  /** Total count of unique items in the library */
  unique_items: number;
  /** Total count of items in the trash */
  trashed_items: number;
  /** Count of items broken down by kind */
  items_by_kind: {
    image?: number;
    video?: number;
    gif?: number;
    link?: number;
    color?: number;
  };
  /** Total number of collections (boards) */
  collections: number;
  /** Total number of archived collections */
  archived_collections: number;
  /** Total number of collection folders */
  collection_folders: number;
  /** Total number of smart folders */
  smart_folders: number;
  /** Total number of connected disk folders */
  connected_folders: number;
  /** Total number of unique tags */
  tags: number;
  /** Total number of untagged items */
  untagged_items: number;
  /** Total number of liked items */
  liked_items: number;
  /** Visual similarity index status */
  similarity_index: {
    indexed_items: number;
    indexing: boolean;
  };
  /** Total raw bytes on disk (only computed when include_bytes is true) */
  bytes?: number;
}

// --- 2. list_libraries ---
export type ListLibrariesParams = {};

export interface AtlasLibraryEntry {
  /** Display name of the library */
  name: string;
  /** Absolute path to the library bundle on disk */
  path: string;
  /** Whether the path exists on the local filesystem */
  exists: boolean;
  /** Whether this is the currently open active library */
  current?: boolean;
}

export interface ListLibrariesResult {
  /** List of known libraries */
  libraries: AtlasLibraryEntry[];
}

// --- 3. list_collections ---
export type ListCollectionsParams = {};

export interface AtlasCollection {
  /** Collection identifier */
  id: string;
  /** Collection name */
  name: string;
  /** Creation timestamp in ISO 8601 format */
  date_created: string;
  /** Count of item placements in the collection (not deduplicated globally) */
  item_count: number;
  /** Whether this is a built-in collection (e.g. Inbox, Likes, Trash) */
  system?: boolean;
  /** Whether this collection is archived */
  archived?: boolean;
  /** Parent collection folder ID */
  folder_id?: string;
  /** Parent collection folder name */
  folder?: string;
}

export interface ListCollectionsResult {
  /** List of collections */
  collections: AtlasCollection[];
  /** Global exact library counts */
  library: {
    unique_items: number;
    trashed_items: number;
  };
}

// --- 4. list_collection_folders ---
export type ListCollectionFoldersParams = {};

export interface AtlasCollectionFolder {
  /** Folder identifier */
  id: string;
  /** Folder name */
  name: string;
  /** Parent folder identifier (null for top-level) */
  parent_id: string | null;
  /** Hierarchical path, e.g. 'Parent ▸ Child' */
  path: string;
  /** List of collection IDs inside this folder */
  collection_ids?: string[];
  /** Summaries of collections inside this folder */
  collections?: Array<{ id: string; name: string }>;
}

export interface ListCollectionFoldersResult {
  /** List of collection folders */
  collection_folders: AtlasCollectionFolder[];
}

// --- 5. list_tags ---
export type ListTagsParams = {};

export interface AtlasTag {
  /** Tag name */
  tag: string;
  /** Count of items tagged with this tag */
  count: number;
  /** Parent tag folder name (empty if ungrouped) */
  folder?: string;
  /** Parent tag folder identifier */
  folder_id?: string;
}

export interface AtlasTagFolder {
  /** Tag folder identifier */
  id: string;
  /** Tag folder name */
  name: string;
  /** List of tag names grouped in this folder */
  tags: string[];
}

export interface ListTagsResult {
  /** List of tags */
  tags: AtlasTag[];
  /** List of tag folders */
  tag_folders: AtlasTagFolder[];
}

// --- 6. list_smart_folders ---
export type ListSmartFoldersParams = {};

export interface AtlasSmartFolderEntry {
  /** Smart folder identifier */
  id: string;
  /** Smart folder name */
  name: string;
  /** Live count of matching items */
  match_count: number;
  /** Smart folder rules and criteria definition */
  definition: SmartFolderDefinition;
}

export interface ListSmartFoldersResult {
  /** List of smart folders */
  smart_folders: AtlasSmartFolderEntry[];
}

// --- 7. list_connected_folders ---
export type ListConnectedFoldersParams = {};

export interface AtlasConnectedFolder {
  /** Connected folder identifier */
  id: string;
  /** Display name of the folder */
  name: string;
  /** Absolute path on local disk */
  path: string;
  /** Whether the host filesystem volume is currently mounted */
  mounted: boolean;
  /** Count of items indexed from this connected directory */
  item_count: number;
}

export interface ListConnectedFoldersResult {
  /** List of connected folders */
  connected_folders: AtlasConnectedFolder[];
}

// --- 8. search_items ---
export interface SearchItemsParams {
  /** Free-text query matching name, title, description, tags, notes, author, location, and source URL */
  query?: string;
  /** Limit search to collection name or ID (pass 'Trash' for trash) */
  collection?: string;
  /** Limit search to collection folder name or ID */
  collection_folder?: string;
  /** Limit search to smart folder name or ID */
  smart_folder?: string;
  /** Limit search to connected folder name or ID */
  connected_folder?: string;
  /** Filter by social network source */
  source?: SocialSource;
  /** Filter by item kind */
  kind?: ItemKind;
  /** Must contain all of these tags */
  tags?: string[];
  /** Must contain at least one of these tags */
  any_tags?: string[];
  /** Filter by file format extension, e.g. png, jpg, mp4 */
  format?: string;
  /** Filter by aspect ratio orientation */
  orientation?: MediaOrientation;
  /** Filter to only liked items */
  liked?: boolean;
  /** Filter to only untagged items */
  untagged?: boolean;
  /** Filter to only annotated items */
  has_annotation?: boolean;
  /** Author substring filter (case-insensitive) */
  author?: string;
  /** Minimum file size in bytes */
  min_bytes?: number;
  /** Maximum file size in bytes */
  max_bytes?: number;
  /** Minimum width in pixels */
  min_width?: number;
  /** Maximum width in pixels */
  max_width?: number;
  /** Minimum height in pixels */
  min_height?: number;
  /** Maximum height in pixels */
  max_height?: number;
  /** Minimum video duration in seconds */
  min_duration?: number;
  /** Maximum video duration in seconds */
  max_duration?: number;
  /** Only return items added within the last N days */
  added_within_days?: number;
  /** Start date when items were added (ISO 8601) */
  added_after?: string;
  /** End date when items were added (ISO 8601) */
  added_before?: string;
  /** Original media creation start date (ISO 8601) */
  created_after?: string;
  /** Original media creation end date (ISO 8601) */
  created_before?: string;
  /** Sort field, defaults to date_added */
  sort?: ItemSortField;
  /** Sort direction, defaults to desc */
  order?: SortOrder;
  /** Pagination offset, defaults to 0 */
  offset?: number;
  /** Maximum items per page, defaults to 50, maximum 200 */
  limit?: number;
  /** Whether to return verbose metadata (absolute paths, annotations, technical specs) */
  verbose?: boolean;
}

export interface SearchItemsResult {
  /** List of matching items */
  items: AtlasItemSummary[];
  /** Total count of matching items */
  total_matches: number;
  /** Current pagination offset */
  offset: number;
}

// --- 9. run_smart_folder ---
export interface RunSmartFolderParams {
  /** Smart folder ID or name */
  smart_folder: string;
  /** Maximum items per page, defaults to 50, maximum 200 */
  limit?: number;
  /** Pagination offset, defaults to 0 */
  offset?: number;
}

export interface RunSmartFolderResult {
  /** List of matching items */
  items: AtlasItemSummary[];
  /** Total matching count */
  total_matches: number;
  /** Current pagination offset */
  offset: number;
  /** Matched smart folder definition */
  smart_folder: {
    id: string;
    name: string;
  };
}

// --- 10. get_item ---
export interface GetItemParams {
  /** Item unique identifier (UUID) */
  item_id: string;
}

export type GetItemResult = AtlasItemDetail;

// --- 11. view_items ---
export interface ViewItemsParams {
  /** List of item IDs (maximum 20 per call) */
  item_ids: string[];
  /** Max thumbnail long-edge pixel size (128-1024, default 512) */
  size?: number;
}

export interface AtlasImageItem {
  type: "image";
  mimeType: string;
  data: string;
}

export interface ViewItemsResult {
  /** List of returned items with text descriptions and Base64 image data */
  content: Array<{
    type: "text" | "image";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
}

// --- 12. get_file ---
export interface GetFileParams {
  /** Item unique identifier (UUID) */
  item_id: string;
  /** Max long-edge pixel size (default 2048px; pass 0 for original bytes, up to 32MB) */
  size?: number;
  /** Target page index for multi-image items (0 is cover) */
  page?: number;
}

export interface GetFileResult {
  /** Delivery notes and file info */
  bytes?: number;
  delivered?: string;
  item_id: string;
  mime_type?: string;
  page?: number;
  path: string;
  /** Inline image payload when requested item is an image */
  image?: {
    data: string;
    mimeType: string;
  };
}

// --- 13. get_board ---
export interface GetBoardParams {
  /** Collection ID or name */
  collection: string;
}

export interface AtlasBoardGroup {
  /** Group identifier */
  id: string;
  /** Group display name (optional) */
  name?: string;
  /** Group center X coordinate on canvas */
  x: number;
  /** Group center Y coordinate on canvas */
  y: number;
  /** Member items in the group in presentation order */
  items: Array<{ id: string; name: string }>;
}

export interface GetBoardResult {
  /** Whether the board layout has been manually customized */
  arranged: boolean;
  /** List of layout groups on canvas */
  groups: AtlasBoardGroup[];
}

// --- 14. find_similar ---
export interface FindSimilarParams {
  /** Reference item ID to find visual matches for */
  item_id: string;
  /** Maximum matching results to return (default 20, max 100) */
  limit?: number;
}

export interface SimilarItemResult extends AtlasItemSummary {
  /** Visual distance score (lower is more similar) */
  distance: number;
}

export interface FindSimilarResult {
  /** Total count of indexed items in similarity index */
  indexed_items: number;
  /** List of visually similar items */
  results: SimilarItemResult[];
}

// --- 15. get_current_view ---
export interface GetCurrentViewParams {
  /** Maximum items to return (default 100) */
  limit?: number;
}

export interface GetCurrentViewResult {
  /** Active collection ID (empty if in preset view) */
  collection?: {
    id: string;
    name: string;
  };
  /** Current view display mode */
  mode: ViewDisplayMode;
  /** Total items in current view */
  item_count: number;
  /** Items currently visible on screen in presentation order */
  items: AtlasItemSummary[];
  /** List of currently selected item IDs */
  selected_item_ids: string[];
}

// --- 16. add_link ---
export interface AddLinkParams {
  /** Full web URL to bookmark */
  url: string;
  /** Target collection ID or name (defaults to global library or inbox) */
  collection?: string;
}

export interface AddLinkResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Generated link card item ID */
  item_id: string;
  /** Title for the link card */
  title?: string;
  /** Original bookmarked URL */
  url: string;
}

// --- 17. add_color ---
export interface AddColorParams {
  /** Hex color string (supports 3/4/6/8 hex digits, e.g. #FF5733) */
  hex: string;
  /** Target collection ID or name */
  collection?: string;
}

export interface AddColorResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Generated color card item ID */
  item_id: string;
  /** Normalized hex color code */
  hex: string;
}

// --- 18. save_media_from_url ---
export interface SaveMediaFromUrlParams {
  /** Web URL or direct media link to save (supports X, Instagram, etc.) */
  url: string;
  /** Target collection ID or name (defaults to inbox) */
  collection?: string;
}

export interface SaveMediaFromUrlResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** List of newly generated item IDs */
  item_ids?: string[];
  /** Primary item ID */
  item_id?: string;
  /** Number of downloaded files */
  saved_count?: number;
}

// --- 19. import_files ---
export interface ImportFilesParams {
  /** List of absolute filesystem paths to import */
  paths: string[];
  /** Target collection ID or name (defaults to inbox) */
  collection?: string;
  /** Canvas X coordinate placement */
  x?: number;
  /** Canvas Y coordinate placement */
  y?: number;
}

export interface ImportFilesResult {
  /** Whether the operation succeeded */
  ok?: boolean;
  /** Count of successfully imported items */
  imported: number;
  /** List of newly generated item IDs */
  item_ids?: string[];
  /** Count of items skipped due to duplicate content hash */
  skipped_duplicate?: number;
  /** Count of items skipped due to unsupported file format */
  skipped_unsupported?: number;
  /** List of failed files and error reasons */
  failed?: Array<{ path: string; reason: string }>;
}

// --- 20. add_tags ---
export interface AddTagsParams {
  /** Target list of item IDs */
  item_ids: string[];
  /** List of tags to append */
  tags: string[];
}

export interface AddTagsResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of updated items */
  items: number;
  /** List of added tags */
  tags: string[];
}

// --- 21. remove_tags ---
export interface RemoveTagsParams {
  /** Target list of item IDs */
  item_ids: string[];
  /** List of tags to remove (case-insensitive) */
  tags: string[];
}

export interface RemoveTagsResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of updated items */
  items: number;
  /** List of removed tags */
  tags: string[];
}

// --- 22. set_tags ---
export interface SetTagsParams {
  /** Target item UUID */
  item_id: string;
  /** Replacement list of tags (pass empty array to clear all) */
  tags: string[];
}

export interface SetTagsResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Item identifier (UUID) */
  item_id: string;
  /** All tags currently on the item */
  tags: string[];
}

// --- 23. set_metadata ---
export interface SetMetadataParams {
  /** Target item UUID */
  item_id: string;
  /** User annotation/note (pass empty string to clear) */
  annotation?: string;
  /** Author attribution (pass empty string to clear) */
  author?: string;
  /** Location (pass empty string to clear) */
  location?: string;
  /** Source URL (pass empty string to clear) */
  source_url?: string;
}

export interface SetMetadataResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 24. edit_link ---
export interface EditLinkParams {
  /** Link card item UUID */
  item_id: string;
  /** New link title (pass empty string to clear) */
  title?: string;
  /** New link description (pass empty string to clear) */
  description?: string;
  /** New target URL */
  url?: string;
}

export interface EditLinkResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Link card item UUID */
  item_id: string;
}

// --- 25. edit_color ---
export interface EditColorParams {
  /** Color card item UUID */
  item_id: string;
  /** New hex color string */
  hex: string;
}

export interface EditColorResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Color card item UUID */
  item_id: string;
  /** Updated hex color code */
  hex: string;
}

// --- 26. add_to_collection ---
export interface AddToCollectionParams {
  /** Target collection ID or name */
  collection: string;
  /** List of item UUIDs */
  item_ids: string[];
  /** Whether to move items out of other collections (default false, appends to collection) */
  move?: boolean;
}

export interface AddToCollectionResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of items added to collection */
  added?: number;
  /** Count of items moved */
  moved?: number;
}

// --- 27. remove_from_collection ---
export interface RemoveFromCollectionParams {
  /** Collection ID or name */
  collection: string;
  /** List of item UUIDs to remove */
  item_ids: string[];
}

export interface RemoveFromCollectionResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of removed items */
  removed?: number;
}

// --- 28. set_liked ---
export interface SetLikedParams {
  /** List of item UUIDs */
  item_ids: string[];
  /** Whether to like the items (adds to Likes collection) */
  liked: boolean;
}

export interface SetLikedResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of affected items */
  updated?: number;
}

// --- 29. edit_image ---
export interface EditImageParams {
  /** List of item UUIDs to edit */
  item_ids: string[];
  /** Rotation direction: 90 degrees left or right */
  rotate?: RotateDirection;
  /** Crop rectangle (0 to 1 normalized coordinates applied after rotation) */
  crop?: CropRect;
  /** Whether to reset edits and revert to the original imported image */
  revert?: boolean;
}

export interface EditImageResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Updated pixel dimensions after image edit */
  images?: Array<{
    item_id: string;
    width: number;
    height: number;
  }>;
}

// --- 30. refresh_thumbnail ---
export interface RefreshThumbnailParams {
  /** List of item UUIDs */
  item_ids: string[];
}

export interface RefreshThumbnailResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of items with refreshed thumbnails */
  refreshed?: number;
}

// --- 31. trash_items ---
export interface TrashItemsParams {
  /** List of item UUIDs to move to trash */
  item_ids: string[];
}

export interface TrashItemsResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of items moved to trash */
  trashed: number;
}

// --- 32. restore_items ---
export interface RestoreItemsParams {
  /** List of item UUIDs to restore from trash */
  item_ids: string[];
}

export interface RestoreItemsResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of successfully restored items */
  restored: number;
}

// --- 33. create_collection ---
export interface CreateCollectionParams {
  /** Collection name */
  name: string;
}

export interface CreateCollectionResult {
  /** Whether the operation succeeded */
  ok?: boolean;
  /** Identifier of the created collection */
  id: string;
  /** Name of the new collection */
  name?: string;
}

// --- 34. rename_collection ---
export interface RenameCollectionParams {
  /** Collection ID or current name */
  collection: string;
  /** New name */
  name: string;
}

export interface RenameCollectionResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Collection identifier */
  id?: string;
  /** Updated collection name */
  name?: string;
}

// --- 35. archive_collection ---
export interface ArchiveCollectionParams {
  /** Collection ID or name */
  collection: string;
  /** true to archive/hide, false to unarchive */
  archived: boolean;
}

export interface ArchiveCollectionResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Collection identifier */
  id?: string;
  /** Current archived state */
  archived: boolean;
}

// --- 36. delete_collection ---
export interface DeleteCollectionParams {
  /** Collection ID or name */
  collection: string;
  /** Whether to permanently delete items exclusive to this collection (irreversible, default false) */
  delete_items?: boolean;
}

export interface DeleteCollectionResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Identifier of the deleted collection */
  deleted?: string;
  /** Count of cascade-deleted items */
  deleted_items?: number;
}

// --- 37. set_collection_order ---
export interface SetCollectionOrderParams {
  /** Array of sorted collection IDs */
  collection_ids: string[];
}

export interface SetCollectionOrderResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 38. move_collection_to_folder ---
export interface MoveCollectionToFolderParams {
  /** Collection ID or name */
  collection: string;
  /** Target collection folder ID, name, or path; omit to move to top level */
  folder?: string;
}

export interface MoveCollectionToFolderResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 39. create_collection_folder ---
export interface CreateCollectionFolderParams {
  /** Folder name */
  name: string;
  /** Parent folder ID, name, or path; omit to create at top level */
  parent?: string;
  /** Initial list of collection IDs or names to group into this folder */
  collection_ids?: string[];
}

export interface CreateCollectionFolderResult {
  /** Whether the operation succeeded */
  ok?: boolean;
  /** Identifier of the created folder */
  id: string;
  /** Folder name */
  name?: string;
}

// --- 40. move_collection_folder ---
export interface MoveCollectionFolderParams {
  /** Folder ID, name, or path to move */
  folder: string;
  /** New parent folder ID, name, or path; omit to move to top level */
  parent?: string;
}

export interface MoveCollectionFolderResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 41. rename_collection_folder ---
export interface RenameCollectionFolderParams {
  /** Folder ID, name, or path */
  folder: string;
  /** New name */
  name: string;
}

export interface RenameCollectionFolderResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Folder identifier */
  id?: string;
  /** Updated name */
  name?: string;
}

// --- 42. delete_collection_folder ---
export interface DeleteCollectionFolderParams {
  /** Folder ID, name, or path to delete */
  folder: string;
  /** Whether to delete child collections (default false, moves collections up one level) */
  delete_collections?: boolean;
}

export interface DeleteCollectionFolderResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 43. create_smart_folder ---
export interface CreateSmartFolderParams {
  /** Smart folder name */
  name: string;
  /** Smart folder rule criteria list */
  rules: SmartFolderRule[];
  /** Match mode: 'all' or 'any', defaults to all */
  match?: SmartFolderMatch;
  /** Expect match flag, defaults to true. Setting false inverts logic (NOT rules) */
  expect?: boolean;
}

export interface CreateSmartFolderResult {
  /** Whether the operation succeeded */
  ok?: boolean;
  /** Identifier of the newly created smart folder */
  id: string;
  /** Smart folder name */
  name?: string;
}

// --- 44. update_smart_folder ---
export interface UpdateSmartFolderParams {
  /** Smart folder ID or current name */
  smart_folder: string;
  /** New name (optional) */
  name?: string;
  /** Replacement list of rules (optional) */
  rules?: SmartFolderRule[];
  /** Match mode (optional) */
  match?: SmartFolderMatch;
  /** Expect match flag (optional) */
  expect?: boolean;
}

export interface UpdateSmartFolderResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Smart folder identifier */
  id?: string;
}

// --- 45. delete_smart_folder ---
export interface DeleteSmartFolderParams {
  /** Smart folder ID or name */
  smart_folder: string;
}

export interface DeleteSmartFolderResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 46. rename_tag ---
export interface RenameTagParams {
  /** Current tag name */
  tag: string;
  /** New tag name (automatically merged if it already exists) */
  name: string;
}

export interface RenameTagResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Original tag name */
  old_tag?: string;
  /** New tag name */
  new_tag?: string;
}

// --- 47. delete_tag ---
export interface DeleteTagParams {
  /** Tag name to permanently delete */
  tag: string;
}

export interface DeleteTagResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of items from which the tag was removed */
  affected_items?: number;
}

// --- 48. create_tag ---
export interface CreateTagParams {
  /** Tag name to pre-create */
  name: string;
}

export interface CreateTagResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Tag name */
  name: string;
}

// --- 49. create_tag_folder ---
export interface CreateTagFolderParams {
  /** Tag folder name */
  name: string;
  /** Initial list of tag names to group into this folder */
  tags?: string[];
}

export interface CreateTagFolderResult {
  /** Whether the operation succeeded */
  ok?: boolean;
  /** Identifier of the created tag folder */
  id: string;
  /** Tag folder name */
  name?: string;
}

// --- 50. rename_tag_folder ---
export interface RenameTagFolderParams {
  /** Tag folder ID or current name */
  folder: string;
  /** New name */
  name: string;
}

export interface RenameTagFolderResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Folder identifier */
  id?: string;
  /** Updated name */
  name?: string;
}

// --- 51. delete_tag_folder ---
export interface DeleteTagFolderParams {
  /** Tag folder ID or name to delete */
  folder: string;
}

export interface DeleteTagFolderResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 52. move_tags_to_folder ---
export interface MoveTagsToFolderParams {
  /** List of tag names to group into the folder */
  tags: string[];
  /** Target tag folder ID or name; omit to ungroup into top-level tags */
  folder?: string;
}

export interface MoveTagsToFolderResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of moved tags */
  moved?: number;
}

// --- 53. arrange_board ---
export interface ArrangeBoardParams {
  /** Collection ID or name */
  collection: string;
  /** Canvas layout group arrangements */
  groups: BoardGroupInput[];
}

export interface ArrangeBoardResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of arranged canvas groups */
  groups?: number;
}

// --- 54. move_to_group ---
export interface MoveToGroupParams {
  /** Collection ID or name */
  collection: string;
  /** Target group ID from get_board */
  group_id: string;
  /** List of item UUIDs to add */
  item_ids: string[];
  /** Zero-based insert position index inside group (defaults to end) */
  index?: number;
}

export interface MoveToGroupResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 55. move_group ---
export interface MoveGroupParams {
  /** Collection ID or name */
  collection: string;
  /** Target group ID */
  group_id: string;
  /** New canvas center X coordinate */
  x: number;
  /** New canvas center Y coordinate */
  y: number;
}

export interface MoveGroupResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 56. reset_board_layout ---
export interface ResetBoardLayoutParams {
  /** Collection ID or name */
  collection: string;
}

export interface ResetBoardLayoutResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 57. undo_board_layout ---
export interface UndoBoardLayoutParams {
  /** Collection ID or name */
  collection: string;
  /** true for redo, false for undo (default false) */
  redo?: boolean;
}

export interface UndoBoardLayoutResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 58. connect_folder ---
export interface ConnectFolderParams {
  /** Absolute filesystem path of local folder to connect */
  path: string;
}

export interface ConnectFolderResult {
  /** Whether the operation succeeded */
  ok?: boolean;
  /** Connected folder identifier */
  id?: string;
  /** Display name of the folder */
  name?: string;
  /** Count of media files initially indexed */
  item_count?: number;
}

// --- 59. disconnect_folder ---
export interface DisconnectFolderParams {
  /** Connected folder ID or name */
  folder: string;
}

export interface DisconnectFolderResult {
  /** Whether the operation succeeded */
  ok: boolean;
}

// --- 60. rescan_folder ---
export interface RescanFolderParams {
  /** Connected folder ID or name */
  folder: string;
}

export interface RescanFolderResult {
  /** Whether the operation succeeded */
  ok?: boolean;
  /** Total indexed item count after rescan */
  item_count: number;
}

// --- 61. switch_library ---
export interface SwitchLibraryParams {
  /** Absolute filesystem path to target .atlas / .atlaslibrary bundle */
  path: string;
}

export interface SwitchLibraryResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Name of the switched active library */
  name?: string;
  /** Absolute path to the active library */
  path: string;
}

// --- 62. create_library ---
export interface CreateLibraryParams {
  /** Absolute path for new library (ending in .atlaslibrary or .atlas) */
  path: string;
}

export interface CreateLibraryResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Path of newly created and switched library */
  path: string;
}

// --- 63. search_by_description ---
export interface SearchByDescriptionParams {
  /**
   * Natural language query description, e.g. 'a red sports car at night'
   */
  query: string;
  /** Filter by item kind */
  kind?: SearchDescriptionKind;
  /** Limit search to collection ID or name */
  collection?: string;
  /** Maximum matching results (default 20, max 100) */
  limit?: number;
  /** Minimum cosine similarity threshold (default 0.04) */
  min_score?: number;
}

export interface SemanticSearchResultItem extends AtlasItemSummary {
  /** Cosine similarity match score (higher is more relevant) */
  score: number;
}

export interface SearchByDescriptionResult {
  /** Status of semantic embeddings index */
  index: {
    indexed_items: number;
    model: string;
    state: string;
  };
  /** Search query text */
  query: string;
  /** List of matching semantic search results */
  results: SemanticSearchResultItem[];
  /** Count of returned search results */
  returned: number;
}

// --- 64. store_embeddings ---
export interface StoreEmbeddingsParams {
  /** Model identifier for embeddings (e.g. siglip2-base-patch16-256) */
  model: string;
  /** Batch list of embedding entries (up to 1000 entries) */
  entries: EmbeddingEntry[];
  /** Whether to purge orphaned hash vectors after storing */
  prune?: boolean;
}

export interface StoreEmbeddingsResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of vectors stored in this call */
  stored?: number;
  /** Total vector count for this model */
  total_vectors?: number;
}

// --- 65. query_embeddings ---
export interface QueryEmbeddingsParams {
  /** Model identifier for query vector */
  model?: string;
  /** Query vector array matching model dimensions */
  vector?: number[];
  /** Minimum similarity threshold to include */
  min_score?: number;
  /** Maximum items to return (default 20, max 100) */
  limit?: number;
}

export interface QueryEmbeddingsResult {
  /** Model identifier */
  model?: string;
  /** Embedding vector dimensions */
  dimension?: number;
  /** Total vectors in the embedding index */
  count?: number;
  /** List of nearest items (empty if vector was omitted) */
  results?: Array<{
    id: string;
    score: number;
    content_hash: string;
  }>;
}

// --- 66. show_in_app ---
export interface ShowInAppParams {
  /** Target preset view */
  view?: BuiltinAppView;
  /** Target collection ID or name */
  collection?: string;
  /** Target collection folder ID or name */
  collection_folder?: string;
  /** Target tag name */
  tag?: string;
  /** Target smart folder ID or name */
  smart_folder?: string;
  /** Target connected folder ID or name */
  connected_folder?: string;
  /** Whether to bring Atlas window to foreground (defaults to true) */
  front?: boolean;
}

export interface ShowInAppResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Identifier or name of currently displayed view */
  showing: string;
}

// --- 67. show_items ---
export interface ShowItemsParams {
  /** List of item UUIDs to display in UI (up to 500, ordered) */
  item_ids: string[];
  /** Title banner displayed above items in UI */
  title?: string;
  /** Whether to select all displayed items (defaults to false) */
  select?: boolean;
  /** Whether to bring Atlas window to front (defaults to true) */
  front?: boolean;
}

export interface ShowItemsResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of items displayed on screen */
  shown: number;
}

// --- 68. open_item ---
export interface OpenItemParams {
  /** Target item UUID */
  item_id: string;
  /** Target collection ID or name (switches to it first) */
  collection?: string;
  /** Whether to bring Atlas window to front (defaults to true) */
  front?: boolean;
}

export interface OpenItemResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Name of the opened item */
  opened: string;
}

// --- 69. select_items ---
export interface SelectItemsParams {
  /** List of item UUIDs to select (must be visible on screen) */
  item_ids: string[];
  /** Whether to bring Atlas window to front (defaults to true) */
  front?: boolean;
}

export interface SelectItemsResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of successfully selected items */
  selected: number;
  /** Count of ignored item IDs not in visible screen view */
  not_on_screen: number;
}

// --- 70. set_view_mode ---
export interface SetViewModeParams {
  /** Display mode: 'grid' (packed rows), 'infinite' (infinite canvas), or 'canvas' */
  mode: ViewDisplayMode;
  /** Whether to bring Atlas window to front (defaults to true) */
  front?: boolean;
}

export interface SetViewModeResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Mode that was activated */
  mode: ViewDisplayMode;
}

// --- 71. show_in_finder ---
export interface ShowInFinderParams {
  /** List of item UUIDs to reveal in Finder (up to 50) */
  item_ids: string[];
}

export interface ShowInFinderResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of files revealed in Finder */
  revealed?: number;
}

// --- 72. get_settings ---
export interface GetSettingsParams {
  /** Filter settings by section, omit to return all */
  section?: SettingsSection;
}

export interface AtlasSettingItem {
  /** Setting key name */
  name: string;
  /** Setting data type */
  type: "string" | "number" | "integer" | "boolean";
  /** Current value */
  value: string | number | boolean;
  /** Human-readable setting description */
  description: string;
  /** Additional notes or warning of side effects */
  note?: string;
  /** List of permitted enum values */
  options?: string[];
  /** Minimum allowed numeric value */
  min?: number;
  /** Maximum allowed numeric value */
  max?: number;
  /** Whether this setting is read-only to AI agents */
  read_only?: boolean;
}

export interface GetSettingsResult {
  /** Explanation for debug section if not unlocked */
  note?: string;
  /** Settings grouped by section */
  settings: Record<string, AtlasSettingItem[]>;
}

// --- 73. set_setting ---
export interface SetSettingParams {
  /** Setting key from get_settings */
  name: string;
  /** New configuration value */
  value: string | number | boolean;
}

export interface SetSettingResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Setting name */
  name: string;
  /** Updated setting value */
  value: string | number | boolean;
}

// --- 74. open_settings ---
export interface OpenSettingsParams {
  /** Settings tab page to open, defaults to general */
  page?: SettingsPage;
}

export interface OpenSettingsResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Name of opened settings page */
  opened: string;
}

// --- 75. app_info ---
export type AppInfoParams = {};

export interface AppInfoResult {
  /** Application name */
  name: string;
  /** Version string, e.g. 1.8.2 */
  version: string;
  /** Build number string */
  build: number;
  /** Release channel: stable, beta, or alpha */
  channel: string;
  /** Whether alpha updates are enabled */
  alpha_updates: boolean;
  /** Whether beta updates are enabled */
  beta_updates: boolean;
  /** Whether the debug tab is unlocked */
  debug_unlocked: boolean;
  /** macOS version and build number */
  macos: string;
  /** Local MCP server endpoint URL */
  mcp_endpoint: string;
  /** Summary of currently active library */
  library: {
    name: string;
    path: string;
    read_only: boolean;
  };
}

// --- 76. empty_trash ---
export interface EmptyTrashParams {
  /** Explicit confirmation flag, must be true */
  confirm: boolean;
}

export interface EmptyTrashResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of permanently purged items */
  purged?: number;
}

// --- 77. delete_permanently ---
export interface DeletePermanentlyParams {
  /** List of item UUIDs to permanently delete (must already be in trash) */
  item_ids: string[];
  /** Explicit confirmation flag, must be true */
  confirm: boolean;
}

export interface DeletePermanentlyResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Count of permanently deleted items */
  deleted?: number;
}

// --- 78. run_maintenance ---
export interface RunMaintenanceParams {
  /** Maintenance action type */
  action: MaintenanceAction;
  /** For purge_expired_trash: days threshold for trashed items (default 30) */
  days?: number;
}

export interface RunMaintenanceResult {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Detailed maintenance operation result message */
  message?: string;
  /** Count of pruned duplicates or reclaimed files */
  freed_count?: number;
}

// * ============================================================================
// * 4. Complete Tool Mapping Interface (AtlasToolMap)
// * ============================================================================

/**
 * Type mapping between tool names and their respective input parameters and return types
 */
export interface AtlasToolMap {
  library_info: { params: LibraryInfoParams; result: LibraryInfoResult };
  list_libraries: { params: ListLibrariesParams; result: ListLibrariesResult };
  list_collections: { params: ListCollectionsParams; result: ListCollectionsResult };
  list_collection_folders: {
    params: ListCollectionFoldersParams;
    result: ListCollectionFoldersResult;
  };
  list_tags: { params: ListTagsParams; result: ListTagsResult };
  list_smart_folders: { params: ListSmartFoldersParams; result: ListSmartFoldersResult };
  list_connected_folders: {
    params: ListConnectedFoldersParams;
    result: ListConnectedFoldersResult;
  };
  search_items: { params: SearchItemsParams; result: SearchItemsResult };
  run_smart_folder: { params: RunSmartFolderParams; result: RunSmartFolderResult };
  get_item: { params: GetItemParams; result: GetItemResult };
  view_items: { params: ViewItemsParams; result: ViewItemsResult };
  get_file: { params: GetFileParams; result: GetFileResult };
  get_board: { params: GetBoardParams; result: GetBoardResult };
  find_similar: { params: FindSimilarParams; result: FindSimilarResult };
  get_current_view: { params: GetCurrentViewParams; result: GetCurrentViewResult };
  add_link: { params: AddLinkParams; result: AddLinkResult };
  add_color: { params: AddColorParams; result: AddColorResult };
  save_media_from_url: { params: SaveMediaFromUrlParams; result: SaveMediaFromUrlResult };
  import_files: { params: ImportFilesParams; result: ImportFilesResult };
  add_tags: { params: AddTagsParams; result: AddTagsResult };
  remove_tags: { params: RemoveTagsParams; result: RemoveTagsResult };
  set_tags: { params: SetTagsParams; result: SetTagsResult };
  set_metadata: { params: SetMetadataParams; result: SetMetadataResult };
  edit_link: { params: EditLinkParams; result: EditLinkResult };
  edit_color: { params: EditColorParams; result: EditColorResult };
  add_to_collection: { params: AddToCollectionParams; result: AddToCollectionResult };
  remove_from_collection: {
    params: RemoveFromCollectionParams;
    result: RemoveFromCollectionResult;
  };
  set_liked: { params: SetLikedParams; result: SetLikedResult };
  edit_image: { params: EditImageParams; result: EditImageResult };
  refresh_thumbnail: { params: RefreshThumbnailParams; result: RefreshThumbnailResult };
  trash_items: { params: TrashItemsParams; result: TrashItemsResult };
  restore_items: { params: RestoreItemsParams; result: RestoreItemsResult };
  create_collection: { params: CreateCollectionParams; result: CreateCollectionResult };
  rename_collection: { params: RenameCollectionParams; result: RenameCollectionResult };
  archive_collection: { params: ArchiveCollectionParams; result: ArchiveCollectionResult };
  delete_collection: { params: DeleteCollectionParams; result: DeleteCollectionResult };
  set_collection_order: { params: SetCollectionOrderParams; result: SetCollectionOrderResult };
  move_collection_to_folder: {
    params: MoveCollectionToFolderParams;
    result: MoveCollectionToFolderResult;
  };
  create_collection_folder: {
    params: CreateCollectionFolderParams;
    result: CreateCollectionFolderResult;
  };
  move_collection_folder: {
    params: MoveCollectionFolderParams;
    result: MoveCollectionFolderResult;
  };
  rename_collection_folder: {
    params: RenameCollectionFolderParams;
    result: RenameCollectionFolderResult;
  };
  delete_collection_folder: {
    params: DeleteCollectionFolderParams;
    result: DeleteCollectionFolderResult;
  };
  create_smart_folder: { params: CreateSmartFolderParams; result: CreateSmartFolderResult };
  update_smart_folder: { params: UpdateSmartFolderParams; result: UpdateSmartFolderResult };
  delete_smart_folder: { params: DeleteSmartFolderParams; result: DeleteSmartFolderResult };
  rename_tag: { params: RenameTagParams; result: RenameTagResult };
  delete_tag: { params: DeleteTagParams; result: DeleteTagResult };
  create_tag: { params: CreateTagParams; result: CreateTagResult };
  create_tag_folder: { params: CreateTagFolderParams; result: CreateTagFolderResult };
  rename_tag_folder: { params: RenameTagFolderParams; result: RenameTagFolderResult };
  delete_tag_folder: { params: DeleteTagFolderParams; result: DeleteTagFolderResult };
  move_tags_to_folder: { params: MoveTagsToFolderParams; result: MoveTagsToFolderResult };
  arrange_board: { params: ArrangeBoardParams; result: ArrangeBoardResult };
  move_to_group: { params: MoveToGroupParams; result: MoveToGroupResult };
  move_group: { params: MoveGroupParams; result: MoveGroupResult };
  reset_board_layout: { params: ResetBoardLayoutParams; result: ResetBoardLayoutResult };
  undo_board_layout: { params: UndoBoardLayoutParams; result: UndoBoardLayoutResult };
  connect_folder: { params: ConnectFolderParams; result: ConnectFolderResult };
  disconnect_folder: { params: DisconnectFolderParams; result: DisconnectFolderResult };
  rescan_folder: { params: RescanFolderParams; result: RescanFolderResult };
  switch_library: { params: SwitchLibraryParams; result: SwitchLibraryResult };
  create_library: { params: CreateLibraryParams; result: CreateLibraryResult };
  search_by_description: { params: SearchByDescriptionParams; result: SearchByDescriptionResult };
  store_embeddings: { params: StoreEmbeddingsParams; result: StoreEmbeddingsResult };
  query_embeddings: { params: QueryEmbeddingsParams; result: QueryEmbeddingsResult };
  show_in_app: { params: ShowInAppParams; result: ShowInAppResult };
  show_items: { params: ShowItemsParams; result: ShowItemsResult };
  open_item: { params: OpenItemParams; result: OpenItemResult };
  select_items: { params: SelectItemsParams; result: SelectItemsResult };
  set_view_mode: { params: SetViewModeParams; result: SetViewModeResult };
  show_in_finder: { params: ShowInFinderParams; result: ShowInFinderResult };
  get_settings: { params: GetSettingsParams; result: GetSettingsResult };
  set_setting: { params: SetSettingParams; result: SetSettingResult };
  open_settings: { params: OpenSettingsParams; result: OpenSettingsResult };
  app_info: { params: AppInfoParams; result: AppInfoResult };
  empty_trash: { params: EmptyTrashParams; result: EmptyTrashResult };
  delete_permanently: { params: DeletePermanentlyParams; result: DeletePermanentlyResult };
  run_maintenance: { params: RunMaintenanceParams; result: RunMaintenanceResult };
}

/**
 * Union type of all 78 supported Atlas tool names
 */
export type AtlasToolName = keyof AtlasToolMap;

// * ============================================================================
// * MCP Native Protocol Types (tools/list, resources/list, resources/read)
// * ============================================================================

/**
 * Definition of an individual MCP tool returned by tools/list.
 */
export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Response payload of tools/list JSON-RPC method.
 */
export interface McpListToolsResult {
  tools: McpToolDefinition[];
  nextCursor?: string;
  [key: string]: unknown;
}

/**
 * Definition of an MCP resource returned by resources/list.
 */
export interface McpResourceDefinition {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
  [key: string]: unknown;
}

/**
 * Response payload of resources/list JSON-RPC method.
 */
export interface McpListResourcesResult {
  resources: McpResourceDefinition[];
  nextCursor?: string;
  [key: string]: unknown;
}

/**
 * Content payload item returned by resources/read.
 */
export interface McpResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
  [key: string]: unknown;
}

/**
 * Response payload of resources/read JSON-RPC method.
 */
export interface McpReadResourceResult {
  contents: McpResourceContent[];
  [key: string]: unknown;
}
