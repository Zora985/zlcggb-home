# Phase 6：编辑器修复 + 体验增强

> **状态**：✅ 已完成
> **执行时间**：2026-05-29
> **前置**：Phase 4（Tiptap 编辑器）、Phase 5（用户系统 + 评论）

---

## 变更汇总

本阶段修复了 3 个 Bug 并完成 2 项体验增强，涉及 TipTap 编辑器崩溃、StarterKit 扩展重复注册、Supabase 评论联表查询失败、图片粘贴体验优化、编辑器实时目录导航。

---

### Bug 1：TipTap editor 未挂载时访问 `editor.view.dom` 导致页面崩溃

**现象**：首次进入编辑页（带 `id` 参数）白屏崩溃，刷新后偶尔恢复。

**根因**：`TutorialEditor.tsx` 的链接悬浮条 effect 中使用 `editor?.view?.dom`，但 TipTap 3 的 `editor.view` 在 DOM 未挂载时访问会直接抛错（不是 `undefined`），optional chaining 拦不住。`loadingTutorial = !!id` 时先返回 loader，`EditorContent` 还没渲染，effect 就已经跑了。

**修复**：改用 `editorRef.current?.querySelector('.ProseMirror')` 获取 DOM 节点。

#### [MODIFY] `src/components/lab/TutorialEditor.tsx`

```diff
-  if (!editor?.view?.dom) return;
-  const proseDom = editor.view.dom;
+  if (!editor) return;
+  const proseDom = editorRef.current?.querySelector('.ProseMirror') as HTMLElement | null;
+  if (!proseDom) return;
```

---

### Bug 2：TipTap 重复扩展警告 `Duplicate extension names found: ['link']`

**现象**：控制台警告 `Duplicate extension names found: ['link']`。

**根因**：`StarterKit` 内置了 `link` 扩展，代码又手动注册了 `LinkExtension`，导致重复。

**修复**：在 `StarterKit.configure()` 中禁用内置 `link`。

#### [MODIFY] `src/components/lab/TutorialEditor.tsx`

```diff
-  StarterKit.configure({ codeBlock: false }),
+  StarterKit.configure({ codeBlock: false, link: false }),
```

#### [MODIFY] `src/components/lab/TutorialDetail.tsx`

```diff
-  StarterKit.configure({ codeBlock: false }),
+  StarterKit.configure({ codeBlock: false, link: false }),
```

---

### Bug 3：Supabase 400 — 评论联表查询外键关系不存在

**现象**：评论区加载时 Supabase REST API 返回 `PGRST200: Could not find a relationship between 'zlcggb_comments' and 'user_id'`。

**根因**：`zlcggb_comments.user_id` 外键指向 `auth.users(id)`，但 `commentService.ts` 的嵌套 select 写的是 `profiles:user_id(username, avatar_url)`。PostgREST 无法从 `auth.users` 自动跳转到 `profiles`。

**修复**：

1. **数据库 Migration**：添加 `zlcggb_comments.user_id → profiles.id` 的外键关系

```sql
-- Migration: add_zlcggb_comments_profiles_fk
ALTER TABLE zlcggb_comments
  ADD CONSTRAINT zlcggb_comments_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

2. **前端查询**：添加外键 hint 消除双外键歧义

#### [MODIFY] `src/lib/commentService.ts`

```diff
-  .select('*, profiles:user_id(username, avatar_url)')
+  .select('*, profiles:user_id!zlcggb_comments_user_id_profiles_fkey(username, avatar_url)')
```

（3 处查询全部更新）

---

### 增强 1：图片粘贴/拖拽乐观插入（消除上传延迟感知）

**问题**：粘贴/拖拽图片需要等上传完成才能看到图片，用户以为没粘进去会反复操作。

**修复**：乐观插入模式 — blob 预览 → 后台上传 → 替换真实 URL。

#### [MODIFY] `src/components/lab/TutorialEditor.tsx`

- 新增 `editorInstanceRef` 解决 `handleEditorImage` ↔ `useEditor` 循环依赖（`handleEditorImage` 定义在 `useEditor` 之前，闭包捕获的 `editor` 永远是 `undefined`）
- `handleEditorImage` 改为乐观插入流程：
  1. `URL.createObjectURL(file)` 立即插入本地 blob 预览
  2. 后台 `uploadImage(file)` 异步上传
  3. 上传成功 → `doc.descendants()` 找到 blob 节点 → `tr.setNodeMarkup()` 替换为真实 URL
  4. 上传失败 → `tr.delete()` 移除占位图
  5. `URL.revokeObjectURL()` 释放内存

#### [MODIFY] `src/index.css`

- 新增 `img[src^="blob:"]` CSS 规则：半透明 + 蓝色边框脉冲动画，自动识别上传中图片
- blob URL 替换为真实 URL 后动画自然消失，零额外状态管理

```css
.ProseMirror img[src^="blob:"] {
  opacity: 0.6;
  border-color: var(--apple-blue);
  animation: img-uploading-pulse 1.8s ease-in-out infinite;
}
```

---

### 增强 2：编辑器实时目录导航侧栏

**问题**：只有详情页有左侧目录，编辑时没有，长文档编辑不方便跳转。

#### [MODIFY] `src/components/lab/TutorialEditor.tsx`

- 新增 `editorHeadings` / `activeHeadingId` 状态
- 监听 editor `update` 事件，实时从 `.ProseMirror` DOM 提取 h1/h2/h3 标题
- 滚动监听实现 Scrollspy 高亮
- 点击目录项时，通过 `editor.chain().setTextSelection(pos).focus().scrollIntoView().run()` 让 TipTap 自动滚动到对应标题（直接操作 DOM scroll 会被 TipTap 焦点管理覆盖）
- 专注模式（zenMode）下自动隐藏
- 仅 `xl` (1280px+) 宽屏显示

#### [MODIFY] `src/index.css`

- 新增 `scroll-margin-top: 120px` 给编辑器标题，目录跳转时预留顶栏空间

---

### 关键设计决策

| 决策 | 原因 |
|------|------|
| 用 `editorRef.querySelector('.ProseMirror')` 代替 `editor.view.dom` | TipTap 3 的 `editor.view` 在未挂载时访问会抛错，不是 undefined |
| 用 `editorInstanceRef` ref 桥接 handleEditorImage | 解决 useCallback 和 useEditor 循环依赖导致闭包捕获 undefined |
| 图片上传用 blob URL 乐观插入 | 消除用户感知延迟，避免重复粘贴 |
| 用 `img[src^="blob:"]` CSS 选择器标记上传中 | 零状态管理，blob URL 替换后动画自然消失 |
| TOC 用 TipTap `setTextSelection + scrollIntoView` 跳转 | 编辑器模式下 DOM scroll 会被 TipTap 焦点管理覆盖 |
| hooks 声明在 early return 之前 | React hooks 规则：hooks 调用顺序在每次渲染中必须一致 |

---

### 验证结果

- `npm run typecheck` → 零错误 ✅
