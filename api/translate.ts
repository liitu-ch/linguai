import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { nanoid } from "nanoid";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const LANG_NAMES: Record<string, string> = {
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian",
  es: "Spanish",
  pt: "Portuguese",
  ms: "Malay",
  cs: "Czech",
  sk: "Slovak",
  ar: "Arabic",
  bg: "Bulgarian",
  ca: "Catalan",
  da: "Danish",
  el: "Greek",
  et: "Estonian",
  fi: "Finnish",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  hu: "Hungarian",
  id: "Indonesian",
  ja: "Japanese",
  ko: "Korean",
  lt: "Lithuanian",
  lv: "Latvian",
  nl: "Dutch",
  no: "Norwegian",
  pl: "Polish",
  ro: "Romanian",
  ru: "Russian",
  sl: "Slovenian",
  sr: "Serbian",
  sv: "Swedish",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  zh: "Chinese",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, sourceLang, targetLangs, sequenceNum, glossary, context } = req.body;

  if (!text || !sourceLang || !targetLangs?.length) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const translations = await batchTranslate(text, sourceLang, targetLangs, glossary, context);

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
  targetLangs: string[],
  glossary?: Array<{ source: string; target: string; lang?: string }>,
  context?: string
): Promise<Record<string, string>> {
  if (targetLangs.length === 0) return {};

  const targetList = targetLangs
    .map((l) => `"${l}": "${LANG_NAMES[l] || l}"`)
    .join(", ");

  let systemPrompt = `You are a specialist simultaneous interpreter with years of experience at international conferences and live events.
The speaker is presenting in ${LANG_NAMES[sourceLang] || sourceLang}. The incoming audio is transcribed from ${LANG_NAMES[sourceLang] || sourceLang} speech — treat the source language selection as authoritative and interpret the text accordingly, even if individual words could belong to another language.
Translate the spoken text into each of these languages: { ${targetList} }.

Key principles:
- The output will be read aloud via text-to-speech — write translations as they would naturally be spoken in each target language.
- Preserve the speaker's tone, register, and emphasis.
- Use natural spoken phrasing, not written/literary style. Avoid overly formal constructions.
- Keep translations concise and fluid for oral delivery.
- If uploaded content or a glossary is provided, always consult them — they define the speaker's subject matter and preferred terminology, and are essential for producing accurate translations.
- Respond ONLY with the JSON object mapping language codes to translations.`;

  const hasGlossary = glossary && glossary.length > 0;
  const hasContext = context && context.trim();

  if (hasGlossary || hasContext) {
    systemPrompt += `\n\nWhen the meaning of a phrase is ambiguous or unclear, use the glossary and/or the uploaded context below to determine the correct translation. These resources reflect the speaker's intended terminology and subject matter.`;
  }

  if (hasGlossary) {
    const entries = glossary.slice(0, 200);
    const glossaryLines = entries
      .map((g) => `  "${g.source}" → "${g.target}"${g.lang ? ` (${g.lang})` : ""}`)
      .join("\n");
    systemPrompt += `\n\nGLOSSARY — Always use these specified translations when you encounter the listed terms:\n${glossaryLines}`;
  }

  if (hasContext) {
    const trimmedContext = context.trim().slice(0, 8000);
    systemPrompt += `\n\nUPLOADED CONTENT — Use this as reference to understand the topic, resolve ambiguities, and translate domain-specific terms accurately:\n---\n${trimmedContext}\n---`;
  }

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
      { role: "system", content: systemPrompt },
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
