import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WelcomeCanvas, ROLES } from "@/components/decipher/welcome-canvas";
import { Composer } from "@/components/decipher/composer";
import { createThread, sendMessage, RateLimitError } from "@/lib/chat.functions";
import { ensureUnderLimit, notifyWordUsageChanged } from "@/lib/word-usage";
import { useWordUsage } from "@/hooks/use-word-usage";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [roleId, setRoleId] = useState(ROLES[0].id);
  const [prefill, setPrefill] = useState<{ key: number; value: string }>({
    key: 0,
    value: "",
  });

  const activeRole = ROLES.find((r) => r.id === roleId) ?? ROLES[0];
  const { exceeded } = useWordUsage();

  const startWith = async (prompt: string, file?: File | null) => {
    if (!ensureUnderLimit(prompt)) return;
    setBusy(true);
    try {
      const t = await createThread({
        corpus: "data-engineering",
        title: prompt.slice(0, 60),
        selectedRole: activeRole.label,
      });
      await sendMessage({
        threadId: t.id,
        content: prompt,
        selectedRole: activeRole.label,
        user: user?.id ?? user?.email ?? "anonymous",
        file: file || undefined,
      });
      notifyWordUsageChanged();
      qc.invalidateQueries({ queryKey: ["threads"] });
      nav({ to: "/chat/$threadId", params: { threadId: t.id } });
    } catch (e) {
      if (e instanceof RateLimitError) {
        toast.error("Decipher is experiencing high demand. Please try sending your query again in a few moments.");
      } else {
        toast.error(e instanceof Error ? e.message : "Failed to start chat");
      }
      setBusy(false);
    }
  };

  const prefillComposer = (text: string) => {
    setPrefill((p) => ({ key: p.key + 1, value: text }));
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
      <WelcomeCanvas
        onPick={startWith}
        onPrefill={prefillComposer}
        disabled={busy}
        activeRoleId={roleId}
        onRoleChange={setRoleId}
        embed
      />
      <Composer
        onSubmit={startWith}
        disabled={busy || exceeded}
        prefillKey={prefill.key}
        prefillValue={prefill.value}
        placeholder={activeRole.placeholder}
        inline
      />
    </div>
  );
}

