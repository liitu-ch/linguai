import { useCallback, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { Languages, ArrowLeft } from "lucide-react";
import { useChannel } from "~/hooks/useChannel.ts";
import { useTTS, type TTSMode } from "~/hooks/useTTS.ts";
import { LanguageSelector } from "~/components/LanguageSelector.tsx";
import { TranscriptView } from "~/components/TranscriptView.tsx";
import { TTSControls } from "~/components/TTSControls.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Badge } from "~/components/ui/badge.tsx";
import {
  Card,
  CardContent,
} from "~/components/ui/card.tsx";
import { LANGUAGES } from "~/lib/languages.ts";
import type { SupportedLanguage, TranslationSegment } from "~/types/session.ts";

interface DisplaySegment {
  id: string;
  text: string;
  isFinal: boolean;
}

export function Session() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage | null>(
    null
  );
  const [segments, setSegments] = useState<DisplaySegment[]>([]);
  const [ttsMode, setTtsMode] = useState<TTSMode>("browser");

  const targetLangs = (searchParams.get("targets") || "es,pt,ms").split(
    ","
  ) as SupportedLanguage[];
  const title = searchParams.get("title") || "Live-Übersetzung";

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

  const { connectionState } = useChannel({
    sessionId: sessionId ?? "",
    onSegment: handleSegment,
    enabled: !!selectedLang && !!sessionId,
  });

  if (!sessionId) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <p className="text-destructive text-center">Keine Session-ID</p>
      </div>
    );
  }

  // Language selection screen
  if (!selectedLang) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Languages className="size-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">
              Wähle deine Sprache für die Übersetzung
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <LanguageSelector
                languages={targetLangs}
                selected={selectedLang}
                onSelect={setSelectedLang}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Live transcript view
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-card/80 px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur-lg">
        {/* Mobile: 2 rows, SM+: single row */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold leading-none">{title}</h1>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={`size-2 shrink-0 rounded-full ${
                  connectionState === "open"
                    ? "bg-green-500"
                    : connectionState === "error"
                      ? "bg-destructive"
                      : "bg-yellow-500 animate-pulse"
                }`}
              />
              <Badge variant="secondary" className="text-xs">
                {LANGUAGES[selectedLang].flag} {LANGUAGES[selectedLang].label}
              </Badge>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <TTSControls mode={ttsMode} onModeChange={setTtsMode} />
            <Button
              variant="ghost"
              size="sm"
              className="px-2 sm:px-3"
              onClick={() => {
                setSelectedLang(null);
                setSegments([]);
              }}
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Sprache</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-3 sm:p-4">
        <TranscriptView segments={segments} className="h-[calc(100svh-4.5rem)] sm:h-[calc(100svh-5rem)]" />
      </main>
    </div>
  );
}
