import { useEffect, useRef } from "react";

interface TranscriptSegment {
  id: string;
  text: string;
  isFinal: boolean;
}

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  interimText?: string;
  className?: string;
}

export function TranscriptView({
  segments,
  interimText,
  className = "",
}: TranscriptViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [segments.length, interimText]);

  return (
    <div
      className={`overflow-y-auto rounded-xl bg-white p-4 shadow-sm ${className}`}
    >
      {segments.length === 0 && !interimText && (
        <p className="text-center text-gray-400 py-8">
          Warte auf Transkription...
        </p>
      )}

      <div className="space-y-2">
        {segments.map((seg) => (
          <p
            key={seg.id}
            className={`text-base leading-relaxed ${
              seg.isFinal ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {seg.text}
          </p>
        ))}

        {interimText && (
          <p className="text-base leading-relaxed text-gray-400 italic">
            {interimText}
          </p>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
