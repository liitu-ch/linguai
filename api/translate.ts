import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { nanoid } from "nanoid";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const LANG_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  ms: "Malay",
  cs: "Czech",
  sk: "Slovak",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, sourceLang, targetLangs, sequenceNum } = req.body;

  if (!text || !sourceLang || !targetLangs?.length) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const translations = await batchTranslate(text, sourceLang, targetLangs);

  const segment = {
    id: nanoid(),
    sequenceNum: sequenceNum ?? 0,
    originalText: text,
    originalLang: sourceLang,
    translations,
    timestampMs: Date.now(),
    isFinal: true,
  };

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
