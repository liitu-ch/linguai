import { useCallback, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { Languages } from "lucide-react";
import { useChannel } from "~/hooks/useChannel.ts";
import { useTTS, type TTSMode } from "~/hooks/useTTS.ts";
import { TranscriptView } from "~/components/TranscriptView.tsx";
import { LanguageSelector } from "~/components/LanguageSelector.tsx";
import {
  BottomTabBar,
  type SessionTab,
} from "~/components/BottomTabBar.tsx";
import { SessionSettingsPanel } from "~/components/SessionSettingsPanel.tsx";
import { Card, CardContent } from "~/components/ui/card.tsx";
import { Button } from "~/components/ui/button.tsx";
import type { SupportedLanguage, TranslationSegment } from "~/types/session.ts";

interface DisplaySegment {
  id: string;
  text: string;
  isFinal: boolean;
  timestampMs: number;
}

export function Session() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage | null>(
    null
  );
  const [confirmedLang, setConfirmedLang] = useState(false);
  const [segments, setSegments] = useState<DisplaySegment[]>([]);
  const [ttsMode, setTtsMode] = useState<TTSMode>("browser");
  const [activeTab, setActiveTab] = useState<SessionTab>("live");
  const [hasUnread, setHasUnread] = useState(false);
  const activeTabRef = useRef<SessionTab>("live");

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
        return [...prev, { id: segment.id, text, isFinal: segment.isFinal, timestampMs: segment.timestampMs || Date.now() }];
      });

      enqueue(text, segment.id, segment.isFinal);

      if (activeTabRef.current !== "live") {
        setHasUnread(true);
      }
    },
    [selectedLang, enqueue]
  );

  const { connectionState } = useChannel({
    sessionId: sessionId ?? "",
    onSegment: handleSegment,
    enabled: !!selectedLang && !!sessionId && confirmedLang,
  });

  const handleTabChange = (tab: SessionTab) => {
    setActiveTab(tab);
    activeTabRef.current = tab;
    if (tab === "live") setHasUnread(false);
  };

  const handleConfirmLanguage = () => {
    setConfirmedLang(true);
  };

  const handleJoinSession = (code: string) => {
    const params = new URLSearchParams(searchParams);
    navigate(`/session/${code}?${params.toString()}`);
    window.location.reload();
  };

  if (!sessionId) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <p className="text-destructive text-center">Keine Session-ID</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Live Tab Header — compact, only when language is confirmed */}
      {activeTab === "live" && confirmedLang && (
        <header className="sticky top-0 z-10 border-b bg-card/80 px-3 py-2.5 backdrop-blur-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold leading-none">
                {title}
              </h1>
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
                <span className="text-xs text-muted-foreground">
                  {connectionState === "open"
                    ? "Verbunden"
                    : connectionState === "error"
                      ? "Fehler"
                      : "Verbinde..."}
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Tab Content — both panels stay mounted to preserve state */}
      <main className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]">
        {/* Live Tab */}
        <div className={activeTab === "live" ? "block h-full" : "hidden"}>
          {confirmedLang ? (
            <div className="p-3 sm:p-4">
              <TranscriptView
                segments={segments}
                className="h-[calc(100svh-8rem-env(safe-area-inset-bottom,0px))]"
              />
            </div>
          ) : (
            /* Language selection inline in Live tab */
            <div className="flex min-h-[60svh] items-center justify-center p-4">
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
                    {selectedLang && (
                      <Button
                        className="mt-4 w-full"
                        size="lg"
                        onClick={handleConfirmLanguage}
                      >
                        Übersetzung starten
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Settings Tab */}
        <div className={activeTab === "settings" ? "block" : "hidden"}>
          <SessionSettingsPanel
            targetLangs={targetLangs}
            selectedLang={selectedLang}
            onSelectLang={setSelectedLang}
            ttsMode={ttsMode}
            onTtsModeChange={setTtsMode}
            connectionState={connectionState}
            title={title}
            sessionId={sessionId}
            onJoinSession={handleJoinSession}
          />
        </div>
      </main>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasUnread={hasUnread}
      />
    </div>
  );
}
