import { create } from "zustand";
import type { ChatSource } from "./api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  model?: string;
  responseTime?: number;
  streaming?: boolean;
  error?: string;
}

interface UIState {
  sidebarOpen: boolean;
  debugOpen: boolean;
  settingsOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  setDebugOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  sidebarOpen: true,
  debugOpen: false,
  settingsOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setDebugOpen: (v) => set({ debugOpen: v }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
}));

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  addMessage: (m: ChatMessage) => void;
  appendToLast: (delta: string) => void;
  patchLast: (patch: Partial<ChatMessage>) => void;
  setStreaming: (v: boolean) => void;
  clear: () => void;
}

export const useChat = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  appendToLast: (delta) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last) msgs[msgs.length - 1] = { ...last, content: last.content + delta };
      return { messages: msgs };
    }),
  patchLast: (patch) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last) msgs[msgs.length - 1] = { ...last, ...patch };
      return { messages: msgs };
    }),
  setStreaming: (v) => set({ isStreaming: v }),
  clear: () => set({ messages: [] }),
}));
