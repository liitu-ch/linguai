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
  Building2,
  GraduationCap,
  Users,
  Mic,
  Subtitles,
  ChevronRight,
  Play,
  KeyRound,
  Minus,
} from "lucide-react";
import { Badge } from "~/components/ui/badge.tsx";
import { Button } from "~/components/ui/button.tsx";
import { ThemeToggle } from "~/components/ThemeToggle.tsx";
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
  { label: "Anbieter", href: "#providers" },
];

const FEATURES = [
  {
    icon: Globe,
    title: "Live-Übersetzung",
    description:
      "KI übersetzt in Echtzeit in über 39 Sprachen — Latenz unter 2 Sekunden. Kein Dolmetscher, kein Equipment.",
    accent: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: KeyRound,
    title: "Bring your own API Key",
    description:
      "LinguAI ist kostenlos. Du nutzt deine eigenen API-Keys von OpenAI oder ElevenLabs — volle Kontrolle über Kosten und Nutzung.",
    accent: "bg-rose-500/10 text-rose-400",
  },
  {
    icon: Subtitles,
    title: "Visuelle Transkription",
    description:
      "Wort für Wort erscheint die Übersetzung auf dem Smartphone — visuell hervorgehoben. Klar, gross, lesbar.",
    accent: "bg-violet-500/10 text-violet-400",
  },
  {
    icon: FileText,
    title: "Session-Planung",
    description:
      "Sessions im Voraus erstellen, QR-Codes generieren und als Link oder Bild teilen — alles bereit, bevor der Event beginnt.",
    accent: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: Headphones,
    title: "Eigenes Smartphone & Kopfhörer",
    description:
      "Jeder nutzt sein eigenes Gerät. Keine App, kein Download, keine Empfänger-Hardware — einfach QR-Code scannen.",
    accent: "bg-amber-500/10 text-amber-400",
  },
];

const USE_CASES = [
  {
    icon: Building2,
    title: "Empfang internationaler Mitarbeitender",
    description:
      "Ein Team aus dem Standort Singapur besucht die Zentrale in Zürich. Beim Town Hall scannen alle den QR-Code, wählen ihre Sprache — und folgen der Begrüssung live auf ihrem Smartphone. Mit den eigenen Kopfhörern, ohne Vorbereitung.",
  },
  {
    icon: GraduationCap,
    title: "Interne Schulungen & Workshops",
    description:
      "Eine Compliance-Schulung für 120 Mitarbeitende in 5 Ländern. Statt teure Dolmetscher für jede Sprache: ein QR-Code, und jeder folgt dem Training in seiner Muttersprache. Bequem am eigenen Gerät — keine App-Installation nötig.",
  },
  {
    icon: Users,
    title: "Konferenzen & Vorträge",
    description:
      "Ein Keynote-Speaker hält seinen Vortrag auf Deutsch. 200 internationale Gäste scannen den QR-Code auf dem Beamer und folgen live in Englisch, Französisch oder Japanisch. Kein Equipment, keine Kabinen — nur Smartphones und Kopfhörer.",
  },
];

const PROVIDER_FEATURES = [
  {
    feature: "Transkription (STT)",
    description: "Sprache zu Text in Echtzeit",
    openai: "gpt-4o-transcribe",
    elevenlabs: null,
    browser: null,
  },
  {
    feature: "Übersetzung",
    description: "Text in 39+ Sprachen übersetzen",
    openai: "gpt-4o",
    elevenlabs: null,
    browser: null,
  },
  {
    feature: "Text-to-Speech",
    description: "Übersetzung vorlesen lassen",
    openai: "gpt-4o-mini-tts",
    elevenlabs: "eleven_multilingual_v2",
    browser: "Web Speech API",
  },
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
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
              <Languages className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">LinguAI</span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
            <div className="mx-2 h-5 w-px bg-border" />
            <ThemeToggle className="text-muted-foreground hover:bg-muted/40 hover:text-foreground" />
            {user ? (
              <Button size="sm" onClick={() => navigate("/dashboard")}>
                Dashboard <ChevronRight className="ml-1 size-3" />
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/40"
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

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle className="text-muted-foreground hover:bg-muted/40 hover:text-foreground" />
            <button
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                >
                  {link.label}
                </button>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
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
      <section className="relative min-h-svh overflow-hidden bg-background pt-14">
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
            Kostenlos · Bring your own API Key · 39+ Sprachen
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl" style={{ animationDelay: "0.1s", opacity: 0 }}>
            Simultandolmetschen
            <span className="block bg-gradient-to-r from-indigo-400 via-blue-300 to-violet-400 bg-clip-text text-transparent">
              für jeden Event
            </span>
          </h1>

          {/* Subhead */}
          <p className="animate-fade-up mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg" style={{ animationDelay: "0.2s", opacity: 0 }}>
            Der Speaker spricht seine Sprache — Zuhörer folgen live in ihrer.
            39+ Sprachen, Echtzeit. Kein Dolmetscher, kein Equipment. Nur ein QR-Code.
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
              className="gap-2 border-border bg-muted/40 text-foreground hover:bg-muted/60"
              onClick={() => scrollTo("#demo")}
            >
              <Play className="size-4" />
              Live-Demo ansehen
            </Button>
          </div>

          {/* Stats */}
          <div className="animate-fade-up mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground" style={{ animationDelay: "0.4s", opacity: 0 }}>
            {[
              { value: "39+", label: "Sprachen" },
              { value: "<2s", label: "Latenz" },
              { value: "0 CHF", label: "Lizenzkosten" },
              { value: "0", label: "App-Downloads nötig" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-foreground">{stat.value}</span>
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


      <main className="flex-1">
        {/* ── Features ──────────────────────────────────────────────── */}
        <section id="features" className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <Badge variant="secondary" className="mb-4">Alles in einem Tool</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Alles was du brauchst — in einer Session
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                LinguAI macht Sprachbarrieren überflüssig — kostenlos, mit deinem eigenen API Key.
                Kein Dolmetscher, kein Equipment, keine versteckten Kosten.
              </p>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <section id="demo" className="border-b bg-muted/30 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 dark:text-indigo-300">
                Live Demo
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Sieh es in Aktion
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
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
              <Badge variant="secondary" className="mb-4">So wird LinguAI eingesetzt</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Echte Szenarien aus dem Arbeitsalltag
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {USE_CASES.map((uc) => (
                <div key={uc.title} className="flex flex-col gap-4 rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <uc.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {uc.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Providers / BYOK ─────────────────────────────────────── */}
        <section id="providers" className="border-b bg-muted/30 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 dark:text-indigo-300">
                <KeyRound className="mr-1.5 size-3" />
                Bring your own API Key
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Kostenlos nutzbar — mit deinem eigenen API Key
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                LinguAI ist komplett kostenlos. Du bringst deinen eigenen API-Schlüssel mit und zahlst nur die tatsächliche Nutzung direkt beim Anbieter — transparent, ohne Aufschlag.
              </p>
            </div>

            {/* Provider cards */}
            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="border-emerald-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
                      <span className="text-lg font-bold text-emerald-500">AI</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">OpenAI</CardTitle>
                      <CardDescription>Erforderlich für Transkription & Übersetzung</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {["Echtzeit-Transkription (gpt-4o-transcribe)", "Übersetzung in 39+ Sprachen (gpt-4o)", "Premium KI-Stimmen (gpt-4o-mini-tts)"].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-violet-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
                      <span className="text-lg font-bold text-violet-500">11</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">ElevenLabs</CardTitle>
                      <CardDescription>Optional — für natürlichere Stimmen</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {["Ultra-realistische mehrsprachige Stimmen", "eleven_multilingual_v2 Modell", "Alternative zu OpenAI TTS"].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-violet-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Feature comparison table */}
            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-6 py-4 text-left font-semibold">Feature</th>
                      <th className="px-6 py-4 text-center font-semibold">
                        <span className="text-emerald-500">OpenAI</span>
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        <span className="text-violet-500">ElevenLabs</span>
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        <span className="text-muted-foreground">Browser</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROVIDER_FEATURES.map((row) => (
                      <tr key={row.feature} className="border-b last:border-0">
                        <td className="px-6 py-4">
                          <div className="font-medium">{row.feature}</div>
                          <div className="text-xs text-muted-foreground">{row.description}</div>
                        </td>
                        {([row.openai, row.elevenlabs, row.browser] as const).map((value, i) => (
                          <td key={i} className="px-6 py-4 text-center">
                            {value ? (
                              <div className="flex flex-col items-center gap-1">
                                <Check className={`size-5 ${i === 0 ? "text-emerald-500" : i === 1 ? "text-violet-500" : "text-muted-foreground"}`} />
                                <span className="text-xs text-muted-foreground">{value}</span>
                              </div>
                            ) : (
                              <Minus className="mx-auto size-5 text-muted-foreground/30" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Browser Text-to-Speech ist kostenlos und funktioniert ohne API Key.
              Zum Vergleich: Ein menschlicher Simultandolmetscher kostet{" "}
              <strong>CHF 400–800 / Stunde</strong> — plus Reise, Equipment und Kabinentechnik.
            </p>
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-background py-20 md:py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/15 blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Bereit für dein erstes Event?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Bring deinen eigenen API Key mit und leg sofort los. Kostenlos, ohne Abo.
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
            <button onClick={() => scrollTo("#providers")} className="hover:text-foreground transition-colors">Anbieter</button>
            <button onClick={() => scrollTo("#demo")} className="hover:text-foreground transition-colors">Demo</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
