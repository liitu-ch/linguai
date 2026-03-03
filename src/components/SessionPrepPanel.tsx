import { AudioLines, BookOpen, FileText, SlidersHorizontal } from "lucide-react";
import { GlossaryEditor } from "~/components/GlossaryEditor.tsx";
import { PresentationUpload } from "~/components/PresentationUpload.tsx";
import type { GlossaryEntry } from "~/types/api.ts";

interface SessionPrepPanelProps {
  glossary: GlossaryEntry[];
  onGlossaryChange: (entries: GlossaryEntry[]) => void;
  context: string;
  onContextChange: (context: string) => void;
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
  silenceDurationMs,
  onSilenceDurationChange,
  vadThreshold,
  onVadThresholdChange,
  isRecording,
}: SessionPrepPanelProps) {
  const disabled = isRecording;

  return (
    <div className="space-y-4">
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

      {/* VAD Settings */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Transkriptions-Einstellungen
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
