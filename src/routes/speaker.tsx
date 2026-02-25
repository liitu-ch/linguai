import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { useRealtimeTranscription } from "~/hooks/useRealtimeTranscription.ts";
import { QRCodeDisplay } from "~/components/QRCodeDisplay.tsx";
import { RecordingControls } from "~/components/RecordingControls.tsx";
import { TranscriptView } from "~/components/TranscriptView.tsx";
import { getSession, getSessionUrl } from "~/lib/session.ts";
import { LANGUAGES } from "~/lib/languages.ts";
import type { SessionMeta, SupportedLanguage } from "~/types/session.ts";

interface FinalSegment {
  id: string;
  text: string;
  isFinal: boolean;
}

export function Speaker() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const [segments, setSegments] = useState<FinalSegment[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    getSession(sessionId)
      .then(setSession)
      .catch(() => setError("Session nicht gefunden"));
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
    sessionId: sessionId ?? "",
    sourceLang: (session?.sourceLang ?? "en") as SupportedLanguage,
    onInterimTranscript: handleInterim,
    onFinalTranscript: handleFinal,
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!session || !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Lade Session...</p>
      </div>
    );
  }

  const sessionUrl = getSessionUrl(sessionId);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {session.title || "Session"}
          </h1>
          <p className="text-sm text-gray-500">
            {LANGUAGES[session.sourceLang].label} →{" "}
            {session.targetLanguages.map((l) => LANGUAGES[l].label).join(", ")}
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
