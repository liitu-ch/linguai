import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock,
  FileText,
  Hash,
  Languages,
  Mic,
  QrCode,
  Radio,
  Settings2,
  Type,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useRealtimeTranscription } from "~/hooks/useRealtimeTranscription.ts";
import { useChunkedTranscription } from "~/hooks/useChunkedTranscription.ts";
import { QRCodeDisplay } from "~/components/QRCodeDisplay.tsx";
import { RecordingControls } from "~/components/RecordingControls.tsx";
import { TranscriptView } from "~/components/TranscriptView.tsx";
import { SessionPrepPanel } from "~/components/SessionPrepPanel.tsx";
import { ThemeToggle } from "~/components/ThemeToggle.tsx";
import { Button } from "~/components/ui/button.tsx";
import { LANGUAGES } from "~/lib/languages.ts";
import { supabase } from "~/lib/supabase.ts";
import type { SupportedLanguage, TranscriptionMode } from "~/types/session.ts";
import type { GlossaryEntry } from "~/types/api.ts";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { cn } from "~/lib/utils.ts";

interface FinalSegment {
  id: string;
  text: string;
  isFinal: boolean;
  timestampMs: number;
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
  const [listenerCount, setListenerCount] = useState(0);
  const [mobileTab, setMobileTab] = useState<"qr" | "transcript">("qr");
  const [showPrepModal, setShowPrepModal] = useState(false);

  // Session prep state
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [presentationContext, setPresentationContext] = useState("");
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>("realtime");
  const [chunkIntervalMs, setChunkIntervalMs] = useState(5000);
  const [silenceDurationMs, setSilenceDurationMs] = useState(300);
  const [vadThreshold, setVadThreshold] = useState(0.5);

  // Timer state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const title = searchParams.get("title") || "Session";
  const sourceLang = (searchParams.get("source") || "en") as SupportedLanguage;
  const targetLanguages = (searchParams.get("targets") || "es,pt,ms").split(
    ","
  ) as SupportedLanguage[];

  // Auto-open prep modal when navigated from dashboard with ?prep=1
  useEffect(() => {
    if (searchParams.get("prep") === "1") setShowPrepModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Supabase channel for broadcasting + presence to count listeners
  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase.channel(`session-${sessionId}`);

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      setListenerCount(Object.keys(state).length);
    });

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
    const id = `final-${transcriptionMode}-${seq}`;
    setSegments((prev) => {
      if (prev.some((s) => s.id === id)) return prev;
      return [
        ...prev,
        { id, text, isFinal: true, timestampMs: Date.now() },
      ];
    });
    setInterimText("");
  }, [transcriptionMode]);

  const handleSpeechStart = useCallback(() => {
    channel?.send({
      type: "broadcast",
      event: "speech_state",
      payload: { speaking: true },
    });
  }, [channel]);

  const handleSpeechStop = useCallback(() => {
    channel?.send({
      type: "broadcast",
      event: "speech_state",
      payload: { speaking: false },
    });
  }, [channel]);

  const realtime = useRealtimeTranscription({
    sourceLang,
    targetLangs: targetLanguages,
    channel,
    glossary,
    context: presentationContext,
    silenceDurationMs,
    vadThreshold,
    onInterimTranscript: handleInterim,
    onFinalTranscript: handleFinal,
    onSpeechStart: handleSpeechStart,
    onSpeechStop: handleSpeechStop,
  });

  const chunked = useChunkedTranscription({
    mode: transcriptionMode === "diarize" ? "diarize" : "chunked",
    sourceLang,
    targetLangs: targetLanguages,
    channel,
    glossary,
    context: presentationContext,
    chunkIntervalMs,
    onInterimTranscript: handleInterim,
    onFinalTranscript: handleFinal,
    onSpeechStart: handleSpeechStart,
    onSpeechStop: handleSpeechStop,
  });

  const { start, stop, status } = transcriptionMode === "realtime" ? realtime : chunked;

  // Timer
  useEffect(() => {
    if (status === "active" && !startTime) setStartTime(Date.now());
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

  // Auto-switch to transcript tab when recording starts
  useEffect(() => {
    if (status === "active") setMobileTab("transcript");
  }, [status]);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPrepModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const totalWords = segments.reduce(
    (acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length,
    0
  );
  const minutes = elapsed / 60;
  const wpm = minutes > 0.5 ? Math.round(totalWords / minutes) : 0;

  // Badge counts for settings icon indicator
  const hasGlossary = glossary.length > 0;
  const hasContext = presentationContext.length > 0;
  const hasCustomVad = silenceDurationMs !== 300 || vadThreshold !== 0.5 || transcriptionMode !== "realtime";
  const settingsBadgeCount =
    (hasGlossary ? 1 : 0) + (hasContext ? 1 : 0) + (hasCustomVad ? 1 : 0);

  if (!sessionId) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-destructive">Keine Session-ID</p>
      </div>
    );
  }

  const base = import.meta.env.VITE_APP_URL || window.location.origin;
  const qsParams = new URLSearchParams({
    title,
    targets: targetLanguages.join(","),
  });
  const sessionUrl = `${base}/session/${sessionId}?${qsParams}`;
  const isRecording = status === "active" || status === "connecting";

  return (
    <div className="flex min-h-svh flex-col bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link to="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </Button>
          </Link>

          {/* Logo + session info */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500">
              <Languages className="size-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {title}
                </p>
                {isRecording && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
                    <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
                    Live · {formatElapsed(elapsed)}
                  </span>
                )}
              </div>
              <div className="mt-0.5 hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
                <span>
                  {LANGUAGES[sourceLang]?.flag} {LANGUAGES[sourceLang]?.label}
                </span>
                <ArrowRight className="size-2.5" />
                {targetLanguages.map((l) => (
                  <span key={l}>
                    {LANGUAGES[l]?.flag} {LANGUAGES[l]?.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right side: listener pill + theme toggle + settings icon + recording (desktop) */}
          <div className="flex items-center gap-2">
            {/* Listener count */}
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5">
              <Users className="size-3.5 text-muted-foreground" />
              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {listenerCount}
              </span>
            </div>

            {/* Theme toggle */}
            <ThemeToggle className="text-muted-foreground hover:bg-muted/40 hover:text-foreground" />

            {/* Settings / Prep modal trigger */}
            <button
              onClick={() => setShowPrepModal(true)}
              title="Session-Einstellungen"
              className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <Settings2 className="size-4" />
              {settingsBadgeCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
                  {settingsBadgeCount}
                </span>
              )}
            </button>

            {/* Desktop recording controls */}
            <div className="hidden md:block">
              <RecordingControls
                status={status}
                onStart={start}
                onStop={stop}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">

        {/* ── Desktop / Tablet layout (≥ md) ── */}
        <div className="hidden md:block">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: "1fr 300px" }}
            >
              {/* Transcript panel */}
              <div>
                {!isRecording && segments.length === 0 ? (
                  <div className="flex h-[calc(100svh-10rem)] flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-muted/20">
                    <div className="flex size-20 items-center justify-center rounded-2xl bg-indigo-500/20">
                      <Mic className="size-10 text-indigo-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">
                        Bereit für die Aufnahme
                      </p>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Starte die Aufnahme — das Live-Transkript erscheint
                        hier. Der QR-Code ist bereits aktiv.
                      </p>
                    </div>
                  </div>
                ) : (
                  <TranscriptView
                    segments={segments}
                    interimText={interimText}
                    className="h-[calc(100svh-10rem)]"
                  />
                )}
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-4">
                <QRCodeDisplay url={sessionUrl} sessionId={sessionId} />

                {/* Stats */}
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    <BarChart3 className="size-3.5" />
                    Statistik
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {[
                      { icon: Hash, label: "Segmente", value: segments.length },
                      { icon: Type, label: "Wörter", value: totalWords },
                      {
                        icon: Clock,
                        label: "Dauer",
                        value: formatElapsed(elapsed),
                      },
                      {
                        icon: Zap,
                        label: "Status",
                        value:
                          status === "active"
                            ? "Live"
                            : status === "connecting"
                              ? "…"
                              : "Bereit",
                      },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label}>
                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                          <Icon className="size-3" />
                          {label}
                        </div>
                        <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  {wpm > 0 && (
                    <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground/70">
                      ~{wpm} Wörter/Min
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile layout (< md) ── */}
        <div className="md:hidden">
          {/* Tab switcher */}
          <div className="border-b border-border px-4 py-2.5">
            <div className="flex gap-1.5 rounded-xl bg-muted/40 p-1">
              {(
                [
                  { id: "qr" as const, icon: QrCode, label: "QR-Code" },
                  {
                    id: "transcript" as const,
                    icon: Radio,
                    label: "Transkript",
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMobileTab(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
                    mobileTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground/70"
                  )}
                >
                  <tab.icon className="size-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile content */}
          <div>
            {mobileTab === "qr" ? (
              <div className="space-y-3 p-4">
                <QRCodeDisplay url={sessionUrl} sessionId={sessionId} />
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-muted/20 py-3 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  {listenerCount === 0
                    ? "Noch keine Zuhörer verbunden"
                    : `${listenerCount} Zuhörer verbunden`}
                </div>
              </div>
            ) : (
              <div className="px-3">
                {!isRecording && segments.length === 0 ? (
                  <div className="flex h-[calc(100svh-12.5rem)] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-muted/20">
                    <Mic className="size-8 text-indigo-400 opacity-70" />
                    <p className="text-sm text-muted-foreground">
                      Starte die Aufnahme unten
                    </p>
                  </div>
                ) : (
                  <TranscriptView
                    segments={segments}
                    interimText={interimText}
                    className="h-[calc(100svh-12.5rem)]"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Mobile fixed bottom recording controls ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-xl px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <RecordingControls
          status={status}
          onStart={start}
          onStop={stop}
          fullWidth
        />
      </div>

      {/* ── Session Prep Modal ── */}
      {showPrepModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPrepModal(false)}
          />

          {/* Panel — centered on desktop, bottom-sheet feel on mobile */}
          <div className="fixed inset-x-4 top-[5svh] z-50 mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/20">
                  <Settings2 className="size-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Session-Vorbereitung
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Glossar, Kontext & Transkriptions-Einstellungen
                  </p>
                </div>
              </div>

              {/* Active-config badges */}
              <div className="flex items-center gap-2">
                {hasGlossary && (
                  <span className="flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                    <BookOpen className="size-2.5" />
                    {glossary.length}
                  </span>
                )}
                {hasContext && (
                  <span className="flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                    <FileText className="size-2.5" />
                    Kontext
                  </span>
                )}
                <button
                  onClick={() => setShowPrepModal(false)}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal body — scrollable */}
            <div
              className="overflow-y-auto p-5"
              style={{ maxHeight: "calc(90svh - 4.5rem)" }}
            >
              {isRecording && (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-300">
                  <Mic className="size-3.5 shrink-0" />
                  Einstellungen können während der Aufnahme nicht geändert
                  werden.
                </div>
              )}
              <SessionPrepPanel
                glossary={glossary}
                onGlossaryChange={setGlossary}
                context={presentationContext}
                onContextChange={setPresentationContext}
                transcriptionMode={transcriptionMode}
                onTranscriptionModeChange={setTranscriptionMode}
                chunkIntervalMs={chunkIntervalMs}
                onChunkIntervalChange={setChunkIntervalMs}
                silenceDurationMs={silenceDurationMs}
                onSilenceDurationChange={setSilenceDurationMs}
                vadThreshold={vadThreshold}
                onVadThresholdChange={setVadThreshold}
                isRecording={isRecording}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
