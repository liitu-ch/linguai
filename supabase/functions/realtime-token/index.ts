import { corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { resolveApiKey, AuthError } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const apiKey = await resolveApiKey(req, "openai");
    const { language } = await req.json().catch(() => ({}));

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
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return errorResponse(text, response.status);
    }

    const data = await response.json();
    return jsonResponse({ token: data.value });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error("[realtime-token] Error:", err);
    return errorResponse("Failed to create ephemeral token");
  }
});
