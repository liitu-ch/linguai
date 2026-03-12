import { Link } from "react-router";
import { ArrowLeft, Languages } from "lucide-react";
import { Footer } from "~/components/Footer.tsx";

export function AGB() {
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-8">Allgemeine Geschäftsbedingungen</h1>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Geltungsbereich</h2>
              <p>
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Webanwendung LinguAI,
                betrieben von der liitu consulting gmbh, Villenstrasse 4, Schaffhausen, Schweiz.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Leistungsbeschreibung</h2>
              <p>
                LinguAI ist eine kostenlose, quelloffene Webanwendung für KI-gestützte Simultanübersetzung
                bei Live-Events. Die Anwendung funktioniert nach dem Prinzip "Bring your own API Key":
                Nutzer stellen ihre eigenen API-Schlüssel für Drittanbieter-Dienste (OpenAI, ElevenLabs) bereit.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. API-Schlüssel und Kosten</h2>
              <p>
                Die Nutzung von LinguAI selbst ist kostenlos. Durch die Verwendung eigener API-Schlüssel
                entstehen Kosten direkt beim jeweiligen Anbieter (OpenAI, ElevenLabs). Der Nutzer ist
                selbst verantwortlich für:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Die Erstellung und Verwaltung seiner API-Schlüssel</li>
                <li>Die Überwachung der entstehenden Kosten bei den Drittanbietern</li>
                <li>Die Einhaltung der Nutzungsbedingungen der jeweiligen Anbieter</li>
                <li>Die sichere Aufbewahrung und den Schutz seiner API-Schlüssel</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Nutzungsbedingungen</h2>
              <p>Der Nutzer verpflichtet sich:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>LinguAI nicht für rechtswidrige Zwecke zu nutzen</li>
                <li>Keine Inhalte zu übersetzen, die gegen geltendes Recht verstossen</li>
                <li>Die Anwendung nicht missbräuchlich oder in einer Weise zu nutzen, die den Dienst für andere Nutzer beeinträchtigt</li>
                <li>Keine automatisierten Zugriffe oder Bots einzusetzen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Verfügbarkeit</h2>
              <p>
                LinguAI wird als "as-is" bereitgestellt. Es besteht kein Anspruch auf ununterbrochene
                Verfügbarkeit. Die liitu consulting gmbh behält sich vor, den Dienst jederzeit ohne
                Vorankündigung zu ändern, einzuschränken oder einzustellen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Haftungsbeschränkung</h2>
              <p>
                Die liitu consulting gmbh haftet nicht für:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Fehlerhafte Übersetzungen oder Transkriptionen</li>
                <li>Ausfälle oder Störungen der genutzten Drittanbieter-Dienste</li>
                <li>Datenverlust oder Schäden, die durch die Nutzung der Anwendung entstehen</li>
                <li>Kosten, die durch die Nutzung der Drittanbieter-APIs entstehen</li>
                <li>Indirekte Schäden oder Folgeschäden jeglicher Art</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Geistiges Eigentum</h2>
              <p>
                Der Quellcode von LinguAI ist unter der{" "}
                <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-indigo-500 transition-colors">
                  CC BY-SA 4.0
                </a>{" "}
                Lizenz veröffentlicht. Die Marke "LinguAI" und das zugehörige Logo sind Eigentum
                der liitu consulting gmbh.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Datenschutz</h2>
              <p>
                Es gelten die Bestimmungen unserer{" "}
                <Link to="/datenschutz" className="text-foreground hover:text-indigo-500 transition-colors">
                  Datenschutzerklärung
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">9. Anwendbares Recht und Gerichtsstand</h2>
              <p>
                Es gilt ausschliesslich Schweizer Recht. Gerichtsstand ist Schaffhausen, Schweiz.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">10. Änderungen der AGB</h2>
              <p>
                Die liitu consulting gmbh behält sich vor, diese AGB jederzeit anzupassen. Die jeweils
                aktuelle Fassung ist auf dieser Seite verfügbar.
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
