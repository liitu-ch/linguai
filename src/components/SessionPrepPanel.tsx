import { AudioLines, BookOpen, FileText, Mic, Radio, SlidersHorizontal, Users } from "lucide-react";
import { GlossaryEditor } from "~/components/GlossaryEditor.tsx";
import { PresentationUpload } from "~/components/PresentationUpload.tsx";
import { cn } from "~/lib/utils.ts";
import type { GlossaryEntry } from "~/types/api.ts";
import type { TranscriptionMode } from "~/types/session.ts";

const TRANSCRIPTION_MODES: {
  value: TranscriptionMode;
  label: string;
  description: string;
  icon: typeof Mic;
}[] = [
  {
    value: "realtime",
    label: "Realtime",
    description: "WebSocket-Streaming, niedrigste Latenz. Ideal für Live-Vorträge.",
    icon: Radio,
  },
  {
    value: "chunked",
    label: "Chunked",
    description: "Audio-Blöcke alle paar Sekunden. Robust, gute Qualität.",
    icon: Mic,
  },
  {
    value: "diarize",
    label: "Diarize",
    description: "Mit Sprecher-Erkennung. Ideal bei mehreren Sprechern.",
    icon: Users,
  },
];

interface SessionPrepPanelProps {
  glossary: GlossaryEntry[];
  onGlossaryChange: (entries: GlossaryEntry[]) => void;
  context: string;
  onContextChange: (context: string) => void;
  transcriptionMode: TranscriptionMode;
  onTranscriptionModeChange: (mode: TranscriptionMode) => void;
  chunkIntervalMs: number;
  onChunkIntervalChange: (value: number) => void;
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
  transcriptionMode,
  onTranscriptionModeChange,
  chunkIntervalMs,
  onChunkIntervalChange,
  silenceDurationMs,
  onSilenceDurationChange,
  vadThreshold,
  onVadThresholdChange,
  isRecording,
}: SessionPrepPanelProps) {
  const disabled = isRecording;

  return (
    <div className="space-y-4">
      {/* Transcription Mode */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Mic className="size-3.5" />
          Transkriptions-Modus
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TRANSCRIPTION_MODES.map((opt) => {
            const isSelected = transcriptionMode === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => !disabled && onTranscriptionModeChange(opt.value)}
                disabled={disabled}
                className={cn(
                  "flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all disabled:opacity-40",
                  isSelected
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-muted/20 hover:border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "size-4",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {opt.label}
                  </span>
                </div>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {opt.description}
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

      {/* Mode-specific settings */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          {transcriptionMode === "realtime"
            ? "Realtime-Einstellungen"
            : "Chunk-Einstellungen"}
        </div>

        {transcriptionMode === "realtime" ? (
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
                disabled={disabled}
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
                disabled={disabled}
                className="mt-2 w-full accent-primary disabled:opacity-40"
              />
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                Niedrig = empfindlicher (leise Sprache) · Hoch = weniger
                empfindlich
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="chunk-interval" className="text-sm font-medium">
                Chunk-Intervall
              </label>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {(chunkIntervalMs / 1000).toFixed(1)} s
              </span>
            </div>
            <input
              id="chunk-interval"
              type="range"
              min={3000}
              max={15000}
              step={1000}
              value={chunkIntervalMs}
              onChange={(e) => onChunkIntervalChange(Number(e.target.value))}
              disabled={disabled}
              className="mt-2 w-full accent-primary disabled:opacity-40"
            />
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              Kürzer = schnelleres Feedback · Länger = bessere Transkriptionsqualität
            </p>
          </div>
        )}

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
