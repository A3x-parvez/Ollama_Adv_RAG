import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function DebugPanel({ lastQuery }: { lastQuery: string | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!lastQuery) return;
    setLoading(true); setErr(null);
    try {
      const res = await api.chatDebug(lastQuery);
      setData(res);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-white/5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bug className="h-3.5 w-3.5" />
        Retrieval Debug
        <span className="ml-auto">{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={run}
                disabled={!lastQuery || loading}
                className="glass border-white/10 text-xs h-7"
              >
                {loading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Inspect last query
              </Button>
              {err && <div className="text-xs text-red-400">{err}</div>}
              {data && (
                <pre className="glass rounded-lg p-3 text-[10px] leading-relaxed overflow-auto max-h-72 scrollbar-thin font-mono text-muted-foreground">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
