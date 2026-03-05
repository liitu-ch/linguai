import { useEffect, useRef, useState } from "react";
import { Mic, Minus, Plus } from "lucide-react";
import { cn } from "~/lib/utils.ts";

interface TranscriptSegment {
  id: string;
  text: string;
  isFinal: boolean;
  timestampMs?: number;
}

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  interimText?: string;
  isSpeaking?: boolean;
  className?: string;
}

type TextSize = "s" | "m" | "l" | "xl";

const TEXT_SIZE_CONFIG: Record<
  TextSize,
  { history: string; current: string; interim: string; cursor: string; label: string }
> = {
  s: {
    history: "text-base sm:text-lg",
    current: "text-xl sm:text-2xl",
    interim: "text-xl sm:text-2xl",
    cursor: "h-6 sm:h-7",
    label: "Klein",
  },
  m: {
    history: "text-lg sm:text-xl",
    current: "text-2xl sm:text-3xl",
    interim: "text-2xl sm:text-3xl",
    cursor: "h-7 sm:h-9",
    label: "Mittel",
  },
  l: {
    history: "text-xl sm:text-2xl",
    current: "text-3xl sm:text-4xl",
    interim: "text-3xl sm:text-4xl",
    cursor: "h-9 sm:h-10",
    label: "Gross",
  },
  xl: {
    history: "text-2xl sm:text-3xl",
    current: "text-4xl sm:text-5xl",
    interim: "text-4xl sm:text-5xl",
    cursor: "h-10 sm:h-12",
    label: "Sehr gross",
  },
};

const SIZE_ORDER: TextSize[] = ["s", "m", "l", "xl"];

function loadTextSize(): TextSize {
  try {
    const stored = localStorage.getItem("transcript-text-size");
    if (stored && stored in TEXT_SIZE_CONFIG) return stored as TextSize;
  } catch {}
  return "m";
}

export function TranscriptView({
  segments,
  interimText,
  isSpeaking = false,
  className,
}: TranscriptViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [textSize, setTextSize] = useState<TextSize>(loadTextSize);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [segments.length, interimText]);

  useEffect(() => {
    localStorage.setItem("transcript-text-size", textSize);
  }, [textSize]);

  const hasContent = segments.length > 0 || !!interimText;
  const previousSegments = segments.slice(0, -1);
  const currentSegment = segments.at(-1);
  const cfg = TEXT_SIZE_CONFIG[textSize];
  const sizeIdx = SIZE_ORDER.indexOf(textSize);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card",
        className
      )}
    >
      {/* Gradient fade at top */}
      {hasContent && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-card to-transparent" />
      )}

      {/* Text size controls */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1">
        <button
          type="button"
          disabled={sizeIdx === 0}
          onClick={() => setTextSize(SIZE_ORDER[sizeIdx - 1])}
          className="rounded-lg p-1.5 text-muted-foreground/50 transition hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/50"
          aria-label="Text verkleinern"
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-[2rem] text-center text-xs text-muted-foreground/50">
          {cfg.label}
        </span>
        <button
          type="button"
          disabled={sizeIdx === SIZE_ORDER.length - 1}
          onClick={() => setTextSize(SIZE_ORDER[sizeIdx + 1])}
          className="rounded-lg p-1.5 text-muted-foreground/50 transition hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/50"
          aria-label="Text vergrössern"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="h-full overflow-y-auto scroll-smooth">
        {!hasContent ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Mic className="size-8 opacity-30" />
            <p className="text-sm">Warte auf Transkription…</p>
          </div>
        ) : (
          <div className="flex min-h-full flex-col justify-end px-5 pb-6 pt-20 sm:px-7">
            {/* History — readable size, only visually faded via opacity */}
            <div className="space-y-3 pb-8">
              {previousSegments.map((seg, i) => {
                const distanceFromEnd = previousSegments.length - 1 - i;
                return (
                  <p
                    key={seg.id}
                    className={cn(
                      "leading-relaxed transition-all duration-300",
                      cfg.history,
                      distanceFromEnd === 0
                        ? "text-muted-foreground/70"
                        : distanceFromEnd <= 2
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground/35"
                    )}
                  >
                    {seg.text}
                  </p>
                );
              })}
            </div>

            {/* Current final segment — large and bright */}
            {currentSegment && !interimText && (
              <p className={cn("font-medium leading-snug text-foreground", cfg.current)}>
                {currentSegment.text}
              </p>
            )}

            {/* Interim — large with blinking cursor */}
            {interimText && (
              <p className={cn("font-medium leading-snug text-foreground/80", cfg.interim)}>
                {interimText}
                <span className={cn("ml-0.5 inline-block w-[3px] animate-cursor rounded-full bg-current align-middle opacity-80", cfg.cursor)} />
              </p>
            )}

            {/* Speaking indicator — shown when speaker is talking but no interim text yet */}
            {isSpeaking && !interimText && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-end gap-0.5">
                  <span className="inline-block w-[3px] h-3 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="inline-block w-[3px] h-4 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="inline-block w-[3px] h-2.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-muted-foreground/60">spricht…</span>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
