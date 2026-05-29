import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Clock, Eye, Calendar, Tag } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Mark, Extension, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useAuth } from '../../lib/useAuth';
import { fetchTutorialBySlug, incrementViewCount } from '../../lib/tutorialService';
import { supabase } from '../../lib/supabaseClient';
import type { Tutorial } from '../../lib/tutorialService';
import VideoEmbed from './VideoEmbed';
import CommentSection from './CommentSection';

const lowlight = createLowlight(common);

// 1. 自定义下划线 Mark
const CustomUnderline = Mark.create({
  name: 'underline',
  parseHTML() {
    return [
      { tag: 'u' },
      {
        style: 'text-decoration',
        consuming: false,
        getAttrs: value => (value as string).includes('underline') ? {} : false,
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['u', mergeAttributes(HTMLAttributes), 0];
  },
});

// 2. 自定义高亮 Mark
const CustomHighlight = Mark.create({
  name: 'highlight',
  addAttributes() {
    return {
      color: {
        default: '#ffe066',
        parseHTML: element => element.getAttribute('data-color') || element.style.backgroundColor,
        renderHTML: attributes => {
          if (!attributes.color) return {};
          return {
            style: `background-color: ${attributes.color}; border-radius: 4px; padding: 2px 4px;`,
            'data-color': attributes.color,
          };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'mark' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes), 0];
  },
});

// 3. 自定义段落与标题对齐属性 Extension
const CustomAlign = Extension.create({
  name: 'customAlign',
  addGlobalAttributes() {
    return [
      {
        types: ['heading', 'paragraph'],
        attributes: {
          align: {
            default: null,
            parseHTML: element => element.style.textAlign || null,
            renderHTML: attributes => {
              if (!attributes.align) return {};
              return {
                style: `text-align: ${attributes.align}`,
              };
            },
          },
        },
      },
    ];
  },
});

// 动态加载 Mermaid.js
let mermaidLoaded = false;
let mermaidLoadingPromise: Promise<any> | null = null;

function loadMermaid(): Promise<any> {
  if (mermaidLoaded) return Promise.resolve((window as any).mermaid);
  if (mermaidLoadingPromise) return mermaidLoadingPromise;

  mermaidLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js';
    script.async = true;
    script.onload = () => {
      mermaidLoaded = true;
      const mermaid = (window as any).mermaid;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
      });
      resolve(mermaid);
    };
    script.onerror = (e) => {
      reject(e);
    };
    document.body.appendChild(script);
  });

  return mermaidLoadingPromise;
}

// 解析 Markdown 表格并输出高定苹果风格 HTML Table
function renderMarkdownTable(rawText: string): string {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return '';

  const parseRow = (rowText: string) => {
    let t = rowText;
    if (t.startsWith('|')) t = t.slice(1);
    if (t.endsWith('|')) t = t.slice(0, -1);
    return t.split('|').map(cell => cell.trim());
  };

  const headerCells = parseRow(lines[0]);
  
  let dataStartIndex = 1;
  if (lines.length > 1 && lines[1].includes('-') && lines[1].includes('|')) {
    dataStartIndex = 2;
  }

  let html = `<div class="overflow-x-auto my-6 rounded-2xl border border-apple-gray-200/60 shadow-sm backdrop-blur-sm">`;
  html += `<table class="min-w-full divide-y divide-apple-gray-200 text-sm">`;
  
  html += `<thead class="bg-apple-gray-50/80"><tr>`;
  headerCells.forEach(cell => {
    html += `<th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">${cell}</th>`;
  });
  html += `</tr></thead>`;

  html += `<tbody class="divide-y divide-apple-gray-100 bg-white">`;
  for (let i = dataStartIndex; i < lines.length; i++) {
    const rowCells = parseRow(lines[i]);
    html += `<tr class="hover:bg-apple-gray-50/30 transition-colors">`;
    for (let j = 0; j < headerCells.length; j++) {
      const cellValue = rowCells[j] || '';
      const formattedValue = cellValue
        .replace(/\\/g, '') // 简单清洗转义符
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="text-xs bg-apple-gray-100 text-apple-blue px-1 py-0.5 rounded font-mono">$1</code>');
      
      html += `<td class="px-4 py-3 text-apple-gray-505 whitespace-nowrap">${formattedValue}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;

  return html;
}

export default function TutorialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState('');
  const [prevTutorial, setPrevTutorial] = useState<Pick<Tutorial, 'title' | 'slug'> | null>(null);
  const [nextTutorial, setNextTutorial] = useState<Pick<Tutorial, 'title' | 'slug'> | null>(null);

  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Image,
      LinkExtension.configure({ openOnClick: true }),
      CodeBlockLowlight.configure({ lowlight }),
      CustomUnderline,
      CustomHighlight,
      CustomAlign,
    ],
    content: '',
  });

  // 加载教程及上下联动导航
  useEffect(() => {
    if (!slug) return;

    window.scrollTo(0, 0); // 瞬间回滚到顶部以保障连贯阅读体验
    setLoading(true);
    
    // 获取当前教程
    fetchTutorialBySlug(slug)
      .then((data) => {
        setTutorial(data);

        // 增加阅读计数（sessionStorage 防重复）
        const viewKey = `viewed_${data.id}`;
        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, '1');
          incrementViewCount(data.id).catch(() => {});
        }

        // 登录用户记录阅读历史
        if (user) {
          supabase
            .from('zlcggb_reading_history')
            .upsert(
              { user_id: user.id, tutorial_id: data.id, read_at: new Date().toISOString() },
              { onConflict: 'user_id,tutorial_id' }
            )
            .then(() => {});
        }
      })
      .catch(() => {
        setError('教程不存在或已被删除');
      })
      .finally(() => {
        setLoading(false);
      });

    // 轻量级拉取所有已发布的教程列表，用于计算上一篇和下一篇
    supabase
      .from('zlcggb_tutorials')
      .select('title, slug, sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const currentIndex = data.findIndex(item => item.slug === slug);
          if (currentIndex !== -1) {
            setPrevTutorial(currentIndex > 0 ? data[currentIndex - 1] : null);
            setNextTutorial(currentIndex < data.length - 1 ? data[currentIndex + 1] : null);
          } else {
            setPrevTutorial(null);
            setNextTutorial(null);
          }
        }
      });
  }, [slug, user]);

  // 教程数据和只读 editor 都准备就绪时，安全同步内容以渲染排版，规避骨架屏组件卸载导致的竞态空白 Bug
  useEffect(() => {
    if (!editor || !tutorial?.content) return;

    try {
      const json = JSON.parse(tutorial.content);
      editor.commands.setContent(json);
    } catch {
      // 兼容可能存在的非 JSON 纯文本
      editor.commands.setContent(tutorial.content);
    }

    // 渲染排版完成后，提取并绑定 H1, H2, H3 的 ID 锚点，并处理表格与 Mermaid 图表
    requestAnimationFrame(async () => {
      const proseContainer = document.querySelector('.prose');
      if (!proseContainer) return;

      const elements = proseContainer.querySelectorAll('h1, h2, h3');
      const list: { id: string; text: string; level: number }[] = [];
      elements.forEach((el, index) => {
        const id = `heading-${index}`;
        el.setAttribute('id', id);
        list.push({
          id,
          text: el.textContent || '',
          level: parseInt(el.tagName[1]),
        });
      });
      setHeadings(list);

      // 后处理 1: 表格 (language-table) 渲染替换
      const codeBlocks = proseContainer.querySelectorAll('pre code');
      codeBlocks.forEach((codeEl) => {
        const preEl = codeEl.parentElement;
        if (!preEl) return;
        const isTable = codeEl.classList.contains('language-table') || preEl.getAttribute('data-language') === 'table';
        if (isTable) {
          const rawText = codeEl.textContent || '';
          const htmlTable = renderMarkdownTable(rawText);
          if (htmlTable) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlTable;
            preEl.replaceWith(tempDiv.firstElementChild!);
          }
        }
      });

      // 后处理 2: Mermaid 流程图异步渲染替换
      const mermaidBlocks: HTMLElement[] = [];
      const activeCodeBlocks = proseContainer.querySelectorAll('pre code');
      activeCodeBlocks.forEach((codeEl) => {
        const preEl = codeEl.parentElement;
        if (!preEl) return;
        const isMermaid = codeEl.classList.contains('language-mermaid') || preEl.getAttribute('data-language') === 'mermaid';
        if (isMermaid) {
          mermaidBlocks.push(preEl);
        }
      });

      if (mermaidBlocks.length > 0) {
        try {
          const mermaid = await loadMermaid();
          for (let i = 0; i < mermaidBlocks.length; i++) {
            const preEl = mermaidBlocks[i];
            const codeEl = preEl.querySelector('code');
            const codeText = codeEl ? codeEl.textContent || '' : '';
            if (codeText.trim()) {
              const uniqueId = `mermaid-${Date.now()}-${i}`;
              const mermaidDiv = document.createElement('div');
              mermaidDiv.className = 'mermaid my-6 flex justify-center bg-apple-gray-50/50 p-4 rounded-2xl border border-apple-gray-200/40 overflow-x-auto';
              
              const { svg } = await mermaid.render(uniqueId, codeText);
              mermaidDiv.innerHTML = svg;
              preEl.replaceWith(mermaidDiv);
            }
          }
        } catch (err) {
          // 捕获异常
        }
      }
    });
  }, [editor, tutorial]);

  // 监听正文滚动，自动高亮大纲目录（Scrollspy 效果）
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180; // 考虑了顶栏高度和偏置距离

      let currentActiveId = '';
      for (let i = 0; i < headings.length; i++) {
        const el = document.getElementById(headings[i].id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            currentActiveId = headings[i].id;
          } else {
            break;
          }
        }
      }

      if (!currentActiveId && headings.length > 0) {
        currentActiveId = headings[0].id;
      }

      setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headings]);

  // 加载态
  if (loading) {
    return (
      <div className="min-h-screen bg-apple-gray-100 py-24">
        <div className="max-w-[720px] mx-auto px-6 animate-pulse">
          <div className="h-4 bg-apple-gray-200 rounded w-20 mb-8" />
          <div className="h-8 bg-apple-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-apple-gray-200 rounded w-1/3 mb-8" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-apple-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 错误态
  if (error || !tutorial) {
    return (
      <div className="min-h-screen bg-apple-gray-100 py-24">
        <div className="max-w-[720px] mx-auto px-6 text-center py-20">
          <h2 className="text-2xl font-semibold text-apple-gray-600 mb-4">
            {error || '教程未找到'}
          </h2>
          <Link
            to="/lab"
            className="inline-flex items-center gap-2 text-apple-blue hover:text-apple-blue-hover transition-colors"
          >
            <ArrowLeft size={16} /> 返回教程列表
          </Link>
        </div>
      </div>
    );
  }

  const publishDate = new Date(tutorial.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-apple-gray-100 py-24 relative">
      {/* 左侧大纲目录栏 (飞书文档风格) */}
      {headings.length > 0 && (
        <div className="fixed left-[calc(50%-550px)] top-40 w-52 hidden xl:block select-none z-10 max-h-[calc(100vh-240px)] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[10px] font-bold text-apple-gray-400 uppercase tracking-wider mb-4 pl-3">目录大纲</p>
          <div className="relative border-l border-apple-gray-200/60 ml-3 flex flex-col gap-1 text-xs">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => {
                  const el = document.getElementById(heading.id);
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }
                }}
                style={{ paddingLeft: `${(heading.level - 1) * 12 + 12}px` }}
                className={`w-full text-left py-1.5 rounded-r-lg transition-all duration-200 border-l-2 -ml-[1.5px] ${
                  activeId === heading.id
                    ? 'border-apple-blue text-apple-blue font-semibold bg-apple-blue/5'
                    : 'border-transparent text-apple-gray-400 hover:text-apple-gray-600 hover:bg-apple-gray-200/50'
                }`}
              >
                <span className="line-clamp-2">{heading.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="max-w-[720px] mx-auto px-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/lab')}
            className="inline-flex items-center gap-1 text-sm text-apple-gray-400 hover:text-apple-blue transition-colors"
          >
            <ArrowLeft size={16} /> 返回列表
          </button>

          {isAdmin && (
            <Link
              to={`/lab/editor/${tutorial.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-apple-gray-200 text-apple-gray-600 text-sm font-medium rounded-full hover:bg-apple-blue hover:text-white transition-all duration-300"
            >
              <Edit3 size={14} /> 编辑
            </Link>
          )}
        </div>

        {/* 视频（仅视频教程） */}
        {tutorial.content_type === 'video' && tutorial.video_url && (
          <div className="mb-8">
            <VideoEmbed url={tutorial.video_url} />
          </div>
        )}

        {/* 元信息 */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-apple-gray-400 mb-4">
          {tutorial.category && (
            <Link
              to={`/lab?category=${encodeURIComponent(tutorial.category)}`}
              className="px-2.5 py-0.5 bg-apple-blue/10 text-apple-blue rounded-md hover:bg-apple-blue/20 transition-colors"
            >
              {tutorial.category}
            </Link>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={14} /> {publishDate}
          </span>
          {tutorial.reading_time > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={14} /> {tutorial.reading_time} 分钟阅读
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye size={14} /> {tutorial.view_count} 次阅读
          </span>
        </div>

        {/* 标题 */}
        <h1 className="text-3xl md:text-4xl font-bold text-apple-gray-600 tracking-tight mb-8 leading-tight">
          {tutorial.title}
        </h1>

        {/* 封面图 */}
        {tutorial.cover_image && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img
              src={tutorial.cover_image}
              alt={tutorial.title}
              className="w-full"
              loading="lazy"
            />
          </div>
        )}

        {/* Tiptap 内容渲染 */}
        <div className="prose prose-lg max-w-none
          prose-headings:text-apple-gray-600 prose-headings:font-semibold
          prose-p:text-apple-gray-500 prose-p:leading-relaxed
          prose-a:text-apple-blue prose-a:no-underline hover:prose-a:underline
          prose-code:text-apple-blue prose-code:bg-apple-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
          prose-pre:bg-apple-gray-600 prose-pre:rounded-xl prose-pre:text-sm
          prose-img:rounded-xl
          prose-blockquote:border-apple-blue prose-blockquote:text-apple-gray-500
          prose-li:text-apple-gray-500
          prose-strong:text-apple-gray-600
        ">
          <EditorContent editor={editor} />
        </div>

        {/* 标签 */}
        {tutorial.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-apple-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={14} className="text-apple-gray-400" />
              {tutorial.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-apple-gray-100 text-apple-gray-500 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 上一章 / 下一章 导航卡片 (苹果风格毛玻璃) */}
        {(prevTutorial || nextTutorial) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 mb-8">
            {prevTutorial ? (
              <Link
                to={`/lab/${prevTutorial.slug}`}
                className="group p-5 rounded-2xl glass border border-apple-gray-200/50 hover:bg-white/85 hover:scale-[1.01] hover:shadow-sm transition-all duration-300 flex flex-col justify-between text-left"
              >
                <span className="text-[10px] font-bold text-apple-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 group-hover:-translate-x-1 transition-transform duration-300">
                  ← 上一章
                </span>
                <span className="text-sm font-semibold text-apple-gray-500 group-hover:text-apple-blue transition-colors line-clamp-2">
                  {prevTutorial.title}
                </span>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}

            {nextTutorial && (
              <Link
                to={`/lab/${nextTutorial.slug}`}
                className="group p-5 rounded-2xl glass border border-apple-gray-200/50 hover:bg-white/85 hover:scale-[1.01] hover:shadow-sm transition-all duration-300 flex flex-col justify-between text-right items-end ml-auto w-full"
              >
                <span className="text-[10px] font-bold text-apple-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
                  下一章 →
                </span>
                <span className="text-sm font-semibold text-apple-gray-500 group-hover:text-apple-blue transition-colors line-clamp-2">
                  {nextTutorial.title}
                </span>
              </Link>
            )}
          </div>
        )}

        {/* 评论区 */}
        <CommentSection tutorialId={tutorial.id} />

        {/* 返回列表 */}
        <div className="mt-10 pt-6 border-t border-apple-gray-200 text-center">
          <Link
            to="/lab"
            className="inline-flex items-center gap-2 text-apple-blue hover:text-apple-blue-hover transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> 返回教程列表
          </Link>
        </div>
      </div>
    </div>
  );
}
