import { useSyncExternalStore } from "react";
import {
  getTotalWordsUsed,
  subscribeWordUsage,
  WORD_LIMIT,
} from "@/lib/word-usage";

/** Reactive total word usage across all stored conversations. */
export function useWordUsage() {
  const total = useSyncExternalStore(
    subscribeWordUsage,
    getTotalWordsUsed,
    () => 0,
  );
  return {
    total,
    limit: WORD_LIMIT,
    pct: Math.min(100, (total / WORD_LIMIT) * 100),
    exceeded: total >= WORD_LIMIT,
  };
}
