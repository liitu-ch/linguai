import { useState } from "react";
import { Settings2, ChevronDown, ChevronUp, BookOpen, FileText, AudioLines, SlidersHorizontal } from "lucide-react";
import { GlossaryEditor } from "~/components/GlossaryEditor.tsx";
import { PresentationUpload } from "~/components/PresentationUpload.tsx";
import { Badge } from "~/components/ui/badge.tsx";
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
  const [expanded, setExpanded] = useState(false);

  const hasGlossary = glossary.length > 0;
  const hasContext = context.length > 0;
  const hasCustomVad = silenceDurationMs !== 600 || vadThreshold !== 0.5;

  const disabled = isRecording;

  return (
    <div className="mb-4 sm:mb-6">
      {/* Toggle bar */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <Settings2 className="size-4 text-primary" />
          <span className="font-medium">Session-Vorbereitung</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {hasGlossary && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <BookOpen className="size-3" />
                {glossary.length}
              </Badge>
            )}
            {hasContext && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <FileText className="size-3" />
                Kontext
              </Badge>
            )}
            {(hasCustomVad || isRecording) && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <AudioLines className="size-3" />
                {silenceDurationMs}ms · {vadThreshold.toFixed(2)}
              </Badge>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Glossary + Context row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-3 shadow-sm">
              <GlossaryEditor entries={glossary} onChange={onGlossaryChange} disabled={disabled} />
            </div>
            <div className="rounded-lg border bg-card p-3 shadow-sm">
              <PresentationUpload context={context} onChange={onContextChange} disabled={disabled} />
            </div>
          </div>

          {/* VAD Settings */}
          <div className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <SlidersHorizontal className="size-3.5" />
              Transkriptions-Einstellungen
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Silence Duration */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="silence-duration" className="text-sm">
                    Stille-Erkennung
                  </label>
                  <span className="text-xs font-mono tabular-nums text-muted-foreground">
                    {silenceDurationMs}ms
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
                  className="mt-1.5 w-full accent-primary disabled:opacity-50"
                />
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                  Kürzer = mehr kleine Blöcke · Länger = weniger grosse Blöcke
                </p>
              </div>

              {/* VAD Threshold */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="vad-threshold" className="text-sm">
                    VAD-Empfindlichkeit
                  </label>
                  <span className="text-xs font-mono tabular-nums text-muted-foreground">
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
                  className="mt-1.5 w-full accent-primary disabled:opacity-50"
                />
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                  Niedrig = empfindlicher (leise Sprache) · Hoch = weniger empfindlich
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
