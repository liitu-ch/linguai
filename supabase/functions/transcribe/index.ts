import { corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { resolveApiKey, AuthError } from "../_shared/auth.ts";
import OpenAI, { toFile } from "npm:openai@4";

async function diarizeTranscription(
  apiKey: string,
  audioBytes: Uint8Array,
  mimeType: string,
  ext: string,
): Promise<{
  text: string;
  segments: Array<{ speaker: string; text: string; start: number; end: number }>;
}> {
  const formData = new FormData();
  const blob = new Blob([audioBytes], { type: mimeType });
  formData.append("file", blob, `audio.${ext}`);
  formData.append("model", "gpt-4o-transcribe-diarize");
  formData.append("response_format", "verbose_json");
  formData.append("chunking_strategy", "auto");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI diarize API error ${response.status}: ${errText}`);
  }

  const result = (await response.json()) as {
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
    segments:
      result.segments?.map((s) => ({
        speaker: s.speaker ?? "unknown",
        text: s.text,
        start: s.start,
        end: s.end,
      })) ?? [],
  };
}

// Base64 decode helper
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const apiKey = await resolveApiKey(req, "openai");

    const {
      audio,
      mimeType = "audio/webm",
      model = "gpt-4o-transcribe",
      language = "en",
      prompt = "",
    } = await req.json();

    if (!audio) return errorResponse("Missing audio data", 400);

    const validModels = ["gpt-4o-transcribe", "gpt-4o-transcribe-diarize"];
    if (!validModels.includes(model)) {
      return errorResponse(`Invalid model: ${model}`, 400);
    }

    const audioBytes = base64ToBytes(audio);
    if (audioBytes.length === 0) {
      return errorResponse("Empty audio data", 400);
    }

    const ext = mimeType.includes("webm")
      ? "webm"
      : mimeType.includes("mp4")
        ? "mp4"
        : "wav";

    const isDiarize = model === "gpt-4o-transcribe-diarize";

    if (isDiarize) {
      const result = await diarizeTranscription(
        apiKey, audioBytes, mimeType, ext,
      );
      return jsonResponse(result);
    }

    const openai = new OpenAI({ apiKey });
    const file = await toFile(audioBytes, `audio.${ext}`, { type: mimeType });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
      response_format: "json",
      ...(language ? { language } : {}),
      ...(prompt ? { prompt } : {}),
    });

    return jsonResponse({ text: transcription.text });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[transcribe] Error:", message, err);
    return errorResponse("Transcription failed");
  }
});
