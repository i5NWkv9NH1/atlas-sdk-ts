// * Atlas UI, App Navigation, and System Settings Domain Module
// * Covers window focus, selection, view modes, settings inspection, and library maintenance.

import type { AtlasTransport } from "./transport.js";
import type {
  AppInfoParams,
  AppInfoResult,
  GetSettingsParams,
  GetSettingsResult,
  OpenItemParams,
  OpenItemResult,
  OpenSettingsParams,
  OpenSettingsResult,
  RunMaintenanceParams,
  RunMaintenanceResult,
  SelectItemsParams,
  SelectItemsResult,
  SetSettingParams,
  SetSettingResult,
  SetViewModeParams,
  SetViewModeResult,
  ShowInAppParams,
  ShowInAppResult,
  ShowInFinderParams,
  ShowInFinderResult,
  ShowItemsParams,
  ShowItemsResult,
} from "./types.js";

/**
 * Domain module controlling Atlas UI navigation, settings, viewer focus, and maintenance.
 */
export class UiModule {
  constructor(private readonly transport: AtlasTransport) {}

  /**
   * Navigate Atlas window to a preset view, collection, tag, or folder.
   */
  showInApp(params: ShowInAppParams = {}): Promise<ShowInAppResult> {
    return this.transport.callTool("show_in_app", params);
  }

  /**
   * Display a custom list of items in the Atlas UI.
   */
  showItems(params: ShowItemsParams): Promise<ShowItemsResult> {
    return this.transport.callTool("show_items", params);
  }

  /**
   * Open an item in detail viewer and bring Atlas to front.
   */
  openItem(params: OpenItemParams): Promise<OpenItemResult> {
    return this.transport.callTool("open_item", params);
  }

  /**
   * Select visible items in the current view.
   */
  selectItems(params: SelectItemsParams): Promise<SelectItemsResult> {
    return this.transport.callTool("select_items", params);
  }

  /**
   * Change the active display mode (grid, infinite, or canvas).
   */
  setViewMode(params: SetViewModeParams): Promise<SetViewModeResult> {
    return this.transport.callTool("set_view_mode", params);
  }

  /**
   * Reveal raw item files in macOS Finder.
   */
  showInFinder(params: ShowInFinderParams): Promise<ShowInFinderResult> {
    return this.transport.callTool("show_in_finder", params);
  }

  /**
   * Read application settings, optionally filtered by section.
   */
  getSettings(params: GetSettingsParams = {}): Promise<GetSettingsResult> {
    return this.transport.callTool("get_settings", params);
  }

  /**
   * Update a specific application setting.
   */
  setSetting(params: SetSettingParams): Promise<SetSettingResult> {
    return this.transport.callTool("set_setting", params);
  }

  /**
   * Open the Atlas preferences / settings window to a specified tab.
   */
  openSettings(params: OpenSettingsParams = {}): Promise<OpenSettingsResult> {
    return this.transport.callTool("open_settings", params);
  }

  /**
   * Get Atlas application name, version, build number, and update channel.
   */
  appInfo(params: AppInfoParams = {}): Promise<AppInfoResult> {
    return this.transport.callTool("app_info", params);
  }

  /**
   * Execute a library maintenance task (deduplication, repair thumbnails, purge expired trash).
   */
  runMaintenance(params: RunMaintenanceParams): Promise<RunMaintenanceResult> {
    return this.transport.callTool("run_maintenance", params);
  }
}
