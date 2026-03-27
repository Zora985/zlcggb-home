import { getUserPromptPrefix, type CreatorMode } from './creatorPrompts';

const MODE_FALLBACK: Record<CreatorMode, string> = {
  character: '角色',
  scene: '场景',
  prop: '道具',
  animation: '合成',
};

function timeSuffix(): string {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 下拉、标签用：过长则截断，完整内容用 title= 展示 */
export function shortenForSelectLabel(name: string, maxLen = 22): string {
  const t = name.replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

function clipSegment(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** 合成页保存时：用画廊里场景/角色已存名称拼短标题（兼容旧数据里的长名） */
export function shortCompositeDisplayName(chName: string, scName: string, propCount: number): string {
  let base = `合成·${clipSegment(chName, 14)}·${clipSegment(scName, 12)}`;
  if (propCount > 0) base += `·道具×${propCount}`;
  return clipSegment(base, 40);
}

/**
 * 从工坊对话里「用户气泡」原文生成画廊短标题（去掉 API 前缀、合成摘要等）
 */
export function deriveCreationShortName(userBubbleContent: string, mode: CreatorMode): string {
  const prefix = getUserPromptPrefix(mode);
  let t = userBubbleContent.trim();
  if (t.startsWith(prefix)) t = t.slice(prefix.length).trim();

  const local = /^【本地合成】\s*(.+)$/s.exec(t);
  if (local) {
    const body = local[1].trim();
    const segments = body
      .split(/\s*\/\s*/)
      .map((s) => s.replace(/\s*道具×\d+\s*$/, '').trim())
      .filter(Boolean);
    if (segments.length) {
      const label = segments.map((s) => clipSegment(s, 12)).join('·');
      return clipSegment(`合成·${label}`, 40);
    }
  }

  t = t.split(/\n\n（注意：/)[0]?.trim() ?? t;
  t = t.split(/\n\n请基于以上素材/)[0]?.trim() ?? t;

  const line = (t.split('\n').find((L) => L.trim().length > 0) ?? t).trim();
  let name = line.replace(/^[：:【\s]+/, '').replace(/^\(\s*可选\s*AI\s*\)[^\n]*/i, '').trim();
  name = name.replace(/[。；;\s]+$/u, '').trim();
  if (!name) return `${MODE_FALLBACK[mode]}·${timeSuffix()}`;

  return clipSegment(name, 32);
}

/** 聊天里用户气泡展示：去掉发给模型的固定前缀，便于阅读 */
export function stripUserPromptPrefixForDisplay(userBubbleContent: string, mode: CreatorMode): string {
  const prefix = getUserPromptPrefix(mode);
  const t = userBubbleContent.trim();
  return t.startsWith(prefix) ? t.slice(prefix.length).trim() : t;
}
