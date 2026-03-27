import type { CreatorMode } from './creatorPrompts';

const SESSION_KEY = 'zlcggb-workshop-session-v1';
const HISTORY_KEY = 'zlcggb-workshop-history-v1';
const MAX_HISTORY = 40;

export type WorkshopChatMsg = {
  role: 'user' | 'assistant';
  content: string;
  /** 本条助手回复对应的画廊条目 id；若在画廊中已删除则 getCreation 为空，用于显示「再次保存」 */
  galleryLinkedId?: string;
};

export interface WorkshopTabSnapshot {
  messages: WorkshopChatMsg[];
  inputDraft: string;
  updatedAt: number;
}

export type WorkshopSessionV1 = Partial<Record<CreatorMode, WorkshopTabSnapshot>>;

export interface WorkshopHistoryEntry {
  id: string;
  mode: CreatorMode;
  title: string;
  messages: WorkshopChatMsg[];
  inputDraft: string;
  createdAt: number;
}

function safeSession(raw: string | null): WorkshopSessionV1 {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as WorkshopSessionV1;
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

export function loadWorkshopSession(): WorkshopSessionV1 {
  return safeSession(localStorage.getItem(SESSION_KEY));
}

export function getWorkshopTabSnapshot(mode: CreatorMode): WorkshopTabSnapshot | undefined {
  const s = loadWorkshopSession()[mode];
  if (!s || !Array.isArray(s.messages)) return undefined;
  return {
    messages: s.messages,
    inputDraft: typeof s.inputDraft === 'string' ? s.inputDraft : '',
    updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : 0,
  };
}

export function saveWorkshopTabSnapshot(
  mode: CreatorMode,
  snapshot: Pick<WorkshopTabSnapshot, 'messages' | 'inputDraft'>,
): void {
  const all = loadWorkshopSession();
  all[mode] = {
    messages: snapshot.messages,
    inputDraft: snapshot.inputDraft,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(all));
  } catch {
    /* quota */
  }
}

function safeHistory(raw: string | null): WorkshopHistoryEntry[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as WorkshopHistoryEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function loadWorkshopHistory(): WorkshopHistoryEntry[] {
  return safeHistory(localStorage.getItem(HISTORY_KEY)).sort((a, b) => b.createdAt - a.createdAt);
}

export function appendWorkshopHistory(entry: Omit<WorkshopHistoryEntry, 'id' | 'createdAt'>): WorkshopHistoryEntry {
  const list = safeHistory(localStorage.getItem(HISTORY_KEY));
  const full: WorkshopHistoryEntry = {
    id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    ...entry,
  };
  const next = [full, ...list].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return full;
}

export function deleteWorkshopHistoryEntry(id: string): void {
  const next = safeHistory(localStorage.getItem(HISTORY_KEY)).filter((h) => h.id !== id);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
}
