import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DifyResult = {
  answer: string;
  conversation_id: string;
  citations: { source: string; page?: number; snippet?: string }[];
};

export const askDify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      query: string;
      selectedRole: string;
      conversationId?: string;
      user?: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<DifyResult> => {
    
    // Get GROQ API key from environment
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    // Fallback key check
    if (!GROQ_API_KEY || GROQ_API_KEY === "gsk_...") {
      throw new Error("Please set GROQ_API_KEY in your .env file");
    }

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { 
              role: "system", 
              content: `You are Decipher, a ${data.selectedRole || 'Data Assistant'} AI expert.

Your core responsibilities:
1. When you see [ATTACHED FILE ...] sections, that's a file structure/schema provided by the user
2. For data files (CSV/Excel): You receive headers + sample rows (structure), not the full dataset
3. Generate code based on the file structure you're shown - assume more rows exist with the same structure
4. For code files: You receive the complete code content
5. Provide production-grade, expert guidance on engineering principles and code architectures
6. Create working code examples that work with the file structure provided

IMPORTANT: Attached files show data structure/schema, not complete datasets. Generate code that:
- Works with the column structure shown
- Is scalable to handle full datasets
- Includes proper error handling and documentation` 
            },
            { role: "user", content: data.query }
          ],
          temperature: 0.2,
          max_tokens: 2048
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        // Include 429 in error message so it's caught by RateLimitError handler
        if (res.status === 429 || res.status === 503) {
          throw new Error(`DIFY_RATE_LIMIT: ${res.status} ${errText}`);
        }
        throw new Error(`Groq API Error: ${res.status} ${errText}`);
      }

      const json = await res.json();
      const answer = json.choices[0]?.message?.content || "No response received from core engine.";

      return {
        answer,
        conversation_id: data.conversationId || "showtime-session",
        citations: [
          { 
            source: "Groq Cloud Engine (Llama-3.1-8b)", 
            snippet: "Direct real-time cloud connection established successfully." 
          }
        ]
      };
    } catch (error) {
      console.error("Direct connection error:", error);
      // If it's already a rate limit error, rethrow it
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("DIFY_RATE_LIMIT") || msg.includes("429") || msg.includes("503")) {
        throw error;
      }
      // For other errors, provide a helpful message
      throw new Error(`DIFY_RATE_LIMIT: Decipher is experiencing high demand. Please try again.`);
    }
  });