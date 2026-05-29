# Phase 5：用户系统 + 评论 + 阅读记录

> **状态**：✅ 已完成
> **执行时间**：2026-05-28

---

## 变更汇总

### 数据库 Migration

#### Migration: `create_zlcggb_comments`

```sql
CREATE TABLE zlcggb_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID NOT NULL REFERENCES zlcggb_tutorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES zlcggb_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zlcggb_comments_tutorial ON zlcggb_comments(tutorial_id);
CREATE INDEX idx_zlcggb_comments_user ON zlcggb_comments(user_id);

ALTER TABLE zlcggb_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zlcggb_comments_public_read" ON zlcggb_comments
  FOR SELECT USING (true);

CREATE POLICY "zlcggb_comments_user_insert" ON zlcggb_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "zlcggb_comments_delete" ON zlcggb_comments
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE TRIGGER trigger_zlcggb_comments_updated_at
  BEFORE UPDATE ON zlcggb_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_zlcggb_tutorials_updated_at();
```

#### Migration: `create_zlcggb_reading_history`

```sql
CREATE TABLE zlcggb_reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id UUID NOT NULL REFERENCES zlcggb_tutorials(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tutorial_id)
);

CREATE INDEX idx_zlcggb_reading_history_user ON zlcggb_reading_history(user_id);

ALTER TABLE zlcggb_reading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zlcggb_reading_history_user_select" ON zlcggb_reading_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "zlcggb_reading_history_user_insert" ON zlcggb_reading_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

### 前端文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| MODIFY | `src/lib/useAuth.ts` | 增加 `signUp`、`profile`（username/avatar_url） |
| MODIFY | `src/components/Layout.tsx` | 导航栏用户入口（登录按钮 / 头像下拉菜单） |
| MODIFY | `src/components/LabPage.tsx` | 删除重复 LoginModal，简化管理员按钮 |
| MODIFY | `src/components/lab/LoginModal.tsx` | 登录+注册双 Tab |
| MODIFY | `src/components/lab/TutorialDetail.tsx` | 评论区 + 阅读历史记录 |
| NEW | `src/lib/commentService.ts` | 评论 CRUD 服务 |
| NEW | `src/components/lab/CommentSection.tsx` | 评论组件（发表/回复/删除） |

---

### 关键设计决策

1. **登录入口在导航栏**：全站可见，不限于 `/lab` 页面
2. **登录+注册合一弹窗**：Tab 切换，减少组件数量
3. **评论一级嵌套**：支持回复，但只做一层（避免过深嵌套影响可读性）
4. **阅读记录自动写入**：登录用户访问教程时 upsert 到数据库，UNIQUE 约束防重复
5. **评论删除权限**：用户删自己的，admin 可删所有（RLS 层面强制）
6. **错误信息不泄露细节**：登录/注册失败用通用提示

### 验证结果

- `npm run typecheck` → 零错误 ✅
