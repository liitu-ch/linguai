import { Languages } from "lucide-react";
import type { SupportedLanguage } from "~/types/session.ts";
import { LANGUAGES } from "~/lib/languages.ts";
import { cn } from "~/lib/utils.ts";

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
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Languages className="size-5" />
        <h2 className="text-lg font-semibold text-foreground">
          Sprache wählen
        </h2>
      </div>
      <div className="grid gap-2">
        {languages.map((code) => {
          const lang = LANGUAGES[code];
          const isSelected = selected === code;
          return (
            <button
              key={code}
              onClick={() => onSelect(code)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-card-foreground shadow-sm hover:border-primary/40 hover:shadow-md"
              )}
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
