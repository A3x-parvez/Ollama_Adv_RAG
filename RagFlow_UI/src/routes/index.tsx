import { createFileRoute } from "@tanstack/react-router";
import { Workstation } from "@/components/workstation/Workstation";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rag Flow · Local AI Workstation" },
      { name: "description", content: "Rag Flow — a privacy-first offline AI workstation powered by local models and advanced RAG." },
      { property: "og:title", content: "Rag Flow · Local AI Workstation" },
      { property: "og:description", content: "Rag Flow — a privacy-first offline AI workstation powered by local models and advanced RAG." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Workstation />
      <Toaster theme="dark" position="bottom-right" />
    </>
  );
}
