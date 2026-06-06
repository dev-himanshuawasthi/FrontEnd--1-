import { motion } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/chat.functions";
import { Markdown } from "./markdown";
import { cn } from "@/lib/utils";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[color:var(--cyan)] to-[color:var(--electric)] grid place-items-center shadow-glow">
          <Sparkles className="h-4 w-4 text-slate-950" strokeWidth={2.5} />
        </div>
      )}

      <div className={cn("min-w-0 max-w-[85%]", isUser && "max-w-[75%]")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
            isUser
              ? "bg-gradient-to-br from-[color:var(--electric)]/90 to-[color:var(--cyan)]/80 text-slate-950 font-medium rounded-tr-sm"
              : "bg-card/60 backdrop-blur border border-border/60 text-foreground rounded-tl-sm",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown content={message.content} />
          )}
        </div>

        {!isUser && message.citations.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground self-center mr-1">
              Cited sources
            </span>
            {message.citations.map((c, i) => (
              <button
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--cyan)]/10 hover:bg-[color:var(--cyan)]/20 border border-[color:var(--cyan)]/30 px-2.5 py-1 text-xs text-[color:var(--cyan)] transition"
              >
                <FileText className="h-3 w-3" />
                {c.source}
                {c.page != null && <span className="opacity-70">· p.{c.page}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
