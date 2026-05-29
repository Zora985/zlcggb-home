# Antigravity + Supabase MCP 配置指南

## 问题背景

在 Antigravity 中配置 Supabase MCP 服务器时，按照 Supabase 官方文档的 `serverUrl`（远程 HTTP）方式会遇到连接失败，需要改用 **stdio 本地模式**。

### 错误演进过程

| 阶段 | 配置方式 | 错误信息 | 根因 |
|------|---------|---------|------|
| 1 | `serverUrl`（无参数） | `Post "https://mcp.supabase.com/mcp": EOF` | 未认证，服务端返回 401 后关闭连接 |
| 2 | `serverUrl` + `headers` Authorization | 同上 EOF | Antigravity 不支持自定义 `headers` 字段 |
| 3 | `command` stdio + 全部 features | `Failed to parse Supabase Content API response: invalid_union` | `docs` feature 的 Content API schema 解析 bug |
| 4 | `command` stdio + 去掉 `docs` | ✅ 19/19 tools 可用 | 最终方案 |

---

## 最终方案：stdio 模式 + PAT Token

### Step 1：生成 Personal Access Token (PAT)

1. 打开 [Supabase Dashboard → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. 点击 **Generate new token**
3. 命名为有意义的名称（如 `Antigravity MCP Dev`）
4. 复制生成的 token（格式：`sbp_xxxxxxxxxxxx`）

> [!CAUTION]
> PAT token 拥有你账户的完整权限。不要提交到 git，不要分享给他人。仅用于开发环境。

### Step 2：获取 Project Reference

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 在 **Project Settings → General** 中找到 **Reference ID**（格式：`xxxxxxxxxxxxxxxxxxxx`）
4. 或者从项目 URL 中提取：`https://supabase.com/dashboard/project/<project_ref>`

### Step 3：配置 MCP

编辑 `~/.gemini/antigravity/mcp_config.json`：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "<你的PAT_TOKEN>",
        "--project-ref",
        "<你的PROJECT_REF>",
        "--features",
        "account,database,debugging,development,functions,branching"
      ]
    }
  }
}
```

**实际示例**（替换 token 和 project_ref）：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "--project-ref",
        "hctavmqrgmajclbmjgiz",
        "--features",
        "account,database,debugging,development,functions,branching"
      ]
    }
  }
}
```

> [!WARNING]
> **不要**在 features 中包含 `docs`。截至 2026-05-01，`docs` feature 存在 Content API schema 解析 bug，会导致 `tools/list` 调用失败（`invalid_union` 错误）。

### Step 4：安装 Agent Skills（可选但推荐）

Agent Skills 提供 Supabase 开发的最佳实践指引，不依赖 MCP 连接：

```bash
# 在项目根目录执行
npx -y skills add supabase/agent-skills --skill supabase --skill supabase-postgres-best-practices
```

如果交互式安装有困难，可以手动安装：

```bash
# 克隆仓库
git clone --depth 1 https://github.com/supabase/agent-skills.git /tmp/supabase-agent-skills

# 复制 skills 到项目
mkdir -p .agents/skills
cp -r /tmp/supabase-agent-skills/skills/supabase .agents/skills/
cp -r /tmp/supabase-agent-skills/skills/supabase-postgres-best-practices .agents/skills/

# 清理
rm -rf /tmp/supabase-agent-skills
```

安装后的目录结构：

```
.agents/
└── skills/
    ├── supabase/
    │   ├── SKILL.md              # 核心指南（Auth, RLS, CLI, MCP, Schema）
    │   ├── assets/
    │   └── references/
    └── supabase-postgres-best-practices/
        ├── SKILL.md              # Postgres 性能优化 8 大分类
        └── references/
```

### Step 5：验证连接

1. 重启 Antigravity
2. 打开顶部 `···` 菜单 → **MCP Servers** → **Manage MCP Servers**
3. 确认 Supabase 显示 **Enabled**，工具数量为 **19/19**
4. 在对话中测试：`"列出数据库中的所有表"`

---

## 可用工具清单（19 个）

| 分组 | 工具 | 说明 |
|------|------|------|
| **Database** | `list_tables` | 列出所有表（支持 verbose 模式） |
| | `list_extensions` | 列出 Postgres 扩展 |
| | `list_migrations` | 列出数据库迁移 |
| | `apply_migration` | 应用 DDL 迁移 |
| | `execute_sql` | 执行原始 SQL |
| **Debugging** | `get_logs` | 获取服务日志 |
| | `get_advisors` | 安全/性能建议 |
| **Development** | `get_project_url` | 获取 API URL |
| | `get_publishable_keys` | 获取公开密钥 |
| | `generate_typescript_types` | 生成 TypeScript 类型 |
| **Functions** | `list_edge_functions` | 列出 Edge Functions |
| | `get_edge_function` | 获取函数详情 |
| | `deploy_edge_function` | 部署 Edge Function |
| **Account** | `list_projects` / `get_project` | 项目管理 |
| **Branching** | `create_branch` / `list_branches` | 分支管理（需付费计划） |
| | `merge_branch` / `reset_branch` / `rebase_branch` | 分支操作 |

---

## 官方方式（备选）

Supabase 官方推荐的 `serverUrl` 方式，依赖 Antigravity 的 OAuth 流程：

```json
{
  "mcpServers": {
    "supabase": {
      "serverUrl": "https://mcp.supabase.com/mcp?project_ref=<PROJECT_REF>"
    }
  }
}
```

保存后重启 Antigravity → 应弹出浏览器 OAuth 登录 → 完成授权。

如果 OAuth 未自动触发：`Cmd+,` → Customizations → 找到 Supabase → 点击 **Authenticate**

> [!NOTE]
> 截至 2026-05-01，此方式在我们的环境中无法工作（EOF 错误），可能与网络环境或 Antigravity 版本的 OAuth 实现有关。如果未来 Antigravity 更新修复了此问题，可以切换回此方式以避免管理 PAT token。

---

## 安全提醒

- ❌ 不要将 PAT token 提交到 git（`mcp_config.json` 在 `~/.gemini/` 目录下，不在项目内）
- ❌ 不要连接生产数据库，仅用于开发
- ✅ 定期轮换 PAT token
- ✅ 如果 token 泄露，立即去 Dashboard 撤销并重新生成
