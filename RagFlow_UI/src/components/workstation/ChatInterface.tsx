import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Sparkles, Copy, Check, FileText, Clock, Cpu, Trash } from "lucide-react";
import { useChat } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "./Markdown";
import { DebugPanel } from "./DebugPanel";
import { toast } from "sonner";

export function ChatInterface() {
  const { messages, addMessage, appendToLast, patchLast, isStreaming, setStreaming, clear } = useChat();
  const [input, setInput] = useState("");
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  };

  const send = async () => {
    const q = input.trim();
    if (!q || isStreaming) return;
    setInput("");
    setLastQuery(q);

    addMessage({ id: crypto.randomUUID(), role: "user", content: q });
    addMessage({ id: crypto.randomUUID(), role: "assistant", content: "", streaming: true });
    setStreaming(true);

    const t0 = performance.now();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const gen = api.chatStream(q, ctrl.signal);
      let final: Awaited<ReturnType<typeof gen.next>>["value"] | null = null;
      while (true) {
        const { value, done } = await gen.next();
        if (done) {
          final = value as typeof final;
          break;
        }
        if (typeof value === "string") appendToLast(value);
      }
      const ms = Math.round(performance.now() - t0);
      const finalObj = (final ?? {}) as { sources?: unknown; model?: string };
      patchLast({
        streaming: false,
        responseTime: ms,
        sources: finalObj.sources as never,
        model: finalObj.model,
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        patchLast({ streaming: false });
      } else {
        // Fallback to non-streaming
        try {
          const res = await api.chat(q);
          const txt = (res.answer || res.response || "") as string;
          patchLast({
            content: txt,
            streaming: false,
            sources: res.sources,
            model: res.model,
            responseTime: Math.round(performance.now() - t0),
          });
        } catch (err) {
          patchLast({ streaming: false, error: (err as Error).message, content: "" });
          toast.error(`Chat failed: ${(err as Error).message}`);
        }
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin no-outer-scroll">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
          {messages.length === 0 && <EmptyState onPick={(p) => setInput(p)} />}
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <DebugPanel lastQuery={lastQuery} />

      <div className="border-t border-white/5 px-4 md:px-6 py-3 glass-strong">
        <div className="max-w-3xl mx-auto">
          {messages.length > 0 && (
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="sm" onClick={clear} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                <Trash className="h-3 w-3 mr-1" /> Clear conversation
              </Button>
            </div>
          )}
          <div className="relative glass rounded-2xl border-white/10 focus-within:border-violet/50 focus-within:glow-violet transition-all">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask your knowledge base anything…"
              className="min-h-[60px] max-h-48 resize-none bg-transparent border-0 focus-visible:ring-0 pr-14 text-sm"
            />
            <div className="absolute bottom-2 right-2">
              {isStreaming ? (
                <Button size="icon" onClick={stop} className="h-9 w-9 bg-red-500/80 hover:bg-red-500">
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={send}
                  disabled={!input.trim()}
                  className="h-9 w-9 bg-gradient-to-br from-violet to-cyan hover:opacity-90 disabled:opacity-30 glow-violet"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Offline · Rag Flow · Press Enter to send, Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (p: string) => void }) {
  const suggestions = [
    "Summarize the key points across my uploaded documents",
    "What does the knowledge base say about…",
    "Compare two ideas from the indexed PDFs",
    "Extract the most actionable insights",
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center pt-16 pb-8 gap-6"
    >
      <div className="relative">
        <div className="absolute inset-0 blur-3xl bg-violet/30 rounded-full" />
        <div className="relative h-16 w-16 rounded-2xl glass-strong flex items-center justify-center glow-violet">
          <Sparkles className="h-7 w-7 text-violet" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-gradient">Your private AI workstation</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Powered by local Ollama with Advanced RAG. Upload PDFs and start asking — nothing leaves your machine.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-xl">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="glass rounded-xl p-3 text-left text-xs text-muted-foreground hover:text-foreground hover:border-violet/40 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: { id: string; role: "user" | "assistant"; content: string; streaming?: boolean; sources?: Array<Record<string, unknown>>; model?: string; responseTime?: number; error?: string } }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="h-8 w-8 shrink-0 rounded-lg glass-strong flex items-center justify-center mt-1">
          <Sparkles className="h-4 w-4 text-violet" />
        </div>
      )}
      <div className={`group max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div
          className={
            isUser
              ? "rounded-2xl px-4 py-2.5 bg-gradient-to-br from-violet/30 to-violet/10 border border-violet/30 text-foreground text-sm"
              : "rounded-2xl px-4 py-3 glass border-white/5 text-sm w-full"
          }
        >
          {message.error ? (
            <span className="text-red-400 text-xs">{message.error}</span>
          ) : message.content ? (
            isUser ? (
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
            ) : (
              <Markdown content={message.content} />
            )
          ) : message.streaming ? (
            <ThinkingDots />
          ) : null}
          {message.streaming && message.content && (
            <motion.span
              className="inline-block w-1.5 h-4 bg-violet ml-0.5 align-middle"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.sources.slice(0, 6).map((s, i) => {
              const fn = (s.filename || s.source || s.file || `source ${i + 1}`) as string;
              const pg = s.page as number | undefined;
              return (
                <div key={i} className="inline-flex items-center gap-1 glass rounded-full px-2 py-0.5 text-[10px] text-muted-foreground">
                  <FileText className="h-2.5 w-2.5 text-cyan" />
                  <span className="truncate max-w-[160px]">{fn}{pg !== undefined ? ` · p.${pg}` : ""}</span>
                </div>
              );
            })}
          </div>
        )}

        {!isUser && !message.streaming && message.content && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex items-center gap-1 hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {message.model && (
              <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{message.model}</span>
            )}
            {message.responseTime !== undefined && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{(message.responseTime / 1000).toFixed(2)}s</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-violet"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
      <span className="ml-2 text-xs text-muted-foreground">Thinking…</span>
    </div>
  );
}
