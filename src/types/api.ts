import type { SupportedLanguage, TranslationSegment } from "./session.ts";

export interface TranslateRequestBody {
  text: string;
  sourceLang: SupportedLanguage;
  targetLangs: SupportedLanguage[];
  sequenceNum: number;
}

export interface TranslateResponse {
  segment: TranslationSegment;
}
