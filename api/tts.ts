import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { authenticateRequest, getUserApiKey, AuthError } from "./_lib/auth.ts";

// ─── OpenAI voice map ────────────────────────────────────────────────────────

const OPENAI_VOICE_MAP: Record<string, string> = {
  en: "marin",
  de: "ash",
  fr: "sage",
  it: "shimmer",
  es: "nova",
  pt: "nova",
  ms: "alloy",
  cs: "onyx",
  sk: "onyx",
  ar: "coral",
  bg: "onyx",
  ca: "sage",
  da: "ash",
  el: "coral",
  et: "alloy",
  fi: "ash",
  he: "coral",
  hi: "cedar",
  hr: "onyx",
  hu: "ash",
  id: "alloy",
  ja: "cedar",
  ko: "cedar",
  lt: "alloy",
  lv: "alloy",
  nl: "marin",
  no: "ash",
  pl: "onyx",
  ro: "shimmer",
  ru: "onyx",
  sl: "alloy",
  sr: "onyx",
  sv: "ash",
  th: "cedar",
  tr: "coral",
  uk: "onyx",
  vi: "cedar",
  zh: "cedar",
};

// ─── ElevenLabs voice map (multilingual v2 voices) ───────────────────────────

const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  en: "21m00Tcm4TlvDq8ikWAM", // Rachel
  de: "29vD33N1CtxCmqQRPOHJ", // Drew
  fr: "EXAVITQu4vr4xnSDxMaL", // Bella
  it: "ErXwobaYiN019PkySvjV", // Antoni
  es: "MF3mGyEYCl7XYWbV9V6O", // Elli
  pt: "MF3mGyEYCl7XYWbV9V6O", // Elli
  default: "21m00Tcm4TlvDq8ikWAM", // Rachel (fallback)
};

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, lang, speed, provider } = req.body;
  if (!text || !lang) {
    return res.status(400).json({ error: "text and lang are required" });
  }

  const ttsProvider = provider || "openai";

  try {
    // Resolve API key
    let apiKey: string;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const userId = await authenticateRequest(req);
      apiKey = await getUserApiKey(userId, ttsProvider === "elevenlabs" ? "elevenlabs" : "openai");
    } else {
      if (ttsProvider === "elevenlabs") {
        return res.status(401).json({ error: "ElevenLabs requires authentication with your own API key" });
      }
      apiKey = process.env.OPENAI_API_KEY ?? "";
      if (!apiKey) {
        return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
      }
    }

    if (ttsProvider === "elevenlabs") {
      return await handleElevenLabsTTS(res, apiKey, text, lang);
    }

    return await handleOpenAITTS(res, apiKey, text, lang, speed);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("[tts] Error:", err);
    if (err instanceof OpenAI.APIError) {
      const message =
        err.status === 429
          ? "OpenAI quota exceeded – check your billing"
          : err.message || "TTS generation failed";
      return res.status(err.status ?? 500).json({ error: message });
    }
    return res.status(500).json({ error: "TTS generation failed" });
  }
}

// ─── OpenAI TTS ──────────────────────────────────────────────────────────────

async function handleOpenAITTS(
  res: VercelResponse,
  apiKey: string,
  text: string,
  lang: string,
  speed?: number
) {
  const openai = new OpenAI({ apiKey });
  const voice = OPENAI_VOICE_MAP[lang] || "marin";

  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: voice as "alloy",
    input: text,
    instructions: "Speak naturally and clearly.",
    response_format: "mp3",
    speed: typeof speed === "number" ? Math.max(0.25, Math.min(4.0, speed)) : 1.1,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  return res.send(buffer);
}

// ─── ElevenLabs TTS ──────────────────────────────────────────────────────────

async function handleElevenLabsTTS(
  res: VercelResponse,
  apiKey: string,
  text: string,
  lang: string
) {
  const voiceId = ELEVENLABS_VOICE_MAP[lang] || ELEVENLABS_VOICE_MAP.default;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("[tts] ElevenLabs error:", response.status, errText);
    const detail = (() => { try { return JSON.parse(errText); } catch { return null; } })();
    const message = detail?.detail?.message || detail?.detail?.status || response.statusText;
    return res.status(response.status).json({ error: `ElevenLabs TTS failed: ${message}` });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  return res.send(buffer);
}
