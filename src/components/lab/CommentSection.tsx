import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Reply, Trash2, Send } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import { fetchComments, createComment, deleteComment } from '../../lib/commentService';
import type { Comment } from '../../lib/commentService';

interface CommentSectionProps {
  tutorialId: string;
}

export default function CommentSection({ tutorialId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, profile, isAdmin } = useAuth();

  const loadComments = useCallback(async () => {
    try {
      const data = await fetchComments(tutorialId);
      setComments(data);
    } catch {
      // 静默
    } finally {
      setLoading(false);
    }
  }, [tutorialId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setSubmitting(true);
    try {
      await createComment(tutorialId, user.id, content.trim(), replyTo?.id);
      setContent('');
      setReplyTo(null);
      await loadComments();
    } catch {
      // 发表失败
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('确定删除这条评论？')) return;
    try {
      await deleteComment(commentId);
      await loadComments();
    } catch {
      // 删除失败
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} 天前`;
    return d.toLocaleDateString('zh-CN');
  }

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);

  return (
    <div className="mt-10 pt-6 border-t border-apple-gray-200">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-apple-gray-600 mb-6">
        <MessageCircle size={20} />
        评论 {totalCount > 0 && <span className="text-sm font-normal text-apple-gray-400">({totalCount})</span>}
      </h3>

      {/* 评论输入 */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-apple-gray-400">
              <Reply size={14} />
              回复 <span className="text-apple-blue">{replyTo.username}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-apple-gray-300 hover:text-apple-gray-500 ml-1"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-medium ${
              isAdmin ? 'bg-apple-blue text-white' : 'bg-apple-gray-300 text-white'
            }`}>
              {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={replyTo ? `回复 ${replyTo.username}...` : '写下你的评论...'}
                rows={2}
                className="w-full px-4 py-3 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:bg-white resize-none transition-all"
              />
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="absolute right-3 bottom-3 p-1.5 bg-apple-blue text-white rounded-lg disabled:opacity-30 hover:bg-apple-blue-hover transition-all"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 px-4 py-4 bg-apple-gray-100 rounded-xl text-center">
          <p className="text-sm text-apple-gray-400">登录后即可发表评论</p>
        </div>
      )}

      {/* 评论列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-apple-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-apple-gray-200 rounded w-24" />
                <div className="h-4 bg-apple-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-apple-gray-400 text-center py-8">暂无评论，来抢沙发吧 ✌️</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAdmin={isAdmin}
              currentUserId={user?.id}
              onReply={(id, username) => setReplyTo({ id, username })}
              onDelete={handleDelete}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────
// 评论项
// ────────────────────────────────────────

function CommentItem({
  comment, isAdmin, currentUserId, onReply, onDelete, formatTime, isReply = false,
}: {
  comment: Comment;
  isAdmin: boolean;
  currentUserId?: string;
  onReply: (id: string, username: string) => void;
  onDelete: (id: string) => void;
  formatTime: (d: string) => string;
  isReply?: boolean;
}) {
  const username = (comment.profiles as { username: string })?.username ?? '用户';
  const canDelete = isAdmin || comment.user_id === currentUserId;

  return (
    <div className={isReply ? 'ml-11' : ''}>
      <div className="flex gap-3 group">
        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-medium bg-apple-gray-300 text-white`}>
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-apple-gray-600">{username}</span>
            <span className="text-xs text-apple-gray-300">{formatTime(comment.created_at)}</span>
          </div>
          <p className="text-sm text-apple-gray-500 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onReply(comment.id, username)}
              className="flex items-center gap-1 text-xs text-apple-gray-400 hover:text-apple-blue transition-colors"
            >
              <Reply size={12} /> 回复
            </button>
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-apple-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} /> 删除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              formatTime={formatTime}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
