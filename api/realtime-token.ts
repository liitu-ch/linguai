import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest, getUserApiKey, AuthError } from "./_lib/auth.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Try to authenticate — fall back to server key if no auth header
    let apiKey: string;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const userId = await authenticateRequest(req);
      apiKey = await getUserApiKey(userId, "openai");
    } else {
      apiKey = process.env.OPENAI_API_KEY ?? "";
      if (!apiKey) {
        return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
      }
    }

    const { language } = req.body ?? {};

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: {
            type: "transcription",
            audio: {
              input: {
                transcription: {
                  model: "gpt-4o-transcribe",
                  ...(language ? { language } : {}),
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    return res.json({ token: data.value });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("[realtime-token] Error:", err);
    return res.status(500).json({ error: "Failed to create ephemeral token" });
  }
}
