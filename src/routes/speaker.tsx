import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useRealtimeTranscription } from "~/hooks/useRealtimeTranscription.ts";
import { QRCodeDisplay } from "~/components/QRCodeDisplay.tsx";
import { RecordingControls } from "~/components/RecordingControls.tsx";
import { TranscriptView } from "~/components/TranscriptView.tsx";
import { LANGUAGES } from "~/lib/languages.ts";
import { supabase } from "~/lib/supabase.ts";
import type { SupportedLanguage } from "~/types/session.ts";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface FinalSegment {
  id: string;
  text: string;
  isFinal: boolean;
}

export function Speaker() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const [interimText, setInterimText] = useState("");
  const [segments, setSegments] = useState<FinalSegment[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const title = searchParams.get("title") || "Session";
  const sourceLang = (searchParams.get("source") || "en") as SupportedLanguage;
  const targetLanguages = (searchParams.get("targets") || "es,pt,ms").split(
    ","
  ) as SupportedLanguage[];

  // Create a Supabase channel for broadcasting segments
  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase.channel(`session-${sessionId}`);
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") setChannel(ch);
    });

    return () => {
      ch.unsubscribe();
      setChannel(null);
    };
  }, [sessionId]);

  const handleInterim = useCallback((text: string) => {
    setInterimText(text);
  }, []);

  const handleFinal = useCallback((text: string, seq: number) => {
    setSegments((prev) => [
      ...prev,
      { id: `final-${seq}`, text, isFinal: true },
    ]);
    setInterimText("");
  }, []);

  const { start, stop, status } = useRealtimeTranscription({
    sourceLang,
    targetLangs: targetLanguages,
    channel,
    onInterimTranscript: handleInterim,
    onFinalTranscript: handleFinal,
  });

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Keine Session-ID</p>
      </div>
    );
  }

  // Build session URL for QR code (inline, no server needed)
  const base = import.meta.env.VITE_APP_URL || window.location.origin;
  const qsParams = new URLSearchParams({
    title,
    targets: targetLanguages.join(","),
  });
  const sessionUrl = `${base}/session/${sessionId}?${qsParams}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">
            {LANGUAGES[sourceLang].label} →{" "}
            {targetLanguages.map((l) => LANGUAGES[l].label).join(", ")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls + Transcript */}
          <div className="lg:col-span-2 space-y-4">
            <RecordingControls
              status={status}
              onStart={start}
              onStop={stop}
            />
            <TranscriptView
              segments={segments}
              interimText={interimText}
              className="h-[60vh]"
            />
          </div>

          {/* Right: QR Code */}
          <div>
            <QRCodeDisplay url={sessionUrl} sessionId={sessionId} />

            <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Statistik
              </h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p>Segmente: {segments.length}</p>
                <p>Status: {status}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
