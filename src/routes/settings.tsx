import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  Languages,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Trash2,
  Loader2,
  Check,
  Eye,
  EyeOff,
  TriangleAlert,
} from "lucide-react";
import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import { Label } from "~/components/ui/label.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card.tsx";
import { useAuth } from "~/hooks/useAuth.ts";
import { supabase } from "~/lib/supabase.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Status = { ok: boolean; msg: string } | null;

function StatusMsg({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      className={`mt-2 flex items-center gap-1.5 text-sm ${
        status.ok ? "text-emerald-600" : "text-destructive"
      }`}
    >
      {status.ok ? (
        <Check className="size-3.5 shrink-0" />
      ) : (
        <TriangleAlert className="size-3.5 shrink-0" />
      )}
      {status.msg}
    </p>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<Status>(null);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<Status>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwStatus, setPwStatus] = useState<Status>(null);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  // Load display_name aus profiles-Tabelle (Single Source of Truth)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name != null) setDisplayName(data.display_name);
      });
  }, [user]);

  // ── Save display name — nur profiles-Tabelle ─────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileStatus(null);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      setProfileStatus({ ok: false, msg: "Profil konnte nicht gespeichert werden." });
    } else {
      setProfileStatus({ ok: true, msg: "Profil gespeichert." });
    }
  };

  // ── Change email ─────────────────────────────────────────────────────────────
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setSavingEmail(true);
    setEmailStatus(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setSavingEmail(false);
    if (error) {
      setEmailStatus({ ok: false, msg: error.message });
    } else {
      // Also update profiles table so it stays in sync
      await supabase
        .from("profiles")
        .update({ email: newEmail.trim() })
        .eq("id", user!.id);
      setEmailStatus({
        ok: true,
        msg: "Bestätigungslink wurde an beide E-Mail-Adressen gesendet.",
      });
      setNewEmail("");
    }
  };

  // ── Change password ──────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);
    if (newPassword.length < 6) {
      setPwStatus({ ok: false, msg: "Passwort muss mindestens 6 Zeichen lang sein." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus({ ok: false, msg: "Passwörter stimmen nicht überein." });
      return;
    }
    setSavingPw(true);
    // Re-authenticate first (sign in with current password)
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });
    if (signInErr) {
      setSavingPw(false);
      setPwStatus({ ok: false, msg: "Aktuelles Passwort ist falsch." });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPw(false);
    if (error) {
      setPwStatus({ ok: false, msg: error.message });
    } else {
      setPwStatus({ ok: true, msg: "Passwort erfolgreich geändert." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // ── Delete account ───────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeletingAccount(true);
    const { error } = await supabase.rpc("delete_user");
    if (error) {
      setDeletingAccount(false);
      alert("Konto konnte nicht gelöscht werden: " + error.message);
      return;
    }
    await signOut();
    navigate("/", { replace: true });
  };

  if (!user) return null;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Languages className="size-3.5" />
            </div>
            <span className="font-bold tracking-tight">LinguAI</span>
          </div>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Profileinstellungen</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profileinstellungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte dein Konto, deine E-Mail und dein Passwort.
          </p>
        </div>

        {/* ── Profil ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4" />
              Profil
            </CardTitle>
            <CardDescription>Dein öffentlicher Anzeigename.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email-display">E-Mail (schreibgeschützt)</Label>
                <Input
                  id="email-display"
                  value={user.email ?? ""}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Anzeigename</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="z.B. Max Muster"
                  maxLength={80}
                />
              </div>
              <StatusMsg status={profileStatus} />
              <Button type="submit" disabled={savingProfile} className="gap-2">
                {savingProfile && <Loader2 className="size-4 animate-spin" />}
                Speichern
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── E-Mail ändern ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4" />
              E-Mail ändern
            </CardTitle>
            <CardDescription>
              Du erhältst Bestätigungs-E-Mails an die alte und neue Adresse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-email">Neue E-Mail-Adresse</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="neue@email.ch"
                  required
                />
              </div>
              <StatusMsg status={emailStatus} />
              <Button type="submit" disabled={savingEmail || !newEmail.trim()} className="gap-2">
                {savingEmail && <Loader2 className="size-4 animate-spin" />}
                E-Mail ändern
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Passwort ändern ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="size-4" />
              Passwort ändern
            </CardTitle>
            <CardDescription>
              Gib zuerst dein aktuelles Passwort zur Bestätigung ein.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-pw">Aktuelles Passwort</Label>
                <div className="relative">
                  <Input
                    id="current-pw"
                    type={showPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Passwort anzeigen"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pw">Neues Passwort</Label>
                <Input
                  id="new-pw"
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pw">Passwort bestätigen</Label>
                <Input
                  id="confirm-pw"
                  type={showPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                  required
                  autoComplete="new-password"
                />
              </div>
              <StatusMsg status={pwStatus} />
              <Button
                type="submit"
                disabled={savingPw || !currentPassword || !newPassword || !confirmPassword}
                className="gap-2"
              >
                {savingPw && <Loader2 className="size-4 animate-spin" />}
                Passwort ändern
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Danger Zone ─────────────────────────────────────────────── */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <TriangleAlert className="size-4" />
              Gefahrenzone
            </CardTitle>
            <CardDescription>
              Diese Aktionen sind unwiderruflich. Bitte mit Bedacht verwenden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showDeleteSection ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteSection(true)}
                className="gap-2"
              >
                <Trash2 className="size-4" />
                Konto löschen
              </Button>
            ) : (
              <div className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive">
                  Konto wirklich löschen?
                </p>
                <p className="text-sm text-muted-foreground">
                  Dein Profil, alle deine Sessions und alle zugehörigen Daten werden
                  permanent gelöscht. Dies kann nicht rückgängig gemacht werden.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="delete-confirm" className="text-sm">
                    Tippe <strong>DELETE</strong> zur Bestätigung
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="border-destructive/40 font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    disabled={deleteConfirm !== "DELETE" || deletingAccount}
                    onClick={handleDeleteAccount}
                    className="gap-2"
                  >
                    {deletingAccount ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Konto endgültig löschen
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowDeleteSection(false);
                      setDeleteConfirm("");
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Languages className="size-3.5" />
            <span>LinguAI &copy; {new Date().getFullYear()}</span>
          </div>
          <Link to="/dashboard" className="transition-colors hover:text-foreground">
            Zurück zum Dashboard
          </Link>
        </div>
      </footer>
    </div>
  );
}
