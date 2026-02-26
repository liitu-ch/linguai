import { useState } from "react";
import { useNavigate } from "react-router";
import { nanoid } from "nanoid";
import {
  Languages,
  Mic,
  Globe,
  Zap,
  Headphones,
  ArrowDown,
  Menu,
  X,
  Check,
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
import { Button } from "~/components/ui/button.tsx";
import type { SupportedLanguage } from "~/types/session.ts";

const NAV_LINKS = [
  { label: "So funktioniert's", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Referenzen", href: "#referenzen" },
];

const PRICING_PLANS = [
  {
    name: "Starter",
    price: "Kostenlos",
    period: "",
    description: "Ideal zum Ausprobieren für kleine Meetings",
    features: [
      "1 Session gleichzeitig",
      "Bis zu 10 Zuhörer",
      "2 Zielsprachen",
      "Browser Text-to-Speech",
      "30 Min. pro Session",
    ],
    cta: "Kostenlos starten",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "CHF 49",
    period: "/ Event",
    description: "Für Konferenzen und Firmenmeetings",
    features: [
      "Unbegrenzte Sessions",
      "Bis zu 100 Zuhörer",
      "Alle 9 Sprachen",
      "OpenAI Premium TTS",
      "6 Stunden pro Session",
      "Prioritäts-Support",
    ],
    cta: "Jetzt buchen",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Auf Anfrage",
    period: "",
    description: "Für grosse Events und Organisationen",
    features: [
      "Alles aus Professional",
      "Unbegrenzte Zuhörer",
      "Custom Glossar & Terminologie",
      "Dedizierte Infrastruktur",
      "SLA & 24/7 Support",
      "On-Premise Option",
    ],
    cta: "Kontakt aufnehmen",
    highlighted: false,
  },
];

const REFERENCES = [
  { name: "ETH Zürich", logo: "ETH" },
  { name: "Universität Bern", logo: "UniBE" },
  { name: "Swiss Re", logo: "Swiss Re" },
  { name: "Nestlé", logo: "Nestlé" },
  { name: "ABB", logo: "ABB" },
  { name: "UBS", logo: "UBS" },
  { name: "Novartis", logo: "Novartis" },
  { name: "Roche", logo: "Roche" },
];

export function Home() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
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

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
            <div className="ml-2 h-5 w-px bg-border" />
            <Button
              size="sm"
              className="ml-2"
              onClick={() => handleNavClick("#session")}
            >
              Session starten
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Menü schliessen" : "Menü öffnen"}
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="border-t bg-background px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {link.label}
                </button>
              ))}
              <Button
                size="sm"
                className="mt-2"
                onClick={() => handleNavClick("#session")}
              >
                Session starten
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <img
          src="https://images.unsplash.com/photo-1507878866276-a947ef722fee?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.1.0"
          alt="Schwarze Stuhlreihen in einem Saal — Foto von Jonas Jacobsson auf Unsplash"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-20 text-center md:pb-20 md:pt-28">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg md:size-20">
            <Languages className="size-8 md:size-10" />
          </div>
          <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white md:text-5xl">
            KI-Simultanübersetzung
            <span className="block text-primary">für Live-Events</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/80 md:mt-6 md:text-lg">
            Sprecher reden — Zuhörer verstehen. In Echtzeit, in ihrer Sprache.
            Starte eine Session und teile den QR-Code mit deinem Publikum.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white shadow-sm ring-1 ring-white/20 backdrop-blur-sm">
              <Mic className="size-3.5 text-primary" />
              Sprache-zu-Text
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white shadow-sm ring-1 ring-white/20 backdrop-blur-sm">
              <Zap className="size-3.5 text-primary" />
              Echtzeit-Übersetzung
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white shadow-sm ring-1 ring-white/20 backdrop-blur-sm">
              <Headphones className="size-3.5 text-primary" />
              Text-to-Speech
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white shadow-sm ring-1 ring-white/20 backdrop-blur-sm">
              <Globe className="size-3.5 text-primary" />
              9 Sprachen
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-12 flex justify-center">
            <ArrowDown className="size-5 animate-bounce text-white/50" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1">
        {/* How it works */}
        <section id="how-it-works" className="border-b bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
            <div className="mb-4 text-center">
              <Badge variant="secondary" className="mb-4">
                Einfach & schnell
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                So funktioniert's
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                In drei Schritten zur Live-Übersetzung — keine Installation,
                kein Setup, einfach loslegen.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg font-bold">1</span>
                </div>
                <h3 className="mb-2 font-semibold">Session erstellen</h3>
                <p className="text-sm text-muted-foreground">
                  Wähle Quell- und Zielsprachen und starte eine neue
                  Übersetzungs-Session.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg font-bold">2</span>
                </div>
                <h3 className="mb-2 font-semibold">QR-Code teilen</h3>
                <p className="text-sm text-muted-foreground">
                  Zeige den QR-Code auf dem Bildschirm — Zuhörer scannen ihn mit
                  dem Smartphone.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
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
        </section>

        {/* Session erstellen */}
        <section id="session" className="border-b">
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
            <div className="mx-auto max-w-md">
              <div className="mb-4 text-center">
                <Badge variant="secondary" className="mb-4">
                  Loslegen
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Neue Session erstellen
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                  Konfiguriere Sprachen und starte die Live-Übersetzung
                </p>
              </div>
              <Card className="mt-8">
                <CardContent>
                  <CreateSessionForm onSubmit={handleSubmit} />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-b bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
            <div className="mb-4 text-center">
              <Badge variant="secondary" className="mb-4">
                Pricing
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Das passende Modell für jedes Event
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Von kleinen Meetings bis zu grossen Konferenzen — transparent
                und fair.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {PRICING_PLANS.map((plan) => (
                <Card
                  key={plan.name}
                  className={
                    plan.highlighted
                      ? "relative border-primary shadow-md"
                      : ""
                  }
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Empfohlen</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <div className="mb-6">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <ul className="mb-8 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.highlighted ? "default" : "outline"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Referenzen */}
        <section id="referenzen" className="border-b">
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
            <div className="mb-12 text-center">
              <Badge variant="secondary" className="mb-4">
                Referenzen
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Vertraut von führenden Organisationen
              </h2>
            </div>
            {/* Marquee */}
            <div className="relative overflow-hidden">
              {/* Fade edges */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent" />

              <div className="flex animate-marquee gap-12">
                {[...REFERENCES, ...REFERENCES].map((ref, i) => (
                  <div
                    key={`${ref.name}-${i}`}
                    className="flex h-16 shrink-0 items-center justify-center px-4"
                  >
                    <span className="whitespace-nowrap text-xl font-semibold text-muted-foreground/60 transition-colors hover:text-muted-foreground">
                      {ref.logo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
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
