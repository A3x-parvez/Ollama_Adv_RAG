import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Trash2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function DocumentList() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["documents"], queryFn: api.listDocuments });
  const { data: stats } = useQuery({ queryKey: ["documents", "stats"], queryFn: api.documentStats });

  const del = useMutation({
    mutationFn: (filename: string) => api.deleteDocument(filename),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["documents", "stats"] });
      // aggressively refetch so UI updates immediately
      try {
        qc.refetchQueries({ queryKey: ["documents"] });
        qc.refetchQueries({ queryKey: ["documents", "stats"] });
      } catch {}
      toast.success("Document removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearAll = useMutation({
    mutationFn: () => api.clearDocuments(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["documents", "stats"] });
      try {
        qc.refetchQueries({ queryKey: ["documents"] });
        qc.refetchQueries({ queryKey: ["documents", "stats"] });
      } catch {}
      toast.success("Knowledge base cleared");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rawDocs = (data?.documents || []) as Array<Record<string, unknown> | string>;
  // normalize to objects with `filename` and optional `chunks`
  const docs = rawDocs.map((d, i) =>
    typeof d === 'string' ? { filename: d } : (d as Record<string, unknown>),
  );

  // stats may be { total_chunks: N } or a mapping { 'a.pdf': 10, 'b.pdf': 200 }
  const statsObj = stats as Record<string, any> | undefined;
  let totalChunks: string | number = '—';
  if (statsObj) {
    const maybeTotal = statsObj.total_chunks ?? statsObj.chunks;
    if (typeof maybeTotal === 'number') {
      totalChunks = maybeTotal;
    } else if (typeof maybeTotal === 'string' && !Number.isNaN(Number(maybeTotal))) {
      totalChunks = Number(maybeTotal);
    } else {
      // sum numeric values when stats is a per-document mapping
      try {
        const vals = Object.values(statsObj).map((v) => (typeof v === 'number' ? v : Number(v))).filter((n) => !Number.isNaN(n));
        if (vals.length > 0) totalChunks = vals.reduce((a, b) => a + b, 0);
      } catch {
        totalChunks = '—';
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          <Database className="h-3 w-3" /> Knowledge Base
        </div>
        {docs.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground hover:text-red-400">
                Clear all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-strong border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear knowledge base?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes all indexed documents and chunks. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearAll.mutate()} className="bg-red-500/80 hover:bg-red-500">
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="glass rounded-xl px-3 py-2 text-xs flex items-center justify-between">
        <span className="text-muted-foreground">Total chunks</span>
        <span className="font-mono text-cyan">{String(totalChunks)}</span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence>
          {docs.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">No documents yet</div>
          )}
          {docs.map((d, i) => {
            const filename = (d.filename || d.name || d.file || `doc-${i}`) as string;
            // prefer explicit chunks on the document object, otherwise consult stats mapping
            let chunks = (d.chunks ?? d.chunk_count ?? d.num_chunks) as number | undefined;
            if (chunks === undefined && statsObj && typeof statsObj === 'object') {
              const val = statsObj[filename];
              if (typeof val === 'number') chunks = val;
            }
            return (
              <motion.div
                key={filename}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="group glass rounded-lg p-2.5 flex items-center gap-2"
              >
                <FileText className="h-3.5 w-3.5 text-violet shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate" title={filename}>{filename}</div>
                  {chunks !== undefined && (
                    <div className="text-[10px] text-muted-foreground">{chunks} chunks</div>
                  )}
                </div>
                <button
                  onClick={() => del.mutate(filename)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 p-1"
                  aria-label="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
