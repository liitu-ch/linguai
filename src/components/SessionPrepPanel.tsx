import { AudioLines, BookOpen, FileText, Mic, SlidersHorizontal, Sparkles } from "lucide-react";
import { GlossaryEditor } from "~/components/GlossaryEditor.tsx";
import { PresentationUpload } from "~/components/PresentationUpload.tsx";
import { cn } from "~/lib/utils.ts";
import type { GlossaryEntry } from "~/types/api.ts";
import type { ApiProvider, TTSProvider } from "~/types/database.ts";

const STT_PROVIDERS: {
  value: ApiProvider;
  label: string;
  description: string;
  model: string;
}[] = [
  {
    value: "openai",
    label: "OpenAI",
    description: "WebSocket-Streaming, ideal für Live-Vorträge",
    model: "gpt-4o-transcribe",
  },
  {
    value: "elevenlabs",
    label: "ElevenLabs",
    description: "Hochwertige Transkription",
    model: "Scribe v1",
  },
];

const TTS_PROVIDERS: {
  value: TTSProvider;
  label: string;
  description: string;
  model: string;
}[] = [
  {
    value: "openai",
    label: "OpenAI",
    description: "Natürlich, mit Stimmanweisungen",
    model: "gpt-4o-mini-tts",
  },
  {
    value: "elevenlabs",
    label: "ElevenLabs",
    description: "Ultra-realistische Stimmen",
    model: "eleven_multilingual_v2",
  },
  {
    value: "browser",
    label: "Browser",
    description: "Kostenlos, Systemstimme",
    model: "Web Speech API",
  },
];

interface SessionPrepPanelProps {
  glossary: GlossaryEntry[];
  onGlossaryChange: (entries: GlossaryEntry[]) => void;
  context: string;
  onContextChange: (context: string) => void;
  sttProvider: ApiProvider;
  onSttProviderChange: (provider: ApiProvider) => void;
  ttsProvider: TTSProvider;
  onTtsProviderChange: (provider: TTSProvider) => void;
  silenceDurationMs: number;
  onSilenceDurationChange: (value: number) => void;
  vadThreshold: number;
  onVadThresholdChange: (value: number) => void;
  isRecording: boolean;
}

export function SessionPrepPanel({
  glossary,
  onGlossaryChange,
  context,
  onContextChange,
  sttProvider,
  onSttProviderChange,
  ttsProvider,
  onTtsProviderChange,
  silenceDurationMs,
  onSilenceDurationChange,
  vadThreshold,
  onVadThresholdChange,
  isRecording,
}: SessionPrepPanelProps) {
  const disabled = isRecording;

  return (
    <div className="space-y-4">
      {/* STT Provider */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Mic className="size-3.5" />
          Transkription (STT)
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {STT_PROVIDERS.map((opt) => {
            const isSelected = sttProvider === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => !disabled && onSttProviderChange(opt.value)}
                disabled={disabled}
                className={cn(
                  "flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all disabled:opacity-40",
                  isSelected
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-muted/20 hover:border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                      Aktiv
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {opt.description}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground/60">
                  {opt.model}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* TTS Provider */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-3.5" />
          Sprachausgabe (TTS)
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TTS_PROVIDERS.map((opt) => {
            const isSelected = ttsProvider === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => !disabled && onTtsProviderChange(opt.value)}
                disabled={disabled}
                className={cn(
                  "flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all disabled:opacity-40",
                  isSelected
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-muted/20 hover:border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                      Aktiv
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {opt.description}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground/60">
                  {opt.model}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Glossary + Context */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BookOpen className="size-3.5" />
            Glossar
            {glossary.length > 0 && (
              <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {glossary.length}
              </span>
            )}
          </div>
          <div className="rounded-xl border bg-card p-3">
            <GlossaryEditor
              entries={glossary}
              onChange={onGlossaryChange}
              disabled={disabled}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FileText className="size-3.5" />
            Präsentations-Kontext
          </div>
          <div className="rounded-xl border bg-card p-3">
            <PresentationUpload
              context={context}
              onChange={onContextChange}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Audio settings (VAD — only relevant for OpenAI STT) */}
      <div className={cn("rounded-xl border bg-card p-4", sttProvider !== "openai" && "opacity-40 pointer-events-none")}>
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Audio-Einstellungen
          {sttProvider !== "openai" && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              nur OpenAI STT
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Silence Duration */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="silence-duration" className="text-sm font-medium">
                Stille-Erkennung
              </label>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {silenceDurationMs} ms
              </span>
            </div>
            <input
              id="silence-duration"
              type="range"
              min={200}
              max={2000}
              step={100}
              value={silenceDurationMs}
              onChange={(e) => onSilenceDurationChange(Number(e.target.value))}
              disabled={disabled || sttProvider !== "openai"}
              className="mt-2 w-full accent-primary disabled:opacity-40"
            />
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              Kürzer = mehr kleine Blöcke · Länger = weniger grosse Blöcke
            </p>
          </div>

          {/* VAD Threshold */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="vad-threshold" className="text-sm font-medium">
                VAD-Empfindlichkeit
              </label>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {vadThreshold.toFixed(2)}
              </span>
            </div>
            <input
              id="vad-threshold"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={vadThreshold}
              onChange={(e) => onVadThresholdChange(Number(e.target.value))}
              disabled={disabled || sttProvider !== "openai"}
              className="mt-2 w-full accent-primary disabled:opacity-40"
            />
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              Niedrig = empfindlicher (leise Sprache) · Hoch = weniger
              empfindlich
            </p>
          </div>
        </div>

        {disabled && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <AudioLines className="size-3.5" />
            Einstellungen während der Aufnahme gesperrt
          </div>
        )}
      </div>
    </div>
  );
}
