import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Languages,
  Loader2,
  Lock,
  Settings,
  Volume2,
  VolumeOff,
  Sparkles,
  X,
} from "lucide-react";
import { useChannel } from "~/hooks/useChannel.ts";
import { useTTS, type TTSMode } from "~/hooks/useTTS.ts";
import { TranscriptView } from "~/components/TranscriptView.tsx";
import { ThemeToggle } from "~/components/ThemeToggle.tsx";
import { LANGUAGES } from "~/lib/languages.ts";
import { getSessionTranslations } from "~/lib/session-i18n.ts";
import { Button } from "~/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog.tsx";
import { Input } from "~/components/ui/input.tsx";
import { cn } from "~/lib/utils.ts";
import { supabase } from "~/lib/supabase.ts";
import { sha256 } from "~/lib/crypto.ts";
import type {
  SupportedLanguage,
  TranslationSegment,
} from "~/types/session.ts";
import type { TTSProvider } from "~/types/database.ts";

const AUDIO_TEST_SENTENCES: Partial<Record<SupportedLanguage, string>> = {
  en: "This is a test. If you can hear this, your audio is working correctly.",
  de: "Dies ist ein Test. Wenn du das hörst, funktioniert dein Audio korrekt.",
  fr: "Ceci est un test. Si vous entendez cela, votre audio fonctionne correctement.",
  it: "Questo è un test. Se riesci a sentire questo, il tuo audio funziona correttamente.",
  es: "Esta es una prueba. Si puedes escuchar esto, tu audio funciona correctamente.",
  pt: "Este é um teste. Se consegues ouvir isto, o teu áudio está a funcionar corretamente.",
  ms: "Ini adalah ujian. Jika anda dapat mendengar ini, audio anda berfungsi dengan betul.",
  cs: "Toto je test. Pokud toto slyšíte, váš zvuk funguje správně.",
  sk: "Toto je test. Ak toto počujete, váš zvuk funguje správne.",
  ja: "これはテストです。この音声が聞こえていれば、オーディオは正常に動作しています。",
  zh: "这是一个测试。如果您能听到这段话，说明您的音频工作正常。",
  ko: "이것은 테스트입니다. 이 소리가 들리면 오디오가 정상적으로 작동하고 있습니다.",
  ar: "هذا اختبار. إذا كنت تسمع هذا، فإن الصوت يعمل بشكل صحيح.",
  ru: "Это тест. Если вы слышите это, ваш звук работает правильно.",
  pl: "To jest test. Jeśli to słyszysz, Twój dźwięk działa prawidłowo.",
  nl: "Dit is een test. Als je dit kunt horen, werkt je audio correct.",
  tr: "Bu bir testtir. Bunu duyabiliyorsanız, sesiniz doğru çalışıyor.",
  uk: "Це тест. Якщо ви чуєте це, ваш звук працює правильно.",
  hi: "यह एक परीक्षण है। यदि आप यह सुन सकते हैं, तो आपका ऑडियो सही काम कर रहा है।",
  th: "นี่คือการทดสอบ หากคุณได้ยินเสียงนี้ แสดงว่าเสียงของคุณทำงานถูกต้อง",
  vi: "Đây là bài kiểm tra. Nếu bạn nghe được điều này, âm thanh của bạn đang hoạt động bình thường.",
};

const DEFAULT_TEST_SENTENCE = "This is a test. If you can hear this, your audio is working correctly.";

interface DisplaySegment {
  id: string;
  text: string;
  isFinal: boolean;
  timestampMs: number;
}

export function Session() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [segments, setSegments] = useState<DisplaySegment[]>([]);
  const [interimText, setInterimText] = useState("");
  const allowedTtsModes = (searchParams.get("allowedTts")?.split(",") as TTSMode[] | undefined) ?? ["off", "browser"];
  const ttsProvider = (searchParams.get("ttsProvider") as TTSProvider | null) ?? "openai";
  // Default to the "best" allowed mode
  const defaultTts: TTSMode = allowedTtsModes.includes("openai") ? "openai" : allowedTtsModes.includes("browser") ? "browser" : "off";
  const [ttsMode, setTtsMode] = useState<TTSMode>(defaultTts);
  const [selectedTtsMode, setSelectedTtsMode] = useState<TTSMode>(defaultTts);
  const [voiceChoiceDone, setVoiceChoiceDone] = useState(false);
  const [audioSetupDone, setAudioSetupDone] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const showSettingsRef = useRef(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isTestingTTS, setIsTestingTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(() => {
    const v = parseFloat(searchParams.get("ttsSpeed") || "");
    return isNaN(v) ? 1.1 : v;
  });

  // ── Password gate state ───────────────────────────────────────────────────
  const [isProtected, setIsProtected] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    supabase.rpc("get_event_protection", { p_event_id: sessionId }).then(({ data }) => {
      setIsProtected(data === true);
    });
  }, [sessionId]);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !passwordInput.trim()) return;
    setVerifying(true);
    setPasswordError(false);
    const hash = await sha256(passwordInput.trim());
    const { data } = await supabase.rpc("verify_event_password", {
      p_event_id: sessionId,
      p_password_hash: hash,
    });
    setVerifying(false);
    if (data === true) {
      setPasswordVerified(true);
    } else {
      setPasswordError(true);
    }
  };

  const targetLangs = (searchParams.get("targets") || "es,pt,ms").split(",") as SupportedLanguage[];
  const sourceLang = searchParams.get("source") as SupportedLanguage | null;
  const availableLangs = sourceLang && !targetLangs.includes(sourceLang)
    ? [...targetLangs, sourceLang]
    : targetLangs;
  const title = searchParams.get("title") || "Live-Übersetzung";
  const speakerName = searchParams.get("speaker") || "";
  const t = getSessionTranslations(selectedLang);

  const allTtsOptions: { value: TTSMode; label: string; description: string; icon: typeof Volume2 }[] = [
    { value: "off", label: t.textOnly, description: t.textOnlyDescription, icon: VolumeOff },
    { value: "browser", label: t.browserVoice, description: t.browserVoiceDescription, icon: Volume2 },
    { value: "openai", label: t.premiumVoice, description: t.premiumVoiceDescription, icon: Sparkles },
  ];
  const ttsOptions = allTtsOptions.filter((opt) => allowedTtsModes.includes(opt.value));

  const { enqueue } = useTTS({
    mode: ttsMode,
    lang: selectedLang ?? "en",
    speed: ttsSpeed,
    ttsProvider,
  });

  const handleInterim = useCallback((text: string) => {
    // Only show interim text if listener chose the original language —
    // otherwise they'd see untranslated text that gets replaced, which is confusing
    if (selectedLang === sourceLang) {
      setInterimText(text);
    }
  }, [selectedLang, sourceLang]);

  const handleSpeechState = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
  }, []);

  const handleTtsSpeed = useCallback((speed: number) => {
    setTtsSpeed(speed);
  }, []);

  const handleSegment = useCallback(
    (segment: TranslationSegment) => {
      if (!selectedLang) return;
      const text = segment.translations[selectedLang] ?? segment.originalText;
      setInterimText("");
      setSegments((prev) => {
        if (prev.some((s) => s.id === segment.id)) return prev;
        return [
          ...prev,
          { id: segment.id, text, isFinal: segment.isFinal, timestampMs: segment.timestampMs || Date.now() },
        ];
      });
      enqueue(text, segment.id, segment.isFinal);
      if (showSettingsRef.current) setHasUnread(true);
    },
    [selectedLang, enqueue]
  );

  const { connectionState } = useChannel({
    sessionId: sessionId ?? "",
    onSegment: handleSegment,
    onInterim: handleInterim,
    onSpeechState: handleSpeechState,
    onTtsSpeed: handleTtsSpeed,
    enabled: !!selectedLang && !!sessionId && audioSetupDone,
    trackPresence: true,
  });

  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  const playTestSentence = useCallback(
    async (lang: SupportedLanguage, mode: TTSMode) => {
      speechSynthesis.cancel();
      testAudioRef.current?.pause();
      setTtsError(null);
      const text = AUDIO_TEST_SENTENCES[lang] || DEFAULT_TEST_SENTENCE;

      if (mode === "openai") {
        setIsTestingTTS(true);
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.access_token) {
            headers.Authorization = `Bearer ${sessionData.session.access_token}`;
          }
          const provider = ttsProvider === "browser" ? "openai" : ttsProvider;
          const res = await fetch("/api/tts", {
            method: "POST",
            headers,
            body: JSON.stringify({ text, lang, speed: ttsSpeed, provider }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            setTtsError(data?.error || `TTS fehlgeschlagen (${res.status})`);
            return;
          }
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          testAudioRef.current = audio;
          audio.onended = () => URL.revokeObjectURL(url);
          audio.onerror = () => URL.revokeObjectURL(url);
          audio.play().catch(() => {});
        } finally {
          setIsTestingTTS(false);
        }
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANGUAGES[lang].bcp47;
        const voices = speechSynthesis.getVoices();
        const native = voices.find((v) => v.lang.startsWith(lang) && !v.name.includes("Compact"));
        if (native) utterance.voice = native;
        speechSynthesis.speak(utterance);
      }
    },
    [ttsSpeed, ttsProvider]
  );

  // If only one mode is allowed, skip voice selection and auto-confirm
  const skipVoiceChoice = ttsOptions.length <= 1;

  const handleSelectLang = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    setShowSettings(false);
    if (skipVoiceChoice) {
      const onlyMode = ttsOptions[0]?.value ?? "off";
      setSelectedTtsMode(onlyMode);
      setTtsMode(onlyMode);
      setVoiceChoiceDone(true);
      setAudioSetupDone(true);
    }
  };

  const handleVoiceChoiceNext = () => {
    if (selectedTtsMode === "off") {
      setTtsMode("off");
      setAudioSetupDone(true);
    } else {
      setVoiceChoiceDone(true);
    }
  };

  const handleAudioConfirm = () => {
    setTtsMode(selectedTtsMode);
    setAudioSetupDone(true);
    speechSynthesis.cancel();
    testAudioRef.current?.pause();
  };

  const handleToggleAudio = () => {
    if (ttsMode === "off") {
      // When turning audio on, pick the best allowed non-off mode
      const fallback = allowedTtsModes.includes("openai") ? "openai" : allowedTtsModes.includes("browser") ? "browser" : "off";
      setTtsMode(selectedTtsMode === "off" ? fallback : selectedTtsMode);
    } else {
      setTtsMode("off");
    }
  };

  const handleSettingsOpenChange = (open: boolean) => {
    setShowSettings(open);
    showSettingsRef.current = open;
    if (!open) setHasUnread(false);
  };

  if (!sessionId) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <p className="text-destructive text-center">{t.noSessionId}</p>
      </div>
    );
  }

  if (isProtected === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Step 1: Language selection ─────────────────────────────────────────────
  if (!selectedLang) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-xs space-y-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-500">
                <Languages className="size-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {speakerName && <p className="mt-1 text-sm text-muted-foreground">{speakerName}</p>}
              <p className="mt-2 text-sm text-muted-foreground">{t.chooseLanguage}</p>
            </div>
            <div className="space-y-3">
              {availableLangs.map((lang) => {
                const l = LANGUAGES[lang];
                return (
                  <button key={lang} onClick={() => handleSelectLang(lang)} className="flex w-full items-center gap-4 rounded-2xl border border-border bg-muted/30 p-4 text-left transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 active:scale-[0.98]">
                    <span className="text-4xl leading-none">{l.flag}</span>
                    <div><p className="text-lg font-semibold text-foreground">{l.label}</p></div>
                    <ArrowRight className="ml-auto size-5 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground/70">Session-ID: {sessionId}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Password gate (if protected) ───────────────────────────────────
  if (isProtected && !passwordVerified) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-xs space-y-8">
            <button onClick={() => setSelectedLang(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              {t.language}
            </button>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-500">
                <Languages className="size-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {speakerName && <p className="mt-1 text-sm text-muted-foreground">{speakerName}</p>}
              <p className="mt-2 text-sm text-muted-foreground">{t.passwordProtected}</p>
            </div>
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <Lock className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t.passwordPrompt}</span>
              </div>
              <div className="relative">
                <Input
                  type={showPasswordInput ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                  placeholder={t.password}
                  autoFocus
                  className={cn("pr-10", passwordError && "border-destructive focus-visible:ring-destructive/30")}
                />
                <button type="button" onClick={() => setShowPasswordInput((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPasswordInput ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {passwordError && <p className="text-center text-sm text-destructive">{t.wrongPassword}</p>}
              <Button type="submit" size="lg" disabled={verifying || !passwordInput.trim()} className="w-full gap-2 bg-indigo-500 text-white hover:bg-indigo-400">
                {verifying ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                {t.join}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Voice output selection ────────────────────────────────────────
  if (!voiceChoiceDone && !audioSetupDone) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-xs space-y-8">
            <button onClick={() => setSelectedLang(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              {t.language}
            </button>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-500">
                <Volume2 className="size-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{t.chooseVoiceOutput}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t.audioTestDescription}</p>
            </div>
            <div className="space-y-2">
              <div className="space-y-2">
                {ttsOptions.map((opt) => {
                  const isSelected = selectedTtsMode === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button key={opt.value} onClick={() => { setSelectedTtsMode(opt.value); speechSynthesis.cancel(); }} className={cn("flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all", isSelected ? "border-indigo-500/40 bg-indigo-500/10" : "border-border bg-muted/30")}>
                      <div className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", isSelected ? "border-indigo-400 bg-indigo-400" : "border-muted-foreground/30")}>
                        {isSelected && <span className="size-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("size-4", isSelected ? "text-indigo-400" : "text-muted-foreground")} />
                          <span className="text-sm font-medium text-foreground">{opt.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedTtsMode !== "off" && (
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground/70">
                {t.aiVoiceDisclaimer}
              </p>
            )}
            <Button size="lg" onClick={handleVoiceChoiceNext} className="w-full gap-2 bg-indigo-500 text-white hover:bg-indigo-400">
              <ArrowRight className="size-4" />
              {selectedTtsMode === "off" ? t.join : t.next}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 4: Audio / speaker test ────────────────────────────────────────────
  if (!audioSetupDone) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-xs space-y-8">
            <button onClick={() => { setVoiceChoiceDone(false); speechSynthesis.cancel(); testAudioRef.current?.pause(); }} className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              {t.voiceOutput}
            </button>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-500">
                <Volume2 className="size-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{t.audioTest}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t.audioTestInstruction}</p>
            </div>
            <button
              onClick={() => playTestSentence(selectedLang, selectedTtsMode)}
              disabled={selectedTtsMode === "openai" && isTestingTTS}
              className={cn(
                "flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-5 text-foreground transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 active:scale-[0.98]",
                selectedTtsMode === "openai" && isTestingTTS && "opacity-50"
              )}
            >
              {selectedTtsMode === "openai" && isTestingTTS ? (
                <Loader2 className="size-6 animate-spin text-indigo-400" />
              ) : (
                <Volume2 className="size-6 text-indigo-400" />
              )}
              <span className="text-lg font-semibold">{t.playTestSentence}</span>
            </button>
            {ttsError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
                {ttsError}
              </p>
            )}
            <Button size="lg" onClick={handleAudioConfirm} className="w-full gap-2 bg-indigo-500 text-white hover:bg-indigo-400">
              <Check className="size-4" />
              {t.audioConfirm}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentLang = selectedLang ? LANGUAGES[selectedLang] : null;

  // ── Live session screen ────────────────────────────────────────────────────
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Compact status header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={cn("size-2 shrink-0 rounded-full", connectionState === "open" ? "bg-green-400" : connectionState === "error" ? "bg-destructive" : "bg-yellow-400 animate-pulse")} />
            <span className="truncate text-sm font-semibold text-foreground">{title}{speakerName && <span className="font-normal text-muted-foreground"> · {speakerName}</span>}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {currentLang && <button onClick={() => setShowLangPicker(true)} className="rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">{currentLang.flag} {currentLang.label}</button>}
            <button onClick={handleToggleAudio} className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", ttsMode !== "off" ? "bg-indigo-500/15 text-indigo-400" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground")} title={ttsMode !== "off" ? "Audio aus" : "Audio ein"}>
              {ttsMode !== "off" ? <Volume2 className="size-4" /> : <VolumeOff className="size-4" />}
            </button>
            <button onClick={() => handleSettingsOpenChange(true)} className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
              <Settings className="size-4" />
              {hasUnread && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary animate-pulse" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content — transcript always visible */}
      <main className="flex-1">
        <TranscriptView segments={segments} interimText={interimText} isSpeaking={isSpeaking} animateWords={selectedLang !== sourceLang} className="mx-auto max-w-2xl h-[calc(100svh-3.5rem)]" />
      </main>

      {/* Settings modal */}
      <Dialog open={showSettings} onOpenChange={handleSettingsOpenChange}>
        <DialogContent showCloseButton={false} className="max-h-[85svh] overflow-y-auto max-w-[calc(100%-2rem)] sm:max-w-md rounded-2xl p-5">
          <DialogHeader className="flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-base">{t.settings}</DialogTitle>
            <div className="flex items-center gap-1">
              <ThemeToggle className="text-muted-foreground hover:bg-muted/40 hover:text-foreground" />
              <button onClick={() => handleSettingsOpenChange(false)} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          </DialogHeader>
          <DialogDescription className="sr-only">{t.settings}</DialogDescription>

          <div className="space-y-5">
            {/* Language switch */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">{t.language}</p>
              <div className="space-y-2">
                {availableLangs.map((lang) => {
                  const l = LANGUAGES[lang];
                  const isSelected = selectedLang === lang;
                  return (
                    <button key={lang} onClick={() => handleSelectLang(lang)} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all", isSelected ? "border-indigo-500/40 bg-indigo-500/10 text-foreground" : "border-border bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground")}>
                      <span className="text-2xl">{l.flag}</span>
                      <span className="font-medium">{l.label}</span>
                      {isSelected && <Check className="ml-auto size-4 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TTS mode */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">{t.voiceOutput}</p>
              <div className="space-y-2">
                {ttsOptions.map((opt) => {
                  const isSelected = ttsMode === opt.value;
                  const Icon = opt.icon;
                  return (
                    <div key={opt.value} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 transition-all", isSelected ? "border-indigo-500/40 bg-indigo-500/10" : "border-border bg-muted/30")}>
                      <button
                        onClick={() => { setSelectedTtsMode(opt.value); setTtsMode(opt.value); speechSynthesis.cancel(); }}
                        className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", isSelected ? "border-indigo-400 bg-indigo-400" : "border-muted-foreground/30")}
                      >
                        {isSelected && <span className="size-2 rounded-full bg-white" />}
                      </button>
                      <button
                        onClick={() => { setSelectedTtsMode(opt.value); setTtsMode(opt.value); speechSynthesis.cancel(); }}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={cn("size-4", isSelected ? "text-indigo-400" : "text-muted-foreground")} />
                          <span className="text-sm font-medium text-foreground">{opt.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                      </button>
                      {opt.value !== "off" && selectedLang && (
                        <button
                          onClick={() => playTestSentence(selectedLang, opt.value)}
                          disabled={opt.value === "openai" && isTestingTTS}
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
                            opt.value === "openai" && isTestingTTS && "opacity-50"
                          )}
                          title={t.playTestSentence}
                        >
                          {opt.value === "openai" && isTestingTTS ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Volume2 className="size-4" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {ttsError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {ttsError}
                </p>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Language picker dialog */}
      <Dialog open={showLangPicker} onOpenChange={setShowLangPicker}>
        <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)] sm:max-w-xs rounded-2xl p-5">
          <DialogHeader className="flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-base">{t.language}</DialogTitle>
            <button onClick={() => setShowLangPicker(false)} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
              <X className="size-4" />
            </button>
          </DialogHeader>
          <DialogDescription className="sr-only">{t.language}</DialogDescription>
          <div className="space-y-2">
            {availableLangs.map((lang) => {
              const l = LANGUAGES[lang];
              const isSelected = selectedLang === lang;
              return (
                <button key={lang} onClick={() => { handleSelectLang(lang); setShowLangPicker(false); }} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all", isSelected ? "border-indigo-500/40 bg-indigo-500/10 text-foreground" : "border-border bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground")}>
                  <span className="text-2xl">{l.flag}</span>
                  <span className="font-medium">{l.label}</span>
                  {isSelected && <Check className="ml-auto size-4 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
