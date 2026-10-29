// * Atlas Organization and Library Structure Domain Module
// * Covers collections, folders, tags, smart folders, board canvas layouts, connected folders, and libraries.

import type { AtlasTransport } from "./transport.js";
import type {
  AddTagsParams,
  AddTagsResult,
  AddToCollectionParams,
  AddToCollectionResult,
  ArchiveCollectionParams,
  ArchiveCollectionResult,
  ArrangeBoardParams,
  ArrangeBoardResult,
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
  DeleteSmartFolderParams,
  DeleteSmartFolderResult,
  DeleteTagFolderParams,
  DeleteTagFolderResult,
  DeleteTagParams,
  DeleteTagResult,
  DisconnectFolderParams,
  DisconnectFolderResult,
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
  SetCollectionOrderParams,
  SetCollectionOrderResult,
  SetTagsParams,
  SetTagsResult,
  SwitchLibraryParams,
  SwitchLibraryResult,
  UndoBoardLayoutParams,
  UndoBoardLayoutResult,
  UpdateSmartFolderParams,
  UpdateSmartFolderResult,
} from "./types.js";

/**
 * Domain module managing collections, folders, tags, smart folders, canvas boards, and library switching.
 */
export class OrganizeModule {
  constructor(private readonly transport: AtlasTransport) {}

  // * ========================================================================
  // * Collections
  // * ========================================================================

  /**
   * List collections in the active library.
   */
  listCollections(params: ListCollectionsParams = {}): Promise<ListCollectionsResult> {
    return this.transport.callTool("list_collections", params);
  }

  /**
   * Create a new collection (board) in the library.
   */
  createCollection(params: CreateCollectionParams): Promise<CreateCollectionResult> {
    return this.transport.callTool("create_collection", params);
  }

  /**
   * Rename an existing collection.
   */
  renameCollection(params: RenameCollectionParams): Promise<RenameCollectionResult> {
    return this.transport.callTool("rename_collection", params);
  }

  /**
   * Archive or unarchive a collection.
   */
  archiveCollection(params: ArchiveCollectionParams): Promise<ArchiveCollectionResult> {
    return this.transport.callTool("archive_collection", params);
  }

  /**
   * Delete a collection, optionally deleting exclusively contained items.
   */
  deleteCollection(params: DeleteCollectionParams): Promise<DeleteCollectionResult> {
    return this.transport.callTool("delete_collection", params);
  }

  /**
   * Set custom display order of collections in the sidebar.
   */
  setCollectionOrder(params: SetCollectionOrderParams): Promise<SetCollectionOrderResult> {
    return this.transport.callTool("set_collection_order", params);
  }

  /**
   * Add items to a collection.
   */
  addToCollection(params: AddToCollectionParams): Promise<AddToCollectionResult> {
    return this.transport.callTool("add_to_collection", params);
  }

  /**
   * Remove items from a collection.
   */
  removeFromCollection(params: RemoveFromCollectionParams): Promise<RemoveFromCollectionResult> {
    return this.transport.callTool("remove_from_collection", params);
  }

  // * ========================================================================
  // * Collection Folders
  // * ========================================================================

  /**
   * List collection sidebar folders.
   */
  listCollectionFolders(
    params: ListCollectionFoldersParams = {},
  ): Promise<ListCollectionFoldersResult> {
    return this.transport.callTool("list_collection_folders", params);
  }

  /**
   * Create a new folder to organize collections in the sidebar.
   */
  createCollectionFolder(
    params: CreateCollectionFolderParams,
  ): Promise<CreateCollectionFolderResult> {
    return this.transport.callTool("create_collection_folder", params);
  }

  /**
   * Move a collection folder to a new parent folder or top level.
   */
  moveCollectionFolder(params: MoveCollectionFolderParams): Promise<MoveCollectionFolderResult> {
    return this.transport.callTool("move_collection_folder", params);
  }

  /**
   * Rename a collection folder.
   */
  renameCollectionFolder(
    params: RenameCollectionFolderParams,
  ): Promise<RenameCollectionFolderResult> {
    return this.transport.callTool("rename_collection_folder", params);
  }

  /**
   * Delete a collection folder, optionally cascading to its collections.
   */
  deleteCollectionFolder(
    params: DeleteCollectionFolderParams,
  ): Promise<DeleteCollectionFolderResult> {
    return this.transport.callTool("delete_collection_folder", params);
  }

  /**
   * Move a collection into a collection folder.
   */
  moveCollectionToFolder(
    params: MoveCollectionToFolderParams,
  ): Promise<MoveCollectionToFolderResult> {
    return this.transport.callTool("move_collection_to_folder", params);
  }

  // * ========================================================================
  // * Tags and Tag Folders
  // * ========================================================================

  /**
   * List all tags and tag folders.
   */
  listTags(params: ListTagsParams = {}): Promise<ListTagsResult> {
    return this.transport.callTool("list_tags", params);
  }

  /**
   * Create a new tag in the library.
   */
  createTag(params: CreateTagParams): Promise<CreateTagResult> {
    return this.transport.callTool("create_tag", params);
  }

  /**
   * Rename an existing tag, merging with target if name already exists.
   */
  renameTag(params: RenameTagParams): Promise<RenameTagResult> {
    return this.transport.callTool("rename_tag", params);
  }

  /**
   * Delete a tag permanently and remove it from all items.
   */
  deleteTag(params: DeleteTagParams): Promise<DeleteTagResult> {
    return this.transport.callTool("delete_tag", params);
  }

  /**
   * Add tags to multiple items.
   */
  addTags(params: AddTagsParams): Promise<AddTagsResult> {
    return this.transport.callTool("add_tags", params);
  }

  /**
   * Remove tags from multiple items.
   */
  removeTags(params: RemoveTagsParams): Promise<RemoveTagsResult> {
    return this.transport.callTool("remove_tags", params);
  }

  /**
   * Replace all tags on a single item with a new set of tags.
   */
  setTags(params: SetTagsParams): Promise<SetTagsResult> {
    return this.transport.callTool("set_tags", params);
  }

  /**
   * Move tags into a tag folder or ungroup to top level.
   */
  moveTagsToFolder(params: MoveTagsToFolderParams): Promise<MoveTagsToFolderResult> {
    return this.transport.callTool("move_tags_to_folder", params);
  }

  /**
   * Create a new tag folder in the sidebar.
   */
  createTagFolder(params: CreateTagFolderParams): Promise<CreateTagFolderResult> {
    return this.transport.callTool("create_tag_folder", params);
  }

  /**
   * Rename a tag folder.
   */
  renameTagFolder(params: RenameTagFolderParams): Promise<RenameTagFolderResult> {
    return this.transport.callTool("rename_tag_folder", params);
  }

  /**
   * Delete a tag folder, dissolving grouped tags back to top level.
   */
  deleteTagFolder(params: DeleteTagFolderParams): Promise<DeleteTagFolderResult> {
    return this.transport.callTool("delete_tag_folder", params);
  }

  // * ========================================================================
  // * Smart Folders
  // * ========================================================================

  /**
   * List all smart folders in the library.
   */
  listSmartFolders(params: ListSmartFoldersParams = {}): Promise<ListSmartFoldersResult> {
    return this.transport.callTool("list_smart_folders", params);
  }

  /**
   * Create a new rule-based smart folder.
   */
  createSmartFolder(params: CreateSmartFolderParams): Promise<CreateSmartFolderResult> {
    return this.transport.callTool("create_smart_folder", params);
  }

  /**
   * Update rules, name, or match criteria for an existing smart folder.
   */
  updateSmartFolder(params: UpdateSmartFolderParams): Promise<UpdateSmartFolderResult> {
    return this.transport.callTool("update_smart_folder", params);
  }

  /**
   * Delete a smart folder.
   */
  deleteSmartFolder(params: DeleteSmartFolderParams): Promise<DeleteSmartFolderResult> {
    return this.transport.callTool("delete_smart_folder", params);
  }

  // * ========================================================================
  // * Board Spatial Layouts
  // * ========================================================================

  /**
   * Apply spatial grouping layout to items in a canvas collection.
   */
  arrangeBoard(params: ArrangeBoardParams): Promise<ArrangeBoardResult> {
    return this.transport.callTool("arrange_board", params);
  }

  /**
   * Move items into a specific layout group on canvas.
   */
  moveToGroup(params: MoveToGroupParams): Promise<MoveToGroupResult> {
    return this.transport.callTool("move_to_group", params);
  }

  /**
   * Reposition a layout group on canvas.
   */
  moveGroup(params: MoveGroupParams): Promise<MoveGroupResult> {
    return this.transport.callTool("move_group", params);
  }

  /**
   * Reset canvas layout to auto-arranged flow.
   */
  resetBoardLayout(params: ResetBoardLayoutParams): Promise<ResetBoardLayoutResult> {
    return this.transport.callTool("reset_board_layout", params);
  }

  /**
   * Undo or redo canvas board layout changes.
   */
  undoBoardLayout(params: UndoBoardLayoutParams): Promise<UndoBoardLayoutResult> {
    return this.transport.callTool("undo_board_layout", params);
  }

  // * ========================================================================
  // * Connected Disk Folders
  // * ========================================================================

  /**
   * List all connected disk directories being indexed.
   */
  listConnectedFolders(
    params: ListConnectedFoldersParams = {},
  ): Promise<ListConnectedFoldersResult> {
    return this.transport.callTool("list_connected_folders", params);
  }

  /**
   * Connect and index a local filesystem folder.
   */
  connectFolder(params: ConnectFolderParams): Promise<ConnectFolderResult> {
    return this.transport.callTool("connect_folder", params);
  }

  /**
   * Disconnect an indexed local folder from the library.
   */
  disconnectFolder(params: DisconnectFolderParams): Promise<DisconnectFolderResult> {
    return this.transport.callTool("disconnect_folder", params);
  }

  /**
   * Rescan a connected folder for file changes.
   */
  rescanFolder(params: RescanFolderParams): Promise<RescanFolderResult> {
    return this.transport.callTool("rescan_folder", params);
  }

  // * ========================================================================
  // * Libraries
  // * ========================================================================

  /**
   * Retrieve summary statistics and health status of the active library.
   */
  libraryInfo(params: LibraryInfoParams = {}): Promise<LibraryInfoResult> {
    return this.transport.callTool("library_info", params);
  }

  /**
   * List known Atlas library packages on disk.
   */
  listLibraries(params: ListLibrariesParams = {}): Promise<ListLibrariesResult> {
    return this.transport.callTool("list_libraries", params);
  }

  /**
   * Create a new .atlaslibrary bundle on disk and switch to it.
   */
  createLibrary(params: CreateLibraryParams): Promise<CreateLibraryResult> {
    return this.transport.callTool("create_library", params);
  }

  /**
   * Switch active library to another .atlaslibrary at given filesystem path.
   */
  switchLibrary(params: SwitchLibraryParams): Promise<SwitchLibraryResult> {
    return this.transport.callTool("switch_library", params);
  }
}
