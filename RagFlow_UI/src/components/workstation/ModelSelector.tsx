import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cpu } from "lucide-react";
import { toast } from "sonner";

export function ModelSelector({ compact = false }: { compact?: boolean }) {
  const qc = useQueryClient();
  const { data: models } = useQuery({ queryKey: ["models"], queryFn: api.listModels });
  const { data: current } = useQuery({ queryKey: ["models", "current"], queryFn: api.currentModel });

  const select = useMutation({
    mutationFn: api.selectModel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["models", "current"] });
      toast.success("Model switched");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list: string[] = (models?.models || []).map((m) =>
    typeof m === "string" ? m : m.name,
  );
  // Accept multiple possible backend shapes for the current model
  const active = (() => {
    if (!current) return "";
    if (typeof current === "string") return current;
    const c = current as Record<string, unknown>;
    return (
      (typeof c.model === "string" && c.model) ||
      (typeof c.current === "string" && c.current) ||
      (typeof c.current_model === "string" && c.current_model) ||
      ""
    );
  })() as string;

  return (
    <div className={compact ? "" : "space-y-2"}>
      {!compact && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          <Cpu className="h-3 w-3" /> Active Model
        </div>
      )}
      <Select value={active} onValueChange={(v) => select.mutate(v)}>
        <SelectTrigger className="glass border-white/10 hover:border-violet/40 transition-colors">
          <SelectValue placeholder={list.length ? "Select a model" : "Loading models…"} />
        </SelectTrigger>
        <SelectContent className="glass-strong border-white/10">
          {list.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No models available</div>
          )}
          {list.map((name) => (
            <SelectItem key={name} value={name}>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet" />
                {name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
