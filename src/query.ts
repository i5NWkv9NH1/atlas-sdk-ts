// * Atlas Query and Search Domain Module
// * Covers metadata search, vector similarity search, visual browsing, and smart folder execution.

import type { AtlasTransport } from "./transport.js";
import type {
  AtlasItemDetail,
  FindSimilarParams,
  FindSimilarResult,
  GetBoardParams,
  GetBoardResult,
  GetCurrentViewParams,
  GetCurrentViewResult,
  GetFileParams,
  GetFileResult,
  GetItemParams,
  QueryEmbeddingsParams,
  QueryEmbeddingsResult,
  RunSmartFolderParams,
  RunSmartFolderResult,
  SearchByDescriptionParams,
  SearchByDescriptionResult,
  SearchItemsParams,
  SearchItemsResult,
  StoreEmbeddingsParams,
  StoreEmbeddingsResult,
  ViewItemsParams,
  ViewItemsResult,
} from "./types.js";

/**
 * Domain module handling metadata queries, vector embeddings, and item retrieval.
 */
export class QueryModule {
  constructor(private readonly transport: AtlasTransport) {}

  /**
   * Search the active library with metadata filters, full-text search, and pagination.
   */
  searchItems(params: SearchItemsParams = {}): Promise<SearchItemsResult> {
    return this.transport.callTool("search_items", params);
  }

  /**
   * Perform semantic vector search using natural language descriptions.
   */
  searchByDescription(params: SearchByDescriptionParams): Promise<SearchByDescriptionResult> {
    return this.transport.callTool("search_by_description", params);
  }

  /**
   * Find visually or semantically similar items using the local similarity index.
   */
  findSimilar(params: FindSimilarParams): Promise<FindSimilarResult> {
    return this.transport.callTool("find_similar", params);
  }

  /**
   * Retrieve complete metadata, dimensions, tags, and collections for a single item.
   */
  getItem(params: GetItemParams): Promise<AtlasItemDetail> {
    return this.transport.callTool("get_item", params);
  }

  /**
   * View rendered visual thumbnail images for given item IDs.
   */
  viewItems(params: ViewItemsParams): Promise<ViewItemsResult> {
    return this.transport.callTool("view_items", params);
  }

  /**
   * Read local file path, raw binary bytes, or resized image.
   */
  getFile(params: GetFileParams): Promise<GetFileResult> {
    return this.transport.callTool("get_file", params);
  }

  /**
   * Store embedding float vectors for content hashes in the local vector database.
   */
  storeEmbeddings(params: StoreEmbeddingsParams): Promise<StoreEmbeddingsResult> {
    return this.transport.callTool("store_embeddings", params);
  }

  /**
   * Query vector embeddings index by cosine similarity.
   */
  queryEmbeddings(params: QueryEmbeddingsParams): Promise<QueryEmbeddingsResult> {
    return this.transport.callTool("query_embeddings", params);
  }

  /**
   * Evaluate a smart folder and return live matching items.
   */
  runSmartFolder(params: RunSmartFolderParams): Promise<RunSmartFolderResult> {
    return this.transport.callTool("run_smart_folder", params);
  }

  /**
   * Retrieve board spatial groups and item layouts for a canvas collection.
   */
  getBoard(params: GetBoardParams): Promise<GetBoardResult> {
    return this.transport.callTool("get_board", params);
  }

  /**
   * Inspect the current view, collection, and visible items in the active Atlas window.
   */
  getCurrentView(params: GetCurrentViewParams = {}): Promise<GetCurrentViewResult> {
    return this.transport.callTool("get_current_view", params);
  }
}
