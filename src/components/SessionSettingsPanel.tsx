import { useState } from "react";
import {
  Languages,
  Volume2,
  VolumeOff,
  Sparkles,
  Wifi,
  WifiOff,
  Info,
  LogOut,
  ArrowRight,
} from "lucide-react";
import type { SupportedLanguage } from "~/types/session.ts";
import type { TTSMode } from "~/hooks/useTTS.ts";
import { LanguageSelector } from "~/components/LanguageSelector.tsx";
import { LANGUAGES } from "~/lib/languages.ts";
import { Card, CardContent } from "~/components/ui/card.tsx";
import { Button } from "~/components/ui/button.tsx";
import { cn } from "~/lib/utils.ts";

const TTS_OPTIONS: {
  value: TTSMode;
  label: string;
  description: string;
  icon: typeof Volume2;
}[] = [
  {
    value: "off",
    label: "Aus",
    description: "Nur Text anzeigen, keine Sprachausgabe.",
    icon: VolumeOff,
  },
  {
    value: "browser",
    label: "Browser-Stimme",
    description:
      "Kostenlose Sprachausgabe deines Geräts. Qualität variiert je nach Gerät und Sprache.",
    icon: Volume2,
  },
  {
    value: "openai",
    label: "Premium-Stimme",
    description:
      "Natürlich klingende KI-Stimme von OpenAI. Höhere Qualität, benötigt mehr Daten.",
    icon: Sparkles,
  },
];

interface SessionSettingsPanelProps {
  targetLangs: SupportedLanguage[];
  selectedLang: SupportedLanguage | null;
  onSelectLang: (lang: SupportedLanguage) => void;
  ttsMode: TTSMode;
  onTtsModeChange: (mode: TTSMode) => void;
  connectionState: string;
  title: string;
  sessionId: string;
  onJoinSession: (code: string) => void;
}

export function SessionSettingsPanel({
  targetLangs,
  selectedLang,
  onSelectLang,
  ttsMode,
  onTtsModeChange,
  connectionState,
  title,
  sessionId,
  onJoinSession,
}: SessionSettingsPanelProps) {
  const [newSessionCode, setNewSessionCode] = useState("");

  const handleJoin = () => {
    const code = newSessionCode.trim();
    if (code) onJoinSession(code);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Session Info */}
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Languages className="size-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">
          Session: {sessionId}
        </p>
      </div>

      {/* Language Selection */}
      <Card>
        <CardContent className="pt-6">
          <LanguageSelector
            languages={targetLangs}
            selected={selectedLang}
            onSelect={onSelectLang}
          />
        </CardContent>
      </Card>

      {/* TTS Controls */}
      {selectedLang && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Volume2 className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Sprachausgabe</h2>
          </div>
          {TTS_OPTIONS.map((opt) => {
            const isSelected = ttsMode === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => onTtsModeChange(opt.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40"
                  )}
                >
                  {isSelected && (
                    <span className="size-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "size-4",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Connection Status */}
      {selectedLang && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {connectionState === "open" ? (
                <Wifi className="size-5 text-green-500" />
              ) : connectionState === "error" ? (
                <WifiOff className="size-5 text-destructive" />
              ) : (
                <Wifi className="size-5 text-yellow-500 animate-pulse" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {connectionState === "open"
                    ? "Verbunden"
                    : connectionState === "error"
                      ? "Verbindungsfehler"
                      : "Verbinde..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {LANGUAGES[selectedLang].flag}{" "}
                  {LANGUAGES[selectedLang].label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session wechseln */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <LogOut className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Session wechseln</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Gib einen neuen Session-Code ein, um einer anderen Session
              beizutreten.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSessionCode}
                onChange={(e) => setNewSessionCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoin();
                }}
                placeholder="Session-Code"
                className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                size="icon"
                onClick={handleJoin}
                disabled={!newSessionCode.trim()}
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="flex items-center justify-center gap-1.5 pb-4 text-xs text-muted-foreground">
        <Info className="size-3" />
        <span>LinguAI</span>
      </div>
    </div>
  );
}
