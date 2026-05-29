# 教程内容平台 — 分阶段实施计划

## 项目目标

将 `/lab` 技术实验室页面从静态飞书文档引导页升级为完整的教程内容管理平台。

**核心能力**：文章发布（Tiptap 富文本）、视频嵌入（B站/YouTube）、分类标签筛选、搜索、管理员 CRUD。

---

## 阶段索引

| 阶段 | 文档 | 状态 | 说明 |
|------|------|------|------|
| Phase 1 | [phase1-database.md](./phase1-database.md) | ✅ 已完成 | 数据库表 + RLS + Storage |
| Phase 2 | [phase2-data-layer.md](./phase2-data-layer.md) | ✅ 已完成 | Supabase 客户端 + 数据服务层 |
| Phase 3 | [phase3-frontend.md](./phase3-frontend.md) | ✅ 已完成 | 前端页面组件（7 新 + 2 改） |
| Phase 4 | [phase4-tiptap.md](./phase4-tiptap.md) | ✅ 已完成 | Tiptap 编辑器依赖 @3.23.6 |
| Phase 4 补充 | [phase4-tiptap-optimization.md](./phase4-tiptap-optimization.md) | ✅ 已完成 | Tiptap 富文本大纲与交互优化 |
| Phase 5 | [phase5-user-system.md](./phase5-user-system.md) | ✅ 已完成 | 用户登录/注册 + 评论 + 阅读记录 |

---

## 用户确认项

1. **登录方式** → 邮箱 + 密码（Supabase Auth）✅
2. **导航命名** → 「技术实验室」不改名 ✅
3. **飞书链接** → 不保留飞书文档入口 ✅
4. **预设分类** → 6 个 ✅
   - AI大模型技术 / 常用开发思路 / 网站开发逻辑 / 部署与运维 / 从业务到系统 / 从系统到架构

---

## 执行顺序

```
Phase 4（安装依赖）→ Phase 2（tutorialService.ts）→ Phase 3（前端组件）→ 验证
```

## 验证计划

### 自动化

```bash
npm run typecheck     # TypeScript 编译检查
npm run build         # 生产构建验证
```

### 手动

1. **访客视角**：`/lab` → 教程列表 → 点击卡片 → 详情页 → 视频播放
2. **管理员视角**：登录 → 编辑器 → 写内容 → 上传图片 → 发布 → 前台确认
3. **响应式**：手机端排版
4. **空状态**：无教程时的友好提示

### 安全

| 检查项 | 措施 |
|--------|------|
| SQL 注入 | Supabase SDK 参数化查询 |
| XSS | Tiptap JSON 渲染，不用 `dangerouslySetInnerHTML` |
| 认证 | Supabase Auth，不自行存储 token |
| 授权 | RLS 数据库层面强制 admin |
| 文件上传 | UUID 重命名，Storage RLS 限制 |
| 密钥 | 环境变量，不硬编码 |
| iframe | sandbox + 域名白名单 |
| 错误信息 | 登录失败不泄露具体原因 |
