import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Languages, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import { Label } from "~/components/ui/label.tsx";
import { useAuth } from "~/hooks/useAuth.ts";

type Mode = "signin" | "signup";

export function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
        navigate("/dashboard", { replace: true });
      } else {
        await signUp(email, password);
        setSuccess(
          "Konto erstellt! Bitte überprüfe deine E-Mail zur Bestätigung."
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      if (msg.includes("Invalid login credentials")) {
        setError("E-Mail oder Passwort falsch.");
      } else if (msg.includes("User already registered")) {
        setError("Diese E-Mail ist bereits registriert. Bitte anmelden.");
      } else if (msg.includes("Password should be at least")) {
        setError("Passwort muss mindestens 6 Zeichen lang sein.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="flex min-h-svh flex-col bg-slate-950">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 size-[500px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 size-80 rounded-full bg-violet-600/15 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
              <Languages className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">LinguAI</span>
          </Link>
        </div>
      </header>

      {/* Auth Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Icon + Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-500/30">
              <Languages className="size-7 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {mode === "signin" ? "Willkommen zurück" : "Konto erstellen"}
            </h1>
            <p className="mt-1.5 text-sm text-white/50">
              {mode === "signin"
                ? "Melde dich an, um deine Sessions zu verwalten."
                : "Erstelle ein kostenloses Konto und starte deine erste Session."}
            </p>
          </div>

          {/* Form */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm text-white/70">
                  E-Mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="du@beispiel.ch"
                    className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm text-white/70">
                  Passwort
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Mindestens 6 Zeichen" : "••••••••"}
                    className="border-white/10 bg-white/5 pl-9 pr-9 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    aria-label="Passwort anzeigen"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Anmelden" : "Konto erstellen"}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Toggle mode */}
          <p className="mt-5 text-center text-sm text-white/40">
            {mode === "signin" ? "Noch kein Konto?" : "Bereits ein Konto?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setSuccess(null);
              }}
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {mode === "signin" ? "Kostenlos registrieren" : "Anmelden"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
