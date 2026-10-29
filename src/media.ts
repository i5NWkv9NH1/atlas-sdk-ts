// * Atlas Media Ingestion and Manipulation Domain Module
// * Covers file import, link bookmarking, color swatches, metadata updates, and trash management.

import type { AtlasTransport } from "./transport.js";
import type {
  AddColorParams,
  AddColorResult,
  AddLinkParams,
  AddLinkResult,
  DeletePermanentlyParams,
  DeletePermanentlyResult,
  EditColorParams,
  EditColorResult,
  EditImageParams,
  EditImageResult,
  EditLinkParams,
  EditLinkResult,
  EmptyTrashParams,
  EmptyTrashResult,
  ImportFilesParams,
  ImportFilesResult,
  RefreshThumbnailParams,
  RefreshThumbnailResult,
  RestoreItemsParams,
  RestoreItemsResult,
  SaveMediaFromUrlParams,
  SaveMediaFromUrlResult,
  SetLikedParams,
  SetLikedResult,
  SetMetadataParams,
  SetMetadataResult,
  TrashItemsParams,
  TrashItemsResult,
} from "./types.js";

/**
 * Domain module managing media files, links, colors, image transformations, and trash.
 */
export class MediaModule {
  constructor(private readonly transport: AtlasTransport) {}

  /**
   * Import files from absolute filesystem paths into the active library.
   */
  importFiles(params: ImportFilesParams): Promise<ImportFilesResult> {
    return this.transport.callTool("import_files", params);
  }

  /**
   * Bookmark a web URL as a link card in the library.
   */
  addLink(params: AddLinkParams): Promise<AddLinkResult> {
    return this.transport.callTool("add_link", params);
  }

  /**
   * Update title, description, or URL for an existing link item.
   */
  editLink(params: EditLinkParams): Promise<EditLinkResult> {
    return this.transport.callTool("edit_link", params);
  }

  /**
   * Add a solid-color palette swatch item to the library.
   */
  addColor(params: AddColorParams): Promise<AddColorResult> {
    return this.transport.callTool("add_color", params);
  }

  /**
   * Update the hex value of an existing color card item.
   */
  editColor(params: EditColorParams): Promise<EditColorResult> {
    return this.transport.callTool("edit_color", params);
  }

  /**
   * Download and save media from an external URL (including X, Instagram, etc.).
   */
  saveMediaFromUrl(params: SaveMediaFromUrlParams): Promise<SaveMediaFromUrlResult> {
    return this.transport.callTool("save_media_from_url", params);
  }

  /**
   * Rotate or crop images non-destructively, or reset edits.
   */
  editImage(params: EditImageParams): Promise<EditImageResult> {
    return this.transport.callTool("edit_image", params);
  }

  /**
   * Re-render and update thumbnail images for items.
   */
  refreshThumbnail(params: RefreshThumbnailParams): Promise<RefreshThumbnailResult> {
    return this.transport.callTool("refresh_thumbnail", params);
  }

  /**
   * Mark items as liked or unliked (adds to or removes from Likes collection).
   */
  setLiked(params: SetLikedParams): Promise<SetLikedResult> {
    return this.transport.callTool("set_liked", params);
  }

  /**
   * Update user notes, author, location, and source URL metadata for an item.
   */
  setMetadata(params: SetMetadataParams): Promise<SetMetadataResult> {
    return this.transport.callTool("set_metadata", params);
  }

  /**
   * Move specified item IDs to the library trash.
   */
  trashItems(params: TrashItemsParams): Promise<TrashItemsResult> {
    return this.transport.callTool("trash_items", params);
  }

  /**
   * Restore trashed items back to their previous collections.
   */
  restoreItems(params: RestoreItemsParams): Promise<RestoreItemsResult> {
    return this.transport.callTool("restore_items", params);
  }

  /**
   * Permanently erase specified items from the trash (requires confirm: true).
   */
  deletePermanently(params: DeletePermanentlyParams): Promise<DeletePermanentlyResult> {
    return this.transport.callTool("delete_permanently", params);
  }

  /**
   * Permanently purge all items currently in the trash (requires confirm: true).
   */
  emptyTrash(params: EmptyTrashParams): Promise<EmptyTrashResult> {
    return this.transport.callTool("empty_trash", params);
  }
}
