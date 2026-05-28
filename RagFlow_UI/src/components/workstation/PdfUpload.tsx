import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

export function PdfUpload() {
  const qc = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const uploadOne = useMutation({
    mutationFn: async ({ file, id }: { file: File; id: string }) => {
      return api.upload(file, (pct) =>
        setItems((s) => s.map((it) => (it.id === id ? { ...it, progress: pct } : it))),
      );
    },
    onSuccess: (_data, vars) => {
      setItems((s) => s.map((it) => (it.id === vars.id ? { ...it, status: "done", progress: 100 } : it)));
      // Immediately refresh documents and stats so the UI shows uploaded doc
      try {
        qc.invalidateQueries({ queryKey: ["documents"] });
        qc.invalidateQueries({ queryKey: ["documents", "stats"] });
        // also trigger refetch to be more aggressive
        qc.refetchQueries({ queryKey: ["documents"] });
        qc.refetchQueries({ queryKey: ["documents", "stats"] });
      } catch {}
      toast.success(`${vars.file.name} indexed`);
      // remove the upload item from the UI after a short delay so progress hides
      setTimeout(() => {
        setItems((s) => s.filter((it) => it.id !== vars.id));
      }, 900);
    },
    onError: (e: Error, vars) => {
      setItems((s) =>
        s.map((it) => (it.id === vars.id ? { ...it, status: "error", error: e.message } : it)),
      );
      toast.error(`Upload failed: ${e.message}`);
    },
  });

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        const id = crypto.randomUUID();
        setItems((s) => [
          ...s,
          { id, name: file.name, size: file.size, progress: 0, status: "uploading" },
        ]);
        uploadOne.mutate({ file, id });
      });
    },
    [uploadOne],
  );

  return (
    <div className="space-y-3">
      <motion.label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        animate={{
          borderColor: dragOver ? "oklch(0.62 0.22 295 / 0.8)" : "oklch(1 0 0 / 0.1)",
          boxShadow: dragOver
            ? "0 0 50px -10px oklch(0.62 0.22 295 / 0.6)"
            : "0 0 0 0 transparent",
        }}
        className="relative block cursor-pointer rounded-2xl border-2 border-dashed glass p-6 text-center transition-colors hover:border-violet/40"
      >
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <motion.div
          animate={{ y: dragOver ? -4 : 0 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-violet/30 rounded-full" />
            <UploadCloud className="relative h-8 w-8 text-violet" />
          </div>
          <div className="text-sm font-medium">Drop PDFs or click to upload</div>
          <div className="text-xs text-muted-foreground">Multiple files supported</div>
        </motion.div>
      </motion.label>

      <AnimatePresence>
        {items.map((it) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass rounded-xl p-3"
          >
            <div className="flex items-center gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-cyan shrink-0" />
              <span className="truncate flex-1">{it.name}</span>
              {it.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              {it.status === "error" && <X className="h-3.5 w-3.5 text-red-400" />}
            </div>
            <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan to-violet"
                initial={{ width: 0 }}
                animate={{ width: `${it.progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
