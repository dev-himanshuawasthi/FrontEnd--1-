import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ChatWindow } from "@/components/decipher/chat-window";
import { Composer } from "@/components/decipher/composer";
import { getMessages, getThread, type ChatMessage } from "@/lib/chat.functions";
import { useDify } from "@/hooks/use-dify";
import { ensureUnderLimit, notifyWordUsageChanged } from "@/lib/word-usage";
import { useWordUsage } from "@/hooks/use-word-usage";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const qc = useQueryClient();
  const dify = useDify(threadId);
  const { exceeded } = useWordUsage();
  const { user } = useAuth();

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => getMessages({ threadId }),
  });

  const { data: thread } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getThread(threadId),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, dify.pending]);

  const handleSend = async (content: string, file?: File | null) => {
    if (!ensureUnderLimit(content)) return;
    console.log("[ChatPage] handleSend called with file:", file);
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content,
      citations: [],
      created_at: new Date().toISOString(),
    };
    qc.setQueryData<ChatMessage[]>(["messages", threadId], (prev = []) => [...prev, optimistic]);
    try {
      console.log("[ChatPage] Calling dify.ask with file:", file?.name);
      await dify.ask(content, {
        threadId,
        selectedRole: thread?.selectedRole ?? "Data Analyst",
        user: user?.id ?? user?.email ?? "anonymous",
        file: file || undefined,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to send message";
      toast.error(msg);
    }
    notifyWordUsageChanged();
    qc.invalidateQueries({ queryKey: ["messages", threadId] });
    qc.invalidateQueries({ queryKey: ["threads"] });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatWindow ref={scrollRef} messages={messages} pending={dify.pending} />
      <Composer onSubmit={handleSend} disabled={dify.pending || exceeded} />
    </div>
  );
}
