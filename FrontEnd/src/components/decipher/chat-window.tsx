import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/chat.functions";
import { MessageBubble } from "./message-bubble";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  messages: ChatMessage[];
  pending: boolean;
};

export const ChatWindow = forwardRef<HTMLDivElement, Props>(function ChatWindow(
  { messages, pending },
  ref,
) {
  return (
    <div ref={ref} className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[color:var(--cyan)] to-[color:var(--electric)] grid place-items-center shadow-glow">
              <Sparkles className="h-4 w-4 text-slate-950" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 max-w-[85%] flex-1">
              <div className="rounded-2xl rounded-tl-sm bg-card/60 backdrop-blur border border-border/60 px-4 py-3 space-y-2.5">
                <Skeleton className="h-3 w-[85%]" />
                <Skeleton className="h-3 w-[70%]" />
                <Skeleton className="h-3 w-[55%]" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--cyan)] animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--cyan)] animate-pulse [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--cyan)] animate-pulse [animation-delay:240ms]" />
                </span>
                Deciphering…
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
});

