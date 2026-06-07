const DEFAULT_API_BASE = "http://127.0.0.1:8000";
const STORAGE_KEY = "OllamaRAG.apiBase";
// const STORAGE_KEY = "RagFlow.apiBase";

export function normalizeBase(url: string): string {
  let u = (url || "").trim();
  if (!u) return DEFAULT_API_BASE;
  if (!/^https?:\/\//i.test(u)) u = "http://" + u;
  return u.replace(/\/+$/, "");
}

let _API_BASE: string =
  (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) || DEFAULT_API_BASE;

export const getApiBase = () => _API_BASE;
export const setApiBase = (url: string) => {
  _API_BASE = normalizeBase(url);
  try { localStorage.setItem(STORAGE_KEY, _API_BASE); } catch {}
  return _API_BASE;
};
export const API_BASE_DEFAULT = DEFAULT_API_BASE;

async function jfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => res.statusText)}`);
  const ct = res.headers.get("content-type") || "";
  return (ct.includes("application/json") ? await res.json() : ((await res.text()) as unknown)) as T;
}

export interface ChatSource {
  filename?: string;
  page?: number;
  score?: number;
  text?: string;
  [k: string]: unknown;
}

export interface ChatResponse {
  answer?: string;
  response?: string;
  sources?: ChatSource[];
  model?: string;
  response_time?: number;
  [k: string]: unknown;
}

export const api = {
  // Health
  health: () => jfetch<Record<string, unknown>>("/health/"),

  // Models
  listModels: () => jfetch<{ models?: Array<{ name: string } | string>; [k: string]: unknown }>("/models/"),
  currentModel: async () => {
    const res = await jfetch<Record<string, unknown>>('/models/current');
    // backend returns { current_model: "qwen2.5:7b" }
    const model = (res.current_model as string) || (res.current as string) || (res.model as string) || '';
    return { model };
  },
  selectModel: (model: string) =>
    jfetch<Record<string, unknown>>('/models/select', {
      method: 'POST',
      body: JSON.stringify({ model_name: model }),
    }),

  // Settings
  getSettings: () => jfetch<Record<string, unknown>>("/settings/"),
  updateSettings: (settings: Record<string, unknown>) =>
    jfetch<Record<string, unknown>>("/settings/", {
      method: "POST",
      body: JSON.stringify(settings),
    }),

  // Documents
  listDocuments: () => jfetch<{ documents?: Array<Record<string, unknown>>; [k: string]: unknown }>("/documents/"),
  documentStats: () => jfetch<Record<string, unknown>>("/documents/stats"),
  deleteDocument: (filename: string) =>
    jfetch<Record<string, unknown>>(`/documents/${encodeURIComponent(filename)}`, { method: "DELETE" }),
  clearDocuments: () => jfetch<Record<string, unknown>>("/documents/", { method: "DELETE" }),

  // Upload
  upload: async (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${getApiBase()}/upload/`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({ raw: xhr.responseText }); }
        } else reject(new Error(`${xhr.status} ${xhr.responseText}`));
      };
      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.send(form);
    });
  },

  // Chat
  chat: (query: string) =>
    jfetch<ChatResponse>("/chat/", { method: "POST", body: JSON.stringify({ query }) }),

  chatDebug: (query: string) =>
    jfetch<Record<string, unknown>>("/chat/debug", { method: "POST", body: JSON.stringify({ query }) }),

  // Streaming chat — yields text chunks
  async *chatStream(query: string, signal?: AbortSignal): AsyncGenerator<string, ChatResponse | null> {
    const res = await fetch(`${getApiBase()}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal,
    });
    if (!res.ok || !res.body) throw new Error(`${res.status} ${res.statusText}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let final: ChatResponse | null = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // NDJSON or SSE-like streams: split by newline and parse each JSON line
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        // support SSE `data: {...}` prefix
        const payload = line.startsWith('data:') ? line.slice(5).trim() : line;
        if (!payload) continue;
        // ignore sentinel
        if (payload === '[DONE]') continue;
        try {
          const obj = JSON.parse(payload) as Record<string, any>;
          // token / chunk style
          if (obj.type === 'token' && (obj.content || obj.token)) {
            yield String(obj.content ?? obj.token);
          } else if (obj.type === 'chunk' && obj.content) {
            yield String(obj.content);
          } else if (obj.type === 'done') {
            // final metadata
            final = { ...(final || {}), ...(obj as ChatResponse) };
          } else if (obj.content && typeof obj.content === 'string') {
            // fallback for objects that use content
            yield String(obj.content);
          } else if (obj.answer && typeof obj.answer === 'string') {
            final = { ...(final || {}), ...(obj as ChatResponse) };
            // do not yield raw JSON; if answer present, append its text
            yield String(obj.answer);
          } else if (obj.model || obj.sources || obj.citations) {
            final = { ...(final || {}), ...(obj as ChatResponse) };
          }
          // otherwise ignore non-text objects to avoid printing raw JSON
        } catch {
          // non-json line — ignore to avoid raw JSON rendering
          continue;
        }
      }
    }
    if (buffer.trim()) {
      const tail = buffer.trim();
      try {
        const obj = JSON.parse(tail) as Record<string, any>;
        if (obj.type === 'token' && (obj.content || obj.token)) yield String(obj.content ?? obj.token);
        else if (obj.answer && typeof obj.answer === 'string') { final = { ...(final || {}), ...(obj as ChatResponse) }; yield String(obj.answer); }
        else if (obj.model || obj.sources) final = { ...(final || {}), ...(obj as ChatResponse) };
      } catch {
        // ignore leftover non-json tail to avoid rendering raw JSON
      }
    }
    return final;
  },
};
