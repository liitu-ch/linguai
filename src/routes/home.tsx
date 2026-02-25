import { useState } from "react";
import { useNavigate } from "react-router";
import { CreateSessionForm } from "~/components/CreateSessionForm.tsx";
import { createSession } from "~/lib/session.ts";
import type { SupportedLanguage } from "~/types/session.ts";

export function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    title: string;
    sourceLang: SupportedLanguage;
    targetLanguages: SupportedLanguage[];
    speakerName: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const session = await createSession(data);
      navigate(`/speaker/${session.sessionId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Session konnte nicht erstellt werden"
      );
    } finally {
      setLoading(false);
    }
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
          <CreateSessionForm onSubmit={handleSubmit} loading={loading} />

          {error && (
            <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
