// Client-side message store backed by localStorage.
// All keys are scoped by the active Supabase user id so different accounts
// on the same browser never see each other's data.
//
// Assistant replies come from the Dify chat-messages API via a server fn.
// Messages are also synced to Supabase for persistence and word count tracking.

import { askDify } from "@/lib/dify.functions";
import { parseFileData, formatFileDataForMessage } from "@/lib/excel-parser";
import { supabase } from "@/integrations/supabase/client";
import { updateWordCacheAfterMessage, updateWordCacheAfterDelete, countWords } from "@/lib/word-usage";

export type Citation = {
  source: string;
  page?: number;
  snippet?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  created_at: string;
};

export type Thread = {
  id: string;
  title: string;
  corpus: string;
  selectedRole?: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Per-user key scoping
// ---------------------------------------------------------------------------

let currentUserId: string | null = null;

/** Called by AuthProvider whenever the Supabase auth state changes. */
export function setCurrentUserId(uid: string | null) {
  currentUserId = uid;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

const isBrowser = () =>
  typeof window !== "undefined" && typeof localStorage !== "undefined";

const threadsKey = (uid: string) => `decipher.${uid}.threads.v1`;
const messagesKey = (uid: string, tid: string) =>
  `decipher.${uid}.messages.${tid}.v1`;
const conversationKey = (uid: string, tid: string) =>
  `decipher.${uid}.conversation.${tid}.v1`;

/** Remove every localStorage entry for the given user. */
export function purgeUserStorage(uid: string) {
  if (!isBrowser() || !uid) return;
  const prefix = `decipher.${uid}.`;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}

// ---------------------------------------------------------------------------
// Conversation-id helpers (Dify)
// ---------------------------------------------------------------------------

export function getConversationId(threadId: string): string {
  if (!isBrowser() || !currentUserId) return "";
  return localStorage.getItem(conversationKey(currentUserId, threadId)) ?? "";
}

function setConversationId(threadId: string, id: string) {
  if (!isBrowser() || !currentUserId || !id) return;
  localStorage.setItem(conversationKey(currentUserId, threadId), id);
}

// ---------------------------------------------------------------------------
// Threads / messages storage
// ---------------------------------------------------------------------------

function readThreads(): Thread[] {
  if (!isBrowser() || !currentUserId) return [];
  try {
    return JSON.parse(
      localStorage.getItem(threadsKey(currentUserId)) ?? "[]",
    ) as Thread[];
  } catch {
    return [];
  }
}

function writeThreads(threads: Thread[]) {
  if (!isBrowser() || !currentUserId) return;
  localStorage.setItem(threadsKey(currentUserId), JSON.stringify(threads));
}

function readMessages(threadId: string): ChatMessage[] {
  if (!isBrowser() || !currentUserId) return [];
  try {
    return JSON.parse(
      localStorage.getItem(messagesKey(currentUserId, threadId)) ?? "[]",
    ) as ChatMessage[];
  } catch {
    return [];
  }
}

function writeMessages(threadId: string, msgs: ChatMessage[]) {
  if (!isBrowser() || !currentUserId) return;
  localStorage.setItem(
    messagesKey(currentUserId, threadId),
    JSON.stringify(msgs),
  );
}

function uid() {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function requireAuth() {
  if (!currentUserId) throw new Error("Not authenticated");
}

export async function listThreads(): Promise<Thread[]> {
  if (!currentUserId) return [];
  return readThreads().sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

export async function createThread(input: {
  corpus?: string;
  title?: string;
  selectedRole?: string;
}): Promise<Thread> {
  requireAuth();
  const now = new Date().toISOString();
  const t: Thread = {
    id: uid(),
    corpus: input.corpus ?? "data-engineering",
    title: input.title?.slice(0, 120) || "New conversation",
    selectedRole: input.selectedRole,
    updated_at: now,
  };
  const threads = readThreads();
  threads.unshift(t);
  writeThreads(threads);
  writeMessages(t.id, []);
  
  // Sync to Supabase
  await syncThreadToSupabase(t);
  
  return t;
}

export async function getThread(threadId: string): Promise<Thread | null> {
  if (!currentUserId) return null;
  return readThreads().find((t) => t.id === threadId) ?? null;
}

export async function getMessages(input: {
  threadId: string;
}): Promise<ChatMessage[]> {
  if (!currentUserId) return [];
  return readMessages(input.threadId);
}

export async function deleteThread(input: { threadId: string }): Promise<void> {
  if (!currentUserId) return;
  
  // Calculate words in this thread before deleting
  const msgs = readMessages(input.threadId);
  let wordsDelta = 0;
  for (const msg of msgs) {
    wordsDelta += countWords(msg.content);
  }
  
  writeThreads(readThreads().filter((t) => t.id !== input.threadId));
  if (isBrowser()) {
    localStorage.removeItem(messagesKey(currentUserId, input.threadId));
    localStorage.removeItem(conversationKey(currentUserId, input.threadId));
  }
  
  // Update cache: subtract words from deleted thread
  if (wordsDelta > 0) {
    updateWordCacheAfterDelete(wordsDelta);
  }
  
  // Delete from Supabase (cascade will delete messages too)
  try {
    const { error } = await supabase
      .from("threads")
      .delete()
      .eq("id", input.threadId);
    
    if (error) {
      console.warn("[deleteThread] Error deleting from DB:", error);
    } else {
      console.log("[deleteThread] Thread deleted from DB:", input.threadId);
    }
  } catch (err) {
    console.warn("[deleteThread] DB delete failed:", err);
  }
}

export class RateLimitError extends Error {
  constructor() {
    super("DIFY_RATE_LIMIT");
    this.name = "RateLimitError";
  }
}

// ---------------------------------------------------------------------------
// Supabase sync functions
// ---------------------------------------------------------------------------

/**
 * Save a message to Supabase for persistence and word count tracking
 * The Supabase triggers will automatically update user_word_usage
 */
async function syncMessageToSupabase(threadId: string, msg: ChatMessage): Promise<void> {
  if (!currentUserId) return;
  
  try {
    const { error } = await supabase.from("messages").insert({
      id: msg.id,
      thread_id: threadId,
      user_id: currentUserId,
      role: msg.role,
      content: msg.content,
      citations: msg.citations,
      created_at: msg.created_at,
    });

    if (error) {
      console.warn("[syncMessageToSupabase] Error syncing message:", error);
      // Don't throw - let the app continue with localStorage backup
    } else {
      console.log("[syncMessageToSupabase] Message synced to DB:", msg.id);
    }
  } catch (err) {
    console.warn("[syncMessageToSupabase] Sync failed:", err);
  }
}

/**
 * Save a thread to Supabase
 */
async function syncThreadToSupabase(thread: Thread): Promise<void> {
  if (!currentUserId) return;

  try {
    const { error } = await supabase.from("threads").upsert({
      id: thread.id,
      user_id: currentUserId,
      title: thread.title,
      corpus: thread.corpus,
      updated_at: thread.updated_at,
    });

    if (error) {
      console.warn("[syncThreadToSupabase] Error syncing thread:", error);
    } else {
      console.log("[syncThreadToSupabase] Thread synced to DB:", thread.id);
    }
  } catch (err) {
    console.warn("[syncThreadToSupabase] Sync failed:", err);
  }
}

/**
 * Delete a message from Supabase
 */
async function deleteMessageFromSupabase(messageId: string): Promise<void> {
  if (!currentUserId) return;

  try {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.warn("[deleteMessageFromSupabase] Error deleting message:", error);
    } else {
      console.log("[deleteMessageFromSupabase] Message deleted from DB:", messageId);
    }
  } catch (err) {
    console.warn("[deleteMessageFromSupabase] Delete failed:", err);
  }
}

export async function sendMessage(input: {
  threadId: string;
  content: string;
  selectedRole: string;
  user: string;
  file?: File;
}): Promise<{
  user: ChatMessage;
  assistant: ChatMessage;
  conversation_id: string;
}> {
  requireAuth();
  const threads = readThreads();
  const thread = threads.find((t) => t.id === input.threadId);
  if (!thread) throw new Error("Thread not found");

  const msgs = readMessages(input.threadId);

  // Process file if provided
  let contentToSend = input.content;
  console.log("[sendMessage] Received file:", input.file);
  if (input.file) {
    try {
      console.log("[sendMessage] Parsing file:", input.file.name);
      const fileData = await parseFileData(input.file);
      console.log("[sendMessage] File parsed successfully:", fileData);
      const formattedData = formatFileDataForMessage(fileData);
      contentToSend = `${input.content}\n\n${formattedData}`;
      console.log("[sendMessage] Content with file data prepared, length:", contentToSend.length);
    } catch (error) {
      console.error("[sendMessage] Failed to parse file:", error);
      throw new Error(`File processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  } else {
    console.log("[sendMessage] No file provided");
  }

  const userMsg: ChatMessage = {
    id: uid(),
    role: "user",
    content: input.content, // Store original content in message history
    citations: [],
    created_at: new Date().toISOString(),
  };
  msgs.push(userMsg);
  writeMessages(input.threadId, msgs);
  
  // Sync user message to Supabase
  await syncMessageToSupabase(input.threadId, userMsg);
  
  // Update cache with user message words
  updateWordCacheAfterMessage(input.content);

  let answer = "";
  let citations: Citation[] = [];
  let conversationId = getConversationId(input.threadId);

  try {
    const res = await askDify({
      data: {
        query: contentToSend, // Send content with file data to Dify
        selectedRole: input.selectedRole,
        conversationId,
        user: input.user,
      },
    });
    answer = res.answer;
    citations = res.citations;
    conversationId = res.conversation_id;
    setConversationId(input.threadId, conversationId);
  } catch (e) {
    // Roll the user msg back so the user can retry cleanly.
    const rolled = readMessages(input.threadId).filter(
      (m) => m.id !== userMsg.id,
    );
    writeMessages(input.threadId, rolled);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DIFY_RATE_LIMIT") || msg.includes("429")) {
      throw new RateLimitError();
    }
    throw e;
  }

  const assistantMsg: ChatMessage = {
    id: uid(),
    role: "assistant",
    content: answer,
    citations,
    created_at: new Date().toISOString(),
  };
  const finalMsgs = readMessages(input.threadId);
  finalMsgs.push(assistantMsg);
  writeMessages(input.threadId, finalMsgs);
  
  // Sync assistant message to Supabase
  await syncMessageToSupabase(input.threadId, assistantMsg);
  
  // Update cache with assistant message words
  updateWordCacheAfterMessage(answer);

  // Bump thread title + updated_at.
  if (thread.title === "New conversation") {
    thread.title = input.content.slice(0, 60).trim() || "New conversation";
  }
  thread.updated_at = new Date().toISOString();
  writeThreads(threads);
  
  // Sync thread update to Supabase
  await syncThreadToSupabase(thread);

  return { user: userMsg, assistant: assistantMsg, conversation_id: conversationId };
}
