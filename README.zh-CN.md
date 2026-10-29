# atlas-sdk

[English](README.md) | [简体中文](README.zh-CN.md)

> **说明**：本 SDK 主要为个人自用封装。仓库中的绝大部分代码、工程规范与测试套件均由 **Gemini 3.8 Flash** 与 **Gemini 4 Argon** 生成。

macOS 视觉素材管理软件 [**Atlas**](https://atlasformac.com/) 的本地 MCP 客户端强类型 SDK（第三方非官方实现）。

面向 **Bun 1.4+** 与 **TypeScript 7+** 开发，运行期零外部冗余依赖。

---

## 核心特性

- **100% 覆盖官方工具**：完整实现官方 MCP Schema 中的全部 78 个工具并提供强类型保护。
- **高阶链式一步入库**：提供 `client.ingest()` 构建器，支持通过二进制字节流、Base64 字符串、文件路径或网络 URL 一步完成媒体写入、分类归集、打标与元数据配置。
- **双命名风格支持**：每个工具均同时支持 TS 惯用的驼峰命名（如 `client.searchItems(...)`）与协议原始的下划线命名（如 `client.search_items(...)`）。
- **多图库 Token 自动切换**：支持自动读取图库目录下的 `.mcp-token`、支持从 `atlas status` 探测当前图库路径、并支持按图库路径配置独立密钥。
- **断线自愈与静默唤醒**：当本地 Atlas 软件未启动时，通过 `open -g -a Atlas` 静默拉起应用并轮询等待服务可用；当遭遇 `HTTP 401` 时自动清空缓存重新探测 Token 并重试一次。
- **协议参数自动清洗与补齐**：自动处理 MCP 协议的特殊参数要求（例如未设定的过滤字段自动补齐空字符串「」或数字「0」）。
- **零运行时外部依赖**：仅使用 Bun 原生 `fetch`、`Bun.file` 与 `Bun.spawnSync`。
- **内置脱机 Mock 传输层**：自带 `MockAtlasTransport`，方便在不启动 Atlas 软件的情况下进行单元测试与参数断言。

---

## 安装

本包不发布至 NPM 镜像源，支持直接从 GitHub 仓库引用或通过本地路径链接使用：

### 方式一：直接从 GitHub 安装

```bash
bun add github:i5NWkv9NH1/atlas-sdk-ts
```

### 方式二：克隆到本地并通过 `bun link` 链接（推荐本机开发）

```bash
git clone https://github.com/i5NWkv9NH1/atlas-sdk-ts.git
cd atlas-ts && bun install && bun link

# 在你的目标项目中链接：
bun link atlas-sdk
```

---

## 快速上手

### 1. 基础连接与检索

```typescript
import { AtlasClient } from "atlas-sdk";

// 自动探测本地运行中图库的 Token 与端点（http://127.0.0.1:50473/mcp）
const client = new AtlasClient();

// 检查服务连通性
const isReady = await client.ping();
console.log("Atlas MCP 服务就绪状态:", isReady);

// 获取当前打开图库的信息
const info = await client.libraryInfo();
console.log(`已连接图库: ${info.name}，共有素材 ${info.unique_items} 个`);

// 检索素材
const searchResult = await client.searchItems({
  query: "设计规范",
  kind: "image",
  limit: 20,
});

for (const item of searchResult.items) {
  console.log(`检索到素材 [${item.id}] ${item.name} (${item.format})`);
}
```

### 2. 多图库 Token 配置与切换

每个 macOS 上的 `.atlaslibrary` 图库包在 `<图库路径>/.mcp-token` 都有自己独立的授权令牌。你可以在初始化时指定各个图库的 Token，也可以完全依赖自动发现：

```typescript
const client = new AtlasClient({
  // 默认兜底 Token
  token: process.env.ATLAS_MCP_TOKEN,
  // 针对不同图库路径指定不同 Token
  libraryTokens: {
    "/Users/username/Pictures/工作.atlaslibrary": "token_for_work",
    "/Users/username/Pictures/个人.atlaslibrary": "token_for_personal",
  },
  // 切库时自动读取目标图库目录下的 .mcp-token 文件
  autoDiscoverToken: true,
});

// 切换当前激活的图库
await client.switchLibrary({ path: "/Users/username/Pictures/工作.atlaslibrary" });
```

### 3. 一步链式媒体入库（`client.ingest()`）

通过链式调用一步完成图片或媒体的载入，支持二进制字节流、Base64 字符串、本地文件路径或网络媒体 URL，同时指定所属分类、标签、注释、来源与收藏状态，自动管理并清理临时文件：

```typescript
import { AtlasClient } from "atlas-sdk";

const client = new AtlasClient();

// 通过 Base64 字符串一步入库
const result = await client
  .ingest()
  .base64(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "png",
  )
  .filename("hero-banner.png")
  .collection("灵感收集")
  .tags(["ui", "banner", "mobile"])
  .annotation("改版首页横幅素材")
  .sourceUrl("https://example.com/banner.png")
  .liked(true)
  .send();

console.log(`入库成功，素材 ID: ${result.itemId}`);
```

---

## 模块划分

`AtlasClient` 既将 78 个工具按业务归类为四大领域模块，也直接在 `client` 实例顶层平铺了全部方法：

### `client.query`（检索与查看）

- `searchItems(params)` / `search_items`：元数据与全文检索
- `searchByDescription(params)` / `search_by_description`：自然语言语义向量搜索
- `findSimilar(params)` / `find_similar`：视觉与语义相似素材匹配
- `getItem(params)` / `get_item`：读取素材完整详情
- `viewItems(params)` / `view_items`：获取缩略图 Base64 画面
- `getFile(params)` / `get_file`：读取本地文件路径或原图二进制
- `storeEmbeddings(params)` / `store_embeddings`：批量存入特征向量
- `queryEmbeddings(params)` / `query_embeddings`：特征向量近邻检索
- `runSmartFolder(params)` / `run_smart_folder`：运行智能文件夹筛选
- `getBoard(params)` / `get_board`：获取画布集合排版与分组信息
- `getCurrentView(params)` / `get_current_view`：读取软件当前窗口展示状态

### `client.media`（素材录入与编辑）

- `importFiles(params)` / `import_files`：从本地磁盘绝对路径导入文件
- `addLink(params)` / `add_link`：添加网页链接卡片
- `editLink(params)` / `edit_link`：编辑链接标题与描述
- `addColor(params)` / `add_color`：添加色卡
- `editColor(params)` / `edit_color`：修改色卡色值
- `saveMediaFromUrl(params)` / `save_media_from_url`：抓取网络媒体资源
- `editImage(params)` / `edit_image`：无损旋转与剪裁图片
- `refreshThumbnail(params)` / `refresh_thumbnail`：重新生成缩略图
- `setLiked(params)` / `set_liked`：点赞或取消点赞素材
- `setMetadata(params)` / `set_metadata`：修改备注、作者、拍摄地等
- `trashItems(params)` / `trash_items`：移入回收站
- `restoreItems(params)` / `restore_items`：从回收站恢复
- `deletePermanently(params)` / `delete_permanently`：彻底永久删除回收站素材
- `emptyTrash(params)` / `empty_trash`：清空回收站

### `client.organize`（集合、标签与图库管理）

- **集合**：`listCollections`、`createCollection`、`renameCollection`、`archiveCollection`、`deleteCollection`、`setCollectionOrder`、`addToCollection`、`removeFromCollection`
- **文件夹**：`listCollectionFolders`、`createCollectionFolder`、`moveCollectionFolder`、`renameCollectionFolder`、`deleteCollectionFolder`、`moveCollectionToFolder`
- **标签与标签组**：`listTags`、`createTag`、`renameTag`、`deleteTag`、`addTags`、`removeTags`、`setTags`、`moveTagsToFolder`、`createTagFolder`、`renameTagFolder`、`deleteTagFolder`
- **智能文件夹**：`listSmartFolders`、`createSmartFolder`、`updateSmartFolder`、`deleteSmartFolder`
- **画布自由排版**：`arrangeBoard`、`moveToGroup`、`moveGroup`、`resetBoardLayout`、`undoBoardLayout`
- **磁盘连接目录**：`listConnectedFolders`、`connectFolder`、`disconnectFolder`、`rescanFolder`
- **图库管理**：`libraryInfo`、`listLibraries`、`createLibrary`、`switchLibrary`

### `client.ui`（软件界面与设置项）

- `showInApp(params)` / `show_in_app`：在软件窗口中跳转到指定页面或视图
- `showItems(params)` / `show_items`：在软件窗口中呈现指定的素材列表
- `openItem(params)` / `open_item`：在软件窗口中打开素材详情
- `selectItems(params)` / `select_items`：在软件窗口中框选选中素材
- `setViewMode(params)` / `set_view_mode`：切换显示模式（网格、无限瀑布流、画布）
- `showInFinder(params)` / `show_in_finder`：在访达 Finder 中定位文件
- `getSettings(params)` / `get_settings`：读取系统设置项
- `setSetting(params)` / `set_setting`：修改系统设置项
- `openSettings(params)` / `open_settings`：打开设置窗口
- `appInfo(params)` / `app_info`：获取软件版本与系统环境信息
- `runMaintenance(params)` / `run_maintenance`：运行图库去重或缩略图修复维护任务

### MCP 原生协议方法

- `listTools()` / `list_tools()`：请求当前服务端实时注册的全部工具及其入参 JSON Schema。
- `listResources()` / `list_resources()`：获取可用的 MCP 资源列表（如 `atlas://skill` 等）。
- `readResource(uri)` / `read_resource(uri)`：按 URI 读取指定 MCP 资源的具体内容（文档文本或素材数据）。

---

## 脱机单元测试（使用 `MockAtlasTransport`）

无需启动 Atlas 软件即可进行脱机单元测试：

```typescript
import { AtlasClient, MockAtlasTransport } from "atlas-sdk";

const mock = new MockAtlasTransport();
const client = new AtlasClient({ transport: mock });

// 注册 Mock 行为
mock.mockTool("add_color", (args) => ({
  ok: true,
  item_id: "test-color-id",
  hex: args.hex,
}));

// 调用并断言
const result = await client.addColor({ hex: "#00E5FF" });
console.assert(result.item_id === "test-color-id");
console.assert(mock.callHistory[0].name === "add_color");
```

---

## 质量门禁与验证命令

```bash
# 类型检查（TypeScript 7 严格模式）
bunx tsc --noEmit

# 格式化与代码风格检查（Biome）
bunx biome check .

# 运行脱机单元测试与安全活体验证测试
bun test
```

## 开源协议

MIT
