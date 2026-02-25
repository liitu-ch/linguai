import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { useSSE } from "~/hooks/useSSE.ts";
import { useTTS, type TTSMode } from "~/hooks/useTTS.ts";
import { LanguageSelector } from "~/components/LanguageSelector.tsx";
import { TranscriptView } from "~/components/TranscriptView.tsx";
import { TTSControls } from "~/components/TTSControls.tsx";
import { getSession } from "~/lib/session.ts";
import { LANGUAGES } from "~/lib/languages.ts";
import type {
  SessionMeta,
  SupportedLanguage,
  TranslationSegment,
} from "~/types/session.ts";

interface DisplaySegment {
  id: string;
  text: string;
  isFinal: boolean;
}

export function Session() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage | null>(
    null
  );
  const [segments, setSegments] = useState<DisplaySegment[]>([]);
  const [ttsMode, setTtsMode] = useState<TTSMode>("browser");
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    getSession(sessionId)
      .then(setSession)
      .catch(() => setError("Session nicht gefunden"));
  }, [sessionId]);

  const { enqueue } = useTTS({
    mode: ttsMode,
    lang: selectedLang ?? "en",
  });

  const handleSegment = useCallback(
    (segment: TranslationSegment) => {
      if (!selectedLang) return;

      const text =
        segment.translations[selectedLang] ?? segment.originalText;

      setSegments((prev) => {
        if (prev.some((s) => s.id === segment.id)) return prev;
        return [...prev, { id: segment.id, text, isFinal: segment.isFinal }];
      });

      enqueue(text, segment.id, segment.isFinal);
    },
    [selectedLang, enqueue]
  );

  const handleSessionEnd = useCallback(() => {
    setSessionEnded(true);
  }, []);

  const { connectionState } = useSSE({
    sessionId: sessionId ?? "",
    lang: selectedLang ?? "en",
    onSegment: handleSegment,
    onSessionEnd: handleSessionEnd,
    enabled: !!selectedLang && !!sessionId,
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Lade Session...</p>
      </div>
    );
  }

  // Language selection screen
  if (!selectedLang) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              {session.title || "Live-Übersetzung"}
            </h1>
            {session.speakerName && (
              <p className="text-gray-500 mt-1">{session.speakerName}</p>
            )}
          </div>
          <LanguageSelector
            languages={session.targetLanguages}
            selected={selectedLang}
            onSelect={setSelectedLang}
          />
        </div>
      </div>
    );
  }

  // Live transcript view
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              {session.title || "Live-Übersetzung"}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionState === "open"
                    ? "bg-green-500"
                    : connectionState === "error"
                      ? "bg-red-500"
                      : "bg-yellow-400"
                }`}
              />
              <span className="text-xs text-gray-500">
                {LANGUAGES[selectedLang].label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TTSControls mode={ttsMode} onModeChange={setTtsMode} />
            <button
              onClick={() => {
                setSelectedLang(null);
                setSegments([]);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Sprache ändern
            </button>
          </div>
        </div>
      </header>

      {/* Transcript */}
      <main className="flex-1 p-4">
        {sessionEnded && (
          <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2 text-sm text-yellow-800">
            Session beendet
          </div>
        )}
        <TranscriptView segments={segments} className="h-[calc(100vh-8rem)]" />
      </main>
    </div>
  );
}
