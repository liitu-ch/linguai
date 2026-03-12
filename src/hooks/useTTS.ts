import { useRef, useCallback, useEffect } from "react";
import type { SupportedLanguage } from "~/types/session.ts";
import type { TTSProvider } from "~/types/database.ts";
import { LANGUAGES } from "~/lib/languages.ts";
import { supabase } from "~/lib/supabase.ts";
import { fnUrl } from "~/lib/api.ts";

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
  speed?: number;
  browserVoiceName?: string;
  /** Which server-side TTS provider to use when mode is "openai" */
  ttsProvider?: TTSProvider;
}

export function useTTS({ mode, lang, volume = 1, rate = 1, speed = 1.1, browserVoiceName, ttsProvider = "openai" }: UseTTSOptions) {
  const queueRef = useRef<TTSQueueItem[]>([]);
  const isPlayingRef = useRef(false);
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const browserVoiceNameRef = useRef(browserVoiceName);
  browserVoiceNameRef.current = browserVoiceName;

  const ttsProviderRef = useRef(ttsProvider);
  ttsProviderRef.current = ttsProvider;

  // Browser TTS
  const speakBrowser = useCallback(
    (item: TTSQueueItem): Promise<void> =>
      new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.lang = LANGUAGES[item.lang].bcp47;
        utterance.volume = volume;
        utterance.rate = rate;

        // Use user-selected voice, or fall back to a voice for the target language
        const voices = speechSynthesis.getVoices();
        const selectedName = browserVoiceNameRef.current;
        const picked = selectedName
          ? voices.find((v) => v.name === selectedName)
          : voices.find(
              (v) =>
                v.lang.startsWith(item.lang) && !v.name.includes("Compact")
            );
        if (picked) utterance.voice = picked;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        speechSynthesis.speak(utterance);
      }),
    [volume, rate]
  );

  // Server TTS (OpenAI or ElevenLabs) via /api/tts
  const speakServer = useCallback(
    async (item: TTSQueueItem): Promise<void> => {
      // Get auth token for user-key resolution
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        headers.Authorization = `Bearer ${data.session.access_token}`;
      }

      const provider = ttsProviderRef.current;
      const res = await fetch(fnUrl("tts"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          text: item.text,
          lang: item.lang,
          speed,
          provider: provider === "browser" ? "openai" : provider,
        }),
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
    [volume, speed]
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
          await speakServer(item);
        }
      } catch {
        // Don't block queue on TTS errors
      }
    }

    isPlayingRef.current = false;
  }, [mode, speakBrowser, speakServer]);

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
