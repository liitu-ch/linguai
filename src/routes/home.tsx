import { useNavigate } from "react-router";
import { nanoid } from "nanoid";
import {
  Languages,
  Mic,
  Globe,
  Zap,
  Headphones,
  ArrowDown,
} from "lucide-react";
import { CreateSessionForm } from "~/components/CreateSessionForm.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card.tsx";
import { Badge } from "~/components/ui/badge.tsx";
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
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Languages className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">LinguAI</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Prototyp
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)/0.08,transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-20 text-center md:pb-20 md:pt-28">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg md:size-20">
            <Languages className="size-8 md:size-10" />
          </div>
          <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
            KI-Simultanübersetzung
            <span className="block text-primary">für Live-Events</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground md:mt-6 md:text-lg">
            Sprecher reden — Zuhörer verstehen. In Echtzeit, in ihrer Sprache.
            Starte eine Session und teile den QR-Code mit deinem Publikum.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm ring-1 ring-border">
              <Mic className="size-3.5 text-primary" />
              Sprache-zu-Text
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm ring-1 ring-border">
              <Zap className="size-3.5 text-primary" />
              Echtzeit-Übersetzung
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm ring-1 ring-border">
              <Headphones className="size-3.5 text-primary" />
              Text-to-Speech
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm ring-1 ring-border">
              <Globe className="size-3.5 text-primary" />
              9 Sprachen
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-12 flex justify-center">
            <ArrowDown className="size-5 animate-bounce text-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>Neue Session erstellen</CardTitle>
                <CardDescription>
                  Konfiguriere Sprachen und starte die Live-Übersetzung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateSessionForm onSubmit={handleSubmit} />
              </CardContent>
            </Card>
          </div>

          {/* How it works */}
          <div className="mt-16">
            <h2 className="mb-8 text-center text-xl font-semibold tracking-tight">
              So funktioniert's
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg font-bold">1</span>
                </div>
                <h3 className="mb-2 font-semibold">Session erstellen</h3>
                <p className="text-sm text-muted-foreground">
                  Wähle Quell- und Zielsprachen und starte eine neue
                  Übersetzungs-Session.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg font-bold">2</span>
                </div>
                <h3 className="mb-2 font-semibold">QR-Code teilen</h3>
                <p className="text-sm text-muted-foreground">
                  Zeige den QR-Code auf dem Bildschirm — Zuhörer scannen ihn mit
                  dem Smartphone.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg font-bold">3</span>
                </div>
                <h3 className="mb-2 font-semibold">Live zuhören</h3>
                <p className="text-sm text-muted-foreground">
                  Zuhörer wählen ihre Sprache und sehen die Übersetzung in
                  Echtzeit — mit optionalem Audio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground md:flex-row md:justify-between">
          <div className="flex items-center gap-1.5">
            <Languages className="size-3.5" />
            <span className="font-medium text-foreground">LinguAI</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <p>KI-gestützte Simultanübersetzung für Live-Events</p>
        </div>
      </footer>
    </div>
  );
}
