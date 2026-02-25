import type { SessionMeta } from "~/types/session.ts";
import type { CreateSessionBody } from "~/types/api.ts";

export async function createSession(
  body: CreateSessionBody
): Promise<SessionMeta> {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function getSession(sessionId: string): Promise<SessionMeta> {
  const res = await fetch(`/api/session/${sessionId}`);
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}

export function getSessionUrl(sessionId: string): string {
  const base =
    import.meta.env.VITE_APP_URL ?? window.location.origin;
  return `${base}/session/${sessionId}`;
}
