import { useState } from "react";
import { Globe, Mic, Plus } from "lucide-react";
import type { SupportedLanguage } from "~/types/session.ts";
import { LANGUAGE_LIST } from "~/lib/languages.ts";
import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import { Label } from "~/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select.tsx";
import { Badge } from "~/components/ui/badge.tsx";

interface CreateSessionFormProps {
  onSubmit: (data: {
    title: string;
    sourceLang: SupportedLanguage;
    targetLanguages: SupportedLanguage[];
    speakerName: string;
  }) => void;
  loading?: boolean;
}

export function CreateSessionForm({
  onSubmit,
  loading,
}: CreateSessionFormProps) {
  const [title, setTitle] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [sourceLang, setSourceLang] = useState<SupportedLanguage>("en");
  const [targetLanguages, setTargetLanguages] = useState<SupportedLanguage[]>([]);

  const toggleTarget = (lang: SupportedLanguage) => {
    setTargetLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetLanguages.length === 0) return;
    onSubmit({ title, sourceLang, targetLanguages, speakerName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Session-Titel</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Keynote Tag 1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="speaker">Speaker Name</Label>
        <Input
          id="speaker"
          value={speakerName}
          onChange={(e) => setSpeakerName(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <Label>
          <Globe className="size-3.5" />
          Quellsprache
        </Label>
        <Select
          value={sourceLang}
          onValueChange={(v) => setSourceLang(v as SupportedLanguage)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_LIST.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.flag} {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Zielsprachen</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_LIST.filter((l) => l.code !== sourceLang).map((l) => {
            const isActive = targetLanguages.includes(l.code);
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => toggleTarget(l.code)}
              >
                <Badge
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:scale-105"
                >
                  {l.flag} {l.label}
                </Badge>
              </button>
            );
          })}
        </div>
        {targetLanguages.length === 0 && (
          <p className="text-sm text-destructive">
            Mindestens eine Zielsprache wählen
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={loading || targetLanguages.length === 0}
        className="w-full"
      >
        {loading ? (
          <>
            <Mic className="size-4 animate-pulse" />
            Erstelle Session...
          </>
        ) : (
          <>
            <Plus className="size-4" />
            Session erstellen
          </>
        )}
      </Button>
    </form>
  );
}
