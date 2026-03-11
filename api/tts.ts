import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const VOICE_MAP: Record<string, string> = {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, lang } = req.body;
  if (!text || !lang) {
    return res.status(400).json({ error: "text and lang are required" });
  }

  const voice = VOICE_MAP[lang] || "marin";

  try {
    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voice as "alloy",
      input: text,
      instructions: "Speak naturally and clearly.",
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  } catch (err: unknown) {
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
