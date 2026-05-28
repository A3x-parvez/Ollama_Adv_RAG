import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiBase, setApiBase, API_BASE_DEFAULT } from "@/lib/api";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Sliders, Info, Link2, CheckCircle2, XCircle, Loader2, RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SettingDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  tip: string;
}

const DEFS: SettingDef[] = [
  { key: "temperature", label: "Temperature", min: 0, max: 2, step: 0.05, tip: "Higher = more creative, lower = more focused" },
  { key: "top_k", label: "Top K Retrieval", min: 1, max: 50, step: 1, tip: "How many chunks to retrieve from the knowledge base" },
  { key: "rerank_top_k", label: "Rerank Top K", min: 1, max: 20, step: 1, tip: "How many of the retrieved chunks to keep after reranking" },
  { key: "max_tokens", label: "Max Tokens", min: 64, max: 8192, step: 32, tip: "Maximum tokens in the response" },
];

export function SettingsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: api.getSettings });
  const [local, setLocal] = useState<Record<string, number>>({});

  useEffect(() => {
    if (data) {
      const next: Record<string, number> = {};
      for (const d of DEFS) {
        const v = data[d.key];
        if (typeof v === "number") next[d.key] = v;
      }
      setLocal((cur) => ({ ...next, ...cur }));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <ApiEndpointCard onChanged={() => qc.invalidateQueries()} />

        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          <Sliders className="h-3 w-3" /> Runtime Settings
        </div>

        {DEFS.map((def) => {
          const val = local[def.key] ?? (data?.[def.key] as number) ?? def.min;
          return (
            <div key={def.key} className="glass rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-foreground/90">
                  {def.label}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="glass-strong border-white/10 text-xs max-w-[200px]">
                      {def.tip}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="font-mono text-cyan">
                  {def.step < 1 ? val.toFixed(2) : Math.round(val)}
                </span>
              </div>
              <Slider
                value={[val]}
                min={def.min}
                max={def.max}
                step={def.step}
                onValueChange={([v]) => setLocal((s) => ({ ...s, [def.key]: v }))}
              />
            </div>
          );
        })}

        <Button
          onClick={() => save.mutate(local)}
          disabled={save.isPending}
          className="w-full bg-gradient-to-r from-violet to-cyan text-white hover:opacity-90 glow-violet"
        >
          {save.isPending ? "Saving…" : "Apply Settings"}
        </Button>
      </div>
    </TooltipProvider>
  );
}

type ConnStatus = "idle" | "checking" | "ok" | "fail";

function ApiEndpointCard({ onChanged }: { onChanged?: () => void }) {
  const [url, setUrl] = useState<string>(getApiBase());
  const [status, setStatus] = useState<ConnStatus>("idle");
  const [detail, setDetail] = useState<string>("");

  // Auto-test current endpoint on mount
  useEffect(() => {
    void testConnection(getApiBase(), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function testConnection(target: string, persist: boolean) {
    setStatus("checking");
    setDetail("");
    const normalized = target.trim();
    try {
      if (persist) setApiBase(normalized);
      // Probe a few common endpoints
      const base = persist ? getApiBase() : normalized.replace(/\/+$/, "");
      const probes = ["/health/", "/health", "/docs", "/"];
      let ok = false;
      let lastErr = "";
      for (const p of probes) {
        try {
          const res = await fetch(`${base}${p}`, { method: "GET" });
          if (res.ok || res.status === 404 /* server is reachable */) {
            ok = res.ok || p === "/docs" || p === "/";
            if (ok) { setDetail(`${base}${p} → ${res.status}`); break; }
            lastErr = `${p} → ${res.status}`;
          } else {
            lastErr = `${p} → ${res.status}`;
          }
        } catch (e) {
          lastErr = (e as Error).message;
        }
      }
      if (ok) {
        setStatus("ok");
        if (persist) {
          toast.success("Connected to API");
          onChanged?.();
        }
      } else {
        setStatus("fail");
        setDetail(lastErr || "Unreachable");
        if (persist) toast.error("Could not reach API");
      }
    } catch (e) {
      setStatus("fail");
      setDetail((e as Error).message);
    }
  }

  function reset() {
    setUrl(API_BASE_DEFAULT);
    setApiBase(API_BASE_DEFAULT);
    void testConnection(API_BASE_DEFAULT, false);
    onChanged?.();
  }

  const StatusBadge = () => {
    if (status === "checking")
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-cyan">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking…
        </span>
      );
    if (status === "ok")
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Connection OK
        </span>
      );
    if (status === "fail")
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
          <XCircle className="h-3 w-3" /> Failed
        </span>
      );
    return <span className="text-xs text-muted-foreground">Not tested</span>;
  };

  return (
    <div className="glass rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          <Link2 className="h-3 w-3" /> API Endpoint
        </div>
        <StatusBadge />
      </div>

      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="http://127.0.0.1:8000"
        className="font-mono text-xs bg-background/40 border-white/10"
        spellCheck={false}
        onKeyDown={(e) => {
          if (e.key === "Enter") void testConnection(url, true);
        }}
      />

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Sub-routes like <span className="font-mono text-foreground/70">/chat/</span>,{" "}
        <span className="font-mono text-foreground/70">/docs</span>,{" "}
        <span className="font-mono text-foreground/70">/upload/</span> are appended automatically.
      </p>

      {detail && (
        <p className="text-[10px] font-mono text-muted-foreground break-all">{detail}</p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => void testConnection(url, true)}
          disabled={status === "checking"}
          className="flex-1 bg-gradient-to-r from-violet to-cyan text-white hover:opacity-90 glow-violet"
        >
          {status === "checking" ? "Connecting…" : "Connect"}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={reset} className="border-white/10">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="glass-strong border-white/10 text-xs">
            Reset to default
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
