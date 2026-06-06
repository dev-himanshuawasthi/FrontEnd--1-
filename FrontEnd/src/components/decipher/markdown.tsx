import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-border/60 bg-[#0b1220]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 bg-black/30">
        <span className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--cyan)] font-mono">
          {language || "code"}
        </span>
        <button
          onClick={copy}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "14px 16px",
          fontSize: 13,
          fontFamily: "var(--font-mono)",
        }}
        wrapLongLines
      >
        {value.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-decipher">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="text-xl font-bold mt-2 mb-2" {...p} />,
          h2: (p) => <h2 className="text-lg font-semibold mt-3 mb-1.5" {...p} />,
          h3: (p) => <h3 className="text-base font-semibold mt-3 mb-1.5 text-[color:var(--cyan)]" {...p} />,
          p: (p) => <p className="mb-2 last:mb-0 leading-relaxed" {...p} />,
          ul: (p) => <ul className="list-disc pl-5 mb-2 space-y-1" {...p} />,
          ol: (p) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...p} />,
          li: (p) => <li className="leading-relaxed" {...p} />,
          a: (p) => <a className="text-[color:var(--cyan)] underline underline-offset-2 hover:text-[color:var(--electric)]" target="_blank" rel="noreferrer" {...p} />,
          blockquote: (p) => (
            <blockquote className="border-l-2 border-[color:var(--cyan)]/50 pl-3 my-2 text-muted-foreground italic" {...p} />
          ),
          strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
          code({ className, children, ...rest }) {
            const match = /language-(\w+)/.exec(className || "");
            const value = String(children ?? "");
            const inline = !match && !value.includes("\n");
            if (inline) {
              return (
                <code
                  className="rounded bg-black/40 border border-border/60 px-1.5 py-0.5 font-mono text-[0.85em] text-[color:var(--cyan)]"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match?.[1] ?? ""} value={value} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
