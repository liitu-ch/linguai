export type SupportedLanguage =
  | "en" | "de" | "fr" | "it" | "es" | "pt" | "ms" | "cs" | "sk"
  | "ar" | "bg" | "ca" | "da" | "el" | "et" | "fi" | "he" | "hi"
  | "hr" | "hu" | "id" | "ja" | "ko" | "lt" | "lv" | "nl" | "no"
  | "pl" | "ro" | "ru" | "sl" | "sr" | "sv" | "th" | "tr" | "uk"
  | "vi" | "zh";

export type TTSVoice =
  | "alloy" | "ash" | "ballad" | "cedar" | "coral" | "echo" | "fable"
  | "marin" | "nova" | "onyx" | "sage" | "shimmer" | "verse";

export interface TTSVoiceSettings {
  voice: TTSVoice;
  accent: string;
  tone: string;
  emotionalRange: string;
  speed: string;
  intonation: string;
  impressions: string;
  whispering: boolean;
}

export const DEFAULT_TTS_VOICE_SETTINGS: TTSVoiceSettings = {
  voice: "marin",
  accent: "",
  tone: "",
  emotionalRange: "",
  speed: "",
  intonation: "",
  impressions: "",
  whispering: false,
};

export type TranscriptionMode = "realtime" | "chunked" | "diarize";

export interface TranslationSegment {
  id: string;
  sequenceNum: number;
  originalText: string;
  originalLang: SupportedLanguage;
  translations: Partial<Record<SupportedLanguage, string>>;
  timestampMs: number;
  isFinal: boolean;
}
