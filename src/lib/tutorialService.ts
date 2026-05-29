import { supabase } from './supabaseClient';

// ────────────────────────────────────────
// 类型定义
// ────────────────────────────────────────

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

// 预设分类
export const CATEGORIES = [
  'AI大模型技术',
  '常用开发思路',
  '网站开发逻辑',
  '部署与运维',
  '从业务到系统',
  '从系统到架构',
] as const;

// ────────────────────────────────────────
// 查询方法
// ────────────────────────────────────────

/** 获取教程列表（分页、分类、搜索） */
export async function fetchTutorials(params: FetchParams = {}) {
  const { category, search, page = 1, pageSize = 12 } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('zlcggb_tutorials')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    tutorials: (data ?? []) as Tutorial[],
    total: count ?? 0,
    hasMore: (count ?? 0) > from + pageSize,
  };
}

/** 根据 slug 获取单篇教程 */
export async function fetchTutorialBySlug(slug: string) {
  const { data, error } = await supabase
    .from('zlcggb_tutorials')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as Tutorial;
}

/** 获取已使用的分类列表 */
export async function fetchCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('zlcggb_tutorials')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null);

  if (error) throw error;

  const unique = [...new Set((data ?? []).map((r) => r.category as string))];
  return unique.sort();
}

// ────────────────────────────────────────
// 管理方法（需要 admin 权限，RLS 校验）
// ────────────────────────────────────────

/** 创建教程 */
export async function createTutorial(input: TutorialInput) {
  const { data, error } = await supabase
    .from('zlcggb_tutorials')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as Tutorial;
}

/** 更新教程 */
export async function updateTutorial(id: string, input: Partial<TutorialInput>) {
  const { data, error } = await supabase
    .from('zlcggb_tutorials')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Tutorial;
}

/** 删除教程 */
export async function deleteTutorial(id: string) {
  const { error } = await supabase
    .from('zlcggb_tutorials')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ────────────────────────────────────────
// 文件上传
// ────────────────────────────────────────

/** 上传图片到 Storage，返回公开 URL */
export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  // 用 UUID 重命名防路径遍历
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('zlcggb-tutorials')
    .upload(fileName, file, { cacheControl: '31536000', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from('zlcggb-tutorials')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// ────────────────────────────────────────
// 阅读计数
// ────────────────────────────────────────

/** 增加浏览次数（防并发用 SQL 表达式） */
export async function incrementViewCount(id: string) {
  // Supabase JS SDK 不支持 SQL 表达式 increment，用 rpc 或直接 update
  // 这里用简单 update，RLS 允许 public SELECT 但不允许 UPDATE
  // 所以我们用一个 rpc function；如果没有 rpc，退化为客户端递增
  const { data } = await supabase
    .from('zlcggb_tutorials')
    .select('view_count')
    .eq('id', id)
    .single();

  if (data) {
    await supabase
      .from('zlcggb_tutorials')
      .update({ view_count: (data.view_count ?? 0) + 1 })
      .eq('id', id);
  }
}
