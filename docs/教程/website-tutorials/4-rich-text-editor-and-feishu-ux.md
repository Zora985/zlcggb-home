# 打造飞书级编辑器：富文本 WYSIWYG 与交互设计实战

在前三章中，我们完成了网站从"设计思维"到"线上部署"的全流程。但对于一个技术博客来说，核心竞争力在于**写作体验**——你的文章编辑器用起来是否像飞书文档一样丝滑？

本章将拆解如何基于 **Tiptap**（一个基于 ProseMirror 的 React 富文本编辑器框架）打造一个"所见即所得"的写作体验，并以飞书文档为参考标杆，逐步实现表格编辑、Mermaid 思维导图预览和智能超链接交互。

---

## 一、 编辑器选型：为什么选 Tiptap？

在 React 生态中，主流的富文本编辑器有：

| 编辑器 | 特点 | 适用场景 |
| :--- | :--- | :--- |
| **Tiptap** | 基于 ProseMirror，模块化扩展，完全可控 | 需要深度定制的产品级编辑器 |
| **Slate.js** | 底层抽象灵活，但上手曲线陡 | 需要从零构建独特编辑体验 |
| **TinyMCE** | 开箱即用，功能全面，但定制受限 | 传统 CMS 后台管理 |
| **Quill** | 轻量易用，但扩展能力有限 | 简单的评论框或留言板 |

我们选择 **Tiptap**，因为它的核心哲学与 React 组件化思想高度一致：
*   **一切皆扩展 (Extension)**：加粗、斜体、链接、表格，每个功能都是一个独立的可插拔模块。
*   **Schema 驱动**：文档结构由 Schema 定义，数据是纯 JSON，天然适合存入 Supabase。
*   **与 React 深度集成**：`@tiptap/react` 提供 `useEditor` Hook，状态管理与 React 生态无缝衔接。

### 基础安装

```bash
# 核心包
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image

# 代码高亮
npm install @tiptap/extension-code-block-lowlight lowlight

# 可视化表格
npm install @tiptap/extension-table
```

---

## 二、 飞书式行首「+」菜单：快捷插入组件

飞书文档中，当你的光标处于空行时，行首会浮现一个淡灰色的 **+** 按钮。点击后展开一个卡片菜单，可以快速插入标题、列表、表格、代码块等区块。

### 1. 核心设计思路

```
  光标在空行上？
       │
       ▼
  ┌─────────────┐
  │  显示 + 按钮  │  ← 绝对定位，跟随光标行
  └──────┬──────┘
         │ 点击
         ▼
  ┌─────────────────────────┐
  │   快捷插入卡片菜单        │
  │  ┌─────┬─────┬─────┐   │
  │  │ H1  │ H2  │ H3  │   │  ← 基础排版
  │  ├─────┴─────┴─────┤   │
  │  │ 📋 表格           │   │
  │  │ 🔀 思维导图        │   │  ← 快捷组件
  │  │ 🖼️ 图片           │   │
  │  │ 🔗 超链接          │   │
  │  └─────────────────┘   │
  └─────────────────────────┘
```

### 2. 关键技术点

**空行检测**：监听 Tiptap 的 `selectionUpdate` 事件，判断当前行是否为空段落：
```typescript
const checkPlusButton = useCallback(() => {
  if (!editor) return;
  const { $from } = editor.state.selection;
  const node = $from.parent;
  // 空段落 = 段落节点且文本内容为空
  if (node.type.name === 'paragraph' && node.textContent === '') {
    // 获取 DOM 位置，显示 + 按钮
    const dom = editor.view.domAtPos($from.pos);
    const rect = (dom.node as HTMLElement).getBoundingClientRect();
    setPlusPos({ top: rect.top - editorRect.top, left: -32 });
    setShowPlus(true);
  }
}, [editor]);
```

**智能方向判定**：当 + 按钮在屏幕底部时，菜单向上展开，避免超出视窗：
```typescript
const spaceBelow = window.innerHeight - btnAbsoluteTop;
const menuTop = spaceBelow < 400
  ? plusPos.top - 380  // 向上展开
  : plusPos.top + 28;  // 向下展开
```

---

## 三、 可视化表格编辑

### 1. 从 Markdown 代码块到原生 Table

最初的实现方案是把表格当做 `code block` 存储 Markdown 文本：

```
| 表头 1 | 表头 2 |
| --- | --- |
| 数据 1 | 数据 2 |
```

这种方案的致命问题：**编辑器中看到的是纯文本，不是表格**。用户无法直觉地增删行列。

改进方案：使用 Tiptap 原生的 `Table` 扩展：

```typescript
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';

const editor = useEditor({
  extensions: [
    // ...其他扩展
    Table.configure({
      resizable: true,     // 允许拖拽调整列宽
      handleWidth: 5,      // 拖拽手柄宽度
      cellMinWidth: 80,    // 单元格最小宽度
    }),
    TableRow,
    TableHeader,
    TableCell,
  ],
});
```

### 2. 表格操作浮动工具栏

当用户点击表格内任意单元格时，在表格上方浮现操作工具栏：

```
  ←插列  插列→  ↑插行  插行↓  │  删列  删行  │  删表
```

关键实现：
```typescript
// 动态定位到当前表格上方
const tableEl = editorContainer.querySelector('table');
const tableRect = tableEl.getBoundingClientRect();
const editorRect = editorContainer.getBoundingClientRect();
const toolbarTop = tableRect.top - editorRect.top - 40;
```

---

## 四、 Mermaid 思维导图：代码编辑 + 实时预览

飞书文档中插入流程图、思维导图，编辑器会同时显示源码和渲染后的图形。我们用 **Mermaid.js** 实现类似效果。

### 设计方案

```
  ┌──────────────────────────────────┐
  │  graph TD                        │
  │    A[核心概念] --> B[分支一]       │  ← 代码块（可编辑）
  │    A --> C[分支二]                │
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐
  │         ┌─────────┐             │
  │         │ 核心概念  │             │
  │         └────┬────┘             │  ← 实时 SVG 预览
  │        ┌─────┴─────┐            │
  │   ┌────┴───┐  ┌────┴───┐       │
  │   │ 分支一  │  │ 分支二  │       │
  │   └────────┘  └────────┘       │
  └──────────────────────────────────┘
```

### 关键实现

```typescript
// 600ms 防抖渲染，避免频繁重绘
const debouncedRender = () => {
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(async () => {
    // 1. 找到所有 language-mermaid 的代码块
    const preElements = container.querySelectorAll('pre[data-language="mermaid"]');
    
    // 2. 动态加载 Mermaid.js（首次使用时才加载，节省带宽）
    if (!window.mermaid) {
      await loadMermaidScript();
    }
    
    // 3. 在每个代码块下方插入/更新预览 div
    for (const preEl of preElements) {
      const codeText = preEl.querySelector('code')?.textContent;
      const { svg } = await mermaid.render(uniqueId, codeText);
      previewDiv.innerHTML = svg;
    }
  }, 600);
};
```

---

## 五、 飞书式智能超链接

### 1. 链接文字的视觉标识

链接文字必须在编辑器中**清晰可辨**，飞书的做法是蓝色文字 + 半透明下划线：

```css
.ProseMirror a {
  color: #0071E3;
  text-decoration: underline;
  text-decoration-color: rgba(0, 113, 227, 0.3);
  text-underline-offset: 3px;
}
```

### 2. 鼠标悬停浮出操作条

飞书文档中，鼠标悬停在链接上约 1-2 秒后，会浮出一个操作条：

```
  ┌───────────────────────────────────┐
  │  https://example.com  │ ✏️ │ 🔗 │ ↗ │
  └───────────────────────────────────┘
       URL 预览         编辑  取消  打开
```

核心代码（基于 `mouseover` 事件 + 延迟触发）：
```typescript
proseDom.addEventListener('mouseover', (e) => {
  const linkEl = (e.target as HTMLElement).closest('a');
  if (linkEl) {
    hoverTimer = setTimeout(() => {
      const linkRect = linkEl.getBoundingClientRect();
      setLinkBubble({
        url: linkEl.getAttribute('href'),
        top: linkRect.bottom + 6,
        left: linkRect.left,
      });
    }, 1500); // 1.5 秒后显示
  }
});
```

### 3. 链接边界保护

一个容易被忽略的细节：在链接文字末尾继续输入时，新字符不应该成为链接的一部分。这是通过 Tiptap Link 扩展的 `autolink: false` 配置实现的：

```typescript
LinkExtension.configure({
  openOnClick: false,   // 编辑器中点击不跳转
  autolink: false,      // 关闭自动链接检测，同时关闭链接边界扩展
})
```

### 4. 空选区安全插入

当用户没有选中任何文字时插入链接，弹窗需要同时提供"链接文本"和"URL"两个输入框，并使用 Tiptap 标准 API 安全插入：

```typescript
// ❌ 危险做法：拼接 raw HTML（XSS 风险）
editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run();

// ✅ 安全做法：通过 Tiptap 结构化 API 插入
editor.chain().focus()
  .insertContent({
    type: 'text',
    text: displayText,
    marks: [{ type: 'link', attrs: { href: url, target: '_blank' } }],
  })
  .run();
```

---

## 六、 本章总结与架构回顾

完成本章后，你的编辑器已具备以下能力矩阵：

| 功能 | 实现方式 | 交互参考 |
| :--- | :--- | :--- |
| **行首快捷菜单** | `selectionUpdate` 空行检测 + 绝对定位 | 飞书文档 + 按钮 |
| **可视化表格** | `@tiptap/extension-table` 原生扩展 | 飞书/Notion 表格 |
| **Mermaid 预览** | 代码块 + 动态加载 mermaid.js + SVG 渲染 | 飞书代码块预览 |
| **智能超链接** | 悬停操作条 + 边界保护 + 安全插入 | 飞书链接气泡 |

在下一章中，我们将探索更高阶的话题：
*   编辑器数据持久化：如何将 Tiptap 的 JSON 内容存入 Supabase；
*   图片上传与 CDN 加速：让文章中的配图飞速加载；
*   SEO 优化：让搜索引擎爱上你的技术博客。

线上见！
