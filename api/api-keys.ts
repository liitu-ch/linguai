import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { authenticateRequest, AuthError } from "./_lib/auth.ts";
import { encrypt, decrypt, maskKey } from "./_lib/encryption.ts";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function getAdmin() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const VALID_PROVIDERS = ["openai", "elevenlabs"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await authenticateRequest(req);
    const admin = getAdmin();

    switch (req.method) {
      // ── GET: List user's keys (masked) ─────────────────────────────────
      case "GET": {
        const { data, error } = await admin
          .from("api_keys")
          .select("id, provider, key_hint, is_valid, last_validated_at, created_at")
          .eq("user_id", userId)
          .order("provider");

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ keys: data });
      }

      // ── POST: Save or update a key ─────────────────────────────────────
      case "POST": {
        const { provider, key } = req.body ?? {};
        if (!provider || !VALID_PROVIDERS.includes(provider)) {
          return res.status(400).json({ error: "Invalid provider" });
        }
        if (!key || typeof key !== "string" || key.trim().length < 10) {
          return res.status(400).json({ error: "Invalid API key" });
        }

        const trimmedKey = key.trim();

        // Validate the key first
        const valid = await validateProviderKey(provider as Provider, trimmedKey);

        const encryptedKey = encrypt(trimmedKey);
        const keyHint = maskKey(trimmedKey);

        const { data, error } = await admin
          .from("api_keys")
          .upsert(
            {
              user_id: userId,
              provider,
              encrypted_key: encryptedKey,
              key_hint: keyHint,
              is_valid: valid,
              last_validated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,provider" }
          )
          .select("id, provider, key_hint, is_valid, last_validated_at")
          .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ key: data, valid });
      }

      // ── DELETE: Remove a key ───────────────────────────────────────────
      case "DELETE": {
        const provider = req.query.provider as string;
        if (!provider || !VALID_PROVIDERS.includes(provider as Provider)) {
          return res.status(400).json({ error: "Invalid provider" });
        }

        const { error } = await admin
          .from("api_keys")
          .delete()
          .eq("user_id", userId)
          .eq("provider", provider);

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ deleted: true });
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("[api-keys] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/** Validate an API key by making a lightweight request to the provider */
async function validateProviderKey(provider: Provider, key: string): Promise<boolean> {
  try {
    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      return res.ok;
    }

    if (provider === "elevenlabs") {
      // Try /v1/user first, fall back to checking if the error is "missing_permissions"
      // (which means the key is valid but has restricted scopes)
      const res = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": key },
      });
      if (res.ok) return true;
      // A key with limited permissions still returns structured error with "missing_permissions"
      if (res.status === 401 || res.status === 403) {
        const body = await res.json().catch(() => null);
        if (body?.detail?.status === "missing_permissions") return true;
      }
      return false;
    }

    return false;
  } catch {
    return false;
  }
}
