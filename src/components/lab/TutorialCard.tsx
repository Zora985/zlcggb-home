import { Link } from 'react-router-dom';
import { Clock, Eye, Play, FileText } from 'lucide-react';
import type { Tutorial } from '../../lib/tutorialService';

interface TutorialCardProps {
  tutorial: Tutorial;
}

/** 分类对应的渐变色 */
const CATEGORY_COLORS: Record<string, string> = {
  'AI大模型技术': 'from-violet-500 to-purple-600',
  '常用开发思路': 'from-blue-500 to-cyan-600',
  '网站开发逻辑': 'from-emerald-500 to-teal-600',
  '部署与运维': 'from-orange-500 to-amber-600',
  '从业务到系统': 'from-pink-500 to-rose-600',
  '从系统到架构': 'from-indigo-500 to-blue-600',
};

export default function TutorialCard({ tutorial }: TutorialCardProps) {
  const gradient = CATEGORY_COLORS[tutorial.category ?? ''] ?? 'from-gray-500 to-gray-600';

  return (
    <Link to={`/lab/${tutorial.slug}`} className="block group">
      <div className="apple-card overflow-hidden h-full flex flex-col">
        {/* 封面图 */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {tutorial.cover_image ? (
            <img
              src={tutorial.cover_image}
              alt={tutorial.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-apple"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-white/80 text-4xl">
                {tutorial.content_type === 'video' ? '🎬' : '📝'}
              </span>
            </div>
          )}

          {/* 类型标记 */}
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
              {tutorial.content_type === 'video' ? (
                <><Play size={12} /> 视频</>
              ) : (
                <><FileText size={12} /> 文章</>
              )}
            </span>
          </div>

          {/* 推荐标记 */}
          {tutorial.is_featured && (
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 bg-apple-blue text-white text-xs font-medium rounded-lg">
                推荐
              </span>
            </div>
          )}
        </div>

        {/* 内容 */}
        <div className="flex-1 flex flex-col p-5">
          <h3 className="text-base font-semibold text-apple-gray-600 mb-2 line-clamp-2 group-hover:text-apple-blue transition-colors duration-300">
            {tutorial.title}
          </h3>

          {tutorial.excerpt && (
            <p className="text-sm text-apple-gray-400 line-clamp-2 mb-4 flex-1">
              {tutorial.excerpt}
            </p>
          )}

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-xs text-apple-gray-400 mt-auto pt-3 border-t border-apple-gray-100">
            <div className="flex items-center gap-3">
              {tutorial.category && (
                <span className="px-2 py-0.5 bg-apple-gray-100 rounded-md text-apple-gray-500">
                  {tutorial.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {tutorial.reading_time > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {tutorial.reading_time} 分钟
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye size={12} /> {tutorial.view_count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
