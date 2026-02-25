import type { SupportedLanguage } from "~/types/session.ts";
import { LANGUAGES } from "~/lib/languages.ts";

interface LanguageSelectorProps {
  languages: SupportedLanguage[];
  selected: SupportedLanguage | null;
  onSelect: (lang: SupportedLanguage) => void;
}

export function LanguageSelector({
  languages,
  selected,
  onSelect,
}: LanguageSelectorProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">
        Sprache wählen
      </h2>
      <div className="grid gap-2">
        {languages.map((code) => {
          const lang = LANGUAGES[code];
          return (
            <button
              key={code}
              onClick={() => onSelect(code)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                selected === code
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-800 hover:bg-gray-100 shadow-sm"
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium">{lang.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
