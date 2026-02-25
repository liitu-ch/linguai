export type SupportedLanguage = "en" | "es" | "pt" | "ms" | "cs" | "sk";

export interface TranslationSegment {
  id: string;
  sequenceNum: number;
  originalText: string;
  originalLang: SupportedLanguage;
  translations: Partial<Record<SupportedLanguage, string>>;
  timestampMs: number;
  isFinal: boolean;
}
