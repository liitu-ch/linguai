import { Link } from "react-router";
import { ArrowLeft, Languages } from "lucide-react";
import { Footer } from "~/components/Footer.tsx";

export function Datenschutz() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
              <Languages className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">LinguAI</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
            Zurück
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-8">Datenschutzerklärung</h1>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Verantwortliche Stelle</h2>
              <p>
                liitu consulting gmbh<br />
                Villenstrasse 4<br />
                Schaffhausen, Schweiz<br />
                E-Mail: info@liitu.ch
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Erhebung und Verarbeitung von Daten</h2>
              <p>
                LinguAI verarbeitet personenbezogene Daten nur im Rahmen der Nutzung der Anwendung.
                Dies umfasst:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>E-Mail-Adresse und Authentifizierungsdaten (über Supabase Auth)</li>
                <li>API-Schlüssel (verschlüsselt gespeichert mit AES-256-GCM)</li>
                <li>Session-Daten (Spracheinstellungen, Transkriptionen während einer aktiven Session)</li>
                <li>Audio-Daten (werden in Echtzeit verarbeitet und nicht dauerhaft gespeichert)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Bring your own API Key</h2>
              <p>
                LinguAI speichert keine API-Schlüssel im Klartext. Alle Schlüssel werden mit AES-256-GCM
                verschlüsselt in der Datenbank gespeichert. Die Schlüssel werden ausschliesslich für die
                Kommunikation mit den gewählten Drittanbietern (OpenAI, ElevenLabs) verwendet.
              </p>
              <p>
                Durch die Verwendung eigener API-Schlüssel gelten zusätzlich die Datenschutzbestimmungen
                der jeweiligen Anbieter:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-indigo-500 transition-colors">OpenAI Privacy Policy</a></li>
                <li><a href="https://elevenlabs.io/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-indigo-500 transition-colors">ElevenLabs Privacy Policy</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Drittanbieter</h2>
              <p>LinguAI nutzt folgende Drittanbieter-Dienste:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Supabase</strong> — Authentifizierung, Datenbank und Echtzeit-Kommunikation</li>
                <li><strong>Vercel</strong> — Hosting und serverlose Funktionen</li>
                <li><strong>OpenAI</strong> — Spracherkennung, Übersetzung und Text-to-Speech</li>
                <li><strong>ElevenLabs</strong> — Text-to-Speech (optional)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Audio-Daten</h2>
              <p>
                Audio-Aufnahmen werden direkt vom Browser des Speakers an die OpenAI Realtime API gestreamt.
                Es erfolgt keine dauerhafte Speicherung von Audio-Daten auf unseren Servern. Die Verarbeitung
                erfolgt ausschliesslich in Echtzeit.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Cookies und lokale Speicherung</h2>
              <p>
                LinguAI verwendet keine Tracking-Cookies. Es werden ausschliesslich technisch notwendige
                Daten im Browser gespeichert (Authentifizierungs-Token via Supabase, Theme-Einstellungen).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Ihre Rechte</h2>
              <p>
                Sie haben jederzeit das Recht auf Auskunft, Berichtigung und Löschung Ihrer personenbezogenen
                Daten. Kontaktieren Sie uns unter info@liitu.ch.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Änderungen</h2>
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung jederzeit anzupassen. Die aktuelle Version
                ist stets auf dieser Seite verfügbar.
              </p>
              <p className="text-xs">Stand: März 2026</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
