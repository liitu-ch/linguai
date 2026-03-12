import {
  corsResponse,
  errorResponse,
  binaryResponse,
  jsonResponse,
} from "../_shared/cors.ts";
import { resolveApiKey, AuthError } from "../_shared/auth.ts";
import OpenAI from "npm:openai@4";

const OPENAI_VOICE_MAP: Record<string, string> = {
  en: "marin", de: "ash", fr: "sage", it: "shimmer",
  es: "nova", pt: "nova", ms: "alloy", cs: "onyx",
  sk: "onyx", ar: "coral", bg: "onyx", ca: "sage",
  da: "ash", el: "coral", et: "alloy", fi: "ash",
  he: "coral", hi: "cedar", hr: "onyx", hu: "ash",
  id: "alloy", ja: "cedar", ko: "cedar", lt: "alloy",
  lv: "alloy", nl: "marin", no: "ash", pl: "onyx",
  ro: "shimmer", ru: "onyx", sl: "alloy", sr: "onyx",
  sv: "ash", th: "cedar", tr: "coral", uk: "onyx",
  vi: "cedar", zh: "cedar",
};

const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  en: "21m00Tcm4TlvDq8ikWAM",
  de: "29vD33N1CtxCmqQRPOHJ",
  fr: "EXAVITQu4vr4xnSDxMaL",
  it: "ErXwobaYiN019PkySvjV",
  es: "MF3mGyEYCl7XYWbV9V6O",
  pt: "MF3mGyEYCl7XYWbV9V6O",
  default: "21m00Tcm4TlvDq8ikWAM",
};

async function handleOpenAITTS(
  apiKey: string,
  text: string,
  lang: string,
  speed?: number,
): Promise<Response> {
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

  const arrayBuffer = await response.arrayBuffer();
  return binaryResponse(arrayBuffer, "audio/mpeg");
}

async function handleElevenLabsTTS(
  apiKey: string,
  text: string,
  lang: string,
): Promise<Response> {
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
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("[tts] ElevenLabs error:", response.status, errText);
    const detail = (() => {
      try { return JSON.parse(errText); } catch { return null; }
    })();
    const message =
      detail?.detail?.message || detail?.detail?.status || response.statusText;
    return jsonResponse(
      { error: `ElevenLabs TTS failed: ${message}` },
      response.status,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return binaryResponse(arrayBuffer, "audio/mpeg");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const { text, lang, speed, provider: reqProvider } = await req.json();
    if (!text || !lang) {
      return errorResponse("text and lang are required", 400);
    }

    const ttsProvider = reqProvider || "openai";
    const apiKey = await resolveApiKey(
      req,
      ttsProvider === "elevenlabs" ? "elevenlabs" : "openai",
    );

    if (ttsProvider === "elevenlabs") {
      return await handleElevenLabsTTS(apiKey, text, lang);
    }
    return await handleOpenAITTS(apiKey, text, lang, speed);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    if (err instanceof OpenAI.APIError) {
      const message =
        err.status === 429
          ? "OpenAI quota exceeded – check your billing"
          : err.message || "TTS generation failed";
      return errorResponse(message, err.status ?? 500);
    }
    console.error("[tts] Error:", err);
    return errorResponse("TTS generation failed");
  }
});
