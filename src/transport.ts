// * Atlas MCP Communication and Transport Layer
// * Provides HTTP communication, token auto-discovery, auto-launch, 401 retries, and offline mocking.

import { normalizeParams } from "./normalize.js";
import type {
  AtlasToolMap,
  AtlasToolName,
  McpListResourcesResult,
  McpListToolsResult,
  McpReadResourceResult,
} from "./types.js";

// * ============================================================================
// * 1. Strongly-Typed Error Hierarchy
// * ============================================================================

/**
 * Base exception for all Atlas SDK errors.
 */
export class AtlasError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AtlasError";
  }
}

/**
 * Authentication and authorization failure exception (e.g. HTTP 401).
 */
export class AtlasAuthError extends AtlasError {
  constructor(message: string) {
    super(message);
    this.name = "AtlasAuthError";
  }
}

/**
 * Network connectivity and connection failure exception.
 */
export class AtlasConnectionError extends AtlasError {
  constructor(message: string) {
    super(message);
    this.name = "AtlasConnectionError";
  }
}

/**
 * JSON-RPC protocol level error.
 */
export class AtlasRpcError extends AtlasError {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(`JSON-RPC error (${code}): ${message}`);
    this.name = "AtlasRpcError";
    this.code = code;
    this.data = data;
  }
}

/**
 * MCP tool execution business error (when result.isError is true).
 */
export class AtlasToolError extends AtlasError {
  readonly toolName: string;

  constructor(toolName: string, message: string) {
    super(`Atlas tool '${toolName}' failed: ${message}`);
    this.name = "AtlasToolError";
    this.toolName = toolName;
  }
}

// * ============================================================================
// * 2. Transport Interfaces and Signatures
// * ============================================================================

export type FetchFn = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

/**
 * Common contract for transport implementations.
 */
export interface AtlasTransport {
  /**
   * Call a strongly-typed MCP tool and unwrap the result.
   */
  callTool<K extends AtlasToolName>(
    name: K,
    args?: AtlasToolMap[K]["params"],
  ): Promise<AtlasToolMap[K]["result"]>;

  /**
   * Call an arbitrary tool with weakly-typed payload.
   */
  callTool<T = unknown>(name: string, args?: Record<string, unknown>): Promise<T>;

  /**
   * Request the list of available tools and their schemas from the MCP server.
   */
  listTools(): Promise<McpListToolsResult>;

  /**
   * Request the list of available resources from the MCP server.
   */
  listResources(): Promise<McpListResourcesResult>;

  /**
   * Read the content of an MCP resource by URI.
   */
  readResource(uri: string): Promise<McpReadResourceResult>;

  /**
   * Health check ping to ensure server is reachable.
   */
  ping(): Promise<boolean>;

  /**
   * Optional cleanup and resource release.
   */
  close?(): Promise<void>;
}

/**
 * Configuration options for TokenResolver.
 */
export interface TokenResolverOptions {
  /** Explicit Bearer token */
  token?: string;
  /** Per-library token mapping table */
  libraryTokens?: Record<string, string>;
  /** Whether to enable automatic filesystem and CLI token discovery */
  autoDiscover?: boolean;
}

/**
 * Configuration options for HttpAtlasTransport.
 */
export interface HttpAtlasTransportOptions {
  /** MCP endpoint URL (defaults to http://127.0.0.1:50473/mcp) */
  endpoint?: string;
  /** Explicit Bearer token */
  token?: string;
  /** Per-library token mapping table */
  libraryTokens?: Record<string, string>;
  /** Automatically discover token when missing or on 401 */
  autoDiscoverToken?: boolean;
  /** Automatically launch Atlas in background if connection refused */
  autoLaunch?: boolean;
  /** HTTP request timeout in milliseconds */
  timeoutMs?: number;
  /** Custom fetch implementation */
  fetchFn?: FetchFn;
}

// * ============================================================================
// * 3. Multi-Library Token Resolver
// * ============================================================================

/**
 * Resolves active authentication tokens with multi-library support and disk discovery.
 */
export class TokenResolver {
  private explicitToken?: string;
  private readonly libraryTokens: Map<string, string>;
  private readonly autoDiscover: boolean;
  private currentLibrary?: string;
  private cachedToken?: string;

  constructor(options: TokenResolverOptions | string = {}) {
    if (typeof options === "string") {
      this.explicitToken = options.trim();
      this.libraryTokens = new Map();
      this.autoDiscover = true;
    } else {
      this.explicitToken = options.token?.trim();
      this.libraryTokens = new Map(Object.entries(options.libraryTokens ?? {}));
      this.autoDiscover = options.autoDiscover ?? true;
    }
  }

  /**
   * Update the active library name or path, optionally registering its token.
   */
  setActiveLibrary(nameOrPath: string, token?: string): void {
    this.currentLibrary = nameOrPath;
    if (token) {
      this.libraryTokens.set(nameOrPath, token.trim());
    }
    this.cachedToken = undefined;
  }

  /**
   * Manually set an explicit active token.
   */
  setToken(token: string): void {
    this.explicitToken = token.trim();
    this.cachedToken = undefined;
  }

  /**
   * Clear cached token in memory to force re-discovery.
   */
  clearCache(): void {
    this.cachedToken = undefined;
  }

  /**
   * Resolve a valid Bearer token according to priority rules.
   */
  async resolveToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.cachedToken) {
      return this.cachedToken;
    }

    // * Check specific token for active library
    if (this.currentLibrary) {
      const libToken = this.libraryTokens.get(this.currentLibrary);
      if (libToken) {
        this.cachedToken = libToken;
        return libToken;
      }

      // ? If currentLibrary is a directory path, attempt to read .mcp-token directly
      if (this.autoDiscover) {
        const directToken = await this.readTokenFromFile(`${this.currentLibrary}/.mcp-token`);
        if (directToken) {
          this.cachedToken = directToken;
          return directToken;
        }
      }
    }

    // * Check explicit token
    if (this.explicitToken) {
      this.cachedToken = this.explicitToken;
      return this.explicitToken;
    }

    // * Check environment variable ATLAS_MCP_TOKEN
    const envToken = process.env.ATLAS_MCP_TOKEN?.trim();
    if (envToken) {
      this.cachedToken = envToken;
      return envToken;
    }

    // * Automatic discovery from local filesystem and Atlas process
    if (this.autoDiscover) {
      const discovered = await this.discoverLocalToken();
      if (discovered) {
        this.cachedToken = discovered;
        return discovered;
      }
    }

    // ! No valid token found across all channels
    throw new AtlasAuthError(
      "No Atlas MCP token found. Specify a token in options, set ATLAS_MCP_TOKEN, or ensure an Atlas library with .mcp-token is open.",
    );
  }

  // * Internal helper to read token file from disk
  private async readTokenFromFile(path: string): Promise<string | undefined> {
    try {
      const file = Bun.file(path);
      if (await file.exists()) {
        const text = (await file.text()).trim();
        if (text) {
          return text;
        }
      }
    } catch {
      // ? Ignore filesystem access errors
    }
    return undefined;
  }

  // * Discover active token from Atlas CLI status output and dynamic directory scanning
  private async discoverLocalToken(): Promise<string | undefined> {
    // * 1. Inspect active library path via 'atlas status' CLI
    const cliCommands = [
      ["/opt/homebrew/bin/atlas", "status"],
      ["atlas", "status"],
    ];
    for (const cmd of cliCommands) {
      try {
        const proc = Bun.spawnSync(cmd, {
          stdout: "pipe",
          stderr: "pipe",
        });
        if (proc.exitCode === 0) {
          const text = proc.stdout.toString().trim();
          const info = JSON.parse(text) as {
            library?: { path?: string; name?: string };
          };
          const libPath = info.library?.path;
          if (libPath) {
            // Check library tokens map
            if (this.libraryTokens.has(libPath)) {
              return this.libraryTokens.get(libPath);
            }
            if (info.library?.name && this.libraryTokens.has(info.library.name)) {
              return this.libraryTokens.get(info.library.name);
            }
            const token = await this.readTokenFromFile(`${libPath}/.mcp-token`);
            if (token) {
              return token;
            }
          }
        }
      } catch {
        // ? Ignore CLI execution errors and continue
      }
    }

    // * 2. Dynamically scan Pictures and Documents for .atlaslibrary / .atlas bundles
    const home = process.env.HOME;
    if (home) {
      const glob = new Bun.Glob("*.{atlaslibrary,atlas}");
      for (const baseDir of [`${home}/Pictures`, `${home}/Documents`]) {
        try {
          for await (const entry of glob.scan({ cwd: baseDir, onlyFiles: false })) {
            const token = await this.readTokenFromFile(`${baseDir}/${entry}/.mcp-token`);
            if (token) {
              return token;
            }
          }
        } catch {
          // ? Ignore filesystem access errors
        }
      }
    }

    return undefined;
  }
}

// * ============================================================================
// * 4. Production HTTP Transport Implementation
// * ============================================================================

/**
 * Production HTTP transport connecting to local Atlas MCP server.
 */
export class HttpAtlasTransport implements AtlasTransport {
  private readonly endpoint: string;
  private readonly autoLaunch: boolean;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchFn;
  private readonly tokenResolver: TokenResolver;
  private rpcId = 1;

  constructor(options: HttpAtlasTransportOptions = {}) {
    this.endpoint = options.endpoint || "http://127.0.0.1:50473/mcp";
    this.autoLaunch = options.autoLaunch ?? true;
    this.timeoutMs = options.timeoutMs ?? 15000;
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.tokenResolver = new TokenResolver({
      token: options.token,
      libraryTokens: options.libraryTokens,
      autoDiscover: options.autoDiscoverToken ?? true,
    });
  }

  /**
   * Update active library on token resolver.
   */
  setActiveLibrary(nameOrPath: string, token?: string): void {
    this.tokenResolver.setActiveLibrary(nameOrPath, token);
  }

  /**
   * Access the underlying TokenResolver instance.
   */
  getTokenResolver(): TokenResolver {
    return this.tokenResolver;
  }

  /**
   * Check whether the server is reachable and responsive.
   */
  async ping(): Promise<boolean> {
    try {
      const token = await this.tokenResolver.resolveToken().catch(() => undefined);
      const response = await this.executeRawRpc("ping", {}, token);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Strongly-typed tool invocation overload.
   */
  callTool<K extends AtlasToolName>(
    name: K,
    args?: AtlasToolMap[K]["params"],
  ): Promise<AtlasToolMap[K]["result"]>;

  /**
   * Generic tool invocation overload.
   */
  callTool<T = unknown>(name: string, args?: Record<string, unknown>): Promise<T>;

  /**
   * Core tool execution implementation.
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const normalizedArgs = normalizeParams(name, args);
    const result = await this.executeRpcMethod<{
      isError?: boolean;
      content?: Array<{
        type: "text" | "image";
        text?: string;
        data?: string;
        mimeType?: string;
      }>;
    }>("tools/call", { name, arguments: normalizedArgs });

    // ! Check tool execution business error
    if (result.isError) {
      const firstText = result.content?.[0]?.text || "Unknown Atlas tool error";
      throw new AtlasToolError(name, firstText);
    }

    // * Unwrap MCP content payload
    return this.unpackMcpContent(name, result.content);
  }

  /**
   * Request the list of available tools and their schemas from the MCP server.
   */
  async listTools(): Promise<McpListToolsResult> {
    return await this.executeRpcMethod<McpListToolsResult>("tools/list", {});
  }

  /**
   * Request the list of available resources from the MCP server.
   */
  async listResources(): Promise<McpListResourcesResult> {
    return await this.executeRpcMethod<McpListResourcesResult>("resources/list", {});
  }

  /**
   * Read the content of an MCP resource by URI.
   */
  async readResource(uri: string): Promise<McpReadResourceResult> {
    return await this.executeRpcMethod<McpReadResourceResult>("resources/read", { uri });
  }

  // * Execute a JSON-RPC method with auto-launch and 401 retry handling
  private async executeRpcMethod<T>(
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    const token = await this.tokenResolver.resolveToken();

    let response: Response;
    try {
      response = await this.executeRpcWithAutoLaunch(method, params, token);
    } catch (err) {
      // ! Unreachable connection or network failure
      throw new AtlasConnectionError(
        `Failed to connect to Atlas MCP server at ${this.endpoint}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // ! Handle HTTP 401 Unauthorized: clear cache, refresh token, retry once
    if (response.status === 401) {
      this.tokenResolver.clearCache();
      const refreshedToken = await this.tokenResolver.resolveToken(true);

      let retryRes: Response;
      try {
        retryRes = await this.executeRawRpc(method, params, refreshedToken);
      } catch (err) {
        throw new AtlasConnectionError(
          `Failed to connect to Atlas MCP server on retry at ${this.endpoint}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      if (retryRes.status === 401) {
        throw new AtlasAuthError(
          "Atlas authentication failed (HTTP 401). Access token is invalid or expired.",
        );
      }
      response = retryRes;
    }

    // ! Handle other HTTP errors
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new AtlasError(`Atlas MCP HTTP error (status ${response.status}): ${errText}`);
    }

    // * Parse JSON-RPC 2.0 response wrapper
    let json: {
      jsonrpc: string;
      id: number;
      error?: { code: number; message: string; data?: unknown };
      result?: T;
    };
    try {
      json = (await response.json()) as {
        jsonrpc: string;
        id: number;
        error?: { code: number; message: string; data?: unknown };
        result?: T;
      };
    } catch (parseErr) {
      throw new AtlasError(
        `Failed to parse Atlas MCP JSON-RPC response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
    }

    // ! Check top-level JSON-RPC protocol error
    if (json.error) {
      throw new AtlasRpcError(json.error.code, json.error.message, json.error.data);
    }

    return (json.result ?? {}) as T;
  }

  // * Send request with automatic background app launch if connection is refused
  private async executeRpcWithAutoLaunch(
    method: string,
    params: Record<string, unknown>,
    token: string,
  ): Promise<Response> {
    try {
      return await this.executeRawRpc(method, params, token);
    } catch (firstErr) {
      if (!this.autoLaunch) {
        throw firstErr;
      }

      // * Attempt silent background launch of Atlas on macOS with active token
      await this.wakeAtlasApp(token);

      // * Retry the original request after successful wake-up
      return await this.executeRawRpc(method, params, token);
    }
  }

  // * Launch Atlas application silently in background and poll ping until responsive
  private async wakeAtlasApp(token?: string): Promise<void> {
    try {
      Bun.spawn(["open", "-g", "-a", "Atlas"], {
        stdout: "ignore",
        stderr: "ignore",
      });
    } catch (e) {
      throw new AtlasConnectionError(
        `Failed to launch Atlas: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    const startTime = Date.now();
    const maxWaitMs = 5000;
    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const activeToken =
          token ?? (await this.tokenResolver.resolveToken().catch(() => undefined));
        const pingRes = await this.executeRawRpc("ping", {}, activeToken);
        if (pingRes.ok) {
          return;
        }
      } catch {
        // ? Continue waiting
      }
    }

    throw new AtlasConnectionError("Timeout waiting for Atlas to launch (5s timeout).");
  }

  // * Execute a raw JSON-RPC 2.0 POST request
  private async executeRawRpc(
    method: string,
    params: Record<string, unknown>,
    token?: string,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Connection: "close",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: this.rpcId++,
          method,
          params,
        }),
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // * Unwrap content array from MCP response with special handling for view_items
  private unpackMcpContent(
    toolName: string,
    content?: Array<{
      type: "text" | "image";
      text?: string;
      data?: string;
      mimeType?: string;
    }>,
  ): unknown {
    if (!content || content.length === 0) {
      return toolName === "view_items" ? { content: [] } : {};
    }

    // * For view_items, always preserve { content } array structure to conform to ViewItemsResult
    if (toolName === "view_items") {
      return { content };
    }

    // * Single text response
    if (content.length === 1 && content[0]?.type === "text") {
      const text = content[0].text ?? "";
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    // * Single image response
    if (content.length === 1 && content[0]?.type === "image") {
      return {
        type: "image",
        data: content[0].data ?? "",
        mimeType: content[0].mimeType ?? "image/jpeg",
      };
    }

    // * Mixed text and image response
    const textPart = content.find((c) => c.type === "text");
    const imagePart = content.find((c) => c.type === "image");

    if (textPart && imagePart && content.length === 2) {
      let parsedText: Record<string, unknown> = {};
      try {
        parsedText = JSON.parse(textPart.text || "{}") as Record<string, unknown>;
      } catch {
        parsedText = { message: textPart.text };
      }
      return {
        ...parsedText,
        image: {
          data: imagePart.data ?? "",
          mimeType: imagePart.mimeType ?? "image/jpeg",
        },
      };
    }

    return { content };
  }
}

// * ============================================================================
// * 5. Mock Transport Implementation (Offline Unit Testing)
// * ============================================================================

export type MockHandler = (args: Record<string, unknown>) => Promise<unknown> | unknown;

/**
 * In-memory mock transport for deterministic, isolated unit testing.
 */
export class MockAtlasTransport implements AtlasTransport {
  private handlers = new Map<string, MockHandler>();
  private toolsHandler?: () => Promise<McpListToolsResult> | McpListToolsResult;
  private resourcesHandler?: () => Promise<McpListResourcesResult> | McpListResourcesResult;
  private readResourceHandler?: (
    uri: string,
  ) => Promise<McpReadResourceResult> | McpReadResourceResult;
  public callHistory: Array<{ name: string; args: Record<string, unknown> }> = [];

  /**
   * Register a strongly-typed mock handler for a specific tool.
   */
  mockTool<K extends AtlasToolName>(
    name: K,
    handler: (
      args: AtlasToolMap[K]["params"],
    ) => AtlasToolMap[K]["result"] | Promise<AtlasToolMap[K]["result"]>,
  ): this {
    this.handlers.set(name, handler as MockHandler);
    return this;
  }

  /**
   * Register a generic mock handler.
   */
  mock(name: string, handler: MockHandler): this {
    this.handlers.set(name, handler);
    return this;
  }

  /**
   * Register a mock handler for listTools (tools/list).
   */
  mockListTools(handler: () => Promise<McpListToolsResult> | McpListToolsResult): this {
    this.toolsHandler = handler;
    return this;
  }

  /**
   * Register a mock handler for listResources (resources/list).
   */
  mockListResources(handler: () => Promise<McpListResourcesResult> | McpListResourcesResult): this {
    this.resourcesHandler = handler;
    return this;
  }

  /**
   * Register a mock handler for readResource (resources/read).
   */
  mockReadResource(
    handler: (uri: string) => Promise<McpReadResourceResult> | McpReadResourceResult,
  ): this {
    this.readResourceHandler = handler;
    return this;
  }

  /**
   * Mock ping handler.
   */
  async ping(): Promise<boolean> {
    return true;
  }

  /**
   * Request the list of available tools from mock handler.
   */
  async listTools(): Promise<McpListToolsResult> {
    if (this.toolsHandler) {
      return await this.toolsHandler();
    }
    return { tools: [] };
  }

  /**
   * Request the list of available resources from mock handler.
   */
  async listResources(): Promise<McpListResourcesResult> {
    if (this.resourcesHandler) {
      return await this.resourcesHandler();
    }
    return { resources: [] };
  }

  /**
   * Read the content of an MCP resource from mock handler.
   */
  async readResource(uri: string): Promise<McpReadResourceResult> {
    if (this.readResourceHandler) {
      return await this.readResourceHandler(uri);
    }
    return { contents: [] };
  }

  /**
   * Strongly-typed tool invocation overload.
   */
  callTool<K extends AtlasToolName>(
    name: K,
    args?: AtlasToolMap[K]["params"],
  ): Promise<AtlasToolMap[K]["result"]>;

  /**
   * Generic tool invocation overload.
   */
  callTool<T = unknown>(name: string, args?: Record<string, unknown>): Promise<T>;

  /**
   * Core mock execution implementation.
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const normalizedArgs = normalizeParams(name, args);
    this.callHistory.push({ name, args: normalizedArgs });
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new AtlasError(`No mock handler registered for tool '${name}'.`);
    }
    return await handler(normalizedArgs);
  }

  /**
   * Clear recorded call history.
   */
  clearHistory(): void {
    this.callHistory = [];
  }
}
