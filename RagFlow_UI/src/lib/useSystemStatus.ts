import { useEffect, useRef, useState } from "react";
import { getApiBase } from "./api";

type SystemStatus = {
  cpu: number; // percent
  gpu: number; // percent
  ram: number; // GB
  temp: number; // C
};

export function useSystemStatus(intervalMs = 2500) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const latest = useRef<SystemStatus | null>(null);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const fetchOnce = async () => {
      try {
        const res = await fetch(`${getApiBase()}/system/status`, { signal: controller.signal });
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (!alive) return;

        const next: SystemStatus = {
          cpu: Number(data.cpu ?? latest.current?.cpu ?? 0),
          gpu: Number(data.gpu ?? latest.current?.gpu ?? 0),
          ram: Number(data.ram ?? latest.current?.ram ?? 0),
          temp: Number(data.temp ?? latest.current?.temp ?? 0),
        };

        // update only when values are valid numbers
        latest.current = next;
        setStatus(next);
      } catch (e) {
        // Fail silently: keep previous values and do not flash errors
      }
    };

    // initial fetch immediately, then interval
    fetchOnce();
    const id = setInterval(fetchOnce, intervalMs);

    return () => {
      alive = false;
      controller.abort();
      clearInterval(id);
    };
  }, [intervalMs]);

  return status;
}
