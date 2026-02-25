import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const VOICE_MAP: Record<string, string> = {
  en: "alloy",
  es: "nova",
  pt: "nova",
  ms: "alloy",
  cs: "onyx",
  sk: "onyx",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, lang, voice } = req.body;
  if (!text || !lang) {
    return res.status(400).json({ error: "text and lang are required" });
  }

  const selectedVoice = voice || VOICE_MAP[lang] || "alloy";

  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: selectedVoice,
      input: text,
      response_format: "mp3",
      speed: 1.1,
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  } catch (err) {
    console.error("[tts] Error:", err);
    return res.status(500).json({ error: "TTS generation failed" });
  }
}
