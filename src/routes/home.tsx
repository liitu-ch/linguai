import { useNavigate } from "react-router";
import { nanoid } from "nanoid";
import { CreateSessionForm } from "~/components/CreateSessionForm.tsx";
import type { SupportedLanguage } from "~/types/session.ts";

export function Home() {
  const navigate = useNavigate();

  const handleSubmit = (data: {
    title: string;
    sourceLang: SupportedLanguage;
    targetLanguages: SupportedLanguage[];
    speakerName: string;
  }) => {
    const sessionId = nanoid(8);
    const params = new URLSearchParams({
      title: data.title,
      source: data.sourceLang,
      targets: data.targetLanguages.join(","),
    });
    navigate(`/speaker/${sessionId}?${params}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            KI-Simultanübersetzung
          </h1>
          <p className="text-gray-500 mt-1">
            Neue Session für Live-Übersetzung erstellen
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <CreateSessionForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
