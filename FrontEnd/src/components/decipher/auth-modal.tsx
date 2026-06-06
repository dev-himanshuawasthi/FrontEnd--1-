import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Mail, Lock, User, CheckCircle2, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export function AuthModal({ onClose }: { onClose?: () => void } = {}) {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; title: string; message: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        const msg = `Reset link sent to ${email}. Check your inbox.`;
        setStatus({ kind: "success", title: "Email sent", message: msg });
        toast.success("Reset link sent", { description: msg });
      } else if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const msg = `Signed in as ${data.user?.email ?? email}`;
        setStatus({ kind: "success", title: "Welcome back", message: msg });
        toast.success("Signed in", { description: msg });
      } else {
        const first = firstName.trim();
        const last = lastName.trim();
        const full_name = [first, last].filter(Boolean).join(" ");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { first_name: first, last_name: last, full_name, name: full_name },
          },
        });
        if (error) throw error;
        const needsConfirm = !data.session;
        const msg = needsConfirm
          ? `Confirmation email sent to ${email}. Verify to finish sign-up.`
          : `Account created for ${data.user?.email ?? email}.`;
        setStatus({ kind: "success", title: "Account created", message: msg });
        toast.success("Account created", { description: msg });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setStatus({ kind: "error", title: "Request failed", message });
      toast.error(mode === "signin" ? "Sign-in failed" : "Sign-up failed", { description: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-md my-auto rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_60px_-10px_rgba(6,182,212,0.35)]"
      >
        {onClose && (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(600px circle at 50% -10%, rgba(6,182,212,0.18), transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="flex flex-col items-center text-center">
            <img
              src="/logo-new.svg"
              alt="Decipher Logo"
              className="h-12 w-12 drop-shadow-lg"
            />
            <h1 className="mt-4 text-2xl font-bold tracking-tight gradient-text text-glow">
              Decipher
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to access your knowledge co-pilot"
                : mode === "signup"
                  ? "Create an account to get started"
                  : "Enter your email and we'll send a reset link"}
            </p>
          </div>

          <AnimatePresence>
            {status && (
              <motion.div
                key={status.title + status.message}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-6"
              >
                <Alert
                  variant={status.kind === "error" ? "destructive" : "default"}
                  className={
                    status.kind === "success"
                      ? "border-[color:var(--cyan)]/40 bg-[color:var(--cyan)]/10 text-foreground"
                      : ""
                  }
                >
                  {status.kind === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--cyan)]" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{status.title}</AlertTitle>
                  <AlertDescription className="text-xs opacity-90">{status.message}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs uppercase tracking-wider text-muted-foreground">
                    First name
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-9 h-11 bg-card/40 border-white/10 focus-visible:ring-[color:var(--cyan)]"
                      placeholder="Rupesh"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 bg-card/40 border-white/10 focus-visible:ring-[color:var(--cyan)]"
                    placeholder="Galhotra"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 bg-card/40 border-white/10 focus-visible:ring-[color:var(--cyan)]"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {mode !== "reset" && (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-11 bg-card/40 border-white/10 focus-visible:ring-[color:var(--cyan)]"
                    placeholder="••••••••"
                  />
                </div>
                {mode === "signin" && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStatus(null);
                        setMode("reset");
                      }}
                      className="text-xs text-muted-foreground/80 hover:text-[color:var(--cyan)] transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-11 gap-2 bg-gradient-to-r from-[color:var(--cyan)] to-[color:var(--electric)] text-slate-950 font-semibold hover:opacity-90 shadow-glow"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send Reset Link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "reset" ? (
              <>
                Remembered it?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStatus(null);
                    setMode("signin");
                  }}
                  className="text-[color:var(--cyan)] hover:underline font-medium"
                >
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                {mode === "signin" ? "New to Decipher?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStatus(null);
                    setMode(mode === "signin" ? "signup" : "signin");
                  }}
                  className="text-[color:var(--cyan)] hover:underline font-medium"
                >
                  {mode === "signin" ? "Create account" : "Sign in"}
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
