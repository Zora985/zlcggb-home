import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles, Trash2, Save, UserCircle2, History, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { streamChatCompletion, isAiConfigured, type ChatMessage } from '../../lib/aiClient';
import { getSystemPrompt, getUserPromptPrefix, truncateSvgForPrompt, type CreatorMode } from '../../lib/creatorPrompts';
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

interface CreatorWorkshopProps {
  onApplyCharacter?: (creationId: string) => void;
}

const MODE_TABS: { id: CreatorMode; label: string }[] = [
  { id: 'character', label: '角色' },
  { id: 'scene', label: '场景' },
  { id: 'prop', label: '道具' },
  { id: 'animation', label: '合成动画' },
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
  const abortRef = useRef<AbortController | null>(null);

  /** 合成动画：从画廊选的素材 id */
  const [pickCharacterId, setPickCharacterId] = useState('');
  const [pickSceneId, setPickSceneId] = useState('');
  const [pickPropIds, setPickPropIds] = useState<string[]>([]);

  const gallery = useMemo(() => getCreations(), [galleryTick]);
  const historyList = useMemo(() => loadWorkshopHistory(), [historyTick]);

  const creationsByType = useMemo(() => {
    return {
      character: getCreations('character'),
      scene: getCreations('scene'),
      prop: getCreations('prop'),
    };
  }, [galleryTick]);

  const lastAssistantSvg = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!last) return null;
    const svg = extractSvgFromAssistantText(last.content);
    if (!svg || !isProbablySafeSvg(svg)) return null;
    return svg;
  }, [messages]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  /** 切换标签：先暂存当前标签，再恢复目标标签 */
  const goMode = useCallback(
    (next: CreatorMode) => {
      if (next === mode || streaming) return;
      saveWorkshopTabSnapshot(mode, { messages, inputDraft: input });
      const snap = getWorkshopTabSnapshot(next);
      setMessages(snap?.messages ?? []);
      setInput(snap?.inputDraft ?? '');
      setMode(next);
      setError(null);
    },
    [mode, messages, input, streaming],
  );

  /** 输入与对话变更后自动暂存到当前标签（防抖） */
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
      setError('请先复制 .env.example 为 .env，并填写 VITE_LLM_* 变量');
      return;
    }
    setError(null);
    setInput('');

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
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: acc };
          }
          return copy;
        });
      },
      onDone: () => {
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
          if (last?.role === 'assistant' && !last.content) {
            copy[copy.length - 1] = { ...last, content: `（生成失败）${err.message}` };
          }
          return copy;
        });
      },
    });
  }, [input, streaming, mode, messages]);

  const handleSave = useCallback(() => {
    if (!lastAssistantSvg) {
      setError('当前没有可保存的 SVG，请等待生成完成');
      return;
    }
    const name =
      messages
        .filter((m) => m.role === 'user')
        .pop()
        ?.content.replace(/^[\s\S]*?生成[^：:]*[：:]\s*/i, '')
        .slice(0, 40)
        .trim() || `未命名${mode}`;
    saveCreation({
      type: mode,
      name,
      description: '',
      svgData: lastAssistantSvg,
      prompt: messages.map((m) => `${m.role}: ${m.content}`).join('\n---\n').slice(0, 4000),
    });
    setGalleryTick((t) => t + 1);
    setError(null);
  }, [lastAssistantSvg, messages, mode]);

  const handleApplyCharacter = useCallback(() => {
    if (!lastAssistantSvg || !isProbablySafeSvg(lastAssistantSvg)) return;
    const rec = saveCreation({
      type: 'character',
      name: messages.filter((m) => m.role === 'user').pop()?.content.slice(0, 40) || 'AI 角色',
      description: '从工坊应用',
      svgData: lastAssistantSvg,
      prompt: messages.map((m) => `${m.role}: ${m.content}`).join('\n---\n').slice(0, 4000),
    });
    setGalleryTick((t) => t + 1);
    onApplyCharacter?.(rec.id);
  }, [lastAssistantSvg, messages, onApplyCharacter]);

  const clearChat = useCallback(() => {
    stop();
    setMessages([]);
    setInput('');
    setError(null);
    saveWorkshopTabSnapshot(mode, { messages: [], inputDraft: '' });
  }, [stop, mode]);

  const pushToHistory = useCallback(() => {
    const firstUser = messages.find((m) => m.role === 'user');
    const title =
      firstUser?.content.replace(/^[\s\S]*?[：:]\s*/i, '').slice(0, 48).trim() ||
      `${MODE_TABS.find((x) => x.id === mode)?.label ?? mode} 对话`;
    appendWorkshopHistory({
      mode,
      title,
      messages: JSON.parse(JSON.stringify(messages)) as WorkshopChatMsg[],
      inputDraft: input,
    });
    setHistoryTick((h) => h + 1);
    setError(null);
  }, [messages, input, mode]);

  const restoreHistory = useCallback(
    (entry: WorkshopHistoryEntry) => {
      if (streaming) return;
      saveWorkshopTabSnapshot(mode, { messages, inputDraft: input });
      setMode(entry.mode);
      setMessages(entry.messages);
      setInput(entry.inputDraft);
      saveWorkshopTabSnapshot(entry.mode, { messages: entry.messages, inputDraft: entry.inputDraft });
      setShowHistory(false);
    },
    [streaming, mode, messages, input],
  );

  const insertCompositeFromGallery = useCallback(() => {
    const parts: string[] = [];
    const maxChunk = 3500;

    if (pickCharacterId) {
      const c = getCreation(pickCharacterId);
      if (c) {
        parts.push(`【角色】${c.name}\n${truncateSvgForPrompt(c.svgData, maxChunk)}`);
      }
    }
    if (pickSceneId) {
      const c = getCreation(pickSceneId);
      if (c) {
        parts.push(`【场景】${c.name}\n${truncateSvgForPrompt(c.svgData, maxChunk)}`);
      }
    }
    for (const pid of pickPropIds) {
      const c = getCreation(pid);
      if (c) {
        parts.push(`【道具】${c.name}\n${truncateSvgForPrompt(c.svgData, maxChunk)}`);
      }
    }

    if (parts.length === 0) {
      setError('请先在下方选择至少一个画廊素材，或直接在输入框描述需求');
      return;
    }

    const block = `${parts.join('\n\n---\n\n')}\n\n请基于以上素材与用户补充说明，输出一个合并后的、带适度 CSS 动画的完整场景 SVG。`;
    setInput((prev) => (prev.trim() ? `${prev.trim()}\n\n${block}` : block));
    setError(null);
  }, [pickCharacterId, pickSceneId, pickPropIds]);

  const togglePropPick = useCallback((id: string) => {
    setPickPropIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 8) return prev;
      return [...prev, id];
    });
  }, []);

  const emptyHint =
    mode === 'character'
      ? '描述你想要的像素风宠物角色，发送后 AI 会流式输出 SVG。切换「场景 / 道具 / 合成动画」时，当前对话会自动暂存在本机。'
      : mode === 'scene'
        ? '描述像素风房间或室外场景。各标签对话互不丢失，可随时切回继续改。'
        : mode === 'prop'
          ? '描述食物、玩具等小道具。可多生成几个道具，再到「合成动画」里组合。'
          : '从下方选择画廊中的角色、场景、道具（可先在各标签生成并保存），点「填入素材」再补充说明后发送，生成带动画的合成场景 SVG。';

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#0d1020] to-[#12142b] text-white overflow-hidden">
      <div className="flex-none flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/20">
        <span className="text-indigo-200/80 text-xs font-semibold mr-1">生成类型</span>
        {MODE_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            disabled={streaming}
            onClick={() => goMode(id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-indigo-200/70 hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={streaming}
          onClick={() => setShowHistory((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-[10px] text-indigo-200/80 hover:bg-white/10"
        >
          <History size={12} />
          历史
          {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {!isAiConfigured() && (
          <span className="text-amber-400/90 text-[10px] w-full sm:w-auto">未配置 API，请检查 .env</span>
        )}
      </div>

      {showHistory && (
        <div className="flex-none max-h-32 overflow-y-auto border-b border-white/10 bg-black/30 px-3 py-2 space-y-1">
          {historyList.length === 0 ? (
            <p className="text-indigo-300/40 text-[10px]">暂无。对话满意后点「存档到历史」可保留快照。</p>
          ) : (
            historyList.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-2 text-[10px] bg-white/5 rounded-lg px-2 py-1"
              >
                <span className="shrink-0 text-indigo-400/80">{MODE_TABS.find((x) => x.id === h.mode)?.label}</span>
                <span className="flex-1 truncate text-indigo-100/70" title={h.title}>
                  {h.title}
                </span>
                <button
                  type="button"
                  className="text-emerald-400/90 hover:underline"
                  onClick={() => restoreHistory(h)}
                >
                  恢复
                </button>
                <button
                  type="button"
                  className="text-rose-400/70"
                  onClick={() => {
                    deleteWorkshopHistoryEntry(h.id);
                    setHistoryTick((x) => x + 1);
                  }}
                >
                  删
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {mode === 'animation' && (
        <div className="flex-none border-b border-white/10 bg-purple-950/20 px-3 py-2 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-200/80">
            <Layers size={12} />
            从画廊选取素材填入提示（可先去「角色 / 场景 / 道具」生成并保存）
          </div>
          <div className="flex flex-wrap gap-2 items-center text-[10px]">
            <select
              value={pickCharacterId}
              onChange={(e) => setPickCharacterId(e.target.value)}
              className="rounded-lg bg-white/10 border border-white/10 px-2 py-1 text-indigo-100 max-w-[140px]"
            >
              <option value="">角色（可选）</option>
              {creationsByType.character.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={pickSceneId}
              onChange={(e) => setPickSceneId(e.target.value)}
              className="rounded-lg bg-white/10 border border-white/10 px-2 py-1 text-indigo-100 max-w-[140px]"
            >
              <option value="">场景（可选）</option>
              {creationsByType.scene.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-indigo-300/50 w-full">道具多选（最多 8 个）：</span>
            {creationsByType.prop.length === 0 ? (
              <span className="text-indigo-400/40 text-[10px]">暂无道具，请先到「道具」标签生成</span>
            ) : (
              creationsByType.prop.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => togglePropPick(c.id)}
                  className={`px-2 py-0.5 rounded text-[9px] border ${
                    pickPropIds.includes(c.id)
                      ? 'bg-amber-500/30 border-amber-400/50 text-amber-100'
                      : 'bg-white/5 border-white/10 text-indigo-200/70'
                  }`}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={insertCompositeFromGallery}
            disabled={streaming}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-purple-600/50 hover:bg-purple-600/70 font-medium"
          >
            将选中素材填入输入框
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="flex-1 flex flex-col min-h-0 min-w-0 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-indigo-200/50 text-sm text-center py-6 px-4">{emptyHint}</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[95%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/40 text-indigo-50'
                      : 'bg-white/5 text-indigo-100/90 border border-white/5'
                  }`}
                >
                  {msg.content || (streaming && i === messages.length - 1 ? '…' : '')}
                </div>
              </div>
            ))}
            {error && (
              <p className="text-red-400 text-xs text-center bg-red-500/10 rounded-lg py-2 px-3">{error}</p>
            )}
          </div>

          <div className="flex-none p-3 flex gap-2 border-t border-white/10">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="描述需求或补充说明…（Enter 发送，Shift+Enter 换行）"
              rows={3}
              disabled={streaming}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-indigo-300/30 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-[4.5rem]"
            />
            {streaming ? (
              <button
                type="button"
                onClick={stop}
                className="px-4 rounded-xl bg-rose-500/30 text-rose-200 text-sm font-medium self-end"
              >
                停止
              </button>
            ) : (
              <button
                type="button"
                onClick={send}
                disabled={!input.trim()}
                className="px-4 rounded-xl bg-indigo-500 text-white flex items-center gap-2 disabled:opacity-40 self-end"
              >
                <Send size={18} />
                发送
              </button>
            )}
          </div>

          <div className="flex-none flex flex-wrap gap-2 px-3 pb-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!lastAssistantSvg || streaming}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium hover:bg-white/15 disabled:opacity-40"
            >
              <Save size={14} /> 保存到画廊
            </button>
            {mode === 'character' && (
              <button
                type="button"
                onClick={handleApplyCharacter}
                disabled={!lastAssistantSvg || streaming}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/50 text-xs font-medium hover:bg-emerald-600/70 disabled:opacity-40"
              >
                <UserCircle2 size={14} /> 应用为当前宠物
              </button>
            )}
            <button
              type="button"
              onClick={pushToHistory}
              disabled={streaming || messages.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/30 text-xs font-medium hover:bg-violet-500/50 disabled:opacity-40"
            >
              <History size={14} /> 存档到历史
            </button>
            <button
              type="button"
              onClick={clearChat}
              disabled={streaming}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-indigo-200/70 hover:bg-white/10 disabled:opacity-40"
            >
              <Trash2 size={14} /> 清空本标签
            </button>
          </div>
        </div>

        <div className="flex-none lg:w-[min(100%,420px)] flex flex-col min-h-[200px] lg:min-h-0 bg-black/30">
          <div className="flex-none px-3 py-2 text-xs font-semibold text-indigo-200/60 flex items-center gap-2 border-b border-white/5">
            <Sparkles size={14} /> 实时预览
          </div>
          <div
            className="flex-1 flex items-center justify-center p-4 min-h-[180px]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {lastAssistantSvg ? (
              <img
                src={svgToDataUri(lastAssistantSvg)}
                alt="preview"
                className="max-w-full max-h-[min(55vh,360px)] object-contain drop-shadow-lg"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <p className="text-indigo-300/40 text-sm">等待 SVG 输出…</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-white/10 bg-black/25 max-h-[140px] flex flex-col">
        <div className="flex-none px-3 py-1.5 text-[10px] font-bold tracking-wider text-indigo-200/40 uppercase">
          已保存作品（含合成动画）
        </div>
        <div className="flex-1 overflow-x-auto flex gap-2 px-3 pb-3">
          {gallery.length === 0 && (
            <span className="text-indigo-300/30 text-xs py-2">暂无，生成后点「保存到画廊」</span>
          )}
          {gallery.map((c) => (
            <GalleryThumb
              key={c.id}
              record={c}
              onDelete={() => {
                deleteCreation(c.id);
                setGalleryTick((t) => t + 1);
              }}
              onApplyCharacter={onApplyCharacter}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function GalleryThumb({
  record,
  onDelete,
  onApplyCharacter,
}: {
  record: CreationRecord;
  onDelete: () => void;
  onApplyCharacter?: (id: string) => void;
}) {
  return (
    <div className="flex-shrink-0 w-24 flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="h-16 flex items-center justify-center bg-[#0b0e14] p-1">
        <img
          src={svgToDataUri(record.svgData)}
          alt={record.name}
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <div className="p-1 flex flex-col gap-0.5">
        <span className="text-[9px] text-indigo-100/80 truncate text-center" title={record.name}>
          {record.type === 'animation' ? '🎬 ' : ''}
          {record.name}
        </span>
        <div className="flex gap-0.5 justify-center">
          {record.type === 'character' && onApplyCharacter && (
            <button
              type="button"
              title="应用"
              onClick={() => onApplyCharacter(record.id)}
              className="p-0.5 rounded bg-emerald-500/30 text-emerald-200 text-[9px] px-1"
            >
              用
            </button>
          )}
          <button type="button" title="删除" onClick={onDelete} className="p-0.5 rounded bg-rose-500/20 text-rose-300">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
