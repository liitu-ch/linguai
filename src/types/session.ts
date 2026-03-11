export type SupportedLanguage =
  | "en" | "de" | "fr" | "it" | "es" | "pt" | "ms" | "cs" | "sk"
  | "ar" | "bg" | "ca" | "da" | "el" | "et" | "fi" | "he" | "hi"
  | "hr" | "hu" | "id" | "ja" | "ko" | "lt" | "lv" | "nl" | "no"
  | "pl" | "ro" | "ru" | "sl" | "sr" | "sv" | "th" | "tr" | "uk"
  | "vi" | "zh";

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
