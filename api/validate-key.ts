import type { VercelRequest, VercelResponse } from "@vercel/node";

const VALID_PROVIDERS = ["openai", "elevenlabs"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { provider, key } = req.body ?? {};

  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: "Invalid provider" });
  }
  if (!key || typeof key !== "string" || key.trim().length < 10) {
    return res.status(400).json({ error: "Invalid API key" });
  }

  const valid = await validateKey(provider as Provider, key.trim());
  return res.json({ valid });
}

async function validateKey(provider: Provider, key: string): Promise<boolean> {
  try {
    if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      return r.ok;
    }
    if (provider === "elevenlabs") {
      const r = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": key },
      });
      if (r.ok) return true;
      // Key with restricted permissions is still valid
      if (r.status === 401 || r.status === 403) {
        const body = await r.json().catch(() => null);
        if (body?.detail?.status === "missing_permissions") return true;
      }
      return false;
    }
    return false;
  } catch {
    return false;
  }
}
