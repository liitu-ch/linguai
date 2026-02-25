import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Clock,
  Hash,
  Languages,
  Mic,
  Radio,
  Type,
  Zap,
} from "lucide-react";
import { useRealtimeTranscription } from "~/hooks/useRealtimeTranscription.ts";
import { QRCodeDisplay } from "~/components/QRCodeDisplay.tsx";
import { RecordingControls } from "~/components/RecordingControls.tsx";
import { TranscriptView } from "~/components/TranscriptView.tsx";
import { SessionPrepPanel } from "~/components/SessionPrepPanel.tsx";
import { Badge } from "~/components/ui/badge.tsx";
import { Button } from "~/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card.tsx";
import { LANGUAGES } from "~/lib/languages.ts";
import { supabase } from "~/lib/supabase.ts";
import type { SupportedLanguage } from "~/types/session.ts";
import type { GlossaryEntry } from "~/types/api.ts";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface FinalSegment {
  id: string;
  text: string;
  isFinal: boolean;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function Speaker() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const [interimText, setInterimText] = useState("");
  const [segments, setSegments] = useState<FinalSegment[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Session prep state
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [presentationContext, setPresentationContext] = useState("");

  // VAD settings
  const [silenceDurationMs, setSilenceDurationMs] = useState(600);
  const [vadThreshold, setVadThreshold] = useState(0.5);

  // Timer state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

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
    glossary,
    context: presentationContext,
    silenceDurationMs,
    vadThreshold,
    onInterimTranscript: handleInterim,
    onFinalTranscript: handleFinal,
  });

  // Timer
  useEffect(() => {
    if (status === "active" && !startTime) {
      setStartTime(Date.now());
    }
    if (status === "idle") {
      setStartTime(null);
      setElapsed(0);
    }
  }, [status, startTime]);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Stats
  const totalWords = segments.reduce(
    (acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length,
    0
  );
  const minutes = elapsed / 60;
  const wpm = minutes > 0.5 ? Math.round(totalWords / minutes) : 0;

  if (!sessionId) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-destructive">Keine Session-ID</p>
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

  const isRecording = status === "active" || status === "connecting";

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-12 sm:h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="size-8">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Languages className="size-3.5 sm:size-4" />
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight">LinguAI</span>
            </div>
          </div>

          <RecordingControls status={status} onStart={start} onStop={stop} />
        </div>
      </header>

      {/* Session info bar */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-5 w-0.5 rounded-full bg-primary" />
            <Radio className="size-4 shrink-0 text-primary" />
            <h1 className="truncate text-sm sm:text-base font-semibold">{title}</h1>
            {isRecording && (
              <Badge variant="outline" className="gap-1 text-xs tabular-nums">
                <Clock className="size-3" />
                {formatElapsed(elapsed)}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm">
            <Badge variant="secondary">
              {LANGUAGES[sourceLang].flag} {LANGUAGES[sourceLang].label}
            </Badge>
            <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
            {targetLanguages.map((l) => (
              <Badge key={l} variant="outline">
                {LANGUAGES[l].flag} {LANGUAGES[l].label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
          {/* Session Preparation Panel */}
          <SessionPrepPanel
            glossary={glossary}
            onGlossaryChange={setGlossary}
            context={presentationContext}
            onContextChange={setPresentationContext}
            silenceDurationMs={silenceDurationMs}
            onSilenceDurationChange={setSilenceDurationMs}
            vadThreshold={vadThreshold}
            onVadThresholdChange={setVadThreshold}
            isRecording={isRecording}
          />

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Left: Transcript */}
            <div className="lg:col-span-2">
              {!isRecording && segments.length === 0 ? (
                <div className="flex h-[50svh] sm:h-[55svh] lg:h-[calc(100svh-14rem)] flex-col items-center justify-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Mic className="size-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Bereit für die Aufnahme</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Starte die Aufnahme oben rechts, um die Live-Transkription zu beginnen.
                    </p>
                  </div>
                </div>
              ) : (
                <TranscriptView
                  segments={segments}
                  interimText={interimText}
                  className="h-[50svh] sm:h-[55svh] lg:h-[calc(100svh-14rem)]"
                />
              )}
            </div>

            {/* Right: QR Code + Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <QRCodeDisplay url={sessionUrl} sessionId={sessionId} />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BarChart3 className="size-4" />
                    Statistik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Hash className="size-3" />
                        <p className="text-xs">Segmente</p>
                      </div>
                      <p className="mt-0.5 text-2xl font-bold tabular-nums">
                        {segments.length}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Type className="size-3" />
                        <p className="text-xs">Wörter</p>
                      </div>
                      <p className="mt-0.5 text-2xl font-bold tabular-nums">
                        {totalWords}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3" />
                        <p className="text-xs">Dauer</p>
                      </div>
                      <p className="mt-0.5 text-2xl font-bold tabular-nums">
                        {formatElapsed(elapsed)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Zap className="size-3" />
                        <p className="text-xs">Status</p>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="text-2xl font-bold capitalize">
                          {status === "active"
                            ? "Live"
                            : status === "connecting"
                              ? "..."
                              : status === "error"
                                ? "Fehler"
                                : "Bereit"}
                        </p>
                        {status === "active" && (
                          <span className="relative flex size-2.5">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {wpm > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                      <Zap className="size-3" />
                      <span>~{wpm} Wörter/Min</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-3 py-3 text-center text-xs sm:text-sm text-muted-foreground sm:px-4 sm:py-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-1.5">
            <Languages className="size-3.5" />
            <span className="font-medium text-foreground">LinguAI</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <p>KI-gestützte Simultanübersetzung für Live-Events</p>
        </div>
      </footer>
    </div>
  );
}
