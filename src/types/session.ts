export type SupportedLanguage = "en" | "es" | "pt" | "ms" | "cs" | "sk";

export interface TranslationSegment {
  id: string;
  sessionId: string;
  sequenceNum: number;
  originalText: string;
  originalLang: SupportedLanguage;
  translations: Partial<Record<SupportedLanguage, string>>;
  timestampMs: number;
  isFinal: boolean;
}

export interface SessionMeta {
  sessionId: string;
  title: string;
  sourceLang: SupportedLanguage;
  targetLanguages: SupportedLanguage[];
  speakerName?: string;
  createdAt: number;
  expiresAt: number;
  status: "active" | "ended";
}

export const KV_KEYS = {
  sessionMeta: (sid: string) => `session:${sid}:meta`,
  segments: (sid: string) => `session:${sid}:segments`,
  latestSeq: (sid: string) => `session:${sid}:latest`,
  TTL_SECONDS: 6 * 60 * 60,
} as const;
