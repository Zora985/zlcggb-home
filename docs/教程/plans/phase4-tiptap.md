# Phase 4：Tiptap 编辑器依赖

> **状态**：✅ 已安装
> **前置条件**：无（应最先执行）

---

## 概览

安装 Tiptap 富文本编辑器及相关扩展包，用于 TutorialEditor（编辑）和 TutorialDetail（只读渲染）。

---

## 需安装的包

| 包名 | 用途 |
|------|------|
| `@tiptap/react` | Tiptap React 绑定 |
| `@tiptap/starter-kit` | 基础扩展集（段落/标题/列表/代码块/引用等） |
| `@tiptap/extension-image` | 图片插入 |
| `@tiptap/extension-link` | 链接支持 |
| `@tiptap/extension-placeholder` | 输入占位提示 |
| `@tiptap/extension-code-block-lowlight` | 代码块语法高亮 |
| `lowlight` | 语法高亮引擎（被 code-block-lowlight 使用） |
| `highlight.js` | `@tiptap/extension-code-block-lowlight` 的传递依赖，会被自动安装 |

---

## 安装命令

当前项目已经安装并锁定以下版本：

```bash
npm install --save-exact \
  @tiptap/react@3.23.6 \
  @tiptap/starter-kit@3.23.6 \
  @tiptap/extension-image@3.23.6 \
  @tiptap/extension-link@3.23.6 \
  @tiptap/extension-placeholder@3.23.6 \
  @tiptap/extension-code-block-lowlight@3.23.6 \
  lowlight@3.3.0 \
  --no-audit --no-fund --fetch-timeout=30000 --fetch-retries=0 --maxsockets=2
```

不要使用不带版本号的裸命令。裸命令会按 `*` 解析最新版，并触发整棵 Tiptap/ProseMirror 依赖树的 reify。

本项目曾在安装时卡顿，npm 日志显示主要慢点是 `highlight.js-11.11.1.tgz` 从 `cdn.npmmirror.com` 下载耗时约 103 秒；当前项目 `.npmrc` 已切到 `registry.npmjs.org`，避免继续走该 CDN。

---

## 不安装的包

| 包名 | 原因 |
|------|------|
| `react-markdown` | 内容统一使用 Tiptap JSON 格式，不需要 Markdown 渲染 |
| `@tiptap/pm` | 不直接声明；由 Tiptap 包自动安装并锁定版本 |

---

## 使用方式

### 编辑模式（TutorialEditor.tsx）

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

const editor = useEditor({
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    Image,
    Link.configure({ openOnClick: false }),
    Placeholder.configure({ placeholder: '开始写教程...' }),
    CodeBlockLowlight.configure({ lowlight }),
  ],
  content: existingContent || '',
});
```

### 只读模式（TutorialDetail.tsx）

```typescript
const editor = useEditor({
  editable: false,
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    Image,
    Link.configure({ openOnClick: true }),
    CodeBlockLowlight.configure({ lowlight }),
  ],
  content: JSON.parse(tutorial.content),
});
```

---

## 体积影响评估

Tiptap + 扩展预计增加约 200-300KB（gzip 后约 60-80KB）到 bundle 中。

**缓解措施**：
- TutorialEditor 使用 `React.lazy()` 按需加载，不影响首屏
- TutorialDetail 需要直接加载（SEO/首屏渲染），但扩展集较小

---

## 验证方式

安装后执行：

```bash
npm run typecheck     # 确保类型正确
npm run build         # 确保构建通过
```
