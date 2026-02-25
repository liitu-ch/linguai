import { useRef, useState } from "react";
import { FileText, Upload, X, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "~/components/ui/button.tsx";
import { Badge } from "~/components/ui/badge.tsx";

interface PresentationUploadProps {
  context: string;
  onChange: (context: string) => void;
  disabled?: boolean;
}

const MAX_CHARS = 8000;
const ACCEPTED_TYPES = ".txt,.md,.pdf";

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

async function extractText(file: File): Promise<string> {
  if (file.name.endsWith(".pdf")) {
    return extractPdfText(file);
  }
  return file.text();
}

export function PresentationUpload({ context, onChange, disabled }: PresentationUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTruncated = context.length > MAX_CHARS;
  const charCount = context.length;

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const text = await extractText(file);
      setFileName(file.name);
      onChange(text);
    } catch (err) {
      console.error("[PresentationUpload] Extraction failed:", err);
      setFileName(null);
      onChange("");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFileName(null);
    onChange("");
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileText className="size-4 text-primary" />
          Präsentation / Kontext
        </div>
        {charCount > 0 && (
          <Badge
            variant={isTruncated ? "destructive" : "secondary"}
            className="gap-1 text-xs"
          >
            {charCount.toLocaleString("de")} Zeichen
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Präsentation oder Kontextmaterial hochladen (TXT, MD, PDF). Der Inhalt verbessert die Übersetzungsqualität.
      </p>

      {!fileName ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 px-4 py-6 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50"
        >
          <Upload className="size-6 opacity-60" />
          <span className="text-sm font-medium">
            {loading ? "Wird verarbeitet..." : "Datei auswählen"}
          </span>
          <span className="text-xs opacity-60">TXT, MD oder PDF</span>
        </button>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-primary" />
              <span className="font-medium">{fileName}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="size-7 p-0 text-muted-foreground"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {isTruncated && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3" />
              Text wird auf {MAX_CHARS.toLocaleString("de")} Zeichen gekürzt
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {showPreview ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            Vorschau
          </button>

          {showPreview && (
            <pre className="mt-2 max-h-[120px] overflow-y-auto whitespace-pre-wrap rounded bg-background p-2 text-xs text-muted-foreground">
              {context.slice(0, 500)}
              {context.length > 500 && "..."}
            </pre>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
    </div>
  );
}
