import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import {
  Languages,
  Plus,
  Play,
  Clock,
  LogOut,
  Share2,
  Trash2,
  Globe,
  Users,
  Loader2,
  AlertCircle,
  X,
  ArrowRight,
  Check,
  Settings2,
  Radio,
  UserCircle,
  Lock,
} from "lucide-react";
import { nanoid } from "nanoid";
import { CreateSessionForm } from "~/components/CreateSessionForm.tsx";
import { ThemeToggle } from "~/components/ThemeToggle.tsx";
import { Button } from "~/components/ui/button.tsx";
import { useAuth } from "~/hooks/useAuth.ts";
import { supabase } from "~/lib/supabase.ts";
import { sha256 } from "~/lib/crypto.ts";
import { LANGUAGES } from "~/lib/languages.ts";
import type { SupportedLanguage } from "~/types/session.ts";
import type { EventRow } from "~/types/database.ts";
import { cn } from "~/lib/utils.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (days > 0) return `vor ${days} Tag${days > 1 ? "en" : ""}`;
  if (hours > 0) return `vor ${hours} Std.`;
  if (minutes > 0) return `vor ${minutes} Min.`;
  return "gerade eben";
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load events ──────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoadingEvents(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError("Events konnten nicht geladen werden.");
    } else {
      setEvents(data ?? []);
    }
    setLoadingEvents(false);
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Create event ─────────────────────────────────────────────────────────
  const handleCreateSession = async (data: {
    title: string;
    sourceLang: SupportedLanguage;
    targetLanguages: SupportedLanguage[];
    speakerName: string;
    password: string;
  }) => {
    if (!user) return;
    const id = nanoid(8);
    const title = data.title.trim() || "Neue Session";
    const passwordHash = data.password ? await sha256(data.password) : null;

    const { error } = await supabase.from("events").insert({
      id,
      user_id: user.id,
      title,
      source_lang: data.sourceLang,
      target_languages: data.targetLanguages,
      speaker_name: data.speakerName.trim() || null,
      password_hash: passwordHash,
      status: "active",
    });

    if (error) {
      console.error("Event insert error:", error.message);
    }

    setShowForm(false);
    const params = new URLSearchParams({
      title,
      source: data.sourceLang,
      targets: data.targetLanguages.join(","),
    });
    navigate(`/speaker/${id}?${params}`);
  };

  // ── Delete event ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("user_id", user!.id);

    if (!error) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
    setDeletingId(null);
  };

  // ── Copy link ────────────────────────────────────────────────────────────
  const handleCopyLink = async (event: EventRow) => {
    const base = import.meta.env.VITE_APP_URL || window.location.origin;
    const params = new URLSearchParams({
      title: event.title,
      targets: event.target_languages.join(","),
    });
    await navigator.clipboard.writeText(
      `${base}/session/${event.id}?${params}`
    );
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500">
              <Languages className="size-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">LinguAI</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-48 truncate text-sm text-muted-foreground sm:block">
              {user?.email}
            </span>
            <ThemeToggle className="text-muted-foreground hover:bg-muted/40 hover:text-foreground" />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              onClick={() => navigate("/dashboard/settings")}
              title="Profilverwaltung"
            >
              <UserCircle className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              onClick={handleSignOut}
              title="Abmelden"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {/* ── Page header ── */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Erstelle und verwalte deine Übersetzungs-Sessions.
            </p>
          </div>
          <Button
            onClick={() => setShowForm((v) => !v)}
            className={cn(
              "gap-2",
              showForm
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "bg-indigo-500 text-white hover:bg-indigo-400"
            )}
          >
            {showForm ? (
              <>
                <X className="size-4" />
                Abbrechen
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Neue Session
              </>
            )}
          </Button>
        </div>

        {/* ── Create Session Form ── */}
        {showForm && (
          <div className="mb-8 animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/5">
            {/* Form header */}
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="font-semibold text-foreground">Neue Session erstellen</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Konfiguriere Sprachen und starte die Live-Übersetzung.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="ml-4 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="px-6 py-6">
              <CreateSessionForm onSubmit={handleCreateSession} />
            </div>
          </div>
        )}

        {/* ── Events list ── */}
        {loadingEvents ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {loadError}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={fetchEvents}
            >
              Erneut versuchen
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-indigo-500/10">
              <Radio className="size-8 text-indigo-400" />
            </div>
            <h2 className="font-semibold text-foreground">Noch keine Sessions</h2>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              Erstelle deine erste Übersetzungs-Session und teile den QR-Code
              mit deinem Publikum.
            </p>
            <Button
              className="mt-6 gap-2 bg-indigo-500 text-white hover:bg-indigo-400"
              onClick={() => setShowForm(true)}
            >
              <Plus className="size-4" />
              Erste Session erstellen
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Letzte Sessions
              </h2>
              <span className="text-xs text-muted-foreground">
                {events.length} Session{events.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const sourceLang = event.source_lang as SupportedLanguage;
                const targetLangs = event.target_languages as SupportedLanguage[];
                const speakerParams = new URLSearchParams({
                  title: event.title,
                  source: event.source_lang,
                  targets: event.target_languages.join(","),
                });

                return (
                  <div
                    key={event.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-md"
                  >
                    {/* Accent top border */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500/40 via-indigo-500 to-indigo-500/40" />

                    <div className="flex flex-1 flex-col p-5 pt-6">
                      {/* Title + delete */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <h3 className="font-semibold leading-tight text-foreground truncate">
                            {event.title}
                          </h3>
                          {event.password_hash && (
                            <span title="Passwortgeschützt">
                              <Lock className="size-3 shrink-0 text-muted-foreground/60" />
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(event.id)}
                          disabled={deletingId === event.id}
                          className="shrink-0 text-muted-foreground/40 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                          title="Session löschen"
                        >
                          {deletingId === event.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </button>
                      </div>

                      {/* Time */}
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {timeAgo(event.created_at)}
                      </div>

                      {/* Language flow */}
                      <div className="mt-4 flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                          <Globe className="size-3" />
                          {LANGUAGES[sourceLang]?.flag}{" "}
                          {LANGUAGES[sourceLang]?.label}
                        </span>
                        <ArrowRight className="size-3 shrink-0 text-muted-foreground/40" />
                        {targetLangs.map((lang) => (
                          <span
                            key={lang}
                            className="rounded-md border border-border bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {LANGUAGES[lang]?.flag} {LANGUAGES[lang]?.label}
                          </span>
                        ))}
                      </div>

                      {event.speaker_name && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="size-3" />
                          {event.speaker_name}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-auto flex gap-2 pt-4">
                        {/* Open session — view transcript + resume */}
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 bg-indigo-500 text-white hover:bg-indigo-400"
                          onClick={() =>
                            navigate(`/speaker/${event.id}?${speakerParams}`)
                          }
                        >
                          <Play className="size-3.5" />
                          Öffnen
                        </Button>

                        {/* Session settings / prep */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/speaker/${event.id}?prep=1&${speakerParams}`
                            )
                          }
                          title="Einstellungen, Unterlagen & Glossar"
                        >
                          <Settings2 className="size-3.5" />
                        </Button>

                        {/* Copy listener link */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(event)}
                          title="Zuhörer-Link kopieren"
                        >
                          {copiedId === event.id ? (
                            <Check className="size-3.5 text-indigo-400" />
                          ) : (
                            <Share2 className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Languages className="size-3.5" />
            <span>LinguAI &copy; {new Date().getFullYear()}</span>
          </div>
          <Link to="/" className="transition-colors hover:text-foreground">
            Zurück zur Startseite
          </Link>
        </div>
      </footer>
    </div>
  );
}
