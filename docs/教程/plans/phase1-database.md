# Phase 1：数据库基础设施

> **状态**：✅ 已完成
> **执行时间**：2026-05-28
> **Supabase 项目**：`jkxjpopqbkjpevkcncrr`
> **MCP 服务器**：`supabase-yueyu`

---

## 概览

创建了 3 个 Migration，建立教程系统所需的数据库基础设施：

| Migration | 版本号 | 说明 |
|-----------|--------|------|
| `create_zlcggb_tutorials` | 20260528084711 | 教程主表 + 索引 + RLS + 触发器 |
| `create_zlcggb_tutorial_series` | 20260528084750 | 系列教程表 + 外键关联 |
| `create_zlcggb_tutorials_storage` | 20260528084836 | Storage 桶 + 上传/读取策略 |

---

## Migration 1: create_zlcggb_tutorials

### 完整 SQL

```sql
-- 教程/文章表
CREATE TABLE zlcggb_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  content_format TEXT DEFAULT 'tiptap' CHECK (content_format IN ('tiptap', 'markdown')),
  excerpt TEXT,
  cover_image TEXT,
  content_type TEXT DEFAULT 'article' CHECK (content_type IN ('article', 'video', 'series')),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  video_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  author_id UUID REFERENCES profiles(id),
  series_id UUID,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_zlcggb_tutorials_slug ON zlcggb_tutorials(slug);
CREATE INDEX idx_zlcggb_tutorials_category ON zlcggb_tutorials(category);
CREATE INDEX idx_zlcggb_tutorials_published ON zlcggb_tutorials(is_published);
CREATE INDEX idx_zlcggb_tutorials_created ON zlcggb_tutorials(created_at DESC);

-- 启用 RLS
ALTER TABLE zlcggb_tutorials ENABLE ROW LEVEL SECURITY;

-- 所有人可读已发布内容
CREATE POLICY "zlcggb_tutorials_public_read" ON zlcggb_tutorials
  FOR SELECT USING (is_published = true);

-- admin 可读所有（含草稿）
CREATE POLICY "zlcggb_tutorials_admin_read_all" ON zlcggb_tutorials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- admin 可插入
CREATE POLICY "zlcggb_tutorials_admin_insert" ON zlcggb_tutorials
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- admin 可更新
CREATE POLICY "zlcggb_tutorials_admin_update" ON zlcggb_tutorials
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- admin 可删除
CREATE POLICY "zlcggb_tutorials_admin_delete" ON zlcggb_tutorials
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_zlcggb_tutorials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_zlcggb_tutorials_updated_at
  BEFORE UPDATE ON zlcggb_tutorials
  FOR EACH ROW
  EXECUTE FUNCTION update_zlcggb_tutorials_updated_at();
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键，自动生成 |
| `title` | TEXT NOT NULL | 教程标题 |
| `slug` | TEXT UNIQUE NOT NULL | URL 友好的标识符 |
| `content` | TEXT | 教程正文（Tiptap JSON 或 Markdown） |
| `content_format` | TEXT | 内容格式：`'tiptap'` 或 `'markdown'` |
| `excerpt` | TEXT | 摘要（列表展示用） |
| `cover_image` | TEXT | 封面图 URL |
| `content_type` | TEXT | 内容类型：`'article'` / `'video'` / `'series'` |
| `category` | TEXT | 分类 |
| `tags` | TEXT[] | 标签数组 |
| `video_url` | TEXT | 外链视频（B站/YouTube） |
| `is_published` | BOOLEAN | 是否已发布 |
| `is_featured` | BOOLEAN | 是否推荐 |
| `view_count` | INTEGER | 浏览次数 |
| `reading_time` | INTEGER | 阅读时间（分钟） |
| `author_id` | UUID FK→profiles | 作者 ID |
| `series_id` | UUID FK→series | 所属系列 |
| `sort_order` | INTEGER | 系列内排序 |
| `created_at` | TIMESTAMPTZ | 创建时间 |
| `updated_at` | TIMESTAMPTZ | 更新时间（触发器自动维护） |

### RLS 策略

| 策略名 | 操作 | 条件 |
|--------|------|------|
| `zlcggb_tutorials_public_read` | SELECT | `is_published = true` |
| `zlcggb_tutorials_admin_read_all` | SELECT | `profiles.role = 'admin'` |
| `zlcggb_tutorials_admin_insert` | INSERT | `profiles.role = 'admin'` |
| `zlcggb_tutorials_admin_update` | UPDATE | `profiles.role = 'admin'` |
| `zlcggb_tutorials_admin_delete` | DELETE | `profiles.role = 'admin'` |

### 索引

| 索引名 | 字段 | 用途 |
|--------|------|------|
| `idx_zlcggb_tutorials_slug` | `slug` | slug 查询加速 |
| `idx_zlcggb_tutorials_category` | `category` | 分类筛选 |
| `idx_zlcggb_tutorials_published` | `is_published` | 发布状态过滤 |
| `idx_zlcggb_tutorials_created` | `created_at DESC` | 按时间排序 |

---

## Migration 2: create_zlcggb_tutorial_series

### 完整 SQL

```sql
-- 系列教程表
CREATE TABLE zlcggb_tutorial_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zlcggb_tutorial_series_slug ON zlcggb_tutorial_series(slug);

-- 启用 RLS
ALTER TABLE zlcggb_tutorial_series ENABLE ROW LEVEL SECURITY;

-- 所有人可读
CREATE POLICY "zlcggb_tutorial_series_public_read" ON zlcggb_tutorial_series
  FOR SELECT USING (true);

-- admin 可管理
CREATE POLICY "zlcggb_tutorial_series_admin_insert" ON zlcggb_tutorial_series
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "zlcggb_tutorial_series_admin_update" ON zlcggb_tutorial_series
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "zlcggb_tutorial_series_admin_delete" ON zlcggb_tutorial_series
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 添加 tutorials 表的外键关联
ALTER TABLE zlcggb_tutorials
  ADD CONSTRAINT fk_zlcggb_tutorials_series
  FOREIGN KEY (series_id) REFERENCES zlcggb_tutorial_series(id) ON DELETE SET NULL;
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `title` | TEXT NOT NULL | 系列标题 |
| `slug` | TEXT UNIQUE NOT NULL | URL 标识符 |
| `description` | TEXT | 系列描述 |
| `cover_image` | TEXT | 封面图 |
| `sort_order` | INTEGER | 排序 |
| `created_at` | TIMESTAMPTZ | 创建时间 |

### 关联关系

- `zlcggb_tutorials.series_id` → `zlcggb_tutorial_series.id`（ON DELETE SET NULL）

---

## Migration 3: create_zlcggb_tutorials_storage

### 完整 SQL

```sql
-- 创建教程资源存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('zlcggb-tutorials', 'zlcggb-tutorials', true);

-- 所有人可读
CREATE POLICY "zlcggb_tutorials_storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'zlcggb-tutorials');

-- admin 可上传
CREATE POLICY "zlcggb_tutorials_storage_admin_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'zlcggb-tutorials'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- admin 可删除
CREATE POLICY "zlcggb_tutorials_storage_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'zlcggb-tutorials'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
```

### Storage 策略

| 策略名 | 操作 | 条件 |
|--------|------|------|
| `zlcggb_tutorials_storage_public_read` | SELECT | `bucket_id = 'zlcggb-tutorials'` |
| `zlcggb_tutorials_storage_admin_upload` | INSERT | `bucket_id + admin role` |
| `zlcggb_tutorials_storage_admin_delete` | DELETE | `bucket_id + admin role` |

---

## 回滚方案

如需回滚，按逆序执行：

```sql
-- 3. 删除 Storage 桶及策略
DROP POLICY IF EXISTS "zlcggb_tutorials_storage_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "zlcggb_tutorials_storage_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "zlcggb_tutorials_storage_public_read" ON storage.objects;
DELETE FROM storage.buckets WHERE id = 'zlcggb-tutorials';

-- 2. 删除系列表
ALTER TABLE zlcggb_tutorials DROP CONSTRAINT IF EXISTS fk_zlcggb_tutorials_series;
DROP TABLE IF EXISTS zlcggb_tutorial_series;

-- 1. 删除教程表
DROP TRIGGER IF EXISTS trigger_zlcggb_tutorials_updated_at ON zlcggb_tutorials;
DROP FUNCTION IF EXISTS update_zlcggb_tutorials_updated_at();
DROP TABLE IF EXISTS zlcggb_tutorials;
```
