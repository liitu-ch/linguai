import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
import OpenAI from "openai";
import { nanoid } from "nanoid";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const LANG_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  ms: "Malay",
  cs: "Czech",
  sk: "Slovak",
};

const TTL_SECONDS = 6 * 60 * 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId, text, sourceLang, isFinal, sequenceNum } = req.body;

  if (!sessionId || !text || !sourceLang || sequenceNum == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Get session meta to know target languages
  const rawMeta = await redis.get<string>(`session:${sessionId}:meta`);
  if (!rawMeta) {
    return res.status(404).json({ error: "Session not found" });
  }

  const meta = typeof rawMeta === "string" ? JSON.parse(rawMeta) : rawMeta;
  const targetLangs: string[] = meta.targetLanguages.filter(
    (l: string) => l !== sourceLang
  );

  // Batch translate in one API call
  const translations = await batchTranslate(text, sourceLang, targetLangs);

  const segment = {
    id: nanoid(),
    sessionId,
    sequenceNum,
    originalText: text,
    originalLang: sourceLang,
    translations,
    timestampMs: Date.now(),
    isFinal: isFinal ?? true,
  };

  // Store in Redis sorted set (score = sequenceNum)
  await Promise.all([
    redis.zadd(`session:${sessionId}:segments`, {
      score: sequenceNum,
      member: JSON.stringify(segment),
    }),
    redis.set(`session:${sessionId}:latest`, sequenceNum, {
      ex: TTL_SECONDS,
    }),
    redis.expire(`session:${sessionId}:segments`, TTL_SECONDS),
  ]);

  return res.json({ segment });
}

async function batchTranslate(
  text: string,
  sourceLang: string,
  targetLangs: string[]
): Promise<Record<string, string>> {
  if (targetLangs.length === 0) return {};

  const targetList = targetLangs
    .map((l) => `"${l}": "${LANG_NAMES[l] || l}"`)
    .join(", ");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "translations",
        strict: true,
        schema: {
          type: "object",
          properties: Object.fromEntries(
            targetLangs.map((l) => [l, { type: "string" }])
          ),
          required: targetLangs,
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "system",
        content: `You are a professional simultaneous interpreter.
Translate the given text from ${LANG_NAMES[sourceLang] || sourceLang} into each of these languages: { ${targetList} }.
Preserve the speaker's tone and register. Keep translations concise and natural for spoken delivery.
Respond ONLY with the JSON object mapping language codes to translations.`,
      },
      { role: "user", content: text },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(raw);
  } catch {
    console.error("[translate] JSON parse failed:", raw);
    return {};
  }
}
