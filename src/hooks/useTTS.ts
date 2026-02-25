import { useRef, useCallback, useEffect } from "react";
import type { SupportedLanguage } from "~/types/session.ts";
import { LANGUAGES } from "~/lib/languages.ts";

export type TTSMode = "browser" | "openai" | "off";

interface TTSQueueItem {
  text: string;
  lang: SupportedLanguage;
  segmentId: string;
}

interface UseTTSOptions {
  mode: TTSMode;
  lang: SupportedLanguage;
  volume?: number;
  rate?: number;
}

export function useTTS({ mode, lang, volume = 1, rate = 1 }: UseTTSOptions) {
  const queueRef = useRef<TTSQueueItem[]>([]);
  const isPlayingRef = useRef(false);
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Browser TTS
  const speakBrowser = useCallback(
    (item: TTSQueueItem): Promise<void> =>
      new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.lang = LANGUAGES[item.lang].bcp47;
        utterance.volume = volume;
        utterance.rate = rate;

        // Prefer a voice for the target language
        const voices = speechSynthesis.getVoices();
        const native = voices.find(
          (v) =>
            v.lang.startsWith(item.lang) && !v.name.includes("Compact")
        );
        if (native) utterance.voice = native;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        speechSynthesis.speak(utterance);
      }),
    [volume, rate]
  );

  // OpenAI TTS via server proxy
  const speakOpenAI = useCallback(
    async (item: TTSQueueItem): Promise<void> => {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: item.text, lang: item.lang }),
      });

      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      return new Promise((resolve) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.volume = volume;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    },
    [volume]
  );

  // Queue processor
  const processQueue = useCallback(async () => {
    if (isPlayingRef.current || queueRef.current.length === 0) return;
    isPlayingRef.current = true;

    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift()!;
      try {
        if (mode === "browser") {
          await speakBrowser(item);
        } else if (mode === "openai") {
          await speakOpenAI(item);
        }
      } catch {
        // Don't block queue on TTS errors
      }
    }

    isPlayingRef.current = false;
  }, [mode, speakBrowser, speakOpenAI]);

  const enqueue = useCallback(
    (text: string, segmentId: string, isFinal: boolean) => {
      if (mode === "off") return;
      if (!isFinal) return;
      if (spokenIdsRef.current.has(segmentId)) return;
      if (!text.trim()) return;

      spokenIdsRef.current.add(segmentId);
      queueRef.current.push({ text, lang, segmentId });
      processQueue();
    },
    [lang, mode, processQueue]
  );

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    audioRef.current?.pause();
    queueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { enqueue, stop };
}
