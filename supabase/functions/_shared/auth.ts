import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decrypt } from "./encryption.ts";

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/** Extract and verify the Supabase JWT from the Authorization header. Returns user id. */
export async function authenticateRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get("authorization");
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

/** Get a user's decrypted API key for a given provider. */
export async function getUserApiKey(
  userId: string,
  provider: "openai" | "elevenlabs",
): Promise<string> {
  const admin = getAdminClient();

  const { data } = await admin
    .from("api_keys")
    .select("encrypted_key")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();

  if (data?.encrypted_key) {
    return await decrypt(data.encrypted_key);
  }

  throw new AuthError(`No API key configured for ${provider}`, 400);
}

/** Resolve API key: authenticates user and returns their stored key. */
export async function resolveApiKey(
  req: Request,
  provider: "openai" | "elevenlabs" = "openai",
): Promise<string> {
  const userId = await authenticateRequest(req);
  return await getUserApiKey(userId, provider);
}
