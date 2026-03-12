import type { VercelRequest } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { decrypt } from "./encryption.ts";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Extract and verify the Supabase JWT from the Authorization header. Returns user id. */
export async function authenticateRequest(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header", 401);
  }

  const token = authHeader.slice(7);
  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data.user) {
    throw new AuthError("Invalid or expired token", 401);
  }

  return data.user.id;
}

/** Get a user's decrypted API key for a given provider. Falls back to env var. */
export async function getUserApiKey(
  userId: string,
  provider: "openai" | "elevenlabs"
): Promise<string> {
  const admin = getAdminClient();

  const { data } = await admin
    .from("api_keys")
    .select("encrypted_key")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();

  if (data?.encrypted_key) {
    return decrypt(data.encrypted_key);
  }

  // Fallback to server env var
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  throw new AuthError(`No API key configured for ${provider}`, 400);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
