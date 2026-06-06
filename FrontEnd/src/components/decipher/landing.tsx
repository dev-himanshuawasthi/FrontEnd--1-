import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Brain, ShieldCheck, Database, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "./auth-modal";

const FEATURES = [
  {
    icon: Brain,
    eyebrow: "Data Science",
    title: "Contextual Analysis",
    body: "Ask complex machine learning or statistics questions over custom PDF and Python documentation portfolios.",
    accent: "from-violet-400 to-[color:var(--electric)]",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Cloud Infrastructure",
    title: "Verified Citations",
    body: "Get instant, clickable source badges pointing straight to specific clauses in dense Azure and AWS architecture specifications.",
    accent: "from-[color:var(--cyan)] to-cyan-300",
  },
  {
    icon: Database,
    eyebrow: "Data Engineering",
    title: "Schema Optimization",
    body: "Synthesize, review, and optimize complex SQL queries based entirely on your project's unique DDL references.",
    accent: "from-[color:var(--electric)] to-blue-400",
  },
];

export function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const openAuth = () => {
    setMenuOpen(false);
    setAuthOpen(true);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px circle at 20% -10%, rgba(6,182,212,0.18), transparent 60%), radial-gradient(700px circle at 80% 10%, rgba(59,130,246,0.15), transparent 60%)",
        }}
      />

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight gradient-text">Decipher</span>
          </a>

          <div className="hidden md:flex items-center gap-8 lg:gap-10 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#architecture" className="hover:text-foreground transition">Architecture</a>
            <Button
              size="sm"
              onClick={openAuth}
              className="ml-2 bg-gradient-to-r from-[color:var(--cyan)] to-[color:var(--electric)] text-slate-950 font-semibold hover:opacity-90 shadow-glow"
            >
              Sign In
            </Button>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden rounded-md p-2 text-foreground hover:bg-white/5"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Features</a>
              <a href="#architecture" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Architecture</a>
              <Button
                size="sm"
                onClick={openAuth}
                className="mt-2 w-full bg-gradient-to-r from-[color:var(--cyan)] to-[color:var(--electric)] text-slate-950 font-semibold hover:opacity-90 shadow-glow"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-28 pb-24 sm:pb-32 text-center">
        {/* Logo with Subtitle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6 mb-12"
        >
          {/* Logo Image */}
          <img
            src="/logo-new.svg"
            alt="Decipher Logo"
            className="h-40 w-40 drop-shadow-lg"
          />
          {/* Logo Text */}
          <div>
            <h2 className="text-4xl font-bold tracking-tight gradient-text text-glow">
              DECIPHER
            </h2>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mt-2">
              Decoding the Data Queries
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--cyan)]/30 bg-[color:var(--cyan)]/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--cyan)]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--cyan)] shadow-glow" />
          Retrieval-augmented · grounded
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-8 max-w-4xl text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]"
        >
          Decrypt your technical documentation with{" "}
          <span className="gradient-text text-glow">Intelligence.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mt-7 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground"
        >
          The advanced RAG co-pilot for Data Scientists and Cloud Engineers. Query Azure, AWS, and SQL documentation with zero hallucinations and exact page-level citations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6"
        >
          <Button
            size="lg"
            onClick={openAuth}
            className="h-12 px-8 gap-2 bg-gradient-to-r from-[color:var(--cyan)] to-[color:var(--electric)] text-slate-950 font-semibold hover:opacity-90 shadow-[0_0_40px_-5px_rgba(6,182,212,0.6)]"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition px-3 py-2"
          >
            See how it works →
          </a>
        </motion.div>
      </section>

      {/* Feature cards */}
      <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-12 pb-24 sm:pb-32">
        <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="group relative rounded-2xl bg-card/50 backdrop-blur p-7 sm:p-8 gradient-border hover:bg-card/70 transition"
            >
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.accent} grid place-items-center shadow-glow`}>
                <f.icon className="h-5 w-5 text-slate-950" strokeWidth={2.4} />
              </div>
              <div className="mt-6 text-[11px] uppercase tracking-[0.18em] text-[color:var(--cyan)]">
                {f.eyebrow}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Architecture anchor + CTA */}
      <section id="architecture" className="mx-auto max-w-4xl px-4 sm:px-6 pt-4 pb-28 sm:pb-32 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur p-10 sm:p-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Built on a <span className="gradient-text">grounded retrieval</span> stack.
          </h2>
          <p className="mt-5 text-sm sm:text-base leading-relaxed text-muted-foreground max-w-xl mx-auto">
            Vector search, semantic re-ranking, and citation-first synthesis — wired to your private corpora so every answer is traceable.
          </p>
          <Button
            size="lg"
            onClick={openAuth}
            className="mt-10 h-12 px-8 gap-2 bg-gradient-to-r from-[color:var(--cyan)] to-[color:var(--electric)] text-slate-950 font-semibold hover:opacity-90 shadow-glow"
          >
            Start Deciphering
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/5 mt-8 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Decipher · Grounded answers for engineers
      </footer>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
