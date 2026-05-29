# Phase 3：前端页面组件

> **状态**：✅ 已完成
> **执行时间**：2026-05-28
> **依赖**：Phase 2（tutorialService.ts）+ Phase 4（Tiptap 依赖）

---

## 概览

| 操作 | 文件 | 说明 |
|------|------|------|
| MODIFY | `src/App.tsx` | 新增 3 条路由 |
| MODIFY | `src/components/LabPage.tsx` | 完全重写为教程列表页 |
| NEW | `src/components/lab/TutorialCard.tsx` | 教程卡片 |
| NEW | `src/components/lab/TutorialDetail.tsx` | 教程详情页 |
| NEW | `src/components/lab/TutorialEditor.tsx` | Tiptap 富文本编辑器 |
| NEW | `src/components/lab/CategoryFilter.tsx` | 分类筛选 |
| NEW | `src/components/lab/SearchBar.tsx` | 搜索组件 |
| NEW | `src/components/lab/VideoEmbed.tsx` | 视频嵌入 |
| NEW | `src/components/lab/LoginModal.tsx` | 登录弹窗 |

---

## 1. App.tsx 路由修改

**变更范围**：在现有 `/lab` 路由之后，新增 3 条子路由。

```tsx
// 新增 import
import { lazy, Suspense } from 'react';
import TutorialDetail from './components/lab/TutorialDetail';
const TutorialEditor = lazy(() => import('./components/lab/TutorialEditor'));

// 路由表新增（在 <Route path="/lab" .../> 之后）
<Route path="/lab/:slug" element={<TutorialDetail />} />
<Route path="/lab/editor" element={
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
    <TutorialEditor />
  </Suspense>
} />
<Route path="/lab/editor/:id" element={
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
    <TutorialEditor />
  </Suspense>
} />
```

**注意**：
- `/lab/editor` 路由必须放在 `/lab/:slug` **前面**，否则 `editor` 会被当作 slug
- TutorialEditor 使用 `React.lazy` 按需加载，因为 Tiptap 体积较大
- `_redirects` 无需修改，`/* /index.html 200` 已覆盖

---

## 2. LabPage.tsx 重写

**当前状态**：静态飞书文档引导页（指向 `doyd60gw42.feishu.cn`）
**目标**：完整的教程列表页

### 页面结构

```
┌──────────────────────────────────────┐
│ Hero 区域                            │
│ - 副标题: 技术实验室                   │
│ - 主标题: 教程与文章                   │
│ - 描述文字                            │
│ - 管理员: 「发布新教程」按钮           │
├──────────────────────────────────────┤
│ SearchBar + CategoryFilter           │
├──────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │ Card │ │ Card │ │ Card │  ← 网格   │
│ └──────┘ └──────┘ └──────┘          │
│ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │ Card │ │ Card │ │ Card │          │
│ └──────┘ └──────┘ └──────┘          │
├──────────────────────────────────────┤
│ 加载更多 / 空状态提示                 │
└──────────────────────────────────────┘
```

### 状态管理

```typescript
const [tutorials, setTutorials] = useState<Tutorial[]>([]);
const [category, setCategory] = useState('');        // 空 = 全部
const [search, setSearch] = useState('');             // 防抖 300ms
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [loading, setLoading] = useState(true);
const [categories, setCategories] = useState<string[]>([]);
const { isAdmin } = useAuth();
```

### 数据流

1. 页面加载 → `fetchCategories()` + `fetchTutorials({ page: 1 })`
2. 切换分类 → 重置 page=1，重新 `fetchTutorials`
3. 搜索输入 → 防抖 300ms → 重置 page=1，重新 `fetchTutorials`
4. 加载更多 → page++，追加数据

---

## 3. TutorialCard.tsx

### Props

```typescript
interface TutorialCardProps {
  tutorial: Tutorial;
}
```

### UI 构成

- **封面图区域**：
  - 有图 → `<img>` 展示
  - 无图 → 分类色块 + 分类名
  - 右上角：内容类型标记（🎬 视频 / 📝 文章）
- **内容区域**：
  - 标题（line-clamp-2）
  - 摘要（line-clamp-3，灰色小字）
- **底部信息**：
  - 分类标签（pill 样式）
  - 阅读时间（`{n} 分钟`）
  - 浏览次数（`{n} 次阅读`）

### 响应式

```css
/* 网格（在 LabPage 中控制） */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

### 交互

- 整个卡片可点击 → `<Link to={/lab/${tutorial.slug}}>`
- hover → 沿用 `apple-card` 上浮效果

---

## 4. TutorialDetail.tsx

### 路由

`/lab/:slug`

### 功能清单

1. 从 URL 提取 `slug` → `fetchTutorialBySlug(slug)`
2. 页面加载时调用 `incrementViewCount(id)`（仅访客首次，用 sessionStorage 防重复）
3. Tiptap 只读渲染（`useEditor` + `editable: false`）
4. 视频教程 → 顶部嵌入 `<VideoEmbed url={tutorial.video_url} />`
5. 管理员可见「编辑」按钮 → 导航到 `/lab/editor/${id}`
6. 标签可点击 → 导航回 `/lab?category=xxx`
7. 返回按钮 → 回到列表

### 页面结构

```
┌──────────────────────────────────────┐
│ 返回列表                     [编辑]   │
├──────────────────────────────────────┤
│ [VideoEmbed]  ← 仅视频类型           │
├──────────────────────────────────────┤
│ 分类标签  ·  发布日期  ·  阅读时间     │
│                                      │
│ 标题（H1）                           │
│                                      │
│ Tiptap 渲染区域                      │
│ ...                                  │
│                                      │
├──────────────────────────────────────┤
│ 标签列表                             │
├──────────────────────────────────────┤
│ ← 上一篇          下一篇 →           │
└──────────────────────────────────────┘
```

### Tiptap 渲染配置

```typescript
const editor = useEditor({
  editable: false,
  extensions: [
    StarterKit.configure({
      codeBlock: false, // 用 CodeBlockLowlight 替代
    }),
    Image,
    Link.configure({ openOnClick: true }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
  ],
  content: JSON.parse(tutorial.content),
});
```

### 安全考量

- Tiptap JSON 渲染不使用 `dangerouslySetInnerHTML`
- 视频 URL 通过 VideoEmbed 白名单校验
- `incrementViewCount` 用 sessionStorage 防刷

---

## 5. TutorialEditor.tsx

### 路由

- `/lab/editor` — 新建
- `/lab/editor/:id` — 编辑

### 权限控制

```typescript
const { user, isAdmin, loading } = useAuth();
const [showLogin, setShowLogin] = useState(false);

// 未登录 → 显示 LoginModal
if (!loading && !user) return <LoginModal isOpen onClose={() => navigate('/lab')} />;

// 非 admin → 提示无权限
if (!loading && !isAdmin) return <NoPermission />;
```

### 编辑器工具栏

| 工具 | Tiptap 方法 |
|------|------------|
| H1/H2/H3 | `toggleHeading({ level })` |
| 加粗 | `toggleBold()` |
| 斜体 | `toggleItalic()` |
| 删除线 | `toggleStrike()` |
| 有序列表 | `toggleOrderedList()` |
| 无序列表 | `toggleBulletList()` |
| 代码块 | `toggleCodeBlock()` |
| 引用 | `toggleBlockquote()` |
| 链接 | `toggleLink({ href })` |
| 图片 | 文件上传 → `uploadImage()` → `setImage({ src })` |
| 分割线 | `setHorizontalRule()` |

### 表单字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | input text | ✅ | 教程标题 |
| slug | input text | ✅ | 自动从标题生成（中文 pinyin 或手动输入） |
| category | select | ❌ | 下拉，预设 6 个分类 |
| tags | tag input | ❌ | Enter 添加，× 删除 |
| excerpt | textarea | ❌ | 摘要 |
| cover_image | file upload | ❌ | 封面图 |
| content_type | radio | ❌ | article / video |
| video_url | input url | ❌ | content_type=video 时显示 |
| is_published | toggle | ❌ | 发布/草稿 |
| is_featured | toggle | ❌ | 推荐开关 |

### 预设分类

```typescript
const CATEGORIES = [
  'AI大模型技术',
  '常用开发思路',
  '网站开发逻辑',
  '部署与运维',
  '从业务到系统',
  '从系统到架构',
];
```

### 保存逻辑

```typescript
async function handleSave() {
  const content = JSON.stringify(editor.getJSON());
  const textLength = editor.getText().length;
  const reading_time = Math.max(1, Math.ceil(textLength / 400));

  const data: TutorialInput = {
    title, slug, content, content_format: 'tiptap',
    excerpt, cover_image, content_type, category,
    tags, video_url, is_published, is_featured,
    reading_time, author_id: user.id,
  };

  if (editingId) {
    await updateTutorial(editingId, data);
  } else {
    await createTutorial(data);
  }

  navigate(`/lab/${slug}`);
}
```

---

## 6. CategoryFilter.tsx

### Props

```typescript
interface CategoryFilterProps {
  categories: string[];
  selected: string;          // 空字符串 = 全部
  onSelect: (category: string) => void;
}
```

### UI

- 水平滚动 pill 标签
- 首个为「全部」
- 选中态：`bg-apple-blue text-white rounded-full`
- 默认态：`bg-white text-apple-gray-500 border`
- 切换有 `scale(1.05)` 微动画

---

## 7. SearchBar.tsx

### Props

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}
```

### UI

- 圆角搜索框 + 🔍 图标
- 输入时右侧显示 × 清除按钮
- placeholder: `"搜索教程..."`
- 苹果风格：`bg-apple-gray-100 rounded-xl`

---

## 8. VideoEmbed.tsx

### Props

```typescript
interface VideoEmbedProps {
  url: string;
}
```

### URL 解析逻辑

```typescript
function parseVideoUrl(url: string): { platform: 'bilibili' | 'youtube' | null; id: string } {
  // B站
  const bvMatch = url.match(/bilibili\.com\/video\/(BV\w+)/);
  if (bvMatch) return { platform: 'bilibili', id: bvMatch[1] };

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };

  return { platform: null, id: '' };
}
```

### 渲染

- B站 → `<iframe src="//player.bilibili.com/player.html?bvid={id}&autoplay=0" />`
- YouTube → `<iframe src="//www.youtube.com/embed/{id}" />`
- 未识别 → 显示外链按钮

### 安全

- iframe `sandbox="allow-scripts allow-same-origin allow-popups"`
- URL 白名单（只允许 bilibili.com / youtube.com 域名）
- `allow="autoplay; encrypted-media"` 最小权限

---

## 9. LoginModal.tsx

### Props

```typescript
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### 功能

- 邮箱 + 密码表单
- 调用 `useAuth().signIn(email, password)`
- 错误提示：通用 "登录失败，请检查邮箱和密码" 信息（不泄露具体原因）
- 登录成功 → 自动关闭
- 点击遮罩层 → 关闭
- ESC 键 → 关闭
- 加载态：按钮 loading spinner

---

## 执行顺序

```
1. CategoryFilter.tsx  ← 无依赖，最简单
2. SearchBar.tsx       ← 无依赖
3. VideoEmbed.tsx      ← 无依赖
4. LoginModal.tsx      ← 依赖 useAuth
5. TutorialCard.tsx    ← 依赖 Tutorial 类型
6. LabPage.tsx         ← 依赖上述所有组件 + tutorialService
7. TutorialDetail.tsx  ← 依赖 tutorialService + Tiptap + VideoEmbed
8. TutorialEditor.tsx  ← 依赖 tutorialService + Tiptap + LoginModal
9. App.tsx             ← 最后更新路由
```
