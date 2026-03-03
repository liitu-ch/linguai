import { useEffect, useRef } from "react";
import { MessageSquareText } from "lucide-react";
import { cn } from "~/lib/utils.ts";

interface TranscriptSegment {
  id: string;
  text: string;
  isFinal: boolean;
  timestampMs?: number;
}

function formatTime(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

  return (
    <div
      className={cn(
        "overflow-y-auto rounded-xl border bg-card p-4 sm:p-5 shadow-sm",
        className
      )}
    >
      {segments.length === 0 && !interimText && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 sm:py-16 text-muted-foreground">
          <MessageSquareText className="size-8 sm:size-10 opacity-40" />
          <p className="text-sm">Warte auf Transkription...</p>
        </div>
      )}

      <div className="space-y-2.5 sm:space-y-3">
        {segments.map((seg) => (
          <div key={seg.id} className="space-y-0.5">
            {seg.timestampMs && (
              <span className="text-[10px] text-muted-foreground/60">
                {formatTime(seg.timestampMs)}
              </span>
            )}
            <p
              className={cn(
                "text-[15px] sm:text-base leading-relaxed",
                seg.isFinal ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {seg.text}
            </p>
          </div>
        ))}

        {interimText && (
          <p className="text-[15px] sm:text-base leading-relaxed italic text-muted-foreground/70">
            {interimText}
          </p>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
