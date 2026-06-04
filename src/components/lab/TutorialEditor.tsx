import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Eye, EyeOff, Image as ImageIcon, Link2, Code,
  Bold, Italic, Strikethrough, List, ListOrdered, Quote, Heading1,
  Heading2, Heading3, Minus, Star, X, Loader2, Settings2, Upload,
  Copy, Check, Wind, Terminal, Type, Table, GitFork,
  Trash2, ArrowDown as ArrowDownIcon, ArrowUp as ArrowUpIcon,
  ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  ExternalLink, Pencil, Unlink,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Mark, Extension, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table as TableExtension, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { common, createLowlight } from 'lowlight';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../lib/useAuth';
import {
  createTutorial, updateTutorial, uploadImage, CATEGORIES,
  fetchTutorialBySlug,
} from '../../lib/tutorialService';
import type { Tutorial } from '../../lib/tutorialService';
import LoginModal from './LoginModal';
import { Markdown } from '@tiptap/markdown';
import { looksLikeMarkdown } from '../../utils/markdownPaste';

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
  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleMark(this.name),
      'Mod-U': () => this.editor.commands.toggleMark(this.name),
    };
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

// 对齐方式 SVG 图标组件
function AlignIcon({ type }: { type: 'left' | 'center' | 'right' }) {
  if (type === 'center') return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>;
  if (type === 'right') return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="10" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="14" y2="18"></line></svg>;
  return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="14" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="10" y1="18" x2="3" y2="18"></line></svg>;
}

/** 从标题生成 slug */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `tutorial-${Date.now()}`;
}

export default function TutorialEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();

  // 表单
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [contentType, setContentType] = useState<'article' | 'video'>('article');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // UI
  const [saving, setSaving] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loadingTutorial, setLoadingTutorial] = useState(!!id);
  const [coverUploading, setCoverUploading] = useState(false);
  const [existingTutorial, setExistingTutorial] = useState<Tutorial | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // ── 新增状态 ──
  const [showSlash, setShowSlash] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const [zenMode, setZenMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [hoveredPre, setHoveredPre] = useState<HTMLPreElement | null>(null);
  const [copiedPre, setCopiedPre] = useState<HTMLPreElement | null>(null);
  const [copyBtnStyle, setCopyBtnStyle] = useState<React.CSSProperties>({ display: 'none' });
  const [activeSubMenu, setActiveSubMenu] = useState<'none' | 'title' | 'align' | 'color'>('none');
  const [showPlus, setShowPlus] = useState(false);
  const [plusPos, setPlusPos] = useState({ top: 0, left: 0 });
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [plusMenuPos, setPlusMenuPos] = useState({ top: 0, left: 0 });
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [linkTextInput, setLinkTextInput] = useState('');

  // 链接悬浮条
  const [linkBubble, setLinkBubble] = useState<{ url: string; text: string; top: number; left: number } | null>(null);
  const currentLinkEl = useRef<HTMLAnchorElement | null>(null);
  const [linkEditRange, setLinkEditRange] = useState<{ from: number; to: number } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);



  // ── 解决 Tiptap 闭包问题的 Refs ──
  const showSlashRef = useRef(showSlash);
  showSlashRef.current = showSlash;
  const slashQueryRef = useRef(slashQuery);
  slashQueryRef.current = slashQuery;
  const selectedSlashIndexRef = useRef(selectedSlashIndex);
  selectedSlashIndexRef.current = selectedSlashIndex;
  const showPlusMenuRef = useRef(showPlusMenu);
  showPlusMenuRef.current = showPlusMenu;
  const filteredCommandsRef = useRef<any[]>([]);

  // 用 ref 桥接 editor 实例，解决 handleEditorImage ↔ useEditor 循环依赖
  const editorInstanceRef = useRef<ReturnType<typeof useEditor>>(null);

  // 图片上传到编辑器 — 乐观插入：blob 预览 → 后台上传 → 替换真实 URL
  const handleEditorImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const ed = editorInstanceRef.current;
    if (!ed) return;

    // 1. 立即插入本地 blob 预览（用户零延迟看到图片）
    const blobUrl = URL.createObjectURL(file);
    ed.chain().focus().setImage({ src: blobUrl }).run();

    // 2. 后台上传到存储
    setUploadingImage(true);
    try {
      const realUrl = await uploadImage(file);
      // 3. 上传成功 → 找到 blob 节点，替换为真实 URL
      const { state } = ed;
      const { tr } = state;
      state.doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === blobUrl) {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: realUrl });
        }
      });
      ed.view.dispatch(tr);
    } catch {
      // 4. 上传失败 → 移除占位图
      const { state } = ed;
      const { tr } = state;
      let deletePos = -1;
      state.doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === blobUrl) {
          deletePos = pos;
        }
      });
      if (deletePos >= 0) {
        const node = state.doc.nodeAt(deletePos);
        if (node) tr.delete(deletePos, deletePos + node.nodeSize);
        ed.view.dispatch(tr);
      }
    } finally {
      URL.revokeObjectURL(blobUrl);
      setUploadingImage(false);
    }
  }, []);



  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, link: false }),
      ImageExtension.configure({ allowBase64: false }),
      LinkExtension.extend({ inclusive: false }).configure({ openOnClick: false, autolink: false }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return '标题';
          return '输入内容，或按 / 调出命令菜单...';
        },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      TableExtension.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 80,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CustomUnderline,
      CustomHighlight,
      CustomAlign,
      Markdown,
    ],
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[400px] pb-24',
      },
      // 粘贴：图片优先 → Markdown 文本检测 → 默认行为
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        // 1. 图片粘贴（最高优先级）
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) handleEditorImage(file);
            return true;
          }
        }

        // 2. Markdown 文本粘贴检测
        // 只要纯文本包含 Markdown 语法特征（≥2 种），就用 @tiptap/markdown 原生解析
        const plainText = event.clipboardData?.getData('text/plain') || '';

        if (plainText && looksLikeMarkdown(plainText)) {
          event.preventDefault();
          const ed = editorInstanceRef.current;
          if (ed) {
            // 预处理：转换编辑器不支持的 Markdown 语法
            const processed = plainText
              // 引用块内的 checkbox 列表 → 引用块内的 emoji 段落
              // > - [ ] text  →  > ☐ text
              // > - [x] text  →  > ✅ text
              .replace(/^(>\s*)[-*+]\s+\[[ /]\]\s+/gm, '$1☐ ')
              .replace(/^(>\s*)[-*+]\s+\[[xX]\]\s+/gm, '$1✅ ')
              // 引用块内的普通列表 → 引用块内的 emoji 段落
              .replace(/^(>\s*)[-*+]\s+/gm, '$1• ')
              // 非引用块内的 checkbox → 普通列表
              .replace(/^(\s*)[-*+]\s+\[[ /]\]\s+/gm, '$1- ')
              .replace(/^(\s*)[-*+]\s+\[[xX]\]\s+/gm, '$1- ')
              // GitHub 提示框标记 → 加粗文本
              .replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/gm,
                (_match, type) => `**${type}**`);
            try {
              ed.commands.insertContent(processed, {
                contentType: 'markdown',
              });
            } catch (e) {
              // 降级：拆段插入，跳过报错的段落
              console.warn('[Markdown paste] 解析失败，尝试分段插入', e);
              const paragraphs = processed.split(/\n\n+/);
              for (const p of paragraphs) {
                try {
                  ed.commands.insertContent(p.trim() + '\n\n', {
                    contentType: 'markdown',
                  });
                } catch {
                  // 跳过报错段落，插入为纯文本
                  ed.commands.insertContent(p.trim() + '\n\n');
                }
              }
            }
          }
          return true;
        }

        return false;
      },
      // 拖拽图片
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleEditorImage(file);
            return true;
          }
        }
        return false;
      },
      // 监听快捷键和键盘拦截
      handleKeyDown: (_view, event) => {
        if (event.key === 'Escape') {
          let handled = false;
          if (showSlashRef.current) {
            setShowSlash(false);
            handled = true;
          }
          if (showPlusMenuRef.current) {
            setShowPlusMenu(false);
            handled = true;
          }
          if (handled) {
            event.preventDefault();
            return true;
          }
        }
        if (showSlashRef.current) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedSlashIndex((prev) => (prev + 1) % filteredCommandsRef.current.length);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedSlashIndex((prev) => (prev - 1 + filteredCommandsRef.current.length) % filteredCommandsRef.current.length);
            return true;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            const cmd = filteredCommandsRef.current[selectedSlashIndexRef.current];
            if (cmd) {
              handleSlashCommand(cmd);
            }
            return true;
          }
        }
      },
    },
    content: '',
  });

  // 同步 editor 实例到 ref，供 handleEditorImage 等提前定义的回调使用
  editorInstanceRef.current = editor;

  // 选区更新时自动收起格式化二级子菜单
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      setActiveSubMenu('none');
    };
    editor.on('selectionUpdate', handler);
    return () => {
      editor.off('selectionUpdate', handler);
    };
  }, [editor]);

  // ── 飞书式链接悬浮条：鼠标悬停延迟触发 ──
  // 使用 editorRef DOM 查询代替 editor.view.dom，避免编辑器未挂载时访问 view 导致崩溃
  useEffect(() => {
    if (!editor) return;
    const proseDom = editorRef.current?.querySelector('.ProseMirror') as HTMLElement | null;
    if (!proseDom) return;

    let hoverTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMouseOver = (e: Event) => {
      const target = (e as MouseEvent).target as HTMLElement;
      const linkEl = target.tagName === 'A' ? target : target.closest('a');

      if (linkEl && proseDom.contains(linkEl)) {
        const href = linkEl.getAttribute('href');
        if (!href) return;

        // 清除之前的定时器
        if (hoverTimer) clearTimeout(hoverTimer);
        if (hideTimer) clearTimeout(hideTimer);

        // 1.5 秒后显示悬浮条
        hoverTimer = setTimeout(() => {
          if (editorRef.current) {
            const editorRect = editorRef.current.getBoundingClientRect();
            const linkRect = linkEl.getBoundingClientRect();
            currentLinkEl.current = linkEl as HTMLAnchorElement;
            setLinkBubble({
              url: href,
              text: linkEl.textContent || '',
              top: linkRect.bottom - editorRect.top + 6,
              left: linkRect.left - editorRect.left,
            });
          }
        }, 1500);
      }
    };

    const handleMouseOut = (e: Event) => {
      const me = e as MouseEvent;
      const target = me.target as HTMLElement;
      const relatedTarget = me.relatedTarget as HTMLElement | null;

      // 如果鼠标移到了悬浮条上，不隐藏
      if (relatedTarget?.closest('.link-bubble-bar')) return;

      const linkEl = target.tagName === 'A' ? target : target.closest('a');
      if (linkEl) {
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        // 延迟隐藏
        hideTimer = setTimeout(() => {
          const bubbleEl = document.querySelector('.link-bubble-bar');
          if (bubbleEl && bubbleEl.matches(':hover')) return;
          setLinkBubble(null);
        }, 300);
      }
    };

    proseDom.addEventListener('mouseover', handleMouseOver);
    proseDom.addEventListener('mouseout', handleMouseOut);

    return () => {
      proseDom.removeEventListener('mouseover', handleMouseOver);
      proseDom.removeEventListener('mouseout', handleMouseOut);
      if (hoverTimer) clearTimeout(hoverTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [editor]);

  // ── 飞书式段落与标题转换辅助 ──
  const getCurrentBlockTypeLabel = () => {
    if (!editor) return '正文';
    if (editor.isActive('heading', { level: 1 })) return '一级标题';
    if (editor.isActive('heading', { level: 2 })) return '二级标题';
    if (editor.isActive('heading', { level: 3 })) return '三级标题';
    return '正文';
  };

  const blockTypes = [
    { label: '正文', value: 'paragraph', active: () => editor?.isActive('paragraph') && !editor?.isActive('heading'), action: () => editor?.chain().focus().setParagraph().run() },
    { label: '一级标题', value: 'h1', active: () => editor?.isActive('heading', { level: 1 }), action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: '二级标题', value: 'h2', active: () => editor?.isActive('heading', { level: 2 }), action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: '三级标题', value: 'h3', active: () => editor?.isActive('heading', { level: 3 }), action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
  ];

  const handleSetBlockType = (type: typeof blockTypes[0]) => {
    type.action();
    setActiveSubMenu('none');
  };


  // Slash 命令列表
  const slashCommands = [
    { icon: <Heading1 size={15} />, label: '大标题', desc: '一级标题', action: (ed: any) => ed.chain().focus().toggleHeading({ level: 1 }).run() },
    { icon: <Heading2 size={15} />, label: '中标题', desc: '二级标题', action: (ed: any) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: <Heading3 size={15} />, label: '小标题', desc: '三级标题', action: (ed: any) => ed.chain().focus().toggleHeading({ level: 3 }).run() },
    { icon: <List size={15} />, label: '无序列表', desc: '项目符号列表', action: (ed: any) => ed.chain().focus().toggleBulletList().run() },
    { icon: <ListOrdered size={15} />, label: '有序列表', desc: '数字序号列表', action: (ed: any) => ed.chain().focus().toggleOrderedList().run() },
    { icon: <Quote size={15} />, label: '引用', desc: '苹果高质感引用块', action: (ed: any) => ed.chain().focus().toggleBlockquote().run() },
    { icon: <Terminal size={15} />, label: '代码块', desc: 'Mac 终端风格代码块', action: (ed: any) => ed.chain().focus().toggleCodeBlock().run() },
    { icon: <ImageIcon size={15} />, label: '图片', desc: '插入或拖拽图片', action: (_ed: any) => triggerImageUpload() },
    { icon: <Minus size={15} />, label: '分割线', desc: '水平分割横线', action: (ed: any) => ed.chain().focus().setHorizontalRule().run() },
  ];

  // 计算过滤后的 Slash 命令
  const filteredCommands = useMemo(() => {
    if (!slashQuery) return slashCommands;
    const q = slashQuery.toLowerCase();
    return slashCommands.filter(
      (cmd) => cmd.label.toLowerCase().includes(q) || cmd.desc.toLowerCase().includes(q)
    );
  }, [slashQuery]);

  // 同步过滤的命令数组到 Ref，防止键盘拦截闭包抓取旧状态
  useEffect(() => {
    filteredCommandsRef.current = filteredCommands;
  }, [filteredCommands]);

  // 处理 Slash 命令触发
  const handleSlashCommand = useCallback((cmd: typeof slashCommands[0]) => {
    if (!editor) return;
    const queryLength = slashQueryRef.current.length;
    const { from } = editor.state.selection;

    // 删除编辑器里输入的 / 及其后面的查询字符
    editor.chain().focus().deleteRange({
      from: from - (queryLength + 1),
      to: from,
    }).run();

    cmd.action(editor);
    setShowSlash(false);
    setSlashQuery('');
  }, [editor]);

  // 正则检测光标之前的 / 输入
  const checkSlashQuery = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;

    if (!selection.empty) {
      setShowSlash(false);
      return;
    }

    const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '\n');
    const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9\u4e00-\u9fff]*)$/);

    if (match) {
      const query = match[1];
      setSlashQuery(query);
      setSelectedSlashIndex(0); // 每次过滤词变化都将选中重置为第 0 个项

      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const containerRect = editorRef.current?.getBoundingClientRect();
          if (containerRect) {
            setSlashPos({
              top: rect.bottom - containerRect.top + 4,
              left: rect.left - containerRect.left,
            });
            setShowSlash(true);
          }
        }
      });
    } else {
      setShowSlash(false);
      setSlashQuery('');
    }
  }, [editor]);

  // 检查是否显示加号按钮
  const checkPlusButton = useCallback(() => {
    if (!editor) {
      setShowPlus(false);
      setShowPlusMenu(false);
      return;
    }
    const { selection } = editor.state;
    if (!selection.empty) {
      setShowPlus(false);
      setShowPlusMenu(false);
      return;
    }
    const { $from } = selection;
    const isParagraph = $from.parent.type.name === 'paragraph';
    const isEmpty = $from.parent.textContent === '';

    if (isParagraph && isEmpty) {
      const nodeDOM = editor.view.nodeDOM($from.before()) as HTMLElement;
      if (nodeDOM && editorRef.current) {
        const editorRect = editorRef.current.getBoundingClientRect();
        const nodeRect = nodeDOM.getBoundingClientRect();
        
        // 苹果风格设计：微动效加号居中对齐空行
        setPlusPos({
          top: nodeRect.top - editorRect.top + (nodeRect.height - 24) / 2,
          left: -32, // 编辑器内容左侧悬浮 32px
        });
        setShowPlus(true);
      } else {
        setShowPlus(false);
        setShowPlusMenu(false);
      }
    } else {
      setShowPlus(false);
      setShowPlusMenu(false);
    }
  }, [editor]);

  // 绑定事件到 Tiptap 上，监听更新
  useEffect(() => {
    if (!editor) return;

    const handler = () => {
      checkSlashQuery();
      checkPlusButton();
    };

    editor.on('update', handler);
    editor.on('selectionUpdate', handler);
    editor.on('focus', handler);

    return () => {
      editor.off('update', handler);
      editor.off('selectionUpdate', handler);
      editor.off('focus', handler);
    };
  }, [editor, checkSlashQuery, checkPlusButton]);

  // ── Mermaid 实时预览 ──
  useEffect(() => {
    if (!editor || !editorRef.current) return;

    let mermaidInstance: any = null;
    let renderTimeout: ReturnType<typeof setTimeout>;

    const renderMermaidPreviews = async () => {
      const container = editorRef.current;
      if (!container) return;

      const preElements = container.querySelectorAll('pre[data-language="mermaid"]');
      
      if (preElements.length === 0) {
        // 清理所有预览
        container.querySelectorAll('.editor-mermaid-preview').forEach(el => el.remove());
        return;
      }

      // 动态加载 Mermaid
      if (!mermaidInstance) {
        try {
          const script = document.createElement('script');
          if (!(window as any).mermaid) {
            await new Promise<void>((resolve, reject) => {
              script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js';
              script.async = true;
              script.onload = () => {
                (window as any).mermaid.initialize({
                  startOnLoad: false,
                  theme: 'neutral',
                  securityLevel: 'loose',
                });
                resolve();
              };
              script.onerror = () => reject();
              document.body.appendChild(script);
            });
          }
          mermaidInstance = (window as any).mermaid;
        } catch {
          return;
        }
      }

      // 逐一渲染预览
      for (let i = 0; i < preElements.length; i++) {
        const preEl = preElements[i] as HTMLElement;
        const codeEl = preEl.querySelector('code');
        const codeText = codeEl?.textContent?.trim() || '';

        // 查找或创建预览 div
        let previewDiv = preEl.nextElementSibling as HTMLElement | null;
        if (!previewDiv || !previewDiv.classList.contains('editor-mermaid-preview')) {
          previewDiv = document.createElement('div');
          previewDiv.className = 'editor-mermaid-preview';
          preEl.after(previewDiv);
        }

        if (!codeText) {
          previewDiv.innerHTML = '<span style="color:#86868b;font-size:12px;">输入 Mermaid 语法后自动预览</span>';
          continue;
        }

        try {
          const uniqueId = `editor-mermaid-${Date.now()}-${i}`;
          const { svg } = await mermaidInstance.render(uniqueId, codeText);
          previewDiv.innerHTML = svg;
        } catch {
          previewDiv.innerHTML = '<span style="color:#ff5f56;font-size:12px;">⚠ Mermaid 语法错误</span>';
        }
      }

      // 清理多余的预览 div（如果 pre 已被删除）
      container.querySelectorAll('.editor-mermaid-preview').forEach(el => {
        const prev = el.previousElementSibling;
        if (!prev || prev.tagName !== 'PRE' || (prev as HTMLElement).getAttribute('data-language') !== 'mermaid') {
          el.remove();
        }
      });
    };

    const debouncedRender = () => {
      clearTimeout(renderTimeout);
      renderTimeout = setTimeout(renderMermaidPreviews, 600);
    };

    editor.on('update', debouncedRender);

    // 初始渲染
    debouncedRender();

    return () => {
      editor.off('update', debouncedRender);
      clearTimeout(renderTimeout);
      // 清理预览
      editorRef.current?.querySelectorAll('.editor-mermaid-preview').forEach(el => el.remove());
    };
  }, [editor]);

  // 监听鼠标在编辑器内的移动，高亮 Pre 代码块并显示复制按钮
  useEffect(() => {
    const container = editorRef.current;
    if (!container) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const pre = target.closest('pre');
      if (pre && container.contains(pre)) {
        setHoveredPre(pre);
      } else {
        setHoveredPre(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredPre(null);
    };

    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor]);

  // 计算复制按钮应该在 pre 右上角相对位置
  useEffect(() => {
    if (!hoveredPre || !editorRef.current) {
      setCopyBtnStyle({ display: 'none' });
      return;
    }
    const preRect = hoveredPre.getBoundingClientRect();
    const containerRect = editorRef.current.getBoundingClientRect();

    setCopyBtnStyle({
      position: 'absolute',
      top: preRect.top - containerRect.top + 8,
      right: containerRect.right - preRect.right + 12,
      zIndex: 10,
    });
  }, [hoveredPre]);

  // 一键复制代码块内容
  const handleCopyCode = useCallback(async (pre: HTMLPreElement) => {
    const codeEl = pre.querySelector('code');
    if (!codeEl) return;
    try {
      await navigator.clipboard.writeText(codeEl.textContent || '');
      setCopiedPre(pre);
      setTimeout(() => setCopiedPre(null), 2000);
    } catch (e) {
      // 捕获权限等错误
    }
  }, []);

  // 点击外部关闭 slash 菜单
  useEffect(() => {
    if (showSlash) {
      const handler = () => {
        setShowSlash(false);
        setSlashQuery('');
      };
      setTimeout(() => document.addEventListener('click', handler), 0);
      return () => document.removeEventListener('click', handler);
    }
  }, [showSlash]);

  // 点击外部关闭加号悬浮菜单
  useEffect(() => {
    if (showPlusMenu) {
      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.editor-plus-btn') && !target.closest('.editor-plus-menu')) {
          setShowPlusMenu(false);
        }
      };
      setTimeout(() => document.addEventListener('click', handler), 0);
      return () => document.removeEventListener('click', handler);
    }
  }, [showPlusMenu]);

  // 编辑模式：加载已有教程
  useEffect(() => {
    if (!id || !editor) return;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    setLoadingTutorial(true);
    const loadData = async () => {
      try {
        let tutorial: Tutorial;
        if (isUUID) {
          const { supabase } = await import('../../lib/supabaseClient');
          const { data, error } = await supabase
            .from('zlcggb_tutorials')
            .select('*')
            .eq('id', id)
            .single();
          if (error) throw error;
          tutorial = data as Tutorial;
        } else {
          tutorial = await fetchTutorialBySlug(id);
        }

        setExistingTutorial(tutorial);
        setTitle(tutorial.title);
        setSlug(tutorial.slug);
        setSlugManual(true);
        setExcerpt(tutorial.excerpt ?? '');
        setCategory(tutorial.category ?? '');
        setTags(tutorial.tags ?? []);
        setCoverImage(tutorial.cover_image ?? '');
        setContentType(tutorial.content_type === 'video' ? 'video' : 'article');
        setVideoUrl(tutorial.video_url ?? '');
        setIsPublished(tutorial.is_published);
        setIsFeatured(tutorial.is_featured);

        if (tutorial.content) {
          try {
            editor.commands.setContent(JSON.parse(tutorial.content));
          } catch {
            editor.commands.setContent(tutorial.content);
          }
        }
      } catch {
        // 加载失败
      } finally {
        setLoadingTutorial(false);
      }
    };
    loadData();
  }, [id, editor]);

  // 标题 → slug
  useEffect(() => {
    if (!slugManual && title) setSlug(generateSlug(title));
  }, [title, slugManual]);

  // 标签
  function handleAddTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  }

  // 封面图上传（支持文件选择和粘贴）
  async function handleCoverFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setCoverUploading(true);
    try {
      const url = await uploadImage(file);
      setCoverImage(url);
    } catch {
      // 失败
    } finally {
      setCoverUploading(false);
    }
  }

  // 封面区域粘贴监听
  function handleCoverPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleCoverFile(file);
        return;
      }
    }
  }

  // 封面拖拽
  function handleCoverDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleCoverFile(file);
  }

  // 触发图片上传
  function triggerImageUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleEditorImage(file);
    };
    input.click();
  }

  // 链接
  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrlInput(previousUrl || '');
    // 如果选区为空，需要显示链接文本输入框
    const isEmptySelection = editor.state.selection.empty;
    setLinkTextInput(isEmptySelection ? '' : '');
    setLinkModalOpen(true);
  }, [editor]);

  // 保存
  async function handleSave() {
    if (!title.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      const content = editor ? JSON.stringify(editor.getJSON()) : '';
      const textLength = editor ? editor.getText().length : 0;
      const reading_time = Math.max(1, Math.ceil(textLength / 400));

      const data = {
        title: title.trim(),
        slug: slug.trim(),
        content,
        content_format: 'tiptap' as const,
        excerpt: excerpt.trim() || undefined,
        cover_image: coverImage || undefined,
        content_type: contentType,
        category: category || undefined,
        tags,
        video_url: contentType === 'video' ? videoUrl : undefined,
        is_published: isPublished,
        is_featured: isFeatured,
        reading_time,
        author_id: user?.id,
      };

      if (existingTutorial) {
        await updateTutorial(existingTutorial.id, data);
      } else {
        await createTutorial(data);
      }
      navigate(`/lab/${slug}`);
    } catch {
      // 保存失败
    } finally {
      setSaving(false);
    }
  }

  // ── 编辑器实时目录提取（hooks 必须在所有 early return 之前） ──
  const [editorHeadings, setEditorHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState('');

  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      const container = editorRef.current?.querySelector('.ProseMirror');
      if (!container) return;

      const elements = container.querySelectorAll('h1, h2, h3');
      const list: { id: string; text: string; level: number }[] = [];
      elements.forEach((el, index) => {
        const id = `editor-heading-${index}`;
        el.setAttribute('id', id);
        const text = el.textContent || '';
        if (text.trim()) {
          list.push({ id, text, level: parseInt(el.tagName[1]) });
        }
      });
      setEditorHeadings(list);
    };

    // 初始 + 每次内容更新时提取
    const timer = setTimeout(extractHeadings, 100);
    editor.on('update', extractHeadings);

    return () => {
      clearTimeout(timer);
      editor.off('update', extractHeadings);
    };
  }, [editor]);

  // 滚动监听 — 自动高亮当前可见标题
  useEffect(() => {
    if (editorHeadings.length === 0) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      let currentId = '';
      for (const h of editorHeadings) {
        const el = document.getElementById(h.id);
        if (el && el.offsetTop <= scrollPos) {
          currentId = h.id;
        } else {
          break;
        }
      }
      if (!currentId && editorHeadings.length > 0) currentId = editorHeadings[0].id;
      setActiveHeadingId(currentId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [editorHeadings]);

  // ── 认证 ──
  if (authLoading) {
    return <FullScreenLoader />;
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-apple-gray-100 py-24">
        <div className="max-w-[720px] mx-auto px-6 text-center py-20">
          <h2 className="text-xl font-semibold text-apple-gray-600 mb-4">需要登录</h2>
          <p className="text-sm text-apple-gray-400 mb-6">请先登录管理员账号</p>
          <button onClick={() => setShowLogin(true)} className="apple-button apple-button-primary text-sm">登录</button>
          <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-apple-gray-100 py-24">
        <div className="max-w-[720px] mx-auto px-6 text-center py-20">
          <h2 className="text-xl font-semibold text-apple-gray-600 mb-4">无权限</h2>
          <p className="text-sm text-apple-gray-400 mb-6">仅管理员可以编辑教程</p>
          <button onClick={() => navigate('/lab')} className="apple-button apple-button-secondary text-sm">返回列表</button>
        </div>
      </div>
    );
  }
  if (loadingTutorial) {
    return <FullScreenLoader />;
  }

  const wordCount = editor ? editor.getText().length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 400));

  return (
    <div className={`min-h-screen bg-white transition-all duration-500 ${
      zenMode ? 'zen-mode-active bg-apple-gray-50/30' : ''
    } ${typewriterMode ? 'typewriter-mode-active' : ''}`}>
      {/* ── 顶栏 ── */}
      <div className="fixed top-12 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-apple-gray-200/50 transition-all duration-300 fixed-top-bar">
        <div className="max-w-[900px] mx-auto px-6 h-12 flex items-center justify-between">
          <button
            onClick={() => navigate('/lab')}
            className="flex items-center gap-1 text-sm text-apple-gray-400 hover:text-apple-blue transition-colors"
          >
            <ArrowLeft size={16} /> 返回
          </button>

          <div className="flex items-center gap-2">
            {/* 字数 */}
            <span className="text-xs text-apple-gray-300 hidden sm:block">
              {wordCount} 字 · {readingTime} 分钟
            </span>

            {/* 设置面板 */}
            <button
              onClick={() => setShowMeta(!showMeta)}
              className={`p-2 rounded-lg transition-all ${showMeta ? 'bg-apple-blue text-white' : 'text-apple-gray-400 hover:bg-apple-gray-100'}`}
            >
              <Settings2 size={16} />
            </button>

            {/* 专注模式 (Zen Mode) */}
            <button
              onClick={() => setZenMode(!zenMode)}
              title="专注模式"
              className={`p-2 rounded-lg transition-all ${zenMode ? 'bg-apple-blue/10 text-apple-blue' : 'text-apple-gray-400 hover:bg-apple-gray-100'}`}
            >
              <Wind size={16} />
            </button>

            {/* 打字机模式 */}
            <button
              onClick={() => setTypewriterMode(!typewriterMode)}
              title="打字机聚焦"
              className={`p-2 rounded-lg transition-all ${typewriterMode ? 'bg-apple-blue/10 text-apple-blue' : 'text-apple-gray-400 hover:bg-apple-gray-100'}`}
            >
              <Type size={16} />
            </button>

            {/* 发布状态 */}
            <button
              onClick={() => setIsPublished(!isPublished)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isPublished ? 'bg-green-100 text-green-700' : 'bg-apple-gray-100 text-apple-gray-500'
              }`}
            >
              {isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
              {isPublished ? '发布' : '草稿'}
            </button>

            {/* 推荐 */}
            <button
              onClick={() => setIsFeatured(!isFeatured)}
              className={`p-2 rounded-lg transition-all ${isFeatured ? 'text-amber-500' : 'text-apple-gray-300 hover:text-apple-gray-400'}`}
            >
              <Star size={16} fill={isFeatured ? 'currentColor' : 'none'} />
            </button>

            {/* 保存 */}
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-apple-blue text-white text-sm font-medium rounded-full hover:bg-apple-blue-hover disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? '保存中' : existingTutorial ? '更新' : '发布'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 编辑器左侧目录栏（飞书文档风格） ── */}
      {editorHeadings.length > 0 && !zenMode && (
        <div className="fixed left-[calc(50%-620px)] top-40 w-52 hidden xl:block select-none z-10 max-h-[calc(100vh-240px)] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[10px] font-bold text-apple-gray-400 uppercase tracking-wider mb-4 pl-3">目录</p>
          <div className="relative border-l border-apple-gray-200/60 ml-3 flex flex-col gap-1 text-xs">
            {editorHeadings.map((heading) => (
              <button
                key={heading.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!editor) return;

                  // 从 heading.id 解析 DOM 索引，在 ProseMirror 文档中找到对应位置
                  const domIndex = parseInt(heading.id.replace('editor-heading-', ''));
                  let count = 0;
                  let targetPos = -1;

                  editor.state.doc.descendants((node, pos) => {
                    if (node.type.name === 'heading') {
                      if (count === domIndex) {
                        targetPos = pos;
                      }
                      count++;
                    }
                  });

                  if (targetPos >= 0) {
                    // 把光标移到标题位置，TipTap 自动滚动到光标处
                    editor.chain().setTextSelection(targetPos + 1).focus().scrollIntoView().run();
                  }
                }}
                style={{ paddingLeft: `${(heading.level - 1) * 12 + 12}px` }}
                className={`w-full text-left py-1.5 rounded-r-lg transition-all duration-200 border-l-2 -ml-[1.5px] ${
                  activeHeadingId === heading.id
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

      {/* ── 主写作区 ── */}
      <div className={`max-w-[720px] mx-auto px-6 pb-20 transition-all duration-500 ${
        zenMode ? 'pt-20 max-w-[680px]' : 'pt-32'
      }`}>
        {/* 封面图 */}
        <div
          className={`mb-8 rounded-2xl overflow-hidden transition-all ${
            coverImage ? '' : 'border-2 border-dashed border-apple-gray-200 hover:border-apple-blue/30'
          }`}
          onPaste={handleCoverPaste}
          onDrop={handleCoverDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {coverImage ? (
            <div className="relative group">
              <img src={coverImage} alt="封面" className="w-full max-h-[300px] object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <label className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-apple-gray-600 cursor-pointer hover:bg-apple-gray-100 transition-colors">
                    更换
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f); }} />
                  </label>
                  <button
                    onClick={() => setCoverImage('')}
                    className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    移除
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center py-12 cursor-pointer text-apple-gray-400 hover:text-apple-blue transition-colors">
              {coverUploading ? (
                <Loader2 size={24} className="animate-spin mb-2" />
              ) : (
                <Upload size={24} className="mb-2" />
              )}
              <span className="text-sm font-medium">{coverUploading ? '上传中...' : '添加封面图'}</span>
              <span className="text-xs mt-1 text-apple-gray-300">点击上传、拖拽或粘贴图片</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f); }}
                disabled={coverUploading}
              />
            </label>
          )}
        </div>

        {/* 标题 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入标题..."
          className="w-full text-4xl font-bold text-apple-gray-600 bg-transparent border-none outline-none placeholder:text-apple-gray-200 mb-4 leading-tight"
        />

        {/* Slug 行 */}
        <div className="flex items-center gap-1 text-xs text-apple-gray-300 mb-8">
          <span>zlcggb.com/lab/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
            className="bg-transparent outline-none text-apple-gray-400 min-w-[100px]"
          />
        </div>

        {/* 图片上传中指示器 */}
        {uploadingImage && (
          <div className="flex items-center gap-2 px-4 py-2 bg-apple-blue/5 text-apple-blue text-sm rounded-xl mb-4 animate-pulse">
            <Loader2 size={14} className="animate-spin" />
            图片上传中...
          </div>
        )}



        {/* 编辑器内容 — 干净无边框 */}
        <div className="relative" ref={editorRef}>
          {/* Tiptap 气泡格式化菜单 (选中文字浮现) */}
          {editor && (
            <BubbleMenu editor={editor}>
              <div className="glass border border-apple-gray-200/80 rounded-2xl p-1.5 flex items-center gap-1 shadow-apple-lg backdrop-blur-md select-none relative">
                {/* 1. 标题类型转换器 */}
                <div className="relative">
                  <button
                    onClick={() => setActiveSubMenu(activeSubMenu === 'title' ? 'none' : 'title')}
                    className={`px-2 py-1 flex items-center gap-1 rounded-lg text-xs font-semibold transition-all ${
                      activeSubMenu === 'title' ? 'bg-apple-blue/10 text-apple-blue' : 'text-apple-gray-500 hover:bg-apple-gray-100 hover:text-apple-gray-700'
                    }`}
                  >
                    <span>{getCurrentBlockTypeLabel()}</span>
                    <span className="text-[9px] opacity-60">▼</span>
                  </button>
                  
                  <AnimatePresence>
                    {activeSubMenu === 'title' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-2 w-32 glass border border-apple-gray-200/80 rounded-xl py-1 shadow-apple-md z-50 flex flex-col backdrop-blur-md"
                      >
                        {blockTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => handleSetBlockType(type)}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              type.active() ? 'bg-apple-blue/5 text-apple-blue font-medium' : 'text-apple-gray-500 hover:bg-apple-gray-50'
                            }`}
                          >
                            <span>{type.label}</span>
                            {type.active() && <span className="text-[10px]">✓</span>}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Sep />

                {/* 2. 对齐方式 */}
                <div className="relative">
                  <button
                    onClick={() => setActiveSubMenu(activeSubMenu === 'align' ? 'none' : 'align')}
                    className={`p-1.5 flex items-center rounded-lg transition-all ${
                      activeSubMenu === 'align' ? 'bg-apple-blue/10 text-apple-blue' : 'text-apple-gray-400 hover:bg-apple-gray-100'
                    }`}
                    title="对齐方式"
                  >
                    {editor.isActive({ align: 'center' }) ? (
                      <AlignIcon type="center" />
                    ) : editor.isActive({ align: 'right' }) ? (
                      <AlignIcon type="right" />
                    ) : (
                      <AlignIcon type="left" />
                    )}
                  </button>

                  <AnimatePresence>
                    {activeSubMenu === 'align' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-2 w-28 glass border border-apple-gray-200/80 rounded-xl p-1 shadow-apple-md z-50 flex flex-col gap-0.5 backdrop-blur-md"
                      >
                        {[
                          { label: '左对齐', value: 'left', icon: <AlignIcon type="left" /> },
                          { label: '居中对齐', value: 'center', icon: <AlignIcon type="center" /> },
                          { label: '右对齐', value: 'right', icon: <AlignIcon type="right" /> },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => {
                              if (item.value === 'left') {
                                editor.chain().focus().updateAttributes('paragraph', { align: null }).updateAttributes('heading', { align: null }).run();
                              } else {
                                editor.chain().focus().updateAttributes('paragraph', { align: item.value }).updateAttributes('heading', { align: item.value }).run();
                              }
                              setActiveSubMenu('none');
                            }}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors ${
                              (item.value === 'left' && !editor.isActive({ align: 'center' }) && !editor.isActive({ align: 'right' })) ||
                              editor.isActive({ align: item.value })
                                ? 'bg-apple-blue/5 text-apple-blue font-medium'
                                : 'text-apple-gray-500 hover:bg-apple-gray-50'
                            }`}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Sep />

                {/* 3. 基础格式 (B, I, U, S) */}
                <TBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗 ⌘B">
                  <Bold size={14} />
                </TBtn>
                <TBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体 ⌘I">
                  <Italic size={14} />
                </TBtn>
                <TBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleMark('underline').run()} title="下划线 ⌘U">
                  <span className="underline font-bold text-xs font-serif leading-none">U</span>
                </TBtn>
                <TBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线">
                  <Strikethrough size={14} />
                </TBtn>
                <Sep />

                {/* 4. 高亮色板 */}
                <div className="relative">
                  <button
                    onClick={() => setActiveSubMenu(activeSubMenu === 'color' ? 'none' : 'color')}
                    className={`p-1.5 flex items-center rounded-lg transition-all ${
                      editor.isActive('highlight') ? 'bg-amber-100 text-amber-600' : 'text-apple-gray-400 hover:bg-apple-gray-100'
                    }`}
                    title="背景高亮"
                  >
                    <span className="font-bold text-xs bg-amber-200/80 px-1 rounded text-apple-gray-600 border border-amber-300/30">A</span>
                  </button>

                  <AnimatePresence>
                    {activeSubMenu === 'color' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-2 p-2 w-40 glass border border-apple-gray-200/80 rounded-xl shadow-apple-md z-50 backdrop-blur-md"
                      >
                        <div className="grid grid-cols-5 gap-1.5 justify-items-center">
                          {[
                            { color: '#ffe066', label: '柠檬黄' },
                            { color: '#a5d6a7', label: '薄荷绿' },
                            { color: '#90caf9', label: '冰川蓝' },
                            { color: '#f8bbd0', label: '樱花粉' },
                            { color: '#e0e0e0', label: '优雅灰' },
                          ].map((item) => (
                            <button
                              key={item.color}
                              onClick={() => {
                                editor.chain().focus().toggleMark('highlight', { color: item.color }).run();
                                setActiveSubMenu('none');
                              }}
                              className="w-5.5 h-5.5 rounded-full border border-black/10 transition-all hover:scale-110 flex items-center justify-center"
                              style={{ backgroundColor: item.color, width: '22px', height: '22px' }}
                              title={item.label}
                            >
                              {editor.isActive('highlight', { color: item.color }) && (
                                <span className="text-[9px] text-black/60 font-bold">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                        {editor.isActive('highlight') && (
                          <button
                            onClick={() => {
                              editor.chain().focus().unsetMark('highlight').run();
                              setActiveSubMenu('none');
                            }}
                            className="mt-2 w-full text-center py-1 bg-apple-gray-100 hover:bg-red-50 hover:text-red-500 rounded-md text-[10px] text-apple-gray-500 font-medium transition-colors"
                          >
                            清除高亮
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Sep />

                {/* 5. 链接与代码 */}
                <TBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="行内代码">
                  <Code size={14} />
                </TBtn>
                <TBtn active={editor.isActive('link')} onClick={handleInsertLink} title="超链接">
                  <Link2 size={14} />
                </TBtn>
              </div>
            </BubbleMenu>
          )}

          {/* 代码块悬浮复制按钮 */}
          <AnimatePresence>
            {hoveredPre && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                style={copyBtnStyle}
                onClick={() => handleCopyCode(hoveredPre)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-apple-gray-600/90 text-white rounded-lg text-xs font-medium hover:bg-apple-gray-600 transition-colors backdrop-blur-sm shadow-md"
              >
                {copiedPre === hoveredPre ? (
                  <>
                    <Check size={12} className="text-green-400" />
                    <span className="text-green-400">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>复制</span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* 行首悬浮加号按钮 */}
          <AnimatePresence>
            {showPlus && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onMouseDown={(e) => {
                  e.preventDefault(); // 关键！防止失去焦点
                }}
                onClick={() => {
                  if (editor && editorRef.current) {
                    const editorRect = editorRef.current.getBoundingClientRect();
                    const btnAbsTop = editorRect.top + plusPos.top;
                    const viewportH = window.innerHeight;
                    const menuH = 400; // 菜单大约高度
                    const spaceBelow = viewportH - btnAbsTop - 28;
                    // 空间不够时向上展开
                    const menuTop = spaceBelow < menuH
                      ? plusPos.top - menuH + 20
                      : plusPos.top + 28;
                    setPlusMenuPos({
                      top: menuTop,
                      left: plusPos.left + 36,
                    });
                    setShowPlusMenu(!showPlusMenu);
                    setShowSlash(false);
                  }
                }}
                className={`editor-plus-btn absolute w-6 h-6 rounded-full flex items-center justify-center bg-white border text-apple-gray-400 shadow-sm transition-all z-20 ${
                  showPlusMenu ? 'border-apple-blue text-apple-blue rotate-45' : 'border-apple-gray-200 hover:border-apple-blue hover:text-apple-blue'
                }`}
                style={{ top: plusPos.top, left: plusPos.left }}
                title="快捷插入组件"
              >
                <svg className="w-3.5 h-3.5 text-current transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* 行首悬浮加号菜单面板 (飞书式快捷插入卡片) */}
          <AnimatePresence>
            {showPlusMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="editor-plus-menu absolute z-50 w-64 glass border border-apple-gray-200/80 rounded-2xl shadow-apple-xl p-3 backdrop-blur-md overflow-hidden select-none"
                style={{ top: plusMenuPos.top, left: Math.max(0, plusMenuPos.left) }}
                onMouseDown={(e) => e.preventDefault()} // 阻止默认焦点丢失
              >
                {/* 第一栏: 基础排版快捷按钮组 */}
                <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-apple-gray-200/40">
                  <button
                    onClick={() => { editor?.chain().focus().clearNodes().toggleHeading({ level: 1 }).run(); setShowPlusMenu(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-apple-gray-100 text-apple-gray-600 font-bold text-xs"
                    title="一级标题"
                  >H1</button>
                  <button
                    onClick={() => { editor?.chain().focus().clearNodes().toggleHeading({ level: 2 }).run(); setShowPlusMenu(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-apple-gray-100 text-apple-gray-600 font-bold text-xs"
                    title="二级标题"
                  >H2</button>
                  <button
                    onClick={() => { editor?.chain().focus().clearNodes().toggleHeading({ level: 3 }).run(); setShowPlusMenu(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-apple-gray-100 text-apple-gray-600 font-bold text-xs"
                    title="三级标题"
                  >H3</button>
                  <div className="w-px h-4 bg-apple-gray-200" />
                  <button
                    onClick={() => { editor?.chain().focus().toggleBold().run(); setShowPlusMenu(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-apple-gray-100 text-apple-gray-600"
                    title="加粗"
                  ><Bold size={13} /></button>
                  <button
                    onClick={() => { editor?.chain().focus().toggleItalic().run(); setShowPlusMenu(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-apple-gray-100 text-apple-gray-600"
                    title="斜体"
                  ><Italic size={13} /></button>
                  <button
                    onClick={() => { editor?.chain().focus().toggleBlockquote().run(); setShowPlusMenu(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-apple-gray-100 text-apple-gray-600"
                    title="引用"
                  ><Quote size={13} /></button>
                  <button
                    onClick={() => { editor?.chain().focus().toggleCode().run(); setShowPlusMenu(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-apple-gray-100 text-apple-gray-600"
                    title="行内代码"
                  ><Code size={13} /></button>
                </div>

                {/* 第二栏: 丰富组件纵向列表 */}
                <div className="max-h-[260px] overflow-y-auto space-y-0.5 pr-0.5">
                  <p className="px-2 py-0.5 text-[9px] font-semibold text-apple-gray-400 uppercase tracking-wider">快捷组件</p>
                  
                  {/* 无序列表 */}
                  <button
                    onClick={() => { editor?.chain().focus().clearNodes().toggleBulletList().run(); setShowPlusMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-apple-gray-100 transition-all text-left text-apple-gray-600"
                  >
                    <span className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><List size={14} /></span>
                    <div>
                      <div className="text-xs font-semibold">无序列表</div>
                      <div className="text-[10px] text-apple-gray-400">项目符号符号列表</div>
                    </div>
                  </button>

                  {/* 有序列表 */}
                  <button
                    onClick={() => { editor?.chain().focus().clearNodes().toggleOrderedList().run(); setShowPlusMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-apple-gray-100 transition-all text-left text-apple-gray-600"
                  >
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-apple-blue flex items-center justify-center"><ListOrdered size={14} /></span>
                    <div>
                      <div className="text-xs font-semibold">有序列表</div>
                      <div className="text-[10px] text-apple-gray-400">数字序号列表</div>
                    </div>
                  </button>

                  {/* 代码块 */}
                  <button
                    onClick={() => { editor?.chain().focus().clearNodes().toggleCodeBlock().run(); setShowPlusMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-apple-gray-100 transition-all text-left text-apple-gray-600"
                  >
                    <span className="w-7 h-7 rounded-lg bg-apple-gray-100 text-apple-gray-600 flex items-center justify-center"><Terminal size={14} /></span>
                    <div>
                      <div className="text-xs font-semibold">终端代码块</div>
                      <div className="text-[10px] text-apple-gray-400">Mac 终端风格代码块</div>
                    </div>
                  </button>

                  {/* 数据表格 */}
                  <button
                    onClick={() => {
                      editor?.chain()
                        .focus()
                        .clearNodes()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run();
                      setShowPlusMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-apple-gray-100 transition-all text-left text-apple-gray-600"
                  >
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Table size={14} /></span>
                    <div>
                      <div className="text-xs font-semibold">数据表格</div>
                      <div className="text-[10px] text-apple-gray-400">可视化编辑表格</div>
                    </div>
                  </button>

                  {/* 思维导图 */}
                  <button
                    onClick={() => {
                      editor?.chain()
                        .focus()
                        .clearNodes()
                        .setCodeBlock({ language: 'mermaid' })
                        .insertContent('graph TD\n  A[核心概念] --> B[分支一]\n  A --> C[分支二]')
                        .run();
                      setShowPlusMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-apple-gray-100 transition-all text-left text-apple-gray-600"
                  >
                    <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><GitFork size={14} /></span>
                    <div>
                      <div className="text-xs font-semibold">思维导图 (Mermaid)</div>
                      <div className="text-[10px] text-apple-gray-400">Mermaid 关系图形与思维导图</div>
                    </div>
                  </button>

                  {/* 图片插入 */}
                  <button
                    onClick={() => { setImageModalOpen(true); setShowPlusMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-apple-gray-100 transition-all text-left text-apple-gray-600"
                  >
                    <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center"><ImageIcon size={14} /></span>
                    <div>
                      <div className="text-xs font-semibold">插图 / 图片</div>
                      <div className="text-[10px] text-apple-gray-400">上传本地图片或粘贴网络链接</div>
                    </div>
                  </button>

                  {/* 链接与分割线 */}
                  <button
                    onClick={() => { handleInsertLink(); setShowPlusMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-apple-gray-100 transition-all text-left text-apple-gray-600"
                  >
                    <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center"><Link2 size={14} /></span>
                    <div>
                      <div className="text-xs font-semibold">超链接</div>
                      <div className="text-[10px] text-apple-gray-400">插入跳转网络超链接</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { editor?.chain().focus().setHorizontalRule().run(); setShowPlusMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-apple-gray-100 transition-all text-left text-apple-gray-600"
                  >
                    <span className="w-7 h-7 rounded-lg bg-apple-gray-100 text-apple-gray-400 flex items-center justify-center"><Minus size={14} /></span>
                    <div>
                      <div className="text-xs font-semibold">分割线</div>
                      <div className="text-[10px] text-apple-gray-400">水平排版分割细线</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 表格操作浮动工具栏 — 飞书式跟随表格定位 */}
          {editor && editor.isActive('table') && (() => {
            // 动态定位：找到编辑器中当前激活的 table DOM
            const editorContainer = editorRef.current;
            const tableEl = editorContainer?.querySelector('table');
            let toolbarTop = 0;
            let toolbarLeft = 0;
            if (tableEl && editorContainer) {
              const editorRect = editorContainer.getBoundingClientRect();
              const tableRect = tableEl.getBoundingClientRect();
              toolbarTop = tableRect.top - editorRect.top - 40;
              toolbarLeft = tableRect.left - editorRect.left;
            }
            return (
              <div
                className="absolute z-40 flex items-center gap-0.5 p-1 glass border border-apple-gray-200/80 rounded-xl shadow-apple-md backdrop-blur-md select-none"
                style={{ top: toolbarTop, left: toolbarLeft }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-apple-gray-100 text-apple-gray-500 text-[11px]" title="左侧插入列"><ArrowLeftIcon size={12} />插列</button>
                <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-apple-gray-100 text-apple-gray-500 text-[11px]" title="右侧插入列">插列<ArrowRightIcon size={12} /></button>
                <button onClick={() => editor.chain().focus().addRowBefore().run()} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-apple-gray-100 text-apple-gray-500 text-[11px]" title="上方插入行"><ArrowUpIcon size={12} />插行</button>
                <button onClick={() => editor.chain().focus().addRowAfter().run()} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-apple-gray-100 text-apple-gray-500 text-[11px]" title="下方插入行">插行<ArrowDownIcon size={12} /></button>
                <div className="w-px h-4 bg-apple-gray-200 mx-0.5" />
                <button onClick={() => editor.chain().focus().deleteColumn().run()} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 text-apple-gray-400 hover:text-red-500 text-[11px]" title="删除列"><Trash2 size={11} />删列</button>
                <button onClick={() => editor.chain().focus().deleteRow().run()} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 text-apple-gray-400 hover:text-red-500 text-[11px]" title="删除行"><Minus size={11} />删行</button>
                <div className="w-px h-4 bg-apple-gray-200 mx-0.5" />
                <button onClick={() => editor.chain().focus().deleteTable().run()} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 text-apple-gray-400 hover:text-red-500 text-[11px]" title="删除表格"><X size={11} />删表</button>
              </div>
            );
          })()}

          <div className="prose prose-lg max-w-none
            prose-headings:text-apple-gray-600 prose-headings:font-semibold prose-headings:mt-8 prose-headings:mb-4
            prose-p:text-apple-gray-500 prose-p:leading-relaxed prose-p:my-3
            prose-a:text-apple-blue prose-a:underline prose-a:decoration-apple-blue/30 hover:prose-a:decoration-apple-blue
            prose-code:text-apple-blue prose-code:bg-apple-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
            prose-pre:bg-[#1e1e1e] prose-pre:rounded-xl prose-pre:text-sm prose-pre:my-4
            prose-img:rounded-xl prose-img:my-4 prose-img:cursor-pointer
            prose-blockquote:border-apple-blue/50 prose-blockquote:text-apple-gray-400 prose-blockquote:italic
            prose-li:text-apple-gray-500
            prose-strong:text-apple-gray-600
            prose-hr:border-apple-gray-200
          ">
            <EditorContent editor={editor} />
          </div>

          {/* 飞书式链接悬浮操作条 */}
          <AnimatePresence>
            {linkBubble && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="link-bubble-bar absolute z-50 flex items-center gap-1.5 px-3 py-1.5 glass border border-apple-gray-200/80 rounded-xl shadow-apple-md backdrop-blur-md select-none"
                style={{ top: linkBubble.top, left: linkBubble.left }}
                onMouseDown={(e) => e.preventDefault()}
                onMouseLeave={() => setLinkBubble(null)}
              >
                {/* URL 预览 */}
                <span className="text-xs text-apple-gray-400 max-w-[200px] truncate font-mono">
                  {linkBubble.url.length > 35 ? linkBubble.url.slice(0, 35) + '...' : linkBubble.url}
                </span>
                <div className="w-px h-4 bg-apple-gray-200" />
                {/* 编辑链接 */}
                <button
                  onClick={() => {
                    // 计算链接在文档中的位置范围
                    const el = currentLinkEl.current;
                    if (el && editor) {
                      try {
                        const pos = editor.view.posAtDOM(el, 0);
                        const textLen = el.textContent?.length || 0;
                        setLinkEditRange({ from: pos, to: pos + textLen });
                      } catch {
                        setLinkEditRange(null);
                      }
                    }
                    setLinkUrlInput(linkBubble.url);
                    setLinkTextInput(linkBubble.text);
                    setLinkModalOpen(true);
                    setLinkBubble(null);
                  }}
                  className="p-1 rounded-md hover:bg-apple-gray-100 text-apple-gray-500 hover:text-apple-blue transition-colors"
                  title="编辑链接"
                >
                  <Pencil size={13} />
                </button>
                {/* 取消链接 */}
                <button
                  onClick={() => {
                    editor?.chain().focus().unsetLink().run();
                    setLinkBubble(null);
                  }}
                  className="p-1 rounded-md hover:bg-red-50 text-apple-gray-500 hover:text-red-500 transition-colors"
                  title="取消链接"
                >
                  <Unlink size={13} />
                </button>
                {/* 新窗口打开 */}
                <button
                  onClick={() => {
                    window.open(linkBubble.url, '_blank', 'noopener,noreferrer');
                  }}
                  className="p-1 rounded-md hover:bg-apple-gray-100 text-apple-gray-500 hover:text-apple-blue transition-colors"
                  title="新窗口打开"
                >
                  <ExternalLink size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSlash && filteredCommands.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute z-50 w-60 glass border border-apple-gray-200/60 rounded-2xl shadow-apple-xl py-2 backdrop-blur-md overflow-hidden"
                style={{ top: slashPos.top, left: Math.max(0, slashPos.left) }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="px-4 py-1 text-[10px] font-semibold text-apple-gray-400 uppercase tracking-wider">插入内容块</p>
                <div className="max-h-[280px] overflow-y-auto px-1.5 py-1 space-y-0.5">
                  {filteredCommands.map((cmd: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleSlashCommand(cmd)}
                      onMouseEnter={() => setSelectedSlashIndex(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        selectedSlashIndex === i 
                          ? 'bg-apple-blue text-white shadow-apple-sm' 
                          : 'text-apple-gray-600 hover:bg-apple-gray-100'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        selectedSlashIndex === i ? 'bg-white/20 text-white' : 'bg-apple-gray-100 text-apple-gray-500'
                      }`}>
                        {cmd.icon}
                      </span>
                      <div className="text-left">
                        <div className={`font-medium text-sm ${selectedSlashIndex === i ? 'text-white' : 'text-apple-gray-600'}`}>{cmd.label}</div>
                        <div className={`text-xs ${selectedSlashIndex === i ? 'text-white/70' : 'text-apple-gray-400'}`}>{cmd.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 底部提示 */}
        <div className="mt-12 pt-6 border-t border-apple-gray-100 text-xs text-apple-gray-300 flex items-center gap-4">
          <span>输入 <kbd className="px-1.5 py-0.5 bg-apple-gray-100 rounded text-[11px]">/</kbd> 调出命令菜单</span>
          <span>直接粘贴或拖拽图片到编辑器</span>
          <span>⌘B 加粗 · ⌘I 斜体</span>
        </div>
      </div>

      {/* ── 元数据侧边面板 ── */}
      {showMeta && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMeta(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-80 bg-white border-l border-apple-gray-200 z-50 shadow-apple-xl overflow-y-auto animate-slide-in-right">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-apple-gray-600">文章设置</h3>
                <button onClick={() => setShowMeta(false)} className="text-apple-gray-400 hover:text-apple-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                {/* 分类 */}
                <div>
                  <label className="block text-xs font-medium text-apple-gray-500 mb-1.5">分类</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 outline-none focus:ring-2 focus:ring-apple-blue/20"
                  >
                    <option value="">未分类</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* 类型 */}
                <div>
                  <label className="block text-xs font-medium text-apple-gray-500 mb-1.5">内容类型</label>
                  <div className="flex gap-2">
                    {(['article', 'video'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setContentType(type)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                          contentType === type ? 'bg-apple-blue text-white' : 'bg-apple-gray-100 text-apple-gray-500 hover:bg-apple-gray-200'
                        }`}
                      >
                        {type === 'article' ? '📝 文章' : '🎬 视频'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 视频 URL */}
                {contentType === 'video' && (
                  <div>
                    <label className="block text-xs font-medium text-apple-gray-500 mb-1.5">视频链接</label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="B站或YouTube链接"
                      className="w-full px-3 py-2 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 outline-none focus:ring-2 focus:ring-apple-blue/20"
                    />
                  </div>
                )}

                {/* 标签 */}
                <div>
                  <label className="block text-xs font-medium text-apple-gray-500 mb-1.5">标签</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-apple-blue/10 text-apple-blue text-xs rounded-md">
                        {tag}
                        <button onClick={() => setTags(tags.filter((t) => t !== tag))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="输入后回车添加"
                    className="w-full px-3 py-2 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 outline-none focus:ring-2 focus:ring-apple-blue/20"
                  />
                </div>

                {/* 摘要 */}
                <div>
                  <label className="block text-xs font-medium text-apple-gray-500 mb-1.5">摘要</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="简短描述，显示在列表卡片中"
                    rows={3}
                    className="w-full px-3 py-2 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 outline-none focus:ring-2 focus:ring-apple-blue/20 resize-none"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-medium text-apple-gray-500 mb-1.5">URL 路径</label>
                  <div className="flex items-center gap-1 px-3 py-2 bg-apple-gray-100 rounded-xl text-sm">
                    <span className="text-apple-gray-300">/lab/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                      className="flex-1 bg-transparent text-apple-gray-600 outline-none"
                    />
                  </div>
                </div>

                {/* 飞书文档心流指南 */}
                <div className="mt-6 pt-4 border-t border-apple-gray-100">
                  <h4 className="text-xs font-semibold text-apple-gray-600 mb-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-apple-blue animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    心流指南 (快捷键)
                  </h4>
                  <div className="bg-apple-gray-50/70 border border-apple-gray-200/40 rounded-xl p-3 text-xs text-apple-gray-400 space-y-2.5 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="text-apple-blue font-medium mt-0.5">•</span>
                      <div>
                        <span className="font-semibold text-apple-gray-500">粘贴或拖拽图片</span>
                        <p className="mt-0.5 text-[11px] text-apple-gray-400">可直接在正文按 <kbd className="px-1 py-0.5 bg-white border border-apple-gray-200 rounded text-[9px] shadow-sm">⌘V</kbd> 粘贴截图，或直接把电脑里的图片拖入编辑器上传。</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-apple-blue font-medium mt-0.5">•</span>
                      <div>
                        <span className="font-semibold text-apple-gray-500">斜杠命令菜单</span>
                        <p className="mt-0.5 text-[11px] text-apple-gray-400">在空行输入 <kbd className="px-1 py-0.5 bg-white border border-apple-gray-200 rounded text-[9px] shadow-sm">/</kbd> 或点击行首悬浮加号，可快捷插入标题、列表、代码块或引用块。</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-apple-blue font-medium mt-0.5">•</span>
                      <div>
                        <span className="font-semibold text-apple-gray-500">一键终端代码块</span>
                        <p className="mt-0.5 text-[11px] text-apple-gray-400">在空行开头连续输入三个反单引号 <kbd className="px-1 py-0.5 bg-white border border-apple-gray-200 rounded text-[9px] shadow-sm">```</kbd> 随后按下空格或回车，即可插入高级终端代码块。</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-apple-blue font-medium mt-0.5">•</span>
                      <div>
                        <span className="font-semibold text-apple-gray-500">快捷文字格式</span>
                        <p className="mt-0.5 text-[11px] text-apple-gray-400">选中段落文字后，可按 <kbd className="px-1 py-0.5 bg-white border border-apple-gray-200 rounded text-[9px] shadow-sm">⌘B</kbd> 加粗、<kbd className="px-1 py-0.5 bg-white border border-apple-gray-200 rounded text-[9px] shadow-sm">⌘I</kbd> 斜体、<kbd className="px-1 py-0.5 bg-white border border-apple-gray-200 rounded text-[9px] shadow-sm">⌘U</kbd> 下划线，或按 <kbd className="px-1 py-0.5 bg-white border border-apple-gray-200 rounded text-[9px] shadow-sm">⌘K</kbd> 快速加超链接。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── 插入链接 Dialog ── */}
      <AnimatePresence>
        {linkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm glass border border-apple-gray-200 rounded-2xl p-5 shadow-apple-xl backdrop-blur-md relative"
            >
              <h3 className="text-sm font-semibold text-apple-gray-600 mb-3 flex items-center gap-1.5">
                <Link2 size={16} className="text-apple-blue" />
                {linkEditRange ? '编辑超链接' : '插入超链接'}
              </h3>
              <button
                onClick={() => { setLinkModalOpen(false); setLinkUrlInput(''); setLinkTextInput(''); setLinkEditRange(null); }}
                className="absolute top-4 right-4 text-apple-gray-400 hover:text-apple-gray-600 transition-colors"
              >
                <X size={16} />
              </button>

              {/* 编辑模式或空选区时显示链接文本输入 */}
              {(linkEditRange || editor?.state.selection.empty) && (
                <input
                  type="text"
                  value={linkTextInput}
                  onChange={(e) => setLinkTextInput(e.target.value)}
                  placeholder="链接文本（如：点击访问）"
                  className="w-full px-3 py-2 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 outline-none focus:ring-2 focus:ring-apple-blue/20 mb-3"
                  autoFocus
                />
              )}

              <input
                type="url"
                value={linkUrlInput}
                onChange={(e) => setLinkUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 outline-none focus:ring-2 focus:ring-apple-blue/20 mb-4"
                autoFocus={!editor?.state.selection.empty}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (editor && linkUrlInput.trim()) {
                      const url = linkUrlInput.trim();
                      const displayText = linkTextInput.trim() || url;
                      if (linkEditRange) {
                        // 编辑模式：先选中旧链接文字，删除，再插入新的
                        editor.chain().focus()
                          .setTextSelection(linkEditRange)
                          .deleteSelection()
                          .insertContent({
                            type: 'text',
                            text: displayText,
                            marks: [{ type: 'link', attrs: { href: url, target: '_blank' } }],
                          })
                          .run();
                      } else if (editor.state.selection.empty) {
                        editor.chain().focus()
                          .insertContent({
                            type: 'text',
                            text: displayText,
                            marks: [{ type: 'link', attrs: { href: url, target: '_blank' } }],
                          })
                          .run();
                      } else {
                        editor.chain().focus().setLink({ href: url }).run();
                      }
                    }
                    setLinkModalOpen(false);
                    setLinkUrlInput('');
                    setLinkTextInput('');
                    setLinkEditRange(null);
                  }
                  if (e.key === 'Escape') {
                    setLinkModalOpen(false);
                    setLinkUrlInput('');
                    setLinkTextInput('');
                    setLinkEditRange(null);
                  }
                }}
              />
              <div className="flex justify-end gap-2 text-xs font-medium">
                <button
                  onClick={() => {
                    setLinkModalOpen(false);
                    setLinkUrlInput('');
                    setLinkTextInput('');
                    setLinkEditRange(null);
                  }}
                  className="px-3.5 py-2 bg-apple-gray-100 text-apple-gray-500 rounded-full hover:bg-apple-gray-200 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (editor && linkUrlInput.trim()) {
                      const url = linkUrlInput.trim();
                      const displayText = linkTextInput.trim() || url;
                      if (linkEditRange) {
                        // 编辑模式
                        editor.chain().focus()
                          .setTextSelection(linkEditRange)
                          .deleteSelection()
                          .insertContent({
                            type: 'text',
                            text: displayText,
                            marks: [{ type: 'link', attrs: { href: url, target: '_blank' } }],
                          })
                          .run();
                      } else if (editor.state.selection.empty) {
                        editor.chain().focus()
                          .insertContent({
                            type: 'text',
                            text: displayText,
                            marks: [{ type: 'link', attrs: { href: url, target: '_blank' } }],
                          })
                          .run();
                      } else {
                        editor.chain().focus().setLink({ href: url }).run();
                      }
                    }
                    setLinkModalOpen(false);
                    setLinkUrlInput('');
                    setLinkTextInput('');
                    setLinkEditRange(null);
                  }}
                  className="px-3.5 py-2 bg-apple-blue text-white rounded-full hover:bg-apple-blue-hover transition-all"
                >
                  确认
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 插入图片 Dialog ── */}
      <AnimatePresence>
        {imageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm glass border border-apple-gray-200 rounded-2xl p-5 shadow-apple-xl backdrop-blur-md relative"
            >
              <h3 className="text-sm font-semibold text-apple-gray-600 mb-3 flex items-center gap-1.5">
                <ImageIcon size={16} className="text-amber-500" />
                插入图片
              </h3>
              <button
                onClick={() => setImageModalOpen(false)}
                className="absolute top-4 right-4 text-apple-gray-400 hover:text-apple-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
              
              <div className="mb-4">
                <button
                  onClick={() => {
                    setImageModalOpen(false);
                    triggerImageUpload();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-apple-gray-200 hover:border-apple-blue/30 text-apple-gray-500 rounded-xl text-xs font-semibold hover:bg-apple-gray-55 transition-all cursor-pointer mb-3"
                >
                  <Upload size={14} />
                  上传本地图片
                </button>
                <div className="text-center text-[10px] text-apple-gray-300 uppercase tracking-wider mb-3">或输入网络图片 URL</div>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 outline-none focus:ring-2 focus:ring-apple-blue/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editor && imageUrlInput.trim()) {
                        editor.chain().focus().setImage({ src: imageUrlInput.trim() }).run();
                      }
                      setImageModalOpen(false);
                      setImageUrlInput('');
                    }
                  }}
                />
              </div>
              
              <div className="flex justify-end gap-2 text-xs font-medium">
                <button
                  onClick={() => {
                    setImageModalOpen(false);
                    setImageUrlInput('');
                  }}
                  className="px-3.5 py-2 bg-apple-gray-100 text-apple-gray-500 rounded-full hover:bg-apple-gray-200 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (editor && imageUrlInput.trim()) {
                      editor.chain().focus().setImage({ src: imageUrlInput.trim() }).run();
                    }
                    setImageModalOpen(false);
                    setImageUrlInput('');
                  }}
                  className="px-3.5 py-2 bg-apple-blue text-white rounded-full hover:bg-apple-blue-hover transition-all"
                >
                  确认
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 子组件 ──

function TBtn({ active, onClick, title, children }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick} title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${
        active ? 'bg-apple-blue text-white' : 'text-apple-gray-400 hover:bg-apple-gray-100 hover:text-apple-gray-600'
      }`}
    >{children}</button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-apple-gray-200 mx-0.5" />;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-apple-gray-100 flex items-center justify-center">
      <Loader2 className="animate-spin text-apple-gray-400" size={24} />
    </div>
  );
}
