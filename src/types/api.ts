import type { SupportedLanguage, TranslationSegment } from "./session.ts";

export interface GlossaryEntry {
  source: string;
  target: string;
  lang?: SupportedLanguage;
}

export interface TranslateRequestBody {
  text: string;
  sourceLang: SupportedLanguage;
  targetLangs: SupportedLanguage[];
  sequenceNum: number;
  glossary?: GlossaryEntry[];
  context?: string;
}

export interface TranslateResponse {
  segment: TranslationSegment;
}
