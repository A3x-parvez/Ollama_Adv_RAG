import { useMemo } from "react";
import { useSystemStatus } from "@/lib/useSystemStatus";

export function SystemStatus() {
  const s = useSystemStatus(2500);

  // display safe defaults
  const cpu = s?.cpu ?? 0;
  const gpu = s?.gpu ?? 0;
  const ram = s?.ram ?? 0;
  const temp = s?.temp ?? 0;

  const formatted = useMemo(() => {
    return {
      gpu: Math.round(gpu),
      ram: Number(ram).toFixed(1),
      cpu: Math.round(cpu * 10) / 10,
      temp: Math.round(temp),
    };
  }, [gpu, ram, cpu, temp]);

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
      <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
      <div className="flex items-center gap-2">
        <span className="min-w-[48px] text-[12px]">GPU {formatted.gpu}%</span>
        <span className="min-w-[64px] text-[12px]">RAM {formatted.ram}GB</span>
        <span className="hidden sm:inline-flex min-w-[46px] text-[12px]">CPU {formatted.cpu}%</span>
        <span className="hidden sm:inline-flex min-w-[42px] text-[12px]">{formatted.temp}°C</span>
      </div>
    </div>
  );
}
