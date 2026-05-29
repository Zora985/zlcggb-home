import type { CreatorMode } from './creatorPrompts';

const STORAGE_KEY = 'zlcggb-pet-creations-v1';

export interface CreationRecord {
  id: string;
  type: Exclude<CreatorMode, never>;
  name: string;
  description: string;
  svgData: string;
  prompt: string;
  createdAt: number;
}

function safeParse(raw: string | null): CreationRecord[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as CreationRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function getCreations(type?: CreationRecord['type']): CreationRecord[] {
  const list = safeParse(localStorage.getItem(STORAGE_KEY));
  if (!type) return list.sort((a, b) => b.createdAt - a.createdAt);
  return list.filter((c) => c.type === type).sort((a, b) => b.createdAt - a.createdAt);
}

export function getCreation(id: string): CreationRecord | undefined {
  return safeParse(localStorage.getItem(STORAGE_KEY)).find((c) => c.id === id);
}

export function saveCreation(record: Omit<CreationRecord, 'id' | 'createdAt'> & { id?: string }): CreationRecord {
  const list = safeParse(localStorage.getItem(STORAGE_KEY));
  const id = record.id || `cr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const full: CreationRecord = {
    id,
    type: record.type,
    name: record.name.slice(0, 80),
    description: record.description.slice(0, 500),
    svgData: record.svgData,
    prompt: record.prompt.slice(0, 4000),
    createdAt: Date.now(),
  };
  const next = list.filter((c) => c.id !== id);
  next.push(full);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return full;
}

export function deleteCreation(id: string): void {
  const list = safeParse(localStorage.getItem(STORAGE_KEY)).filter((c) => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

/** 将 SVG 字符串转为可供 <img src> 使用的 data URI */
export function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg.replace(/\s+/g, ' ').trim());
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/** 从模型输出中提取第一个完整 SVG 或 JSON 配置 */
export function extractSvgFromAssistantText(text: string): string | null {
  // 优先匹配 JSON 配置（template/seed/baseShape 配置）
  const jsonFence = /```(?:json)?\s*([\s\S]*?)```/gi;
  let jm: RegExpExecArray | null;
  while ((jm = jsonFence.exec(text)) !== null) {
    const inner = jm[1].trim();
    if (inner.startsWith('{') && (inner.includes('"template"') || inner.includes('"seed"') || inner.includes('baseShape'))) {
      return inner;
    }
  }

  // 降级匹配完整裸露的 JSON
  const startJson = text.indexOf('{');
  if (startJson !== -1) {
    const endJson = text.lastIndexOf('}');
    if (endJson !== -1 && (text.includes('"template"') || text.includes('"seed"') || text.includes('"baseShape"'))) {
       return text.slice(startJson, endJson + 1).trim();
    }
  }

  // 匹配传统 SVG（兼容旧场景）
  const fence = /```(?:svg|html)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text)) !== null) {
    const inner = m[1].trim();
    if (inner.includes('<svg')) {
      const s = inner.indexOf('<svg');
      const e = inner.lastIndexOf('</svg>');
      if (e !== -1) return inner.slice(s, e + 6).trim();
    }
  }
  const start = text.indexOf('<svg');
  if (start === -1) return null;
  const end = text.indexOf('</svg>', start);
  if (end === -1) return null;
  return text.slice(start, end + 6).trim();
}

/** 校验是否为可解析的代码（SVG 防 XSS，JSON 信任解析器） */
export function isProbablySafeSvg(svg: string): boolean {
  const trimmed = svg.trim();
  if (trimmed.startsWith('{')) return true; // JSON is safe because we parse it locally
  
  const lower = trimmed.toLowerCase();
  if (!lower.includes('<svg')) return false;
  if (/<script|on\w+\s*=|href\s*=\s*["']?\s*javascript:/i.test(svg)) return false;
  return true;
}
