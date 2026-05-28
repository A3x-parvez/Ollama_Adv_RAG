import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, Github } from "lucide-react";
import { useUI } from "@/lib/store";
import { api } from "@/lib/api";
import { ModelSelector } from "./ModelSelector";
import { PdfUpload } from "./PdfUpload";
import { DocumentList } from "./DocumentList";
import { SettingsPanel } from "./SettingsPanel";
import { HealthIndicator } from "./HealthIndicator";
import { SystemStatus } from "./SystemStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export function Workstation() {
  const { sidebarOpen, setSidebarOpen } = useUI();
  const { data: current } = useQuery({ queryKey: ["models", "current"], queryFn: api.currentModel });

  // backend may return different shapes over time. Accept any of:
  // { model: string } | { current: string } | { current_model: string } | string
  const activeModel = (() => {
    if (!current) return "—";
    // direct string
    if (typeof current === "string") return current;
    const c = current as Record<string, unknown>;
    return (
      (typeof c.model === "string" && c.model) ||
      (typeof c.current === "string" && c.current) ||
      (typeof c.current_model === "string" && c.current_model) ||
      "—"
    );
  })() as string;

  return (
    <div className="relative min-h-screen grid-bg">
      {/* Top navbar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/5"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {/* <div className="relative">
              <div className="absolute inset-0 blur-md bg-violet/40 rounded-lg" />
              <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-violet to-cyan flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            </div> */}

            <div className="relative">
              <div className="absolute inset-0 blur-md bg-violet/30 rounded-xl" />

              <img
                src="/src/asset/rag_logo.png"
                alt="RagFlow Logo"
                className="
                  relative
                  h-10
                  w-10
                  object-contain
                  rounded-full
                  shadow-[0_0_18px_rgba(139,92,246,0.25)]
                "
              />
            </div>


            {/* <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Rag<span className="text-gradient">Flow</span></div>
              <div className="text-[10px] text-muted-foreground -mt-0.5">Local AI Workstation</div>
            </div> */}

            <div className="leading-none select-none">
            {/* Main Brand */}
            <div
              className="
                flex
                items-center
                text-xl
                font-black
                tracking-tight
                whitespace-nowrap
              "
              style={{
                fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              {/* Rag */}
              <span
                  className="
                  ml-0.5
                  text-white/90
                "
              >
                Rag
              </span>

              {/* Flow */}
              <span
                className="
                  bg-gradient-to-r
                  from-violet-300
                  via-violet-400
                  to-fuchsia-400
                  bg-clip-text
                  text-transparent
                  drop-shadow-[0_0_10px_rgba(168,85,247,0.28)]
                "
              >
                Flow
              </span>
            </div>

            {/* Subtitle */}
            <div
              className="
                text-[9px]
                uppercase
                tracking-[0.32em]
                text-muted-foreground/60
                mt-1
                pl-[1px]
              "
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              LOCAL AI WORKSTATION
            </div>
          </div>

          </div>
          <div className="hidden md:flex ml-6 items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-violet pulse-glow" />
            <span>Model:</span>
            <span className="text-foreground font-mono">{activeModel}</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <SystemStatus />
            <a
              href="https://github.com/A3x-parvez/"
              target="_blank"
              rel="noreferrer noopener"
              className="p-1 rounded-md hover:bg-white/5"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5 text-muted-foreground" />
            </a>
            <HealthIndicator />
          </div>
        </div>
      </header>

      <div className="flex" style={{ height: "calc(100vh - 3.5rem)" }}>
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="shrink-0 overflow-hidden border-r border-white/5 glass-strong"
            >
              <div className="w-[320px] h-full flex flex-col">
                <div className="p-4 border-b border-white/5">
                  <ModelSelector />
                </div>
                <Tabs defaultValue="docs" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="mx-4 mt-3 glass border-white/10 grid grid-cols-2">
                    <TabsTrigger value="docs" className="data-[state=active]:bg-violet/20 data-[state=active]:text-foreground text-xs">
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-violet/20 data-[state=active]:text-foreground text-xs">
                      Settings
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="docs" className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-4 mt-0">
                    <PdfUpload />
                    <DocumentList />
                  </TabsContent>
                  <TabsContent value="settings" className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 mt-0">
                    <SettingsPanel />
                  </TabsContent>
                </Tabs>
                <div className="mt-auto p-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center text-white font-semibold">W</div>
                    <div>
                      <div className="flex flex-col">
  <div className="text-sm font-semibold text-foreground">
    Built by{" "}
    <a
      href="https://wtero.com"
      target="_blank"
      rel="noopener noreferrer"
      className="
        bg-gradient-to-r
        from-violet-400
        via-fuchsia-400
        to-cyan-400
        bg-clip-text
        text-transparent
        hover:opacity-80
        transition-all
        duration-200
      "
    >
      Wtero
    </a>
  </div>

  <div className="text-[12px] text-muted-foreground mt-0.5">
    Dev{" "}
    <a
      href="https://rijwanool-karim.vercel.app"
      target="_blank"
      rel="noopener noreferrer"
      className="
        hover:text-violet-300
        transition-colors
        duration-200
      "
    >
      Rijwanool Karim
    </a>
  </div>
</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col">
          <ChatRegion />
        </main>
      </div>
    </div>
  );
}

import { ChatInterface } from "./ChatInterface";
function ChatRegion() {
  return <ChatInterface />;
}
