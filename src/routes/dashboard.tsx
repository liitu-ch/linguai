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
import { CreateSessionForm, type SessionFormData } from "~/components/CreateSessionForm.tsx";
import { ThemeToggle } from "~/components/ThemeToggle.tsx";
import { Button } from "~/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog.tsx";
import { useAuth } from "~/hooks/useAuth.ts";
import { useApiKeys } from "~/hooks/useApiKeys.ts";
import type { TTSMode } from "~/hooks/useTTS.ts";
import { supabase } from "~/lib/supabase.ts";
import { sha256 } from "~/lib/crypto.ts";
import { LANGUAGES } from "~/lib/languages.ts";
import type { SupportedLanguage } from "~/types/session.ts";
import type { EventRow } from "~/types/database.ts";
import { cn } from "~/lib/utils.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hasValidKey } = useApiKeys();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);

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
  const handleCreateSession = async (data: SessionFormData) => {
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
      default_tts_mode: data.allowedTtsModes.includes("openai") ? "openai" : data.allowedTtsModes.includes("browser") ? "browser" : "off",
      allowed_tts_modes: data.allowedTtsModes,
      tts_provider: data.ttsProvider,
      tts_speed: data.ttsSpeed,
      scheduled_at: data.scheduledAt || null,
      status: "active",
    });

    if (error) {
      console.error("Event insert error:", error.message);
    }

    setShowForm(false);
    fetchEvents();
  };

  // ── Update event ────────────────────────────────────────────────────────
  const handleUpdateSession = async (data: SessionFormData) => {
    if (!user || !editingEvent) return;
    const title = data.title.trim() || "Neue Session";

    const updatePayload: Record<string, unknown> = {
      title,
      source_lang: data.sourceLang,
      target_languages: data.targetLanguages,
      speaker_name: data.speakerName.trim() || null,
      default_tts_mode: data.allowedTtsModes.includes("openai") ? "openai" : data.allowedTtsModes.includes("browser") ? "browser" : "off",
      allowed_tts_modes: data.allowedTtsModes,
      tts_provider: data.ttsProvider,
      tts_speed: data.ttsSpeed,
      scheduled_at: data.scheduledAt || null,
    };

    // Only update password_hash if the user explicitly changed the password
    if (data.passwordChanged) {
      updatePayload.password_hash = data.password ? await sha256(data.password) : null;
    }

    const { error } = await supabase
      .from("events")
      .update(updatePayload)
      .eq("id", editingEvent.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Event update error:", error.message);
    }

    setEditingEvent(null);
    fetchEvents();
  };

  // ── Delete event ─────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
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
      source: event.source_lang,
    });
    if (event.speaker_name) {
      params.set("speaker", event.speaker_name);
    }
    const allowedModes = event.allowed_tts_modes ?? (event.default_tts_mode ? [event.default_tts_mode] : ["off"]);
    params.set("allowedTts", allowedModes.join(","));
    if (event.tts_provider && event.tts_provider !== "openai") {
      params.set("ttsProvider", event.tts_provider);
    }
    if (event.tts_speed != null && event.tts_speed !== 1.1) {
      params.set("ttsSpeed", String(event.tts_speed));
    }
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
                  Konfiguriere Sprachen und speichere die Session.
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
              <CreateSessionForm onSubmit={handleCreateSession} hasValidKey={hasValidKey} />
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
            {(() => {
              const today = new Date().toISOString().slice(0, 10);
              const upcoming = events.filter(
                (e) => e.scheduled_at && e.scheduled_at >= today
              );
              const past = events.filter(
                (e) => !e.scheduled_at || e.scheduled_at < today
              );
              const sections = [
                { label: "Kommende Sessions", items: upcoming },
                { label: "Vergangene Sessions", items: past },
              ].filter((s) => s.items.length > 0);

              return sections.map((section) => (
                <div key={section.label} className="mb-8 last:mb-0">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {section.label}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {section.items.length} Session{section.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((event) => {
                const sourceLang = event.source_lang as SupportedLanguage;
                const targetLangs = event.target_languages as SupportedLanguage[];
                const speakerParams = new URLSearchParams({
                  title: event.title,
                  source: event.source_lang,
                  targets: event.target_languages.join(","),
                });
                if (event.speaker_name) {
                  speakerParams.set("speaker", event.speaker_name);
                }
                const cardAllowedModes = event.allowed_tts_modes ?? (event.default_tts_mode ? [event.default_tts_mode] : ["off"]);
                speakerParams.set("allowedTts", cardAllowedModes.join(","));
                if (event.tts_provider && event.tts_provider !== "openai") {
                  speakerParams.set("ttsProvider", event.tts_provider);
                }
                if (event.tts_speed != null && event.tts_speed !== 1.1) {
                  speakerParams.set("ttsSpeed", String(event.tts_speed));
                }

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
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold leading-tight text-foreground truncate">
                              {event.title}
                            </h3>
                            {event.password_hash && (
                              <span title="Passwortgeschützt">
                                <Lock className="size-3 shrink-0 text-muted-foreground/60" />
                              </span>
                            )}
                          </div>
                          {event.speaker_name && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                              <UserCircle className="size-3 shrink-0" />
                              {event.speaker_name}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setDeleteConfirmId(event.id)}
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

                      {/* Date */}
                      {event.scheduled_at && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {formatDate(event.scheduled_at)}
                        </div>
                      )}

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

                        {/* Session settings */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingEvent(event)}
                          title="Einstellungen"
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
                </div>
              ));
            })()}
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

      {/* ── Edit Session Dialog ── */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open) setEditingEvent(null); }}>
        <DialogContent className="max-h-[90svh] overflow-y-auto max-w-[calc(100%-2rem)] sm:max-w-2xl rounded-2xl p-0">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>Session bearbeiten</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Passe Titel, Speaker, Sprachen und Voreinstellungen an.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6">
            {editingEvent && (
              <CreateSessionForm
                key={editingEvent.id}
                onSubmit={handleUpdateSession}
                submitLabel="Änderungen speichern"
                hasValidKey={hasValidKey}
                initialData={{
                  title: editingEvent.title,
                  speakerName: editingEvent.speaker_name ?? "",
                  scheduledAt: editingEvent.scheduled_at ?? "",
                  sourceLang: editingEvent.source_lang as SupportedLanguage,
                  targetLanguages: editingEvent.target_languages as SupportedLanguage[],
                  allowedTtsModes: editingEvent.allowed_tts_modes
                    ? (editingEvent.allowed_tts_modes as TTSMode[])
                    : editingEvent.default_tts_mode
                      ? [editingEvent.default_tts_mode as TTSMode]
                      : ["off", "browser"],
                  ttsProvider: (editingEvent.tts_provider as "openai" | "elevenlabs" | "browser") ?? "openai",
                  ttsSpeed: editingEvent.tts_speed ?? 1.1,
                  hasPassword: !!editingEvent.password_hash,
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>Session löschen?</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}>
              Abbrechen
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteConfirm}>
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
