import { useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Cloud,
  Workflow,
  FileSpreadsheet,
  BarChart3,
  LineChart,
  Code2,
  Sigma,
  TrendingUp,
  Server,
  Boxes,
} from "lucide-react";
import { useAuth, displayNameFor } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export type Card = {
  icon: typeof Database;
  title: string;
  subtext: string;
  button: string;
  prompt: string;
  accent: string;
};

export type Role = {
  id: string;
  label: string;
  emoji: string;
  placeholder: string;
  cards: Card[];
};

export const ROLES: Role[] = [
  {
    id: "analyst",
    label: "Data Analyst",
    emoji: "📊",
    placeholder:
      "Ask Decipher about Excel formulas, VBA macros, DAX measures, Power BI models, or Tableau LOD expressions...",
    cards: [
      {
        icon: FileSpreadsheet,

        title: "Advanced Excel & VBA",
        subtext: "Formulas, lookup optimizations, and macro debugging.",
        button: "Analyze Spreadsheet Logic",
        prompt:
          "Help me analyze and optimize this Excel/VBA spreadsheet logic: ",
        accent: "from-emerald-400 to-[color:var(--cyan)]",
      },
      {
        icon: BarChart3,
        title: "PowerBI & DAX",
        subtext: "Data modeling, star schemas, and complex measure optimization.",
        button: "Debug DAX Formula",
        prompt: "Help me debug and optimize this DAX formula: ",
        accent: "from-yellow-400 to-orange-400",
      },
      {
        icon: LineChart,
        title: "Tableau Visualizations",
        subtext: "Level of Detail (LOD) expressions and dashboard performance.",
        button: "Optimize Tableau Query",
        prompt:
          "Help me optimize this Tableau LOD expression / dashboard query: ",
        accent: "from-[color:var(--electric)] to-blue-400",
      },
    ],
  },
  {
    id: "scientist",
    label: "Data Scientist",
    emoji: "🧪",
    placeholder:
      "Ask Decipher about NumPy arrays, Pandas dataframes, statistical significance, R Tidyverse, or regression modeling...",
    cards: [

      {
        icon: Code2,
        title: "Python Data Stack",
        subtext: "Pandas pipelines, NumPy optimizations, and data cleaning.",
        button: "Review Pandas Script",
        prompt: "Please review and optimize this Pandas/NumPy script: ",
        accent: "from-[color:var(--cyan)] to-cyan-300",
      },
      {
        icon: Sigma,
        title: "R Studio Analytics",
        subtext: "Statistical modeling, tidyverse operations, and ggplot2 graphs.",
        button: "Fix R Script",
        prompt: "Help me fix and improve this R script: ",
        accent: "from-sky-400 to-indigo-400",
      },
      {
        icon: TrendingUp,
        title: "Predictive Analytics",
        subtext: "Feature engineering, regression models, and validation strategy.",
        button: "Tune Model Baseline",
        prompt:
          "Help me tune the baseline for this predictive model (features, validation): ",
        accent: "from-violet-400 to-[color:var(--electric)]",
      },
    ],
  },
  {
    id: "engineer",
    label: "Data Engineer",
    emoji: "⚙️",
    placeholder:
      "Ask Decipher about Spark optimization, distributed shuffling, SQL window partitioning, ETL orchestration, or dbt transformations...",
    cards: [

      {
        icon: Database,
        title: "SQL Performance & DDL",
        subtext: "Window functions, partitioning, query plans, and indexing.",
        button: "Optimize SQL Query",
        prompt: "Help me optimize this SQL query for performance: ",
        accent: "from-[color:var(--cyan)] to-cyan-300",
      },
      {
        icon: Workflow,
        title: "ETL Pipelines & Spark",
        subtext: "PySpark transformations, orchestration, and data lake architecture.",
        button: "Debug ETL Pipeline",
        prompt: "Help me debug this ETL / PySpark pipeline: ",
        accent: "from-orange-400 to-pink-400",
      },
      {
        icon: Cloud,
        title: "Cloud Infrastructure",
        subtext: "Azure Synapse, AWS Redshift, IAM policies, and cloud storage.",
        button: "Check Cloud Specs",
        prompt:
          "Help me review this cloud infrastructure setup (Azure/AWS, IAM, storage): ",
        accent: "from-[color:var(--electric)] to-blue-400",
      },
    ],
  },
];

export function WelcomeCanvas({
  onPick,
  onPrefill,
  disabled,
  activeRoleId,
  onRoleChange,
  embed,
}: {
  onPick: (prompt: string) => void;
  onPrefill?: (prompt: string) => void;
  disabled?: boolean;
  activeRoleId?: string;
  onRoleChange?: (id: string) => void;
  embed?: boolean;
}) {
  const { user } = useAuth();
  const name = displayNameFor(user);
  const [internalId, setInternalId] = useState(ROLES[0].id);
  const activeId = activeRoleId ?? internalId;
  const active = ROLES.find((r) => r.id === activeId) ?? ROLES[0];
  const setActiveId = (id: string) => {
    if (onRoleChange) onRoleChange(id);
    else setInternalId(id);
  };

  return (
    <div className={embed ? "" : "flex-1 min-h-0 overflow-y-auto"}>
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-10">

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--cyan)]/30 bg-[color:var(--cyan)]/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--cyan)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--cyan)] shadow-glow" />
            Retrieval-augmented · grounded
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight">
            Hi <span className="gradient-text text-glow">{name}</span>, what are we deciphering?
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Pick your role to surface the right tool stack — answers come back grounded with citations.
          </p>
        </motion.div>

        {/* Role tabs */}
        <div className="mt-10 -mx-6 px-6 overflow-x-auto no-scrollbar">
          <div
            role="tablist"
            aria-label="Select your role"
            className="mx-auto flex w-max sm:w-full sm:justify-center gap-2 sm:gap-3"
          >
            {ROLES.map((r) => {
              const isActive = r.id === activeId;
              return (
                <button
                  key={r.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(r.id)}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition whitespace-nowrap border",
                    isActive
                      ? "border-[color:var(--cyan)]/60 bg-[color:var(--cyan)]/10 text-foreground shadow-glow"
                      : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground hover:border-[color:var(--cyan)]/30",
                  )}
                >
                  <span aria-hidden>{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {active.cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.06 }}
              whileHover={{ y: -3 }}
              className="group relative flex flex-col rounded-2xl bg-card/50 backdrop-blur p-6 gradient-border hover:bg-card/70 transition"
            >
              <div
                className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.accent} grid place-items-center shadow-glow`}
              >
                <c.icon className="h-5 w-5 text-slate-950" strokeWidth={2.4} />
              </div>
              <h3 className="mt-5 font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.subtext}</p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => (onPrefill ?? onPick)(c.prompt)}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--cyan)]/40 bg-[color:var(--cyan)]/10 px-4 py-2 text-sm font-medium text-[color:var(--cyan)] hover:bg-[color:var(--cyan)]/20 transition disabled:opacity-50"
              >
                {c.button}
                <span aria-hidden>→</span>
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
