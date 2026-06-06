import { useCallback, useState } from "react";
import { sendMessage, RateLimitError, type ChatMessage, type Citation } from "@/lib/chat.functions";
import { toast } from "sonner";

/**
 * Dify-style hook. Mirrors the shape of a Dify chat-completions response so the
 * UI keeps a Dify-like surface area.
 */
export function useDify(threadId: string | null) {
  const [query, setQuery] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [retrieverResources, setRetrieverResources] = useState<Citation[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    async (
      content: string,
      opts: { selectedRole: string; user: string; threadId?: string; file?: File },
    ): Promise<{ user: ChatMessage; assistant: ChatMessage } | null> => {
      const target = opts.threadId ?? threadId;
      if (!target) return null;
      setQuery(content);
      setPending(true);
      setError(null);
      try {
        console.log("[useDify] Calling sendMessage with file:", opts.file?.name);
        const res = await sendMessage({
          threadId: target,
          content,
          selectedRole: opts.selectedRole,
          user: opts.user,
          file: opts.file,
        });
        setAnswer(res.assistant.content);
        setConversationId(res.conversation_id);
        setRetrieverResources(res.assistant.citations);
        return { user: res.user, assistant: res.assistant };
      } catch (e) {
        if (e instanceof RateLimitError) {
          toast.error("Decipher is experiencing high demand. Please try sending your query again in a few moments.");
          setError("rate_limited");
        } else {
          const msg = e instanceof Error ? e.message : "Request failed";
          const displayMsg = msg.includes("DIFY_RATE_LIMIT") 
            ? "Decipher is experiencing high demand. Please try again in a few moments."
            : msg;
          toast.error(displayMsg);
          setError(msg);
        }
        return null;
      } finally {
        setPending(false);
      }
    },
    [threadId],
  );

  return {
    ask,
    query,
    answer,
    conversation_id: conversationId,
    retriever_resources: retrieverResources,
    pending,
    error,
  };
}
