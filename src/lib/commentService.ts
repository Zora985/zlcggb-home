import { supabase } from './supabaseClient';

export interface Comment {
  id: string;
  tutorial_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // JOIN 字段
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

/** 获取教程的评论列表（含用户信息） */
export async function fetchComments(tutorialId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('zlcggb_comments')
    .select('*, profiles:user_id!zlcggb_comments_user_id_profiles_fkey(username, avatar_url)')
    .eq('tutorial_id', tutorialId)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const topLevel = (data ?? []) as Comment[];

  // 加载回复
  if (topLevel.length > 0) {
    const { data: replies } = await supabase
      .from('zlcggb_comments')
      .select('*, profiles:user_id!zlcggb_comments_user_id_profiles_fkey(username, avatar_url)')
      .eq('tutorial_id', tutorialId)
      .not('parent_id', 'is', null)
      .order('created_at', { ascending: true });

    if (replies) {
      const replyMap = new Map<string, Comment[]>();
      for (const r of replies as Comment[]) {
        const pid = r.parent_id!;
        if (!replyMap.has(pid)) replyMap.set(pid, []);
        replyMap.get(pid)!.push(r);
      }
      for (const c of topLevel) {
        c.replies = replyMap.get(c.id) ?? [];
      }
    }
  }

  return topLevel;
}

/** 发表评论 */
export async function createComment(tutorialId: string, userId: string, content: string, parentId?: string) {
  const { data, error } = await supabase
    .from('zlcggb_comments')
    .insert({
      tutorial_id: tutorialId,
      user_id: userId,
      content,
      parent_id: parentId ?? null,
    })
    .select('*, profiles:user_id!zlcggb_comments_user_id_profiles_fkey(username, avatar_url)')
    .single();

  if (error) throw error;
  return data as Comment;
}

/** 删除评论 */
export async function deleteComment(id: string) {
  const { error } = await supabase
    .from('zlcggb_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
