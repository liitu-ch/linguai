import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { authenticateRequest, AuthError } from "../_shared/auth.ts";
import { encrypt, decrypt, maskKey } from "../_shared/encryption.ts";

const VALID_PROVIDERS = ["openai", "elevenlabs"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

function getAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function validateProviderKey(
  provider: Provider,
  key: string,
): Promise<boolean> {
  try {
    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      return res.ok;
    }
    if (provider === "elevenlabs") {
      const res = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": key },
      });
      if (res.ok) return true;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const userId = await authenticateRequest(req);
    const admin = getAdmin();

    switch (req.method) {
      case "GET": {
        const { data, error } = await admin
          .from("api_keys")
          .select(
            "id, provider, key_hint, is_valid, last_validated_at, created_at",
          )
          .eq("user_id", userId)
          .order("provider");

        if (error) return errorResponse(error.message);
        return jsonResponse({ keys: data });
      }

      case "POST": {
        const { provider, key } = await req.json();
        if (!provider || !VALID_PROVIDERS.includes(provider)) {
          return errorResponse("Invalid provider", 400);
        }
        if (!key || typeof key !== "string" || key.trim().length < 10) {
          return errorResponse("Invalid API key", 400);
        }

        const trimmedKey = key.trim();
        const valid = await validateProviderKey(
          provider as Provider,
          trimmedKey,
        );
        const encryptedKey = await encrypt(trimmedKey);
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
            { onConflict: "user_id,provider" },
          )
          .select("id, provider, key_hint, is_valid, last_validated_at")
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse({ key: data, valid });
      }

      case "DELETE": {
        const url = new URL(req.url);
        const provider = url.searchParams.get("provider");
        if (
          !provider ||
          !VALID_PROVIDERS.includes(provider as Provider)
        ) {
          return errorResponse("Invalid provider", 400);
        }

        const { error } = await admin
          .from("api_keys")
          .delete()
          .eq("user_id", userId)
          .eq("provider", provider);

        if (error) return errorResponse(error.message);
        return jsonResponse({ deleted: true });
      }

      default:
        return errorResponse("Method not allowed", 405);
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error("[api-keys] Error:", err);
    return errorResponse("Internal server error");
  }
});
