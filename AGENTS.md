# 项目 AI 指令

## 项目概览

zlcggb-home 是一个 React 18 + TypeScript + Vite 个人网站，采用苹果风格设计系统。

- 在线地址：https://zlcggb.com
- 技术栈：React 18 / TypeScript / Tailwind CSS 3 / Vite 5 / React Router v7
- 部署：Netlify + 阿里云域名

## 数据库

本项目使用 **Supabase** 作为后端数据库，通过 MCP 服务器 `supabase-yueyu` 连接。

- **MCP 服务器名**：`supabase-yueyu`
- **项目 URL**：`https://jkxjpopqbkjpevkcncrr.supabase.co`
- **Project Ref**：`jkxjpopqbkjpevkcncrr`

### 使用规范

1. **查询数据库结构时**，优先使用 `supabase-yueyu` MCP 工具（`list_tables`、`execute_sql`），不要猜测表结构。
2. **修改数据库 schema 时**，必须通过 `apply_migration` 创建 migration，不要直接 `execute_sql` 修改 schema。
3. **所有表都已启用 RLS（Row Level Security）**，新建表时必须同步配置 RLS 策略。
4. **前端连接 Supabase** 使用 `@supabase/supabase-js`，环境变量见 `.env`。

### 现有表分组

| 分组 | 表名前缀 | 说明 |
|------|---------|------|
| 内容系统 | `posts` / `media` / `books` / `milestones` | 文章、媒体、书籍、里程碑 |
| 用户系统 | `profiles` | 用户资料 |
| 社交聚合 | `platform_feeds` | B站/抖音/小红书等平台动态 |
| 课程管理 (CTMS) | `ctms_*` | 学员、课程、课时、交易、评价、试听、联系 |
| 年会抽奖 (Luck) | `luck_*` | 活动、参与者、签到、用户、奖项、中奖记录 |
| 基金工具 (RTF) | `rtf_*` | 用户配置、基金关联、基金代码 |

## 代码知识图谱

本项目已接入 CodeGraph MCP（`codegraph_*` 工具）。

- 分析代码结构时优先使用 `codegraph_context`、`codegraph_search`、`codegraph_callers`。
- 详见 `.cursor/rules/codegraph.mdc`。

## 依赖管理（⚠️ 严格执行）

> **禁止在 IDE 内执行 `npm install` / `npm ci` / `npm add` 等任何触发 node_modules 写入的命令。**
> IDE 文件监听器会与 npm 同时扫描 node_modules，导致 CPU/内存打满、电脑卡死。

需要添加新依赖时，AI 必须：

1. **手动编辑 `package.json`**，将依赖写入 `dependencies` 或 `devDependencies`（使用固定版本号）
2. **不执行任何安装命令**
3. **提醒用户**在系统终端（非 IDE 终端）中手动运行：
   ```bash
   npm ci --ignore-scripts --no-audit --no-fund && npm rebuild esbuild
   ```

## 开发规范

- **样式**：使用 Tailwind CSS，自定义 Apple 设计 token 定义在 `tailwind.config.js`。
- **图片 URL**：统一通过 `src/utils/imageUrl.ts` 处理，开发环境走 Vite proxy，生产环境走 CDN。
- **AI 集成**：创作工坊使用 OpenAI 兼容 API（流式 SSE），配置在 `.env` 中。
- **状态管理**：localStorage 持久化（宠物状态、创作记录、工坊会话），无全局状态库。
- **路由**：React Router v7 客户端路由，Netlify `_redirects` 处理 SPA 回退。
