import { Languages } from "lucide-react";
import type { SupportedLanguage } from "~/types/session.ts";
import { LANGUAGES } from "~/lib/languages.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select.tsx";

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
      <Select
        value={selected ?? undefined}
        onValueChange={(val) => onSelect(val as SupportedLanguage)}
      >
        <SelectTrigger className="w-full h-12 text-base">
          <SelectValue placeholder="Sprache auswählen..." />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {languages.map((code) => {
            const lang = LANGUAGES[code];
            return (
              <SelectItem key={code} value={code} className="py-2.5 text-base">
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

interface LanguageSwitcherProps {
  languages: SupportedLanguage[];
  selected: SupportedLanguage;
  onSelect: (lang: SupportedLanguage) => void;
}

/** Compact language switcher for use in headers / toolbars */
export function LanguageSwitcher({
  languages,
  selected,
  onSelect,
}: LanguageSwitcherProps) {
  const current = LANGUAGES[selected];
  return (
    <Select
      value={selected}
      onValueChange={(val) => onSelect(val as SupportedLanguage)}
    >
      <SelectTrigger size="sm" className="gap-1.5 text-xs">
        <SelectValue>
          <span>{current.flag}</span>
          <span className="hidden sm:inline">{current.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" align="end" sideOffset={4}>
        {languages.map((code) => {
          const lang = LANGUAGES[code];
          return (
            <SelectItem key={code} value={code}>
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
