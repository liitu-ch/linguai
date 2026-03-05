import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI, { toFile } from "openai";
import { Blob as NodeBlob } from "buffer";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

interface TranscribeRequestBody {
  audio: string; // base64-encoded audio
  mimeType?: string;
  model?: string;
  language?: string;
  prompt?: string;
}

/**
 * Diarize call via raw fetch — the OpenAI SDK (v4.x) doesn't support
 * `chunking_strategy` or `diarized_json` response_format yet.
 */
async function diarizeTranscription(
  audioBuffer: Buffer,
  mimeType: string,
  ext: string
): Promise<{ text: string; segments: Array<{ speaker: string; text: string; start: number; end: number }> }> {
  const formData = new FormData();

  const blob = new NodeBlob([audioBuffer], { type: mimeType });
  formData.append("file", blob as unknown as Blob, `audio.${ext}`);
  formData.append("model", "gpt-4o-transcribe-diarize");
  formData.append("response_format", "verbose_json");
  formData.append("chunking_strategy", "auto");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI diarize API error ${response.status}: ${errText}`);
  }

  const result = await response.json() as {
    text: string;
    segments?: Array<{
      speaker?: string;
      text: string;
      start: number;
      end: number;
    }>;
  };

  return {
    text: result.text,
    segments: result.segments?.map((s) => ({
      speaker: s.speaker ?? "unknown",
      text: s.text,
      start: s.start,
      end: s.end,
    })) ?? [],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    audio,
    mimeType = "audio/webm",
    model = "gpt-4o-transcribe",
    language = "en",
    prompt = "",
  } = req.body as TranscribeRequestBody;

  if (!audio) {
    return res.status(400).json({ error: "Missing audio data" });
  }

  const validModels = ["gpt-4o-transcribe", "gpt-4o-transcribe-diarize"];
  if (!validModels.includes(model)) {
    return res.status(400).json({ error: `Invalid model: ${model}` });
  }

  try {
    const audioBuffer = Buffer.from(audio, "base64");
    if (audioBuffer.length === 0) {
      return res.status(400).json({ error: "Empty audio data" });
    }

    const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "mp4" : "wav";
    const isDiarize = model === "gpt-4o-transcribe-diarize";

    // Diarize: use raw fetch (SDK doesn't support diarize params yet)
    if (isDiarize) {
      const result = await diarizeTranscription(audioBuffer, mimeType, ext);
      return res.json(result);
    }

    // Standard transcription: use SDK
    const file = await toFile(audioBuffer, `audio.${ext}`, { type: mimeType });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
      response_format: "json",
      ...(language ? { language } : {}),
      ...(prompt ? { prompt } : {}),
    });

    return res.json({ text: transcription.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[transcribe] Error:", message, err);
    return res.status(500).json({ error: "Transcription failed", detail: message });
  }
}
