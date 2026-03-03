import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";
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
  className?: string;
}

export function TranscriptView({
  segments,
  interimText,
  className,
}: TranscriptViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [segments.length, interimText]);

  const hasContent = segments.length > 0 || !!interimText;
  const previousSegments = segments.slice(0, -1);
  const currentSegment = segments.at(-1);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card",
        className
      )}
    >
      {/* Gradient fade at top — de-emphasises older text like Spotify */}
      {hasContent && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-card to-transparent" />
      )}

      <div className="h-full overflow-y-auto scroll-smooth">
        {!hasContent ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Mic className="size-8 opacity-30" />
            <p className="text-sm">Warte auf Transkription…</p>
          </div>
        ) : (
          <div className="flex min-h-full flex-col justify-end px-5 pb-6 pt-20 sm:px-7">
            {/* History — progressively smaller and more muted as they scroll up */}
            <div className="space-y-2.5 pb-8">
              {previousSegments.map((seg, i) => {
                const distanceFromEnd = previousSegments.length - 1 - i;
                return (
                  <p
                    key={seg.id}
                    className={cn(
                      "leading-relaxed transition-all duration-300",
                      distanceFromEnd === 0
                        ? "text-base text-muted-foreground/60 sm:text-lg"
                        : distanceFromEnd === 1
                          ? "text-sm text-muted-foreground/40 sm:text-base"
                          : "text-xs text-muted-foreground/25 sm:text-sm"
                    )}
                  >
                    {seg.text}
                  </p>
                );
              })}
            </div>

            {/* Current final segment — large and bright */}
            {currentSegment && !interimText && (
              <p className="text-2xl font-medium leading-snug text-foreground sm:text-3xl">
                {currentSegment.text}
              </p>
            )}

            {/* Interim — large with blinking cursor */}
            {interimText && (
              <p className="text-2xl font-medium leading-snug text-foreground/80 sm:text-3xl">
                {interimText}
                <span className="ml-0.5 inline-block h-7 w-[3px] animate-cursor rounded-full bg-current align-middle opacity-80 sm:h-9" />
              </p>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
