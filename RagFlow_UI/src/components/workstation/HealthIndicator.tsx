import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export function HealthIndicator() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 15000,
  });
  const ok = !!data && !isError;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs">
      <motion.span
        className={`relative h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className={`absolute inset-0 rounded-full blur-sm ${ok ? "bg-emerald-400" : "bg-red-400"} opacity-60`} />
      </motion.span>
      <Activity className="h-3 w-3 text-muted-foreground" />
      <span className="text-muted-foreground">{ok ? "Online" : "Offline"}</span>
    </div>
  );
}
