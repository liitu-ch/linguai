import { corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";

const VALID_PROVIDERS = ["openai", "elevenlabs"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const { provider, key } = await req.json();

  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return errorResponse("Invalid provider", 400);
  }
  if (!key || typeof key !== "string" || key.trim().length < 10) {
    return errorResponse("Invalid API key", 400);
  }

  const valid = await validateKey(provider as Provider, key.trim());
  return jsonResponse({ valid });
});
