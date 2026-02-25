import type { SupportedLanguage } from "~/types/session.ts";

export interface LanguageInfo {
  code: SupportedLanguage;
  label: string;
  bcp47: string;
  flag: string;
}

export const LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: { code: "en", label: "English", bcp47: "en-US", flag: "GB" },
  es: { code: "es", label: "Español", bcp47: "es-ES", flag: "ES" },
  pt: { code: "pt", label: "Português", bcp47: "pt-PT", flag: "PT" },
  ms: { code: "ms", label: "Bahasa Melayu", bcp47: "ms-MY", flag: "MY" },
  cs: { code: "cs", label: "Čeština", bcp47: "cs-CZ", flag: "CZ" },
  sk: { code: "sk", label: "Slovenčina", bcp47: "sk-SK", flag: "SK" },
};

export const LANGUAGE_LIST = Object.values(LANGUAGES);

export const LANG_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  ms: "Malay",
  cs: "Czech",
  sk: "Slovak",
};
