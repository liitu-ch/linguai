import type { SupportedLanguage, TranslationSegment } from "./session.ts";

export interface TranslateRequestBody {
  sessionId: string;
  text: string;
  sourceLang: SupportedLanguage;
  isFinal: boolean;
  sequenceNum: number;
}

export interface TranslateResponse {
  segment: TranslationSegment;
}

export interface CreateSessionBody {
  title: string;
  sourceLang: SupportedLanguage;
  targetLanguages: SupportedLanguage[];
  speakerName?: string;
}

export interface TTSRequestBody {
  text: string;
  lang: SupportedLanguage;
  voice?: string;
}

export type SSEEvent =
  | { type: "segment"; data: TranslationSegment }
  | { type: "heartbeat"; ts: number }
  | { type: "session_end" };
