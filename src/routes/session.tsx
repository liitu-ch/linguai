import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Languages,
  Loader2,
  Lock,
  Settings,
  Volume2,
  VolumeOff,
  Wifi,
  WifiOff,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useChannel } from "~/hooks/useChannel.ts";
import { useTTS, type TTSMode } from "~/hooks/useTTS.ts";
import { TranscriptView } from "~/components/TranscriptView.tsx";
import { ThemeToggle } from "~/components/ThemeToggle.tsx";
import { LANGUAGES } from "~/lib/languages.ts";
import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import { cn } from "~/lib/utils.ts";
import { supabase } from "~/lib/supabase.ts";
import { sha256 } from "~/lib/crypto.ts";
import type { SupportedLanguage, TranslationSegment } from "~/types/session.ts";

interface DisplaySegment {
  id: string;
  text: string;
  isFinal: boolean;
  timestampMs: number;
}

const TTS_OPTIONS: {
  value: TTSMode;
  label: string;
  description: string;
  icon: typeof Volume2;
}[] = [
  {
    value: "off",
    label: "Nur Text",
    description: "Kein Audio — nur Transkript lesen.",
    icon: VolumeOff,
  },
  {
    value: "browser",
    label: "Browser-Stimme",
    description: "Kostenlose Sprachausgabe des Geräts.",
    icon: Volume2,
  },
  {
    value: "openai",
    label: "Premium-Stimme",
    description: "Natürlich klingende KI-Stimme (mehr Daten).",
    icon: Sparkles,
  },
];

export function Session() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage | null>(null);
  const [confirmedLang, setConfirmedLang] = useState(false);
  const [segments, setSegments] = useState<DisplaySegment[]>([]);
  const [ttsMode, setTtsMode] = useState<TTSMode>("browser");
  const [showSettings, setShowSettings] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const showSettingsRef = useRef(false);

  // ── Password gate state ───────────────────────────────────────────────────
  const [isProtected, setIsProtected] = useState<boolean | null>(null); // null = loading
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);

  // ── Check if session is password protected ───────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    supabase.rpc("get_event_protection", { p_event_id: sessionId }).then(({ data }) => {
      setIsProtected(data === true);
    });
  }, [sessionId]);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !passwordInput.trim()) return;
    setVerifying(true);
    setPasswordError(false);
    const hash = await sha256(passwordInput.trim());
    const { data } = await supabase.rpc("verify_event_password", {
      p_event_id: sessionId,
      p_password_hash: hash,
    });
    setVerifying(false);
    if (data === true) {
      setPasswordVerified(true);
    } else {
      setPasswordError(true);
    }
  };

  const targetLangs = (searchParams.get("targets") || "es,pt,ms").split(
    ","
  ) as SupportedLanguage[];
  const title = searchParams.get("title") || "Live-Übersetzung";

  const { enqueue } = useTTS({
    mode: ttsMode,
    lang: selectedLang ?? "en",
  });

  const handleSegment = useCallback(
    (segment: TranslationSegment) => {
      if (!selectedLang) return;
      const text = segment.translations[selectedLang] ?? segment.originalText;
      setSegments((prev) => {
        if (prev.some((s) => s.id === segment.id)) return prev;
        return [
          ...prev,
          {
            id: segment.id,
            text,
            isFinal: segment.isFinal,
            timestampMs: segment.timestampMs || Date.now(),
          },
        ];
      });
      enqueue(text, segment.id, segment.isFinal);
      if (showSettingsRef.current) setHasUnread(true);
    },
    [selectedLang, enqueue]
  );

  const { connectionState } = useChannel({
    sessionId: sessionId ?? "",
    onSegment: handleSegment,
    enabled: !!selectedLang && !!sessionId && confirmedLang,
    trackPresence: true,
  });

  const handleSelectLang = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    setConfirmedLang(true);
    setShowSettings(false);
  };

  const handleToggleSettings = () => {
    const next = !showSettings;
    setShowSettings(next);
    showSettingsRef.current = next;
    if (!next) setHasUnread(false);
  };

  const handleJoinSession = (code: string) => {
    const params = new URLSearchParams(searchParams);
    navigate(`/session/${code}?${params.toString()}`);
    window.location.reload();
  };

  if (!sessionId) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <p className="text-destructive text-center">Keine Session-ID</p>
      </div>
    );
  }

  // ── Password gate screen ───────────────────────────────────────────────────
  if (isProtected === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isProtected && !passwordVerified) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-xs space-y-8">
            {/* Logo + title */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-500">
                <Languages className="size-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Diese Session ist passwortgeschützt
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <Lock className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Bitte gib das Passwort ein, um beizutreten.
                </span>
              </div>

              <div className="relative">
                <Input
                  type={showPasswordInput ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Passwort"
                  autoFocus
                  className={cn(
                    "pr-10",
                    passwordError && "border-destructive focus-visible:ring-destructive/30"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordInput((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPasswordInput ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>

              {passwordError && (
                <p className="text-center text-sm text-destructive">
                  Falsches Passwort. Bitte erneut versuchen.
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={verifying || !passwordInput.trim()}
                className="w-full gap-2 bg-indigo-500 text-white hover:bg-indigo-400"
              >
                {verifying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                Beitreten
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Language selection screen ──────────────────────────────────────────────
  if (!confirmedLang) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-xs space-y-8">
            {/* Logo + title */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-500">
                <Languages className="size-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Wähle deine Übersetzungssprache
              </p>
            </div>

            {/* Language cards — one tap to join */}
            <div className="space-y-3">
              {targetLangs.map((lang) => {
                const l = LANGUAGES[lang];
                return (
                  <button
                    key={lang}
                    onClick={() => handleSelectLang(lang)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-border bg-muted/30 p-4 text-left transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 active:scale-[0.98]"
                  >
                    <span className="text-4xl leading-none">{l.flag}</span>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {l.label}
                      </p>
                    </div>
                    <ArrowRight className="ml-auto size-5 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground/70">
              Session-ID: {sessionId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentLang = selectedLang ? LANGUAGES[selectedLang] : null;

  // ── Live session screen ────────────────────────────────────────────────────
  return (
    <div className="flex min-h-svh flex-col bg-background">

      {/* Compact status header */}
      {!showSettings && (
        <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  connectionState === "open"
                    ? "bg-green-400"
                    : connectionState === "error"
                      ? "bg-destructive"
                      : "bg-yellow-400 animate-pulse"
                )}
              />
              <span className="truncate text-sm font-semibold text-foreground">
                {title}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {currentLang && (
                <span className="text-sm text-muted-foreground">
                  {currentLang.flag} {currentLang.label}
                </span>
              )}
              <button
                onClick={handleToggleSettings}
                className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                <Settings className="size-4" />
                {hasUnread && (
                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1">
        {showSettings ? (
          /* Settings panel */
          <div className="space-y-5 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Einstellungen</h2>
              <div className="flex items-center gap-1">
                <ThemeToggle className="text-muted-foreground hover:bg-muted/40 hover:text-foreground" />
                <button
                  onClick={handleToggleSettings}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                >
                  <Check className="size-4" />
                </button>
              </div>
            </div>

            {/* Language switch */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Sprache
              </p>
              <div className="space-y-2">
                {targetLangs.map((lang) => {
                  const l = LANGUAGES[lang];
                  const isSelected = selectedLang === lang;
                  return (
                    <button
                      key={lang}
                      onClick={() => handleSelectLang(lang)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                        isSelected
                          ? "border-indigo-500/40 bg-indigo-500/10 text-foreground"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      <span className="text-2xl">{l.flag}</span>
                      <span className="font-medium">{l.label}</span>
                      {isSelected && (
                        <Check className="ml-auto size-4 text-indigo-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TTS mode */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Sprachausgabe
              </p>
              <div className="space-y-2">
                {TTS_OPTIONS.map((opt) => {
                  const isSelected = ttsMode === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTtsMode(opt.value)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                        isSelected
                          ? "border-indigo-500/40 bg-indigo-500/10"
                          : "border-border bg-muted/30"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                          isSelected
                            ? "border-indigo-400 bg-indigo-400"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && (
                          <span className="size-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={cn(
                              "size-4",
                              isSelected ? "text-indigo-400" : "text-muted-foreground"
                            )}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {opt.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
              {connectionState === "open" ? (
                <Wifi className="size-5 text-green-400" />
              ) : connectionState === "error" ? (
                <WifiOff className="size-5 text-destructive" />
              ) : (
                <Wifi className="size-5 text-yellow-400 animate-pulse" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {connectionState === "open"
                    ? "Verbunden"
                    : connectionState === "error"
                      ? "Verbindungsfehler"
                      : "Verbinde…"}
                </p>
                {currentLang && (
                  <p className="text-xs text-muted-foreground">
                    {currentLang.flag} {currentLang.label}
                  </p>
                )}
              </div>
            </div>

            {/* Join another session */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <LogOut className="size-4 text-muted-foreground/70" />
                <p className="text-sm font-semibold text-foreground">
                  Session wechseln
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="session-code"
                  placeholder="Session-Code"
                  className="h-10 flex-1 rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) handleJoinSession(val);
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="bg-indigo-600 hover:bg-indigo-500"
                  onClick={() => {
                    const el = document.getElementById("session-code") as HTMLInputElement;
                    if (el?.value.trim()) handleJoinSession(el.value.trim());
                  }}
                >
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Live transcript */
          <div className="p-3 sm:p-4">
            <TranscriptView
              segments={segments}
              className="h-[calc(100svh-5.5rem)]"
            />
          </div>
        )}
      </main>
    </div>
  );
}
