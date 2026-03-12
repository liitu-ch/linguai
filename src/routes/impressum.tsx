import { Link } from "react-router";
import { ArrowLeft, Languages } from "lucide-react";
import { Footer } from "~/components/Footer.tsx";

export function Impressum() {
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-8">Impressum</h1>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">Angaben</h2>
              <p>
                liitu consulting gmbh<br />
                Villenstrasse 4<br />
                Schaffhausen, Schweiz
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">Kontakt</h2>
              <p>
                E-Mail: info@liitu.ch<br />
                Telefon: +41 79 403 36 13<br />
                U-ID: CHE-178.036.243
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">Vertretungsberechtigte Person</h2>
              <p>Sandro Scalco</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">Haftung für Inhalte</h2>
              <p>
                Die Inhalte unserer Seiten wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit,
                Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">Urheberrecht</h2>
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
                dem schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede
                Art der Verwertung ausserhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
                Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
