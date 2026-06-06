// Word-usage tracker for the free tier meter.
// Syncs word counts with Supabase for persistence across sessions.

import { getCurrentUserId } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";

export const WORD_LIMIT = 100_000;

export function countWords(text: string): number {
  const t = (text ?? "").trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

const isBrowser = () =>
  typeof window !== "undefined" && typeof localStorage !== "undefined";

/**
 * Get total words used from Supabase (primary source of truth)
 * Falls back to localStorage for offline support
 */
export async function getTotalWordsUsedFromDB(): Promise<number> {
  const uid = getCurrentUserId();
  if (!uid || !isBrowser()) return 0;

  try {
    const { data, error } = await supabase
      .from("user_word_usage")
      .select("total_words_consumed")
      .eq("user_id", uid)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("[getTotalWordsUsedFromDB] Error fetching from DB:", error);
      return getTotalWordsUsedLocal();
    }

    return data?.total_words_consumed ?? 0;
  } catch (err) {
    console.warn("[getTotalWordsUsedFromDB] Fallback to localStorage:", err);
    return getTotalWordsUsedLocal();
  }
}

/**
 * Get total words from localStorage (local cache)
 * Used for offline support and performance
 */
export function getTotalWordsUsedLocal(): number {
  if (!isBrowser()) return 0;
  const uid = getCurrentUserId();
  if (!uid) return 0;
  let total = 0;
  try {
    const threads = JSON.parse(
      localStorage.getItem(`decipher.${uid}.threads.v1`) ?? "[]",
    ) as Array<{ id: string }>;
    for (const t of threads) {
      const raw = localStorage.getItem(`decipher.${uid}.messages.${t.id}.v1`);
      if (!raw) continue;
      const msgs = JSON.parse(raw) as Array<{ content: string }>;
      for (const m of msgs) total += countWords(m.content);
    }
  } catch {
    /* ignore */
  }
  return total;
}

/**
 * Get total words from cache (localStorage)
 * This is populated on login from DB
 */
function getTotalWordsFromCache(): number {
  if (!isBrowser()) return 0;
  const uid = getCurrentUserId();
  if (!uid) return 0;
  const cached = localStorage.getItem(`decipher.${uid}.total_words_used.v1`);
  return cached ? parseInt(cached, 10) : 0;
}

/**
 * Store total words in cache
 */
function setTotalWordsInCache(total: number): void {
  if (!isBrowser()) return;
  const uid = getCurrentUserId();
  if (!uid) return;
  localStorage.setItem(`decipher.${uid}.total_words_used.v1`, total.toString());
}

/**
 * Primary function: get total words used from cache
 * Cache is populated on login from DB, updated by sync functions
 */
export function getTotalWordsUsed(): number {
  // Return cached value (populated on login from DB)
  return getTotalWordsFromCache();
}

/**
 * Update cache after sending a message
 * Increments total words by the message content
 */
export function updateWordCacheAfterMessage(content: string): void {
  const words = countWords(content);
  const current = getTotalWordsFromCache();
  setTotalWordsInCache(current + words);
  notifyWordUsageChanged();
}

/**
 * Update cache after deleting messages
 * Decrements total words
 */
export function updateWordCacheAfterDelete(wordsDelta: number): void {
  const current = getTotalWordsFromCache();
  setTotalWordsInCache(Math.max(0, current - wordsDelta));
  notifyWordUsageChanged();
}

// Tiny pub-sub so the sidebar and limit-dialog can react instantly after a
// send, without waiting for a query refetch tick.
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribeWordUsage(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function notifyWordUsageChanged() {
  listeners.forEach((l) => l());
}

/**
 * Sync word usage from DB to local cache
 * Called on login to populate cache from database
 */
export async function syncWordUsageFromDB(): Promise<void> {
  const uid = getCurrentUserId();
  if (!uid || !isBrowser()) return;

  try {
    const dbTotal = await getTotalWordsUsedFromDB();
    console.log("[syncWordUsageFromDB] Synced from DB:", dbTotal, "words");
    
    // Store in cache so UI can access it immediately
    setTotalWordsInCache(dbTotal);
    
    // Notify listeners to update UI
    notifyWordUsageChanged();
  } catch (err) {
    console.warn("[syncWordUsageFromDB] Sync failed:", err);
  }
}

/**
 * Subscribe to real-time word usage changes from Supabase
 * Keeps local state in sync with database changes from other devices
 */
export function subscribeToWordUsageUpdates(): (() => void) | null {
  const uid = getCurrentUserId();
  if (!uid || !isBrowser()) return null;

  try {
    // Subscribe to changes on user_word_usage table for this user
    const channel = supabase
      .channel(`word_usage_${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_word_usage",
          filter: `user_id=eq.${uid}`,
        },
        (payload) => {
          console.log("[subscribeToWordUsageUpdates] Update received:", payload);
          // Fetch latest from DB and update cache
          getTotalWordsUsedFromDB().then((dbTotal) => {
            setTotalWordsInCache(dbTotal);
            notifyWordUsageChanged();
          }).catch((err) => {
            console.warn("[subscribeToWordUsageUpdates] Error syncing from DB:", err);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("[subscribeToWordUsageUpdates] Setup failed:", err);
    return null;
  }
}

// --- Global "limit reached" dialog store -------------------------------
let dialogOpen = false;
const dialogListeners = new Set<Listener>();
export const limitDialog = {
  isOpen: () => dialogOpen,
  open() {
    dialogOpen = true;
    dialogListeners.forEach((l) => l());
  },
  close() {
    dialogOpen = false;
    dialogListeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    dialogListeners.add(l);
    return () => dialogListeners.delete(l);
  },
};

/**
 * Returns true if the user is allowed to send `content`.
 * If the limit is reached, opens the global limit dialog and returns false.
 */
export function ensureUnderLimit(content?: string): boolean {
  const used = getTotalWordsUsed();
  const incoming = content ? countWords(content) : 0;
  if (used >= WORD_LIMIT || used + incoming > WORD_LIMIT) {
    limitDialog.open();
    return false;
  }
  return true;
}
