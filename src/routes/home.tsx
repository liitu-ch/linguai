import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router";
import {
  Languages,
  Globe,
  Zap,
  Headphones,
  ArrowRight,
  Menu,
  X,
  Check,
  FileText,
  Sparkles,
  Building2,
  GraduationCap,
  Users,
  Heart,
  Mic,
  Subtitles,
  ChevronRight,
  Play,
} from "lucide-react";
import { Badge } from "~/components/ui/badge.tsx";
import { Button } from "~/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card.tsx";
import { useAuth } from "~/hooks/useAuth.ts";

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_PHRASES = [
  {
    en: "Welcome to our international summit on AI and the future of work.",
    es: "Bienvenidos a nuestra cumbre internacional sobre IA y el futuro del trabajo.",
    pt: "Bem-vindos à nossa cúpula internacional sobre IA e o futuro do trabalho.",
    ms: "Selamat datang ke sidang kemuncak antarabangsa kami tentang AI.",
  },
  {
    en: "Our research shows a 40 percent increase in productivity through multilingual collaboration.",
    es: "Nuestra investigación muestra un aumento del 40% en productividad mediante la colaboración multilingüe.",
    pt: "Nossa pesquisa mostra aumento de 40% na produtividade através da colaboração multilíngue.",
    ms: "Penyelidikan kami menunjukkan peningkatan 40% dalam produktiviti melalui kerjasama berbilang bahasa.",
  },
  {
    en: "The next speaker will share breakthrough results from our global pilot program.",
    es: "El próximo orador compartirá los resultados revolucionarios de nuestro programa piloto global.",
    pt: "O próximo palestrante compartilhará os resultados revolucionários do nosso programa piloto global.",
    ms: "Penceramah seterusnya akan berkongsi hasil terobosan dari program perintis global kami.",
  },
];

const TYPING_SPEED = 28; // ms per character
const PHRASE_HOLD_MS = 3500;
const TRANSLATION_DELAY_MS = 600;

// ─── Demo Widget ──────────────────────────────────────────────────────────────

function DemoWidget() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showTrans, setShowTrans] = useState(false);
  const [transVisible, setTransVisible] = useState([false, false, false]);
  const phaseRef = useRef<"typing" | "hold" | "clearing">("typing");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phrase = DEMO_PHRASES[phraseIdx];

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    clear();
    setCharCount(0);
    setShowTrans(false);
    setTransVisible([false, false, false]);
    phaseRef.current = "typing";

    // Typing phase
    intervalRef.current = setInterval(() => {
      setCharCount((prev) => {
        const next = prev + 3;
        if (next >= phrase.en.length) {
          clearInterval(intervalRef.current!);
          // Show translations staggered
          timerRef.current = setTimeout(() => {
            setShowTrans(true);
            setTransVisible([false, false, false]);
            [0, 1, 2].forEach((i) => {
              timerRef.current = setTimeout(() => {
                setTransVisible((v) => {
                  const n = [...v];
                  n[i] = true;
                  return n;
                });
              }, i * 300);
            });
            // Hold then advance
            timerRef.current = setTimeout(() => {
              setPhraseIdx((p) => (p + 1) % DEMO_PHRASES.length);
            }, PHRASE_HOLD_MS + TRANSLATION_DELAY_MS + 3 * 300);
          }, TRANSLATION_DELAY_MS);
          return phrase.en.length;
        }
        return next;
      });
    }, TYPING_SPEED);

    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phraseIdx]);

  const displayedText = phrase.en.slice(0, charCount);
  const isTyping = charCount < phrase.en.length;

  const translations = [
    { flag: "🇪🇸", lang: "Español", text: phrase.es },
    { flag: "🇵🇹", lang: "Português", text: phrase.pt },
    { flag: "🇲🇾", lang: "Bahasa Melayu", text: phrase.ms },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Demo card */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-indigo-500/10">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Live</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Languages className="size-3.5 text-indigo-400" />
            <span className="text-xs text-white/40">Internationale KI-Konferenz</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
            <Users className="size-3 text-white/40" />
            <span className="text-xs text-white/40">87</span>
          </div>
        </div>

        {/* Speaker section */}
        <div className="px-4 py-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-indigo-500/20">
              <Mic className="size-3 text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">English · Speaker</span>
          </div>
          <p className="min-h-[3rem] font-mono text-sm leading-relaxed text-white/90">
            {displayedText}
            {isTyping && (
              <span className="ml-0.5 inline-block w-0.5 h-4 bg-indigo-400 animate-cursor" />
            )}
          </p>
        </div>

        {/* Translations section */}
        <div className="border-t border-white/10">
          {translations.map((t, i) => (
            <div
              key={t.lang}
              className={`flex items-start gap-3 border-b border-white/5 px-4 py-3 last:border-0 transition-all duration-500 ${
                showTrans && transVisible[i]
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-1"
              }`}
            >
              <span className="shrink-0 text-lg leading-none mt-0.5">{t.flag}</span>
              <div className="min-w-0">
                <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-white/30">
                  {t.lang}
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{t.text}</p>
              </div>
            </div>
          ))}
          {!showTrans && (
            <div className="flex items-center gap-2 px-4 py-4">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 rounded-full bg-white/20 animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <span className="text-xs text-white/30">Übersetzung läuft…</span>
            </div>
          )}
        </div>
      </div>

      {/* Phrase progress dots */}
      <div className="mt-4 flex justify-center gap-2">
        {DEMO_PHRASES.map((_, i) => (
          <button
            key={i}
            onClick={() => setPhraseIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === phraseIdx ? "w-6 bg-indigo-400" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Preise", href: "#pricing" },
];

const FEATURES = [
  {
    icon: Globe,
    title: "Live-Übersetzung",
    description:
      "KI übersetzt in Echtzeit in bis zu 9 Sprachen — Latenz unter 2 Sekunden. Kein Dolmetscher, kein Equipment.",
    accent: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: Subtitles,
    title: "Live-Captions",
    description:
      "Zuhörer sehen die Übersetzung sofort auf ihrem Smartphone — klar, gross, lesbar. Ohne App-Download.",
    accent: "bg-violet-500/10 text-violet-400",
  },
  {
    icon: FileText,
    title: "Vollständiges Transkript",
    description:
      "Jede Session wird automatisch transkribiert und nach dem Event als TXT exportiert.",
    accent: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: Sparkles,
    title: "KI-Zusammenfassung",
    description:
      "Nach der Session erstellt die KI automatisch eine strukturierte Zusammenfassung der wichtigsten Punkte.",
    accent: "bg-amber-500/10 text-amber-400",
  },
];

const USE_CASES = [
  {
    icon: Building2,
    title: "Konferenzen & Kongresse",
    description:
      "Internationales Publikum folgt dem Vortrag — ohne Übersetzungsequipment oder gebuchte Dolmetscher.",
  },
  {
    icon: Users,
    title: "Unternehmens-Meetings",
    description:
      "Globale Teams sprechen ihre Muttersprache. Alle verstehen alles, in Echtzeit.",
  },
  {
    icon: GraduationCap,
    title: "Hochschulen & Bildung",
    description:
      "Gastvorträge und Seminare für internationales Publikum zugänglich machen.",
  },
  {
    icon: Heart,
    title: "NGOs & Behörden",
    description:
      "Inklusive Kommunikation — Sprachbarrieren abbauen, ohne hohe Dolmetscherkosten.",
  },
];

const PRICING_PLANS = [
  {
    name: "Starter",
    price: "Kostenlos",
    period: "",
    description: "Ideal zum Ausprobieren",
    features: [
      "Bis zu 10 Zuhörer",
      "2 Zielsprachen",
      "30 Min. pro Session",
      "Browser Text-to-Speech",
      "Live-Transkript",
    ],
    cta: "Kostenlos starten",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Professional",
    price: "CHF 19",
    period: "/ Stunde",
    description: "Für Konferenzen und Firmen",
    features: [
      "Bis zu 500 Zuhörer",
      "Alle 9 Sprachen",
      "Unbegrenzte Dauer",
      "Premium KI-Stimmen",
      "Transkript-Export",
      "KI-Zusammenfassung",
      "Custom Glossar",
    ],
    cta: "Jetzt starten",
    ctaVariant: "default" as const,
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Auf Anfrage",
    period: "",
    description: "Für grosse Events & Organisationen",
    features: [
      "Unbegrenzte Zuhörer",
      "Dedizierte Infrastruktur",
      "SLA & 24/7 Support",
      "SSO & Compliance",
      "On-Premise Option",
    ],
    cta: "Kontakt aufnehmen",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
];

const REFERENCES = [
  "ETH Zürich", "Swiss Re", "Nestlé", "ABB", "UBS",
  "Novartis", "Roche", "Universität Bern",
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCTA = () => {
    navigate(user ? "/dashboard" : "/login");
  };

  const scrollTo = (href: string) => {
    setMobileMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-svh flex-col">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
              <Languages className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">LinguAI</span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="rounded-md px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </button>
            ))}
            <div className="mx-2 h-5 w-px bg-white/10" />
            {user ? (
              <Button size="sm" onClick={() => navigate("/dashboard")}>
                Dashboard <ChevronRight className="ml-1 size-3" />
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/5"
                  onClick={() => navigate("/login")}
                >
                  Anmelden
                </Button>
                <Button size="sm" onClick={handleCTA}>
                  Kostenlos starten
                </Button>
              </>
            )}
          </nav>

          <button
            className="flex size-9 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/5 hover:text-white md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menü"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/5 bg-slate-950 px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="rounded-md px-3 py-2 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </button>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="border-white/10 text-white hover:bg-white/5">
                  Anmelden
                </Button>
                <Button size="sm" onClick={handleCTA}>
                  Kostenlos starten
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-svh overflow-hidden bg-slate-950 pt-14">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px] animate-glow" />
          <div className="absolute top-1/3 -left-20 size-80 rounded-full bg-violet-600/15 blur-[100px] animate-glow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute bottom-0 right-0 size-96 rounded-full bg-blue-600/10 blur-[100px] animate-glow" style={{ animationDelay: "3s" }} />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-24 text-center md:pt-32">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
            <Zap className="size-3.5" />
            KI-Simultandolmetschen · Ab CHF 19/h · Kein Equipment
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl" style={{ animationDelay: "0.1s", opacity: 0 }}>
            Simultandolmetschen
            <span className="block bg-gradient-to-r from-indigo-400 via-blue-300 to-violet-400 bg-clip-text text-transparent">
              für jeden Event
            </span>
          </h1>

          {/* Subhead */}
          <p className="animate-fade-up mx-auto mt-6 max-w-xl text-base text-white/60 md:text-lg" style={{ animationDelay: "0.2s", opacity: 0 }}>
            Sprecher reden auf Englisch — 87 Zuhörer folgen auf Spanisch, Portugiesisch oder
            Malaiisch. In Echtzeit. Ohne Dolmetscher. Ohne Equipment. Einfach der QR-Code.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.3s", opacity: 0 }}>
            <Button
              size="lg"
              className="gap-2 bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25"
              onClick={handleCTA}
            >
              Kostenlos starten
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => scrollTo("#demo")}
            >
              <Play className="size-4" />
              Live-Demo ansehen
            </Button>
          </div>

          {/* Stats */}
          <div className="animate-fade-up mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/40" style={{ animationDelay: "0.4s", opacity: 0 }}>
            {[
              { value: "9", label: "Sprachen" },
              { value: "<2s", label: "Latenz" },
              { value: "500+", label: "Zuhörer/Session" },
              { value: "4-in-1", label: "Übersetzung, Captions, Transkript, Summary" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-white">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Demo preview in hero */}
          <div className="animate-fade-up mt-16 w-full" style={{ animationDelay: "0.5s", opacity: 0 }}>
            <DemoWidget />
          </div>
        </div>
      </section>

      {/* ── Logo Marquee ──────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20 py-8">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Vertraut von führenden Organisationen
        </p>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent" />
          <div className="flex animate-marquee gap-12">
            {[...REFERENCES, ...REFERENCES].map((ref, i) => (
              <div key={`${ref}-${i}`} className="flex h-10 shrink-0 items-center px-4">
                <span className="whitespace-nowrap text-lg font-semibold text-muted-foreground/50 transition-colors hover:text-muted-foreground">
                  {ref}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* ── Features ──────────────────────────────────────────────── */}
        <section id="features" className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <Badge variant="secondary" className="mb-4">4 Funktionen · 1 Tool</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Alles was du brauchst — in einer Session
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                Traditionelle Simultandolmetscher kosten{" "}
                <strong>CHF 400–800 pro Stunde</strong>. LinguAI liefert mehr
                — für einen Bruchteil davon.
              </p>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex flex-col gap-4 rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className={`flex size-10 items-center justify-center rounded-xl ${feature.accent}`}>
                    <feature.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live Demo ─────────────────────────────────────────────── */}
        <section id="demo" className="border-b bg-slate-950 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                Live Demo
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Sieh es in Aktion
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/50">
                So sieht LinguAI in der Praxis aus. Der Speaker spricht Englisch —
                Zuhörer wählen ihre Sprache und sehen die Übersetzung sofort.
              </p>
            </div>

            <DemoWidget />

            <div className="mt-12 flex justify-center">
              <Button
                size="lg"
                className="gap-2 bg-indigo-600 text-white hover:bg-indigo-500"
                onClick={handleCTA}
              >
                Eigene Session starten
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────── */}
        <section id="how-it-works" className="border-b bg-muted/30 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <Badge variant="secondary" className="mb-4">So funktioniert's</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                In drei Schritten live
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                Keine Installation, kein Setup, kein Equipment — einfach loslegen.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: Languages,
                  title: "Session erstellen",
                  desc: "Quell- und Zielsprachen wählen, Session starten. Dauert unter 30 Sekunden.",
                },
                {
                  step: "02",
                  icon: Globe,
                  title: "QR-Code teilen",
                  desc: "QR-Code auf dem Beamer zeigen — Zuhörer scannen einmal, kein Download.",
                },
                {
                  step: "03",
                  icon: Headphones,
                  title: "Live zuhören",
                  desc: "Jeder wählt seine Sprache und folgt dem Vortrag per Text oder Audio.",
                },
              ].map((item) => (
                <div key={item.step} className="relative rounded-2xl border bg-card p-8">
                  <div className="absolute right-6 top-6 text-4xl font-black text-muted-foreground/10">
                    {item.step}
                  </div>
                  <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="size-6" />
                  </div>
                  <h3 className="mb-2 font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Use Cases ─────────────────────────────────────────────── */}
        <section className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <Badge variant="secondary" className="mb-4">Anwendungsfälle</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Für jeden Event die richtige Lösung
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {USE_CASES.map((uc) => (
                <div key={uc.title} className="flex gap-4 rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <uc.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-semibold">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {uc.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────── */}
        <section id="pricing" className="border-b bg-muted/30 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <Badge variant="secondary" className="mb-4">Preise</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Transparent — ohne versteckte Kosten
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                Kein Jahresabo, keine Mindestlaufzeit. Du zahlst nur für die Zeit, die du brauchst.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PRICING_PLANS.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${plan.highlighted ? "border-primary shadow-lg shadow-primary/10" : ""}`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Beliebteste Wahl</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <div className="mb-6">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      {plan.period && (
                        <span className="ml-1 text-muted-foreground">{plan.period}</span>
                      )}
                    </div>
                    <ul className="mb-8 flex-1 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.ctaVariant}
                      className="w-full"
                      onClick={plan.name !== "Enterprise" ? handleCTA : undefined}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Zum Vergleich: Ein menschlicher Simultandolmetscher kostet{" "}
              <strong>CHF 400–800 / Stunde</strong> — plus Reise, Equipment und Kabinentechnik.
            </p>
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-slate-950 py-20 md:py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Bereit für dein erstes Event?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/50">
              Starte kostenlos, kein Kreditkarte nötig. In 30 Sekunden bist du bereit.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="gap-2 bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25"
                onClick={handleCTA}
              >
                Kostenlos starten
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => scrollTo("#demo")}
              >
                Demo ansehen
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Languages className="size-3.5" />
            </div>
            <span className="font-semibold text-foreground">LinguAI</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground transition-colors">Anmelden</Link>
            <button onClick={() => scrollTo("#pricing")} className="hover:text-foreground transition-colors">Preise</button>
            <button onClick={() => scrollTo("#demo")} className="hover:text-foreground transition-colors">Demo</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
