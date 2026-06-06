import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Mic, ArrowUp, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  onSubmit: (content: string, file?: File | null) => void | Promise<void>;
  disabled?: boolean;
  prefillKey?: number;
  prefillValue?: string;
  placeholder?: string;
  inline?: boolean;
};

const DEFAULT_PLACEHOLDER =
  "Ask Decipher about Excel macros, DAX, Python pipelines, SQL tuning, or Cloud architecture...";

const ACCEPTED_FILES =
  ".pdf,.docx,.doc,.csv,.xlsx,.xls,.sql,.R,.py,.png,.jpg,.jpeg";

type SpeechRecognitionLike = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

export function Composer({ onSubmit, disabled, prefillKey, prefillValue, placeholder, inline }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseTextRef = useRef("");

  const effectivePlaceholder = placeholder ?? DEFAULT_PLACEHOLDER;
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState(effectivePlaceholder);
  const [phVisible, setPhVisible] = useState(true);

  useEffect(() => {
    if (effectivePlaceholder === displayedPlaceholder) return;
    setPhVisible(false);
    const t = setTimeout(() => {
      setDisplayedPlaceholder(effectivePlaceholder);
      setPhVisible(true);
    }, 180);
    return () => clearTimeout(t);
  }, [effectivePlaceholder, displayedPlaceholder]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [value]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    if (prefillKey === undefined || !prefillValue) return;
    setValue(prefillValue);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
      el.scrollTop = el.scrollHeight;
    });
  }, [prefillKey, prefillValue]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    console.log("[Composer] Submitting with file:", attachedFile?.name);
    onSubmit(trimmed, attachedFile);
    setValue("");
    setAttachedFile(null);
    requestAnimationFrame(() => ref.current?.focus());
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      toast.success("File attached", { description: file.name });
    }
    e.target.value = "";
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input unavailable", {
        description: "Your browser does not support the Web Speech API.",
      });
      return;
    }
    const rec: SpeechRecognitionLike = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    baseTextRef.current = value ? value.replace(/\s+$/, "") + " " : "";

    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setValue(baseTextRef.current + transcript);
    };
    rec.onerror = (e: any) => {
      toast.error("Voice input error", { description: e?.error ?? "Unknown error" });
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  return (
    <div
      className={cn(
        "px-4 pb-5 pt-3 bg-gradient-to-t from-background via-background/90 to-transparent",
        inline ? "relative" : "sticky bottom-0",
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <AnimatePresence>
          {attachedFile && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="mb-2 flex flex-wrap gap-2"
            >
              <div className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--cyan)]/30 bg-[color:var(--cyan)]/10 px-3 py-1.5 text-xs text-foreground backdrop-blur-sm shadow-glow">
                <FileText className="h-3.5 w-3.5 text-[color:var(--cyan)]" />
                <span className="max-w-[220px] truncate font-medium">{attachedFile.name}</span>
                <span className="text-muted-foreground">
                  {(attachedFile.size / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  aria-label="Remove attachment"
                  className="ml-1 grid h-4 w-4 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            "relative rounded-2xl bg-card/70 backdrop-blur-xl gradient-border transition",
            "focus-within:ring-glow",
            listening && "ring-2 ring-[color:var(--cyan)]/60 animate-pulse",
          )}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            disabled={disabled}
            placeholder={listening ? "Listening…" : displayedPlaceholder}
            rows={1}
            className={cn(
              "block w-full resize-none bg-transparent px-4 pt-3.5 pb-12 pr-4 text-[15px] outline-none placeholder:text-muted-foreground/70 disabled:opacity-60",
              "transition-opacity duration-200 ease-out placeholder:transition-opacity",
              !value && !phVisible ? "opacity-0" : "opacity-100",
            )}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILES}
            onChange={onFilePick}
            className="hidden"
          />

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <IconBtn
                label="Attach document"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label={listening ? "Stop recording" : "Voice input"}
                disabled={disabled}
                onClick={toggleVoice}
                active={listening}
              >
                <Mic className={cn("h-4 w-4", listening && "text-[color:var(--cyan)]")} />
              </IconBtn>
              {listening && (
                <span className="ml-1 flex items-center gap-1.5 text-[11px] font-medium text-[color:var(--cyan)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--cyan)] opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--cyan)]" />
                  </span>
                  Recording
                </span>
              )}
            </div>
            <button
              onClick={submit}
              disabled={disabled || !value.trim()}
              className={cn(
                "h-9 w-9 grid place-items-center rounded-xl transition",
                value.trim() && !disabled
                  ? "bg-gradient-to-br from-[color:var(--cyan)] to-[color:var(--electric)] text-slate-950 shadow-glow hover:scale-105"
                  : "bg-muted text-muted-foreground/60 cursor-not-allowed",
              )}
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Decipher can make mistakes — verify cited sources before shipping.
        </p>
      </motion.div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  disabled,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:text-[color:var(--cyan)] hover:bg-[color:var(--cyan)]/10 transition disabled:opacity-40",
        active && "bg-[color:var(--cyan)]/10 text-[color:var(--cyan)]",
      )}
    >
      {children}
    </button>
  );
}
