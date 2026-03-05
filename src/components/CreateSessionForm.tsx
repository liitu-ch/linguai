import { useState } from "react";
import { Mic, Check, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import type { SupportedLanguage } from "~/types/session.ts";
import { LANGUAGE_LIST } from "~/lib/languages.ts";
import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import { Label } from "~/components/ui/label.tsx";
import { cn } from "~/lib/utils.ts";

interface CreateSessionFormProps {
  onSubmit: (data: {
    title: string;
    sourceLang: SupportedLanguage;
    targetLanguages: SupportedLanguage[];
    speakerName: string;
    password: string;
  }) => void;
  loading?: boolean;
}

export function CreateSessionForm({
  onSubmit,
  loading,
}: CreateSessionFormProps) {
  const [title, setTitle] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [sourceLang, setSourceLang] = useState<SupportedLanguage>("en");
  const [targetLanguages, setTargetLanguages] = useState<SupportedLanguage[]>([]);
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const toggleTarget = (lang: SupportedLanguage) => {
    setTargetLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetLanguages.length === 0) return;
    if (isProtected && !password.trim()) return;
    onSubmit({ title, sourceLang, targetLanguages, speakerName, password: isProtected ? password : "" });
  };

  const availableTargets = LANGUAGE_LIST.filter((l) => l.code !== sourceLang);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Step 1: Session Details ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            1
          </div>
          <h3 className="font-semibold">Session-Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 pl-9 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs text-muted-foreground">
              Event-Titel
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Keynote Tag 1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="speaker" className="text-xs text-muted-foreground">
              Speaker Name{" "}
              <span className="text-muted-foreground/50">(optional)</span>
            </Label>
            <Input
              id="speaker"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="z.B. Dr. Maria Müller"
            />
          </div>
        </div>

        {/* ── Password protection toggle ── */}
        <div className="pl-9">
          <button
            type="button"
            onClick={() => {
              setIsProtected((v) => !v);
              if (isProtected) setPassword("");
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              isProtected
                ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-background hover:border-primary/30 hover:bg-primary/[0.02]"
            )}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                isProtected ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground"
              )}
            >
              <Lock className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Passwortschutz
              </p>
              <p className="text-xs text-muted-foreground">
                Zuhörer müssen ein Passwort eingeben, um beizutreten
              </p>
            </div>
            {/* Toggle pill */}
            <div
              className={cn(
                "relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                isProtected ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute size-3.5 rounded-full bg-white shadow-sm transition-transform",
                  isProtected ? "translate-x-[18px]" : "translate-x-[3px]"
                )}
              />
            </div>
          </button>

          {isProtected && (
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground">
                Passwort
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort für Zuhörer"
                  className="pr-10"
                  required={isProtected}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Step 2: Source Language ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            2
          </div>
          <h3 className="font-semibold">Quellsprache</h3>
          <span className="text-xs text-muted-foreground">
            Sprache des Speakers
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pl-9 sm:grid-cols-3 lg:grid-cols-4">
          {LANGUAGE_LIST.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setSourceLang(l.code);
                setTargetLanguages((prev) =>
                  prev.filter((t) => t !== l.code)
                );
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm text-left transition-all",
                sourceLang === l.code
                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                  : "border-border bg-background hover:border-primary/30 hover:bg-primary/[0.02]"
              )}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="font-medium truncate">{l.label}</span>
              {sourceLang === l.code && (
                <Check className="ml-auto size-3.5 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 3: Target Languages ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
              targetLanguages.length > 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            3
          </div>
          <h3 className="font-semibold">Zielsprachen</h3>
          {targetLanguages.length > 0 ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {targetLanguages.length} gewählt
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Mindestens 1 wählen
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 pl-9 sm:grid-cols-3 lg:grid-cols-4">
          {availableTargets.map((l) => {
            const isActive = targetLanguages.includes(l.code);
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => toggleTarget(l.code)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-primary/30 hover:bg-primary/[0.02]"
                )}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className="font-medium truncate">{l.label}</span>
                {isActive && (
                  <Check className="ml-auto size-3.5 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Submit ── */}
      <Button
        type="submit"
        size="lg"
        disabled={
          loading ||
          targetLanguages.length === 0 ||
          (isProtected && !password.trim())
        }
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Erstelle Session…
          </>
        ) : (
          <>
            {isProtected ? (
              <Lock className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}
            Session starten
          </>
        )}
      </Button>
    </form>
  );
}
