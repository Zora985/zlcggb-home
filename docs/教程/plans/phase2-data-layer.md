# Phase 2：Supabase 客户端 + 数据层

> **状态**：✅ 已完成
> **执行时间**：2026-05-28

---

## 概览

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/lib/supabaseClient.ts` | ✅ 已创建 | Supabase 客户端初始化 |
| `src/lib/useAuth.ts` | ✅ 已创建 | 鉴权 Hook |
| `src/lib/tutorialService.ts` | ✅ 已创建 | 教程 CRUD 服务层 |

---

## 已创建文件

### 1. supabaseClient.ts

**路径**：`src/lib/supabaseClient.ts`
**创建时间**：2026-05-28

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**设计决策**：
- 环境变量缺失时 fail-safe 抛错，而非静默创建空客户端
- 使用 `import.meta.env`（Vite 环境变量方式）
- 不存储 token 到 localStorage（Supabase SDK 自行管理）

---

### 2. useAuth.ts

**路径**：`src/lib/useAuth.ts`
**创建时间**：2026-05-28

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkAdminRole(session.user);
      } else {
        setState({ user: null, isAdmin: false, loading: false });
      }
    });

    // 监听 Auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          checkAdminRole(session.user);
        } else {
          setState({ user: null, isAdmin: false, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminRole(user: User) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setState({
      user,
      isAdmin: data?.role === 'admin',
      loading: false,
    });
  }

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, isAdmin: false, loading: false });
  }, []);

  return { ...state, signIn, signOut };
}
```

**设计决策**：
- 通过 `profiles` 表的 `role` 字段判断 admin（与 RLS 策略一致）
- `signIn` / `signOut` 用 `useCallback` 避免不必要重渲染
- `loading: true` 初始状态，避免登录态闪烁
- 登出时主动清空状态

---

### 3. tutorialService.ts

**路径**：`src/lib/tutorialService.ts`
**创建时间**：2026-05-28

#### 数据类型定义

```typescript
export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  content_format: 'tiptap' | 'markdown';
  excerpt: string | null;
  cover_image: string | null;
  content_type: 'article' | 'video' | 'series';
  category: string | null;
  tags: string[];
  video_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  reading_time: number;
  author_id: string | null;
  series_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TutorialInput {
  title: string;
  slug: string;
  content?: string;
  content_format?: 'tiptap' | 'markdown';
  excerpt?: string;
  cover_image?: string;
  content_type?: 'article' | 'video' | 'series';
  category?: string;
  tags?: string[];
  video_url?: string;
  is_published?: boolean;
  is_featured?: boolean;
  reading_time?: number;
  author_id?: string;
  series_id?: string;
  sort_order?: number;
}

export interface FetchParams {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
```

#### 服务方法

| 方法 | 说明 | 安全考量 |
|------|------|---------|
| `fetchTutorials(params)` | 分页查询，支持分类/搜索筛选 | RLS 自动过滤未发布 |
| `fetchTutorialBySlug(slug)` | 根据 slug 获取单篇 | RLS 保护 |
| `fetchCategories()` | 获取已使用的分类列表 | 只查询已发布文章 |
| `createTutorial(data)` | 创建教程（管理员） | RLS 校验 admin role |
| `updateTutorial(id, data)` | 更新教程（管理员） | 同上 |
| `deleteTutorial(id)` | 删除教程（管理员） | 同上 |
| `uploadImage(file)` | 上传图片到 Storage | UUID 文件名防路径遍历 |
| `incrementViewCount(id)` | 增加阅读计数 | `view_count + 1` |

#### 关键设计决策

- **搜索**：使用 `ilike` 模糊匹配 title/excerpt（简单够用，不引入全文搜索）
- **分页**：`range()` 实现，默认 pageSize = 12
- **图片上传**：路径格式 `{crypto.randomUUID()}.{ext}`，防路径遍历
- **封面图 URL**：存为 Supabase Storage 公开 URL
- **阅读计数**：用 SQL 表达式 `view_count + 1` 防并发问题
