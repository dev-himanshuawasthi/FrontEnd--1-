import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  Plus,
  MessageSquare,
  Zap,
  Trash2,
  LogOut,
} from "lucide-react";
import { listThreads, createThread, deleteThread } from "@/lib/chat.functions";
import { notifyWordUsageChanged } from "@/lib/word-usage";
import { useWordUsage } from "@/hooks/use-word-usage";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DecipherSidebar() {
  const nav = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const qc = useQueryClient();

  const { data: threads = [] } = useQuery({
    queryKey: ["threads"],
    queryFn: () => listThreads(),
  });

  const newChat = async () => {
    try {
      const t = await createThread({ corpus: "data-engineering", title: "New conversation" });
      qc.invalidateQueries({ queryKey: ["threads"] });
      nav({ to: "/chat/$threadId", params: { threadId: t.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const removeThread = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteThread({ threadId: id });
    notifyWordUsageChanged();
    qc.invalidateQueries({ queryKey: ["threads"] });
    if (params.threadId === id) nav({ to: "/" });
  };

  // Free-tier processed word usage (reactive across the whole session).
  const { total: wordsUsed, limit: wordsLimit, pct } = useWordUsage();
  const wordsUsedLabel =
    wordsUsed === 0
      ? "0"
      : wordsUsed >= 1000
        ? `${(wordsUsed / 1000).toFixed(wordsUsed >= 10_000 ? 0 : 1)}K`
        : `${wordsUsed}`;

  return (
    <aside className="w-72 shrink-0 h-screen flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <img
            src="/logo-new.svg"
            alt="Decipher Logo"
            className="h-9 w-9"
          />
        </motion.div>
        <div>
          <h1 className="text-lg font-bold tracking-tight gradient-text text-glow leading-none">
            Decipher
          </h1>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
            RAG Co-pilot
          </p>
        </div>
      </Link>

      {/* Primary action */}
      <div className="px-4 pt-4">
        <Button
          onClick={newChat}
          className="w-full gap-2 bg-gradient-to-r from-[color:var(--cyan)] to-[color:var(--electric)] text-slate-950 font-semibold hover:opacity-90 shadow-glow"
        >
          <Plus className="h-4 w-4" /> New conversation
        </Button>
      </div>

      {/* Recent chats */}
      <div className="flex-1 min-h-0 mt-5 flex flex-col">

        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2 px-5">
          Recent
        </p>
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {threads.length === 0 && (
            <p className="text-xs text-muted-foreground/70 px-2 py-4 text-center">
              No conversations yet.
            </p>
          )}
          {threads.map((t) => {
            const active = params.threadId === t.id;
            return (
              <Link
                key={t.id}
                to="/chat/$threadId"
                params={{ threadId: t.id }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition group",
                  active
                    ? "bg-[color:var(--cyan)]/10 text-foreground ring-1 ring-[color:var(--cyan)]/30"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground",
                )}
              >
                <MessageSquare
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    active ? "text-[color:var(--cyan)]" : "text-muted-foreground/60",
                  )}
                />
                <span className="truncate flex-1">{t.title}</span>
                <button
                  onClick={(e) => removeThread(e, t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-card text-muted-foreground hover:text-destructive transition"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Token bar + local-storage badge */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[color:var(--cyan)]" /> Free tier
                  </span>
                  <span>
                    {wordsUsedLabel} / {(wordsLimit / 1000).toFixed(0)}K words used
                  </span>
                </div>
                <Progress value={pct} className="h-1.5 bg-card" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-center leading-snug">
              Free Analytics Tier: Upgrade to Premium for unlimited token context and multi-document cross-comparison.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <UserFooter />
      </div>
    </aside>
  );
}

function UserFooter() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? "";
  const initials = (email[0] ?? "D").toUpperCase() + (email[1] ?? "C").toUpperCase();
  return (
    <div className="flex items-center gap-2.5 pt-1">
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[color:var(--electric)] to-[color:var(--cyan)] grid place-items-center text-xs font-bold text-slate-950">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" title={email}>
          {email || "Signed in"}
        </p>
        <p className="text-[10px] text-muted-foreground">Authenticated session</p>
      </div>
      <button
        onClick={() => signOut()}
        title="Log out"
        aria-label="Log out"
        className="h-8 w-8 grid place-items-center rounded-lg border border-sidebar-border text-muted-foreground hover:text-[color:var(--cyan)] hover:border-[color:var(--cyan)]/40 hover:bg-[color:var(--cyan)]/5 transition"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

