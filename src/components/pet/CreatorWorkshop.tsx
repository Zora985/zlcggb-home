import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles, Trash2, Save, Download, UserCircle2, History, Layers, MessageSquare, Image as ImageIcon, ImagePlus, Cat, Package, Images, Loader2, LayoutPanelLeft } from 'lucide-react';
import { streamChatCompletion, isAiConfigured, type ChatMessage } from '../../lib/aiClient';
import { getSystemPrompt, getUserPromptPrefix, truncateSvgForPrompt, type CreatorMode } from '../../lib/creatorPrompts';
import { buildLayeredWorkshopComposite, type CompositeLayerProps } from '../../lib/workshopComposite';
import {
  deleteCreation,
  extractSvgFromAssistantText,
  getCreation,
  getCreations,
  isProbablySafeSvg,
  saveCreation,
  svgToDataUri,
  type CreationRecord,
} from '../../lib/creatorStore';
import {
  appendWorkshopHistory,
  deleteWorkshopHistoryEntry,
  getWorkshopTabSnapshot,
  loadWorkshopHistory,
  saveWorkshopTabSnapshot,
  type WorkshopChatMsg,
  type WorkshopHistoryEntry,
} from '../../lib/workshopSessionStore';
import {
  deriveCreationShortName,
  shortCompositeDisplayName,
  shortenForSelectLabel,
  stripUserPromptPrefixForDisplay,
} from '../../lib/creationNaming';
import { downloadSvgAsFile } from '../../lib/svgDownload';

interface CreatorWorkshopProps {
  onApplyCharacter?: (creationId: string) => void;
}

const fnv1aHash = (s: string): string => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
};

const MODE_TABS: { id: CreatorMode; label: string }[] = [
  { id: 'character', label: '角色' },
  { id: 'scene', label: '场景' },
  { id: 'prop', label: '道具' },
  { id: 'animation', label: '合成' },
];

export function CreatorWorkshop({ onApplyCharacter }: CreatorWorkshopProps) {
  const initSnap = getWorkshopTabSnapshot('character');
  const [mode, setMode] = useState<CreatorMode>('character');
  const [messages, setMessages] = useState<WorkshopChatMsg[]>(() => initSnap?.messages ?? []);
  const [input, setInput] = useState(() => initSnap?.inputDraft ?? '');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [galleryTick, setGalleryTick] = useState(0);
  const [historyTick, setHistoryTick] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'preview'>('chat');
  const [svgCodeExpanded, setSvgCodeExpanded] = useState<Record<number, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const workshopContextRef = useRef({ mode: 'character' as CreatorMode, pickSceneId: '', pickCharacterId: '', pickPropIds: [] as string[] });
  const lastAutoSavedSvgKeyRef = useRef<string | null>(null);
  const lastGallerySaveRef = useRef<{ id: string; mode: CreatorMode } | null>(null);

  const [pickCharacterId, setPickCharacterId] = useState('');
  const [pickSceneId, setPickSceneId] = useState('');
  const [pickPropIds, setPickPropIds] = useState<string[]>([]);

  const gallery = useMemo(() => getCreations(), [galleryTick]);
  const historyList = useMemo(() => loadWorkshopHistory(), [historyTick]);

  const creationsByType = useMemo(() => ({
    character: getCreations('character'),
    scene: getCreations('scene'),
    prop: getCreations('prop'),
  }), [galleryTick]);

  /* 合成搭景：画廊里场景/角色各只有一条时自动选中，减少无效点击 */
  useEffect(() => {
    if (mode !== 'animation') return;
    const scene = creationsByType.scene;
    const character = creationsByType.character;
    if (scene.length === 1) setPickSceneId(scene[0].id);
    else setPickSceneId((id) => (id && scene.some((c) => c.id === id) ? id : ''));
    if (character.length === 1) setPickCharacterId(character[0].id);
    else setPickCharacterId((id) => (id && character.some((c) => c.id === id) ? id : ''));
  }, [mode, creationsByType.scene, creationsByType.character]);

  workshopContextRef.current = { mode, pickSceneId, pickCharacterId, pickPropIds };

  /** 每次成功生成后自动入库；同一张 SVG 不重复写入 */
  const persistGeneratedSvg = useCallback((svgData: string, msgs: WorkshopChatMsg[]) => {
    const { mode: m, pickSceneId: ps, pickCharacterId: pc, pickPropIds: pp } = workshopContextRef.current;
    if (!isProbablySafeSvg(svgData)) return null;
    const key = `${m}-${fnv1aHash(svgData)}`;
    if (lastAutoSavedSvgKeyRef.current === key) {
      const cur = lastGallerySaveRef.current;
      return cur ? getCreation(cur.id) ?? null : null;
    }
    lastAutoSavedSvgKeyRef.current = key;
    const lastUserBubble = msgs.filter((x) => x.role === 'user').pop()?.content ?? '';
    let name = deriveCreationShortName(lastUserBubble, m);
    if (m === 'animation') {
      const sc = ps ? getCreation(ps) : undefined;
      const ch = pc ? getCreation(pc) : undefined;
      if (sc?.type === 'scene' && ch?.type === 'character') {
        name = shortCompositeDisplayName(ch.name, sc.name, pp.length);
      }
    }
    const rec = saveCreation({
      type: m,
      name,
      description: '',
      svgData,
      prompt: msgs.map((x) => `${x.role}: ${x.content}`).join('\n---\n').slice(0, 4000),
    });
    lastGallerySaveRef.current = { id: rec.id, mode: m };
    setGalleryTick((t) => t + 1);
    setError(null);
    return rec;
  }, []);

  const lastAssistantSvg = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!last) return null;
    const svg = extractSvgFromAssistantText(last.content);
    if (!svg || !isProbablySafeSvg(svg)) return null;
    return svg;
  }, [messages]);

  useEffect(() => {
    if (lastAssistantSvg && !streaming) setMobilePanel('preview');
  }, [lastAssistantSvg, streaming]);

  useEffect(() => {
    if (mobilePanel === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mobilePanel]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const goMode = useCallback(
    (next: CreatorMode) => {
      if (next === mode || streaming) return;
      saveWorkshopTabSnapshot(mode, { messages, inputDraft: input });
      const snap = getWorkshopTabSnapshot(next);
      setMessages(snap?.messages ?? []);
      setInput(snap?.inputDraft ?? '');
      setMode(next);
      setError(null);
      setMobilePanel('chat');
      setSvgCodeExpanded({});
      lastAutoSavedSvgKeyRef.current = null;
      lastGallerySaveRef.current = null;
    },
    [mode, messages, input, streaming],
  );

  useEffect(() => {
    if (streaming) return;
    const t = window.setTimeout(() => {
      saveWorkshopTabSnapshot(mode, { messages, inputDraft: input });
    }, 400);
    return () => clearTimeout(t);
  }, [messages, input, mode, streaming]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (!isAiConfigured()) {
      setError('请先在 .env 中配置 VITE_LLM_* 变量');
      return;
    }
    setError(null);
    setInput('');
    setMobilePanel('chat');

    const userContent = `${getUserPromptPrefix(mode)}${text}`;
    const nextMessages: WorkshopChatMsg[] = [
      ...messages,
      { role: 'user', content: userContent },
      { role: 'assistant', content: '' },
    ];
    setMessages(nextMessages);
    setStreaming(true);

    const apiMessages: ChatMessage[] = [
      { role: 'system', content: getSystemPrompt(mode) },
      ...nextMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
    ];

    const ac = new AbortController();
    abortRef.current = ac;
    let acc = '';

    await streamChatCompletion({
      messages: apiMessages,
      signal: ac.signal,
      onDelta: (piece) => {
        acc += piece;
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: acc };
          return copy;
        });
      },
      onDone: () => {
        const finalMessages: WorkshopChatMsg[] = [
          ...nextMessages.slice(0, -1),
          { role: 'assistant', content: acc },
        ];
        const svg = extractSvgFromAssistantText(acc);
        const rec = svg ? persistGeneratedSvg(svg, finalMessages) : null;
        setMessages((prev) => {
          const copy = [...prev];
          const li = copy.length - 1;
          const last = copy[li];
          if (last?.role === 'assistant' && rec) {
            copy[li] = { ...last, galleryLinkedId: rec.id };
          }
          return copy;
        });
        setStreaming(false);
        abortRef.current = null;
      },
      onError: (err) => {
        setStreaming(false);
        abortRef.current = null;
        setError(err.message);
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant' && !last.content) copy[copy.length - 1] = { ...last, content: `（失败）${err.message}` };
          return copy;
        });
      },
    });
  }, [input, streaming, mode, messages, persistGeneratedSvg]);

  /** 将第 i 条助手消息中的 SVG 单独存入画廊（与本条对话绑定） */
  const handleSaveMessageAt = useCallback((index: number) => {
    const msg = messages[index];
    if (!msg || msg.role !== 'assistant') return;
    const svgData = extractSvgFromAssistantText(msg.content);
    if (!svgData || !isProbablySafeSvg(svgData)) {
      setError('这条消息里没有可保存的 SVG');
      return;
    }
    let prevUser = '';
    for (let j = index - 1; j >= 0; j--) {
      if (messages[j].role === 'user') {
        prevUser = messages[j].content;
        break;
      }
    }
    const { mode: m, pickSceneId: ps, pickCharacterId: pc, pickPropIds: pp } = workshopContextRef.current;
    let name = deriveCreationShortName(prevUser, m);
    if (m === 'animation') {
      const sc = ps ? getCreation(ps) : undefined;
      const ch = pc ? getCreation(pc) : undefined;
      if (sc?.type === 'scene' && ch?.type === 'character') {
        name = shortCompositeDisplayName(ch.name, sc.name, pp.length);
      }
    }
    const promptSlice = messages
      .slice(0, index + 1)
      .map((x) => `${x.role}: ${x.content}`)
      .join('\n---\n')
      .slice(0, 4000);
    const rec = saveCreation({
      type: m,
      name,
      description: '',
      svgData,
      prompt: promptSlice,
    });
    setMessages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], galleryLinkedId: rec.id };
      return copy;
    });
    if (index === messages.length - 1) {
      lastGallerySaveRef.current = { id: rec.id, mode: m };
      lastAutoSavedSvgKeyRef.current = `${m}-${fnv1aHash(svgData)}`;
    }
    setGalleryTick((t) => t + 1);
    setError(null);
  }, [messages]);

  const downloadSvgFromAssistantIndex = useCallback(
    (index: number) => {
      const msg = messages[index];
      if (!msg || msg.role !== 'assistant') return;
      const svg = extractSvgFromAssistantText(msg.content);
      if (!svg || !isProbablySafeSvg(svg)) return;
      const linked = msg.galleryLinkedId ? getCreation(msg.galleryLinkedId) : undefined;
      let base: string;
      if (linked?.name) base = linked.name;
      else {
        let prevUser = '';
        for (let j = index - 1; j >= 0; j--) {
          if (messages[j].role === 'user') {
            prevUser = messages[j].content;
            break;
          }
        }
        base = deriveCreationShortName(prevUser, mode);
      }
      downloadSvgAsFile(svg, base);
    },
    [messages, mode],
  );

  const handleApplyCharacter = useCallback(() => {
    if (!lastAssistantSvg || !isProbablySafeSvg(lastAssistantSvg)) return;
    const lastAsst = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAsst?.galleryLinkedId) {
      const existing = getCreation(lastAsst.galleryLinkedId);
      if (existing?.type === 'character' && existing.svgData === lastAssistantSvg) {
        onApplyCharacter?.(existing.id);
        return;
      }
    }
    const link = lastGallerySaveRef.current;
    if (link?.mode === 'character') {
      const existing = getCreation(link.id);
      if (existing?.svgData === lastAssistantSvg) {
        onApplyCharacter?.(existing.id);
        return;
      }
    }
    const lastUserBubble = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
    const rec = saveCreation({
      type: 'character',
      name: deriveCreationShortName(lastUserBubble, 'character'),
      description: '从工坊应用',
      svgData: lastAssistantSvg,
      prompt: messages.map((m) => `${m.role}: ${m.content}`).join('\n---\n').slice(0, 4000),
    });
    lastGallerySaveRef.current = { id: rec.id, mode: 'character' };
    lastAutoSavedSvgKeyRef.current = `character-${fnv1aHash(lastAssistantSvg)}`;
    setGalleryTick((t) => t + 1);
    onApplyCharacter?.(rec.id);
  }, [lastAssistantSvg, messages, onApplyCharacter]);

  const clearChat = useCallback(() => {
    stop();
    setMessages([]);
    setInput('');
    setError(null);
    setMobilePanel('chat');
    setSvgCodeExpanded({});
    lastAutoSavedSvgKeyRef.current = null;
    lastGallerySaveRef.current = null;
    saveWorkshopTabSnapshot(mode, { messages: [], inputDraft: '' });
  }, [stop, mode]);

  const pushToHistory = useCallback(() => {
    const firstUser = messages.find((m) => m.role === 'user');
    const title = firstUser ? deriveCreationShortName(firstUser.content, mode)
      : `${MODE_TABS.find((x) => x.id === mode)?.label ?? mode} 对话`;
    appendWorkshopHistory({ mode, title, messages: JSON.parse(JSON.stringify(messages)), inputDraft: input });
    setHistoryTick((h) => h + 1); setError(null);
  }, [messages, input, mode]);

  const restoreHistory = useCallback((entry: WorkshopHistoryEntry) => {
    if (streaming) return;
    saveWorkshopTabSnapshot(mode, { messages, inputDraft: input });
    setMode(entry.mode); setMessages(entry.messages); setInput(entry.inputDraft);
    saveWorkshopTabSnapshot(entry.mode, { messages: entry.messages, inputDraft: entry.inputDraft });
    setShowHistory(false);
    lastAutoSavedSvgKeyRef.current = null;
    lastGallerySaveRef.current = null;
  }, [streaming, mode, messages, input]);

  const insertCompositeFromGallery = useCallback(() => {
    const parts: string[] = [];
    const maxChunk = 3500;
    if (pickCharacterId) { const c = getCreation(pickCharacterId); if (c) parts.push(`【角色】${c.name}\n${truncateSvgForPrompt(c.svgData, maxChunk)}`); }
    if (pickSceneId) { const c = getCreation(pickSceneId); if (c) parts.push(`【场景】${c.name}\n${truncateSvgForPrompt(c.svgData, maxChunk)}`); }
    for (const pid of pickPropIds) { const c = getCreation(pid); if (c) parts.push(`【道具】${c.name}\n${truncateSvgForPrompt(c.svgData, maxChunk)}`); }
    if (parts.length === 0) { setError('请先选择至少一个素材'); return; }
    const block = `${parts.join('\n\n---\n\n')}\n\n（注意：粘贴进 AI 的 SVG 可能被截断，不完整。优先使用上方「生成本地合成预览」。）\n请基于以上素材输出带 CSS 动画的合成场景 SVG：`;
    setInput((prev) => (prev.trim() ? `${prev.trim()}\n\n${block}` : block));
    setError(null);
  }, [pickCharacterId, pickSceneId, pickPropIds]);

  const composeLocalPreview = useCallback(() => {
    const sc = pickSceneId ? getCreation(pickSceneId) : undefined;
    const ch = pickCharacterId ? getCreation(pickCharacterId) : undefined;
    if (!sc || !ch) {
      setError('请同时选择「① 背景场景」与「② 宠物角色」');
      return;
    }
    if (sc.type !== 'scene') {
      setError('① 请选择画廊中类型为「场景」的素材作为背景');
      return;
    }
    if (ch.type !== 'character') {
      setError('② 请选择画廊中类型为「角色」的素材作为宠物');
      return;
    }
    const props: CompositeLayerProps[] = [];
    for (const pid of pickPropIds) {
      const c = getCreation(pid);
      if (c?.type === 'prop') props.push({ name: c.name, svg: c.svgData });
    }
    const svg = buildLayeredWorkshopComposite({ sceneSvg: sc.svgData, characterSvg: ch.svgData, props });
    if (!svg) {
      setError('合成失败：素材未通过安全检查，请换一张或重新生成');
      return;
    }
    const summary = `【本地合成】${ch.name} / ${sc.name}${props.length ? ` / 道具×${props.length}` : ''}`;
    const assistantMsg: WorkshopChatMsg = {
      role: 'assistant',
      content: `\`\`\`svg\n${svg}\n\`\`\`\n\n*背景与图层来自画廊原始 SVG，仅在本地叠加 transform 与简单 CSS 动效，未经大模型重绘。*`,
    };
    const merged: WorkshopChatMsg[] = [...messages, { role: 'user', content: summary }, assistantMsg];
    const rec = persistGeneratedSvg(svg, merged);
    const withLink: WorkshopChatMsg[] = rec
      ? merged.map((m, idx) =>
          idx === merged.length - 1 && m.role === 'assistant' ? { ...m, galleryLinkedId: rec.id } : m,
        )
      : merged;
    setMessages(withLink);
    setError(null);
    setMobilePanel('preview');
  }, [pickSceneId, pickCharacterId, pickPropIds, messages, persistGeneratedSvg]);

  const togglePropPick = useCallback((id: string) => {
    setPickPropIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 8 ? prev : [...prev, id]);
  }, []);

  const emptyHint = mode === 'character'
    ? '描述你想要的像素风宠物角色，AI 会流式输出 SVG。'
    : mode === 'scene' ? '描述像素风房间或室外场景。'
    : mode === 'prop' ? '描述食物、玩具等小道具。'
    : '下方先选场景与角色，点「生成本地合成」；或展开与 AI 对话（易截断）。';

  const hasSvg = !!lastAssistantSvg;

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#0d1020] to-[#12142b] text-white overflow-hidden">

      {/* === 历史列表（顶部展开，不占底部 Dock） === */}
      {showHistory && (
        <div className="flex-none max-h-28 sm:max-h-36 overflow-y-auto border-b border-white/10 bg-black/35 px-2 py-1.5 space-y-1 z-10">
          {historyList.length === 0 ? (
            <p className="text-indigo-300/40 text-xs">暂无暂存的对话记录。</p>
          ) : historyList.map((h) => (
            <div key={h.id} className="flex items-center gap-1.5 text-xs bg-white/5 rounded-lg px-2 py-1">
              <span className="shrink-0 text-indigo-400/80 font-medium">{MODE_TABS.find((x) => x.id === h.mode)?.label}</span>
              <span className="flex-1 truncate text-indigo-100/70">{h.title}</span>
              <button type="button" className="text-emerald-400/90 font-medium" onClick={() => restoreHistory(h)}>恢复</button>
              <button type="button" className="text-rose-400/70" onClick={() => { deleteWorkshopHistoryEntry(h.id); setHistoryTick((x) => x + 1); }}>删</button>
            </div>
          ))}
        </div>
      )}

      {/* === 移动端面板切换 (< lg)；合成模式文案区分「搭景 / 画布」=== */}
      <div className="flex-none flex lg:hidden border-b border-white/10 bg-[#0a0d1a]">
        <button type="button" onClick={() => setMobilePanel('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            mobilePanel === 'chat'
              ? 'text-white bg-white/5 border-b-2 border-indigo-400'
              : 'text-indigo-300/50 hover:text-indigo-200/70'
          }`}>
          {mode === 'animation' ? <LayoutPanelLeft size={14} /> : <MessageSquare size={14} />}
          {mode === 'animation' ? '搭景' : '对话'}
        </button>
        <button type="button" onClick={() => setMobilePanel('preview')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors relative ${
            mobilePanel === 'preview'
              ? 'text-white bg-white/5 border-b-2 border-indigo-400'
              : 'text-indigo-300/50 hover:text-indigo-200/70'
          }`}>
          <ImageIcon size={14} /> {mode === 'animation' ? '画布' : '预览'}
          {hasSvg && mobilePanel === 'chat' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* === 主区域：非合成 ≈ 50/50；合成 = 左侧素材+对话窄栏 + 右侧大画布 === */}
      <div className="flex-1 flex flex-col lg:flex-row lg:items-stretch min-h-0 overflow-hidden">

        {/* ---- 左栏：对话；合成时顶部为「搭景」素材区 ---- */}
        <div className={`flex flex-col min-h-0 min-w-0 border-white/10
          ${mode === 'animation'
            ? 'flex-1 lg:flex-none lg:w-[min(100%,380px)] lg:max-w-[40%] lg:border-r lg:bg-[#080a14]/80'
            : 'flex-1 lg:w-1/2 lg:max-w-[50%] lg:flex-none'}
          ${mobilePanel === 'preview' ? 'hidden lg:flex' : 'flex'}`}>

          {mode === 'animation' && (
            <div className="flex-none border-b border-purple-500/25 bg-gradient-to-br from-purple-950/50 via-[#0d1020]/90 to-transparent px-3 py-3 space-y-2.5 max-h-[min(46vh,380px)] lg:max-h-[42%] overflow-y-auto overscroll-contain">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-purple-100/95 flex items-center gap-1.5">
                  <Layers size={15} className="text-purple-300 shrink-0" /> 搭景
                </span>
                <span className="text-[10px] text-indigo-400/50 hidden sm:block whitespace-nowrap">画廊</span>
              </div>
              <p className="text-[10px] text-indigo-300/65 leading-relaxed">
                选场景作底图 → 再选宠物与可选道具 → <strong className="text-emerald-300/90">生成本地合成</strong>。预览在右栏大画布。
              </p>
              <div className="space-y-2">
                <label className="block space-y-1">
                  <span className="text-[10px] font-semibold text-indigo-200/90 flex items-center gap-1"><ImagePlus size={11} /> 背景（场景）</span>
                  <select value={pickSceneId} onChange={(e) => setPickSceneId(e.target.value)}
                    className="w-full rounded-lg bg-black/30 border border-white/10 px-2.5 py-2 text-xs text-indigo-50">
                    <option value="">从画廊选择场景…</option>
                    {creationsByType.scene.map((c) => (
                      <option key={c.id} value={c.id} title={c.name}>{shortenForSelectLabel(c.name, 26)}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-semibold text-indigo-200/90 flex items-center gap-1"><Cat size={11} /> 宠物（角色）</span>
                  <select value={pickCharacterId} onChange={(e) => setPickCharacterId(e.target.value)}
                    className="w-full rounded-lg bg-black/30 border border-white/10 px-2.5 py-2 text-xs text-indigo-50">
                    <option value="">从画廊选择角色…</option>
                    {creationsByType.character.map((c) => (
                      <option key={c.id} value={c.id} title={c.name}>{shortenForSelectLabel(c.name, 26)}</option>
                    ))}
                  </select>
                </label>
              </div>
              {creationsByType.prop.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-indigo-200/90 flex items-center gap-1"><Package size={11} /> 道具（多选，在宠物上层）</span>
                  <div className="flex flex-wrap gap-1">
                    {creationsByType.prop.map((c) => (
                      <button key={c.id} type="button" onClick={() => togglePropPick(c.id)}
                        className={`px-2 py-1 rounded-md text-[10px] border ${
                          pickPropIds.includes(c.id) ? 'bg-amber-500/35 border-amber-400/50 text-amber-50' : 'bg-white/5 border-white/10 text-indigo-200/80'
                        }`} title={c.name}>{shortenForSelectLabel(c.name, 16)}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1.5 pt-0.5">
                <button type="button" onClick={composeLocalPreview} disabled={streaming || !pickSceneId || !pickCharacterId}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20">
                  <Sparkles size={15} /> 生成本地合成
                </button>
                <button type="button" onClick={insertCompositeFromGallery} disabled={streaming}
                  className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-indigo-200/80 hover:bg-white/10">
                  改走 AI 全文生成（易截断）
                </button>
              </div>
            </div>
          )}

          {/* 聊天消息 */}
          <div className={`flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 sm:px-3 sm:py-3 space-y-2 min-h-0 ${mode === 'animation' ? 'lg:border-t lg:border-white/5' : ''}`}>
            {messages.length === 0 && (
              <p className="text-indigo-200/50 text-xs sm:text-sm text-center py-6 px-3">{emptyHint}</p>
            )}
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const isLast = i === messages.length - 1;
              const streamingAssistant = !isUser && streaming && isLast;

              if (isUser) {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 py-2 text-xs sm:text-sm break-words bg-indigo-600/40 text-indigo-50">
                      {stripUserPromptPrefixForDisplay(msg.content, mode)}
                    </div>
                  </div>
                );
              }

              if (streamingAssistant) {
                return (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 py-3 text-sm border border-indigo-400/25 bg-indigo-500/10 text-indigo-50">
                      <div className="flex items-center gap-2 font-medium">
                        <Loader2 className="shrink-0 animate-spin text-indigo-300" size={18} />
                        正在生成像素图…
                      </div>
                      <p className="text-[11px] text-indigo-200/55 mt-2 leading-relaxed">
                        无需阅读代码，生成完成后在右侧「预览」查看即可。
                      </p>
                    </div>
                  </div>
                );
              }

              const extracted = extractSvgFromAssistantText(msg.content);
              const hasSvgBubble = Boolean(extracted && isProbablySafeSvg(extracted));
              const proseOnly = msg.content.replace(/```(?:svg|html)?\s*[\s\S]*?```/gi, '').replace(/\*+/g, '').trim();
              const isLocalComposite = /本地叠加|未经大模型重绘|本地合成/.test(msg.content);
              const linkedRecord = msg.galleryLinkedId ? getCreation(msg.galleryLinkedId) : undefined;
              const svgInGallery = Boolean(linkedRecord);
              const saveThisDisabled = streaming && isLast;

              if (hasSvgBubble && !svgCodeExpanded[i]) {
                return (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 py-2.5 text-sm border border-emerald-500/30 bg-emerald-500/[0.12] text-indigo-50 shadow-sm shadow-emerald-900/20">
                      <div className="flex items-center gap-2 font-semibold text-emerald-100/95">
                        <Sparkles className="shrink-0 text-emerald-300" size={16} />
                        {isLocalComposite ? '本地合成完成' : '已生成像素图'}
                      </div>
                      <div className="mt-1.5 space-y-1.5">
                        {svgInGallery ? (
                          <p className="text-[11px] text-emerald-200/85 leading-relaxed">
                            ✓ 已自动保存到画廊，与本轮对话绑定。可在底部「画廊」查看或删除。
                          </p>
                        ) : (
                          <>
                            <p className="text-[11px] text-amber-100/80 leading-relaxed">
                              {msg.galleryLinkedId
                                ? '检测到本条已从画廊中移除，可重新保存这一条生成的图。'
                                : '本条尚未在画廊中，或需要手动补存。'}
                            </p>
                            <button
                              type="button"
                              disabled={saveThisDisabled}
                              onClick={() => handleSaveMessageAt(i)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/70 hover:bg-indigo-500/90 text-[11px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Save size={12} /> 保存到画廊
                            </button>
                          </>
                        )}
                      </div>
                      {mode === 'character' && svgInGallery && isLast ? (
                        <p className="text-[10px] text-indigo-300/65 mt-1.5">要在主页换上这只宠物，请用左下角「应用」。</p>
                      ) : null}
                      {proseOnly ? (
                        <p className="text-[11px] text-indigo-300/70 mt-2 line-clamp-3 whitespace-pre-wrap">{proseOnly}</p>
                      ) : null}
                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 items-center">
                        <button
                          type="button"
                          className="text-[11px] text-indigo-400/90 hover:text-indigo-200 underline underline-offset-2"
                          onClick={() => setSvgCodeExpanded((prev) => ({ ...prev, [i]: true }))}
                        >
                          查看原始 SVG（调试用）
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-300/95 hover:text-sky-100"
                          onClick={() => downloadSvgFromAssistantIndex(i)}
                          title="下载本条对话生成的 SVG 文件"
                        >
                          <Download size={12} /> 下载 SVG
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              if (hasSvgBubble && svgCodeExpanded[i]) {
                return (
                  <div key={i} className="flex justify-start w-full min-w-0">
                    <div className="max-w-[92%] sm:max-w-[88%] rounded-2xl px-3 py-2 text-xs sm:text-sm bg-white/5 text-indigo-100/90 border border-white/10">
                      <button
                        type="button"
                        className="mb-2 text-[11px] font-medium text-indigo-400 hover:text-indigo-200"
                        onClick={() => setSvgCodeExpanded((prev) => ({ ...prev, [i]: false }))}
                      >
                        收起代码
                      </button>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {svgInGallery ? (
                          <span className="text-[11px] text-emerald-300/90">✓ 此条已在画廊中</span>
                        ) : (
                          <>
                            <span className="text-[11px] text-amber-200/80">
                              {msg.galleryLinkedId ? '画廊中已删，可重存' : '未在画廊'}
                            </span>
                            <button
                              type="button"
                              disabled={saveThisDisabled}
                              onClick={() => handleSaveMessageAt(i)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600/60 text-[10px] font-medium text-white disabled:opacity-40"
                            >
                              <Save size={11} /> 保存到画廊
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-sky-600/35 text-sky-100 text-[10px] font-medium hover:bg-sky-600/50"
                          onClick={() => downloadSvgFromAssistantIndex(i)}
                          title="下载 SVG"
                        >
                          <Download size={11} /> 下载
                        </button>
                      </div>
                      <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all text-[10px] leading-snug font-mono text-indigo-200/80 bg-black/30 rounded-lg p-2 border border-white/5">
                        {msg.content}
                      </pre>
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 py-2 text-xs sm:text-sm break-words bg-white/5 text-indigo-100/90 border border-white/5">
                    {msg.content || '…'}
                  </div>
                </div>
              );
            })}
            {error && <p className="text-red-400 text-xs text-center bg-red-500/10 rounded-lg py-1.5 px-2">{error}</p>}
            <div ref={chatEndRef} />
          </div>

          {/* 输入栏；合成模式弱化占位（主路径是本地合成） */}
          <div className="flex-none px-2 py-2 sm:px-3 flex gap-2 border-t border-white/10 bg-black/10">
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={mode === 'animation'
                ? '可选：AI 补充说明（非必须）…'
                : '描述需求…（Enter 发送）'}
              rows={mode === 'animation' ? 1 : 2} disabled={streaming}
              className={`flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-indigo-300/30 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 ${mode === 'animation' ? 'text-xs py-1.5' : ''}`}
            />
            {streaming ? (
              <button type="button" onClick={stop} className="px-3 rounded-xl bg-rose-500/30 text-rose-200 text-xs font-medium self-end h-9">停止</button>
            ) : (
              <button type="button" onClick={send} disabled={!input.trim()}
                className="px-3 rounded-xl bg-indigo-500 text-white flex items-center gap-1 disabled:opacity-40 self-end text-sm h-9">
                <Send size={14} />
              </button>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex-none flex flex-wrap items-center gap-1.5 px-2 pb-1.5 sm:px-3 sm:pb-2">
            {mode === 'character' && (
              <ActionBtn icon={<UserCircle2 size={12} />} label="应用" variant="green" onClick={handleApplyCharacter} disabled={!lastAssistantSvg || streaming} />
            )}
            <ActionBtn icon={<History size={12} />} label="暂存对话" variant="violet" onClick={pushToHistory} disabled={streaming || messages.length === 0} title="只保存聊天记录到本机，点底部「历史」可恢复聊天，不会出现在画廊里" />
            <ActionBtn icon={<Trash2 size={12} />} label="清空" onClick={clearChat} disabled={streaming} />
          </div>
        </div>

        {/* ---- 预览 / 画布（合成时尽量占满右半屏） ---- */}
        <div className={`
          flex flex-col bg-black/30 border-white/10 overflow-hidden min-w-0
          ${mobilePanel === 'chat' ? 'hidden lg:flex' : 'flex-1'}
          ${mode === 'animation'
            ? 'lg:flex-1 lg:min-w-0 lg:border-l lg:border-t-0'
            : 'lg:w-1/2 lg:max-w-[50%] lg:flex-none lg:border-l lg:border-t-0'}
        `}>
          <div className="flex-none px-3 py-2 text-xs font-semibold text-indigo-200/60 flex items-center gap-1.5 border-b border-white/5">
            <Sparkles size={14} /> {mode === 'animation' ? '画布' : '预览'}
          </div>
          <div className="flex-1 flex items-center justify-center p-3 sm:p-6 min-h-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}>
            {lastAssistantSvg ? (
              <img src={svgToDataUri(lastAssistantSvg)} alt="preview"
                className="max-w-[96%] lg:max-w-full w-auto h-auto object-contain drop-shadow-2xl max-h-[52vh] lg:max-h-[min(78vh,720px)]"
                style={{ imageRendering: 'pixelated' }} />
            ) : (
              <div className="text-center space-y-3 px-4">
                <Sparkles className="w-10 h-10 text-indigo-400/15 mx-auto" />
                <p className="text-indigo-300/45 text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">
                  {mode === 'animation' ? '在左侧选好场景与角色后，点「生成本地合成」即可在此查看。' : '等待 SVG 输出…'}
                </p>
              </div>
            )}
          </div>

          {lastAssistantSvg && (
            <div className="flex-none flex flex-wrap items-center justify-center gap-2 px-3 pb-3 lg:hidden">
              {mode === 'character' && (
                <ActionBtn icon={<UserCircle2 size={12} />} label="应用角色" variant="green" onClick={handleApplyCharacter} disabled={streaming} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* === 画廊条（紧贴底部 Dock 上方展开） === */}
      {showGallery && (
        <div className="flex-none border-t border-white/10 bg-black/30">
          <div className="overflow-x-auto flex gap-1.5 px-2 py-2 sm:gap-2 sm:px-3 max-h-[100px] sm:max-h-[120px]">
            {gallery.length === 0 && <span className="text-indigo-300/30 text-xs py-2 px-1">画廊暂无素材</span>}
            {gallery.map((c) => (
              <GalleryThumb key={c.id} record={c}
                onDelete={() => { deleteCreation(c.id); setGalleryTick((t) => t + 1); }}
                onApplyCharacter={onApplyCharacter} />
            ))}
          </div>
        </div>
      )}

      {/* === 底部创作 Dock（替代原宠物页房间导航） === */}
      <div className="flex-none border-t border-white/10 bg-[#070914]/95 backdrop-blur-xl pb-[max(10px,env(safe-area-inset-bottom))] z-[85] shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
        <div className="flex items-stretch gap-1.5 px-2 pt-2">
          <div className="flex-1 flex items-center gap-1 overflow-x-auto py-0.5 [&::-webkit-scrollbar]:h-0">
            {MODE_TABS.map(({ id, label }) => (
              <button key={id} type="button" disabled={streaming} onClick={() => goMode(id)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                  mode === id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-900/30' : 'bg-white/5 text-indigo-200/80 hover:bg-white/10'
                }`}
              >{label}</button>
            ))}
          </div>
          <button
            type="button"
            disabled={streaming}
            onClick={() => setShowHistory((v) => !v)}
            className={`shrink-0 flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl border text-[10px] font-medium min-w-[3rem] transition-colors ${
              showHistory ? 'bg-violet-500/25 border-violet-400/40 text-violet-100' : 'bg-white/5 border-white/10 text-indigo-200/70 hover:bg-white/10'
            }`}
            title="查看「暂存对话」列表，恢复聊天内容（不是画廊）"
          >
            <History size={16} />
            <span>历史</span>
          </button>
          <button
            type="button"
            onClick={() => setShowGallery((v) => !v)}
            className={`shrink-0 flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl border text-[10px] font-medium min-w-[3rem] transition-colors ${
              showGallery ? 'bg-amber-500/20 border-amber-400/40 text-amber-100' : 'bg-white/5 border-white/10 text-indigo-200/70 hover:bg-white/10'
            }`}
            title="画廊"
          >
            <Images size={16} />
            <span>画廊{gallery.length > 0 ? ` ${gallery.length}` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, variant, className = '', title: tip, onClick, disabled }: {
  icon: React.ReactNode; label: string; variant?: 'green' | 'violet'; className?: string;
  title?: string;
  onClick?: () => void; disabled?: boolean;
}) {
  const base = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-colors disabled:opacity-40';
  const colors = variant === 'green'
    ? 'bg-emerald-600/50 hover:bg-emerald-600/70 text-emerald-100'
    : variant === 'violet'
    ? 'bg-violet-500/30 hover:bg-violet-500/50 text-violet-100'
    : 'bg-white/10 hover:bg-white/15 text-indigo-200/80';
  return (
    <button type="button" title={tip} onClick={onClick} disabled={disabled} className={`${base} ${colors} ${className}`}>
      {icon}{label}
    </button>
  );
}

function GalleryThumb({ record, onDelete, onApplyCharacter }: {
  record: CreationRecord; onDelete: () => void; onApplyCharacter?: (id: string) => void;
}) {
  return (
    <div className="flex-shrink-0 w-16 sm:w-20 flex flex-col rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      <div className="h-12 sm:h-14 flex items-center justify-center bg-[#0b0e14] p-0.5">
        <img src={svgToDataUri(record.svgData)} alt={record.name}
          className="max-w-full max-h-full object-contain" style={{ imageRendering: 'pixelated' }} />
      </div>
      <div className="px-1 py-0.5 flex flex-col gap-0.5">
        <span className="text-[9px] sm:text-[10px] text-indigo-100/80 truncate text-center" title={record.name}>
          {record.type === 'animation' ? '🎬' : ''}{shortenForSelectLabel(record.name, 10)}
        </span>
        <div className="flex gap-0.5 justify-center">
          {record.type === 'character' && onApplyCharacter && (
            <button type="button" title="应用" onClick={() => onApplyCharacter(record.id)}
              className="px-1 rounded bg-emerald-500/30 text-emerald-200 text-[9px]">用</button>
          )}
          <button
            type="button"
            title="下载 SVG"
            onClick={() => downloadSvgAsFile(record.svgData, record.name)}
            className="p-0.5 rounded bg-sky-500/25 text-sky-200 hover:bg-sky-500/40"
          >
            <Download size={10} />
          </button>
          <button type="button" title="删除" onClick={onDelete} className="p-0.5 rounded bg-rose-500/20 text-rose-300">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
