import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Session ID required" });
  }

  const raw = await redis.get<string>(`session:${id}:meta`);
  if (!raw) {
    return res.status(404).json({ error: "Session not found" });
  }

  const meta = typeof raw === "string" ? JSON.parse(raw) : raw;
  return res.json(meta);
}
