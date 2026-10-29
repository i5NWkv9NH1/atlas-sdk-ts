// * Normalizes MCP tool parameters according to official schema rules.
// * Maps undefined optional string filters to "" and optional numeric filters to 0 where required.

// * List of tools and their fields requiring special empty string or numeric zero defaults
export function normalizeParams(
  tool: string,
  args?: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...(args ?? {}) };

  switch (tool) {
    case "search_items":
      result.sort ??= "";
      result.source ??= "";
      result.orientation ??= "";
      result.kind ??= "";
      result.order ??= "";
      break;

    case "create_smart_folder":
    case "update_smart_folder":
      result.match ??= "";
      break;

    case "search_by_description":
      result.kind ??= "";
      result.min_score ??= 0;
      break;

    case "get_file":
      result.size ??= 0;
      break;

    case "show_in_app":
      result.view ??= "";
      break;

    case "get_settings":
      result.section ??= "";
      break;

    case "open_settings":
      result.page ??= "";
      break;
  }

  // ! Strip undefined fields to ensure clean JSON serialization over JSON-RPC
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) {
      delete result[key];
    }
  }

  return result;
}
