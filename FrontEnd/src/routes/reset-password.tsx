import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Password updated", { description: "You can now sign in with your new password." });
      setTimeout(() => nav({ to: "/" }), 1500);
    } catch (err) {
      toast.error("Reset failed", {
        description: err instanceof Error ? err.message : "Could not update password",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8 shadow-[0_0_60px_-10px_rgba(6,182,212,0.35)]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[color:var(--cyan)] to-[color:var(--electric)] grid place-items-center shadow-glow">
            <Sparkles className="h-5 w-5 text-slate-950" strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight gradient-text text-glow">
            Reset password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {done ? "Password updated successfully" : "Enter your new password below"}
          </p>
        </div>

        {done ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-[color:var(--cyan)]" />
            <p className="text-sm text-muted-foreground">Redirecting…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newpw" className="text-xs uppercase tracking-wider text-muted-foreground">
                New password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newpw"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11 bg-card/40 border-white/10 focus-visible:ring-[color:var(--cyan)]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy || !ready}
              className="w-full h-11 gap-2 bg-gradient-to-r from-[color:var(--cyan)] to-[color:var(--electric)] text-slate-950 font-semibold hover:opacity-90 shadow-glow"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
            {!ready && (
              <p className="text-xs text-center text-muted-foreground">
                Waiting for recovery session… open this page from the email link.
              </p>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
}
