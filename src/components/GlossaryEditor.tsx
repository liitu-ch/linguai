import { useRef, useState } from "react";
import { BookOpen, Upload, X, FileText } from "lucide-react";
import { Button } from "~/components/ui/button.tsx";
import { Textarea } from "~/components/ui/textarea.tsx";
import { Badge } from "~/components/ui/badge.tsx";
import type { GlossaryEntry } from "~/types/api.ts";

interface GlossaryEditorProps {
  entries: GlossaryEntry[];
  onChange: (entries: GlossaryEntry[]) => void;
  disabled?: boolean;
}

const DELIMITERS = /\s*(?:→|->|=>|=|;|\t)\s*/;
const MAX_ENTRIES = 200;

function parseGlossaryText(text: string): GlossaryEntry[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split(DELIMITERS, 2);
      if (parts.length === 2 && parts[0] && parts[1]) {
        return { source: parts[0].trim(), target: parts[1].trim() };
      }
      return null;
    })
    .filter((e): e is GlossaryEntry => e !== null)
    .slice(0, MAX_ENTRIES);
}

export function GlossaryEditor({ entries, onChange, disabled }: GlossaryEditorProps) {
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (value: string) => {
    setRawText(value);
    setFileName(null);
    onChange(parseGlossaryText(value));
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawText(text);
      setFileName(file.name);
      onChange(parseGlossaryText(text));
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setRawText("");
    setFileName(null);
    onChange([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BookOpen className="size-4 text-primary" />
          Glossar
        </div>
        {entries.length > 0 && (
          <Badge variant="secondary" className="gap-1 text-xs">
            {entries.length} {entries.length === 1 ? "Begriff" : "Begriffe"}
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Begriffe eingeben oder CSV/TXT hochladen. Format: <code className="rounded bg-muted px-1">Begriff → Übersetzung</code>
      </p>

      <Textarea
        value={rawText}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={"Workflow → Arbeitsablauf\nStakeholder → Interessengruppe\nDeployment → Bereitstellung"}
        className="min-h-[100px] font-mono text-xs"
        disabled={disabled}
      />

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.tsv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="gap-1.5 text-xs"
        >
          <Upload className="size-3.5" />
          CSV/TXT hochladen
        </Button>

        {(fileName || entries.length > 0) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="gap-1 text-xs text-muted-foreground"
          >
            <X className="size-3.5" />
            Leeren
          </Button>
        )}

        {fileName && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="size-3" />
            {fileName}
          </span>
        )}
      </div>

      {entries.length > 0 && (
        <div className="max-h-[120px] overflow-y-auto rounded-md border bg-muted/30 p-2">
          <div className="space-y-0.5">
            {entries.slice(0, 20).map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="font-medium">{entry.source}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">{entry.target}</span>
              </div>
            ))}
            {entries.length > 20 && (
              <p className="pt-1 text-xs text-muted-foreground">
                ... und {entries.length - 20} weitere
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
