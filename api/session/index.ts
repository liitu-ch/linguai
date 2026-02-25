import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, sourceLang, targetLanguages, speakerName } = req.body;

  if (!sourceLang || !targetLanguages?.length) {
    return res
      .status(400)
      .json({ error: "sourceLang and targetLanguages are required" });
  }

  const sessionId = nanoid(10);
  const now = Date.now();
  const TTL = 6 * 60 * 60;

  const meta = {
    sessionId,
    title: title || "Untitled Session",
    sourceLang,
    targetLanguages,
    speakerName: speakerName || undefined,
    createdAt: now,
    expiresAt: now + TTL * 1000,
    status: "active" as const,
  };

  await redis.set(`session:${sessionId}:meta`, JSON.stringify(meta), {
    ex: TTL,
  });

  return res.json(meta);
}
