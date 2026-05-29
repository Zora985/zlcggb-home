import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { fetchTutorials, fetchCategories, CATEGORIES } from '../lib/tutorialService';
import type { Tutorial } from '../lib/tutorialService';
import TutorialCard from './lab/TutorialCard';
import CategoryFilter from './lab/CategoryFilter';
import SearchBar from './lab/SearchBar';

export default function LabPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([...CATEGORIES]);
  const [isVisible, setIsVisible] = useState(false);

  const { isAdmin } = useAuth();

  // 入场动画
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 加载分类
  useEffect(() => {
    fetchCategories().then((cats) => {
      // 合并预设分类和已使用分类
      const merged = [...new Set([...CATEGORIES, ...cats])];
      setCategories(merged);
    }).catch(() => {
      // 使用预设分类
    });
  }, []);

  // 加载教程列表
  const loadTutorials = useCallback(async (pageNum: number, replace: boolean) => {
    setLoading(true);
    try {
      const result = await fetchTutorials({
        category: category || undefined,
        search: search || undefined,
        page: pageNum,
      });
      setTutorials((prev) => replace ? result.tutorials : [...prev, ...result.tutorials]);
      setHasMore(result.hasMore);
    } catch {
      // 静默处理
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  // 分类或搜索变化时重新加载
  useEffect(() => {
    setPage(1);
    loadTutorials(1, true);
  }, [loadTutorials]);

  // 搜索防抖
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 加载更多
  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadTutorials(nextPage, false);
  }

  return (
    <div className="min-h-screen bg-apple-gray-100 py-24">
      <div className="max-w-[980px] mx-auto px-6">
        {/* Hero */}
        <div className={`text-center mb-12 transition-all duration-1000 ease-apple ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <p className="text-apple-gray-500 text-sm font-medium tracking-wide mb-4">
            技术实验室
          </p>
          <h1 className="text-5xl md:text-6xl font-semibold text-apple-gray-600 tracking-tight mb-4">
            教程与文章
          </h1>
          <p className="text-xl text-apple-gray-500 max-w-2xl mx-auto mb-6">
            分享我的学习笔记和技术心得，帮助更多人入门全栈开发
          </p>

          {/* 管理员发布按钮 */}
          {isAdmin && (
            <Link
              to="/lab/editor"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-apple-blue text-white text-sm font-medium rounded-full hover:bg-apple-blue-hover transition-colors duration-300"
            >
              <Plus size={16} />
              发布新教程
            </Link>
          )}
        </div>

        {/* 搜索 + 分类筛选 */}
        <div className={`mb-8 space-y-4 transition-all duration-1000 delay-100 ease-apple ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <SearchBar value={searchInput} onChange={setSearchInput} />
          <CategoryFilter
            categories={categories}
            selected={category}
            onSelect={setCategory}
          />
        </div>

        {/* 教程网格 */}
        <div className={`transition-all duration-1000 delay-200 ease-apple ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {tutorials.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutorials.map((t) => (
                  <TutorialCard key={t.id} tutorial={t} />
                ))}
              </div>

              {/* 加载更多 */}
              {hasMore && (
                <div className="text-center mt-10">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="apple-button apple-button-secondary text-sm"
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </button>
                </div>
              )}
            </>
          ) : loading ? (
            /* 加载骨架屏 */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="apple-card overflow-hidden animate-pulse">
                  <div className="aspect-[16/9] bg-apple-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-apple-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-apple-gray-200 rounded w-full" />
                    <div className="h-3 bg-apple-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 空状态 */
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-apple-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="text-apple-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-apple-gray-600 mb-2">
                {search || category ? '没有找到匹配的教程' : '暂无教程'}
              </h3>
              <p className="text-sm text-apple-gray-400 mb-6">
                {search || category ? '试试其他关键词或分类' : '教程正在准备中，敬请期待'}
              </p>
              {(search || category) && (
                <button
                  onClick={() => { setSearchInput(''); setCategory(''); }}
                  className="apple-button apple-button-secondary text-sm"
                >
                  清除筛选
                </button>
              )}
            </div>
          )}
        </div>

        {/* 底部特色说明 */}
        {tutorials.length > 0 && (
          <div className={`grid md:grid-cols-3 gap-6 mt-16 transition-all duration-1000 delay-300 ease-apple ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {[
              { emoji: '🎯', title: '实战导向', desc: '每篇教程都来自真实项目经验' },
              { emoji: '🔄', title: '持续更新', desc: '定期更新新内容，记录学习心得' },
              { emoji: '💬', title: '互动交流', desc: '欢迎留言讨论，一起进步' },
            ].map((item, index) => (
              <div key={index} className="apple-card p-6 text-center">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h4 className="font-semibold text-apple-gray-600 mb-1">{item.title}</h4>
                <p className="text-xs text-apple-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* 底部 CTA */}
        <div className={`mt-12 transition-all duration-1000 delay-400 ease-apple ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="apple-card p-8 md:p-10 text-center bg-apple-gray-600">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="text-apple-blue" size={20} />
              <h3 className="text-2xl font-semibold text-white">
                开始你的全栈之旅
              </h3>
            </div>
            <p className="text-apple-gray-300 mb-6 max-w-md mx-auto text-sm">
              从机械到代码，我走过的路，希望能帮你少走弯路
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
