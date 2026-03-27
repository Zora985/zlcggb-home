/**
 * OpenAI 兼容 Chat Completions API（流式 SSE）
 */

const getBaseUrl = () =>
  (import.meta.env.VITE_LLM_API_BASE_URL || '').replace(/\/$/, '');

const getApiKey = () => import.meta.env.VITE_LLM_API_KEY || '';

const getModel = () => import.meta.env.VITE_LLM_MODEL || 'gpt-4o';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type StreamChatOptions = {
  messages: ChatMessage[];
  onDelta: (text: string) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
};

export function isAiConfigured(): boolean {
  return Boolean(getBaseUrl() && getApiKey());
}

export async function streamChatCompletion({
  messages,
  onDelta,
  onDone,
  onError,
  signal,
}: StreamChatOptions): Promise<void> {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) {
    onError?.(new Error('请配置 VITE_LLM_API_BASE_URL 与 VITE_LLM_API_KEY（见 .env.example）'));
    return;
  }

  const url = `${base}/chat/completions`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: getModel(),
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 8192,
      }),
      signal,
    });
  } catch (e) {
    onError?.(e instanceof Error ? e : new Error(String(e)));
    return;
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = (j as { error?: { message?: string } }).error?.message || JSON.stringify(j);
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* noop */
      }
    }
    onError?.(new Error(`API ${res.status}: ${detail}`));
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError?.(new Error('响应无 body'));
    return;
  }

  const dec = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') {
          onDone?.();
          return;
        }
        try {
          const parsed = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const piece = parsed.choices?.[0]?.delta?.content;
          if (piece) onDelta(piece);
        } catch {
          /* 非 JSON 行忽略 */
        }
      }
    }
    onDone?.();
  } catch (e) {
    if ((e as Error).name === 'AbortError') return;
    onError?.(e instanceof Error ? e : new Error(String(e)));
  }
}
