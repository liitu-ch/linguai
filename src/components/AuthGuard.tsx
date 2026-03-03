import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { Languages } from "lucide-react";
import { useAuth } from "~/hooks/useAuth.ts";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 animate-pulse items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Languages className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">Laden…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
