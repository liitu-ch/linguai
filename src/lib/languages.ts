import type { SupportedLanguage } from "~/types/session.ts";

export interface LanguageInfo {
  code: SupportedLanguage;
  label: string;
  bcp47: string;
  flag: string;
}

export const LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: { code: "en", label: "English", bcp47: "en-US", flag: "🇬🇧" },
  de: { code: "de", label: "Deutsch", bcp47: "de-DE", flag: "🇩🇪" },
  fr: { code: "fr", label: "Français", bcp47: "fr-FR", flag: "🇫🇷" },
  it: { code: "it", label: "Italiano", bcp47: "it-IT", flag: "🇮🇹" },
  es: { code: "es", label: "Español", bcp47: "es-ES", flag: "🇪🇸" },
  pt: { code: "pt", label: "Português", bcp47: "pt-PT", flag: "🇵🇹" },
  ms: { code: "ms", label: "Bahasa Melayu", bcp47: "ms-MY", flag: "🇲🇾" },
  cs: { code: "cs", label: "Čeština", bcp47: "cs-CZ", flag: "🇨🇿" },
  sk: { code: "sk", label: "Slovenčina", bcp47: "sk-SK", flag: "🇸🇰" },
};

export const LANGUAGE_LIST = Object.values(LANGUAGES);

export const LANG_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian",
  es: "Spanish",
  pt: "Portuguese",
  ms: "Malay",
  cs: "Czech",
  sk: "Slovak",
};
