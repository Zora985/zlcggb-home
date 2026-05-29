# CodeGraph 通用配置指南

适用对象：想让 Codex、Claude Code、Cursor、opencode、Hermes Agent 更快理解代码库的开发者。

更新时间：2026-05-24。

官方项目：https://github.com/colbymchenry/codegraph

## 30 秒介绍

CodeGraph 是一个本地代码知识图谱工具。它会把项目源码解析成一个本地 SQLite 图数据库，记录文件、函数、类、接口、导入、调用关系、路由和影响范围，然后通过 MCP 工具提供给 AI 编程助手查询。

一句话理解：

> 以前 AI 需要反复 `grep`、`find`、读文件来找代码；接入 CodeGraph 后，AI 可以先查本地代码图谱，再精准读源码。

它适合这些场景：

- 大项目第一次接手，需要快速知道模块入口。
- 改共享函数前，想知道谁在调用它。
- 需要理解某个功能的调用链、依赖关系、影响范围。
- 想减少 AI 在“找文件、扫目录、猜入口”上消耗的 token 和时间。
- 希望代码索引留在本地，不上传到外部服务。

它不适合替代这些东西：

- 产品需求文档。
- 业务流程说明。
- 权限、部署、数据库账号等人工知识。
- 类型检查、测试、代码审查。

## 它有什么功能

| 功能 | 作用 |
| --- | --- |
| 符号搜索 | 根据函数、类、组件、接口名快速定位定义位置 |
| 上下文生成 | 根据任务描述自动找入口、相关符号和关键代码 |
| 调用者查询 | 查某个函数、组件、服务被谁调用 |
| 被调用查询 | 查某个函数内部依赖了哪些函数或服务 |
| 影响分析 | 改某个符号前，估算可能影响哪些代码 |
| 文件结构查询 | 从索引中快速看目录/文件结构 |
| 测试影响分析 | 根据变更文件推断可能受影响的测试文件 |
| 自动同步 | MCP server 运行时监听文件变化，增量更新图谱 |

官方当前说明里的关键特性：

- 本地 SQLite 数据库：`.codegraph/codegraph.db`
- 使用 tree-sitter 解析源码 AST
- 支持 FTS5 全文搜索
- 支持 MCP 工具
- 自动监听文件变化并增量同步
- 尊重 `.gitignore`
- 100% 本地运行，不需要 API key

## 支持哪些 AI 工具

官方安装器可以自动配置这些 agent：

- Claude Code
- Cursor
- Codex CLI / Codex
- opencode
- Hermes Agent

如果你的工具支持 MCP stdio，也可以手动配置：

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    }
  }
}
```

Codex 的 TOML 配置通常是：

```toml
[mcp_servers.codegraph]
command = "codegraph"
args = ["serve", "--mcp"]
```

## 支持哪些语言

官方 README 截至 2026-05-24 列出的语言包括：

- TypeScript：`.ts`、`.tsx`
- JavaScript：`.js`、`.jsx`、`.mjs`
- Python：`.py`
- Go：`.go`
- Rust：`.rs`
- Java：`.java`
- C#：`.cs`
- PHP：`.php`
- Ruby：`.rb`
- C/C++：`.c`、`.h`、`.cpp`、`.hpp`、`.cc`
- Swift：`.swift`
- Kotlin：`.kt`、`.kts`
- Scala：`.scala`、`.sc`
- Dart：`.dart`
- Svelte：`.svelte`
- Vue：`.vue`
- Liquid：`.liquid`
- Pascal/Delphi
- Lua/Luau

注意：如果你的项目用了未列出的文件类型，比如某些框架模板文件，需要实际初始化后用 `codegraph status` 看是否进入索引。没进索引的文件，AI 仍然需要直接读源码。

## 第一步：安装 CodeGraph

### 推荐方式 A：交互式安装

适合普通开发者第一次安装：

```bash
npx @colbymchenry/codegraph
```

安装器会询问：

- 要配置哪些 agent。
- 是否把 `codegraph` 放到 PATH。
- 是全局配置，还是只配置当前项目。
- 是否初始化当前项目。

### 推荐方式 B：npm 全局安装

适合你已经有 Node/npm 的环境：

```bash
npm install -g @colbymchenry/codegraph
```

安装后验证：

```bash
codegraph --version
```

### 推荐方式 C：macOS/Linux 一行安装

适合没有 Node 环境，或想用官方自带 runtime 的方式：

```bash
curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh
```

### 推荐方式 D：Windows PowerShell

```powershell
irm https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.ps1 | iex
```

## 第二步：配置 AI 工具的 MCP

### 自动配置所有检测到的 agent

```bash
codegraph install --yes
```

### 只配置 Codex

```bash
codegraph install --target=codex --location=global --yes
```

配置完后，重启 Codex。

### 只配置 Cursor 和 Claude Code

```bash
codegraph install --target=cursor,claude --location=global --yes
```

配置完后，重启对应工具。

### 查看某个工具应写入的配置，不实际修改文件

```bash
codegraph install --print-config codex
```

如果你想手动写配置，先用这个命令打印模板。

## 第三步：每个项目单独初始化

CodeGraph 的安装是全局一次性的，但每个项目都要单独初始化自己的代码图谱。

进入项目根目录：

```bash
cd your-project
codegraph init -i
codegraph status
```

初始化成功后，项目里会出现：

```text
.codegraph/
  codegraph.db
```

建议把 `.codegraph/` 加入项目 `.gitignore`：

```gitignore
.codegraph/
```

原因：

- `.codegraph/` 是本地索引，不是源码。
- 每个人、每台机器、每个分支都可以自己生成。
- 不应该提交到 Git。

## 第四步：重启 AI 工具并验证

重启 Codex、Claude Code 或 Cursor 后，打开项目，让 AI 检查：

```text
请先检查 CodeGraph 是否可用，调用 codegraph_status。
如果可用，后续代码结构探索优先使用 codegraph_context、codegraph_search、codegraph_callers、codegraph_impact。
```

如果工具可用，应该能看到类似信息：

```text
Files indexed: xxx
Total nodes: xxx
Total edges: xxx
Database size: xx MB
```

也可以用 CLI 自己验证：

```bash
codegraph status
codegraph query AuthService
codegraph context "how login works"
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `codegraph init -i` | 初始化当前项目并立即建立索引 |
| `codegraph status` | 查看索引状态、文件数、节点数、边数 |
| `codegraph query <关键词>` | 搜索函数、类、接口、组件等符号 |
| `codegraph context "<任务描述>"` | 根据任务描述生成代码上下文 |
| `codegraph callers <symbol>` | 查谁调用了某个符号 |
| `codegraph callees <symbol>` | 查某个符号调用了谁 |
| `codegraph impact <symbol>` | 分析修改某个符号的影响范围 |
| `codegraph files --filter <目录>` | 查看索引中的文件结构 |
| `codegraph sync` | 增量同步变更 |
| `codegraph index --force` | 全量重建索引 |
| `codegraph uninit` | 删除当前项目的 `.codegraph/` |
| `codegraph uninstall` | 从已配置的 agent 中移除 CodeGraph MCP |

## MCP 工具怎么用

AI 工具里通常会暴露这些 MCP 工具：

| MCP 工具 | 用途 |
| --- | --- |
| `codegraph_status` | 检查当前项目索引是否健康 |
| `codegraph_search` | 按名称快速找符号 |
| `codegraph_context` | 针对一个任务获取相关入口和代码上下文 |
| `codegraph_callers` | 找调用者 |
| `codegraph_callees` | 找被调用者 |
| `codegraph_impact` | 分析修改影响半径 |
| `codegraph_node` | 查看单个符号详情 |
| `codegraph_explore` | 一次查看多个相关符号的源码 |
| `codegraph_files` | 查看索引文件结构 |

推荐问法：

```text
先用 CodeGraph 分析一下登录模块的入口、调用链和影响范围。
```

```text
我要改 saveOrder，先用 CodeGraph 看看谁调用了它，会影响哪些地方。
```

```text
先调用 codegraph_context 理解这个功能，不要一上来全仓库 grep。
```

## 后续代码更新后怎么办

### 普通保存文件

如果 MCP server 正在运行，CodeGraph 会监听项目文件变化，经过短暂防抖后自动增量同步。

### 拉代码、切分支、合并后

建议手动执行：

```bash
codegraph sync
codegraph status
```

### 大重构、依赖升级、索引异常、符号缺失

执行全量重建：

```bash
codegraph index --force
codegraph status
```

### 判断哪些测试可能受影响

```bash
git diff --name-only | codegraph affected --stdin
```

只输出测试文件路径：

```bash
git diff --name-only | codegraph affected --stdin --quiet
```

可以把它用于本地脚本或 CI，只跑受影响的测试。

## 推荐给 AI 的固定提示词

你可以把下面这段直接贴给 AI：

```text
这个项目已经接入或计划接入 CodeGraph。

请先检查是否能调用 codegraph_status。
如果项目已有 `.codegraph/` 并且索引健康，后续代码结构探索优先使用 CodeGraph：
- 用 codegraph_context 理解功能/模块。
- 用 codegraph_search 查符号定义。
- 用 codegraph_callers / codegraph_callees 查调用链。
- 用 codegraph_impact 在修改共享符号前看影响范围。
- 只有当 CodeGraph 没覆盖、结果不够或需要确认具体业务逻辑时，再直接读源码。

不要把 CodeGraph 当成业务文档。涉及需求、权限、数据安全、部署配置时，仍要回到源码、文档和测试验证。
```

## 最佳实践

1. 每个项目初始化一次。
2. `.codegraph/` 不提交 Git。
3. 新项目接入后先跑 `codegraph status`，确认文件数、语言分布是否符合预期。
4. 大项目优先让 AI 用 `codegraph_context` 找入口，不要先全仓库搜索。
5. 修改共享函数、hooks、service、store 前，先用 `codegraph_impact`。
6. 切分支或拉代码后跑 `codegraph sync`。
7. 缺少符号、语言没识别、结果异常时跑 `codegraph index --force`。

## 常见问题

### 1. AI 里看不到 CodeGraph 工具

检查是否配置了 MCP：

```bash
codegraph install --print-config codex
```

确认配置后重启 AI 工具。

也可以测试 MCP server：

```bash
codegraph serve --mcp
```

### 2. 提示项目没有初始化

进入项目根目录：

```bash
codegraph init -i
```

### 3. 索引很慢

确认大目录是否被 `.gitignore` 排除：

- `node_modules/`
- `dist/`
- `.next/`
- `.output/`
- `.vercel/`
- `.turbo/`
- `coverage/`
- 大型 vendor、build、generated 目录

CodeGraph 会尊重 `.gitignore`。如果某些大目录已经被 Git 跟踪，仍可能进入索引，需要先从项目管理方式上处理。

### 4. 查不到某些文件

可能原因：

- 文件语言暂不支持。
- 文件被 `.gitignore` 排除。
- 文件超过大小限制。
- 索引没有同步。

处理方式：

```bash
codegraph sync
codegraph status
```

仍然不行：

```bash
codegraph index --force
```

### 5. 出现 database locked

优先升级到新版：

```bash
npm install -g @colbymchenry/codegraph@latest
```

再检查：

```bash
codegraph status
```

如果 `Journal` 不是 `wal`，可能是网络盘或特殊文件系统导致并发读写不理想，建议把项目放到本地磁盘。

## 卸载

从 agent 配置里移除 CodeGraph：

```bash
codegraph uninstall
```

删除某个项目的索引：

```bash
cd your-project
codegraph uninit
```

如果只是想重新建索引，不要卸载，直接：

```bash
codegraph index --force
```

## 给朋友的最短安装版

如果对方只想快速用起来，可以把这段发给他：

```bash
# 1. 安装
npm install -g @colbymchenry/codegraph

# 2. 配置 Codex
codegraph install --target=codex --location=global --yes

# 3. 进入自己的项目
cd your-project
codegraph init -i
codegraph status

# 4. 重启 Codex
```

然后告诉 AI：

```text
请先调用 codegraph_status 检查索引。
后续分析代码结构时，优先使用 CodeGraph 工具。
```

## 资料来源

- CodeGraph 官方仓库：https://github.com/colbymchenry/codegraph
- Quick Start：https://github.com/colbymchenry/codegraph#quick-start
- CLI Reference：https://github.com/colbymchenry/codegraph#cli-reference
- MCP Tools：https://github.com/colbymchenry/codegraph#mcp-tools
- Configuration：https://github.com/colbymchenry/codegraph#configuration
- Troubleshooting：https://github.com/colbymchenry/codegraph#troubleshooting
