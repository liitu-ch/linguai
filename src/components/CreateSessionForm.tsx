import { useState } from "react";
import type { SupportedLanguage } from "~/types/session.ts";
import { LANGUAGE_LIST } from "~/lib/languages.ts";

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
  const [targetLanguages, setTargetLanguages] = useState<SupportedLanguage[]>([
    "es",
    "pt",
    "ms",
  ]);

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Session-Titel
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Keynote Tag 1"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Speaker Name
        </label>
        <input
          type="text"
          value={speakerName}
          onChange={(e) => setSpeakerName(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quellsprache
        </label>
        <select
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value as SupportedLanguage)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          {LANGUAGE_LIST.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zielsprachen
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_LIST.filter((l) => l.code !== sourceLang).map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => toggleTarget(l.code)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                targetLanguages.includes(l.code)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || targetLanguages.length === 0}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Erstelle Session..." : "Session erstellen"}
      </button>
    </form>
  );
}
