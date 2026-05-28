import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

export const Markdown = memo(function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-custom prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0 prose-headings:text-foreground prose-strong:text-foreground prose-a:text-cyan">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children }) {
            return <h1 className="text-lg font-semibold mt-1 mb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-md font-semibold mt-1 mb-1.5">{children}</h2>;
          },
          p({ children }) {
            return <p className="text-sm leading-relaxed">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc ml-4 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal ml-4 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-sm leading-relaxed">{children}</li>;
          },
          table({ children }) {
            return <table className="w-full text-sm">{children}</table>;
          },
          th({ children }) {
            return <th className="text-xs text-muted-foreground font-semibold">{children}</th>;
          },
          td({ children }) {
            return <td className="text-sm">{children}</td>;
          },
          code(props) {
            const { className, children, inline } = props as any;
            const match = /language-(\w+)/.exec(className || "");
            const raw = String(children ?? "");
            const text = raw.replace(/\n$/, "");

            // Avoid rendering empty/blank code containers
            if (text.trim().length === 0) return null;

            const isMultiline = text.includes("\n");

            // Prefer inline rendering for inline-marked or single-line code
            if (inline || !isMultiline) {
              return (
                <code className="px-1 py-0.5 rounded bg-white/6 text-cyan font-mono text-[0.9em]" {...props}>
                  {children}
                </code>
              );
            }

            // For true fenced/multiline code blocks, render a compact CodeBlock
            return <CodeBlock language={match?.[1] || "text"} code={text} />;
          },
          a({ href, children }) {
            return (
              <a href={href} className="text-cyan underline-offset-2 hover:underline">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative my-2 rounded-lg overflow-hidden glass border-white/6">
      <div className="flex items-center justify-between px-2 py-1 border-b border-white/6 bg-white/[0.015]">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{language}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, background: "transparent", fontSize: "0.82rem", padding: "0.6rem" }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
