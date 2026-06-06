import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  setCurrentUserId,
  purgeUserStorage,
  getCurrentUserId,
} from "@/lib/chat.functions";
import { notifyWordUsageChanged, syncWordUsageFromDB, subscribeToWordUsageUpdates } from "@/lib/word-usage";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();
  const lastUidRef = useRef<string | null>(null);
  const unsubscribeWordUsageRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const applySession = async (s: Session | null) => {
      const uid = s?.user?.id ?? null;
      const prev = lastUidRef.current;
      if (uid !== prev) {
        setCurrentUserId(uid);
        lastUidRef.current = uid;
        // Different user (or logged out) — drop any cached per-user data
        // sitting in React Query so no UI ever shows the previous user's
        // threads or messages.
        qc.removeQueries({ queryKey: ["threads"] });
        qc.removeQueries({ queryKey: ["messages"] });
        qc.removeQueries({ queryKey: ["thread"] });
        
        // Cleanup previous subscription
        if (unsubscribeWordUsageRef.current) {
          unsubscribeWordUsageRef.current();
        }
        
        // On login: sync word usage from database and subscribe to updates
        if (uid) {
          await syncWordUsageFromDB();
          unsubscribeWordUsageRef.current = subscribeToWordUsageUpdates();
        }
        
        notifyWordUsageChanged();
      }
      setSession(s);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      applySession(s);
    });
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    return () => {
      sub.subscription.unsubscribe();
      if (unsubscribeWordUsageRef.current) {
        unsubscribeWordUsageRef.current();
      }
    };
  }, [qc]);

  const signOut = async () => {
    const uid = getCurrentUserId();
    await supabase.auth.signOut();
    try {
      // Wipe this user's namespaced cache so a future login on the same
      // device starts cleanly.
      if (uid) purgeUserStorage(uid);
      // Defensive cleanup of any cached supabase auth state.
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-") || k.includes("supabase.auth"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    setCurrentUserId(null);
    lastUidRef.current = null;
    qc.removeQueries({ queryKey: ["threads"] });
    qc.removeQueries({ queryKey: ["messages"] });
    qc.removeQueries({ queryKey: ["thread"] });
    notifyWordUsageChanged();
    setSession(null);
  };

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

export function displayNameFor(user: User | null): string {
  if (!user) return "there";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta =
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    (meta.display_name as string | undefined);
  if (fromMeta && fromMeta.trim()) return fromMeta.split(" ")[0];
  const email = user.email ?? "";
  const local = email.split("@")[0] || "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}
