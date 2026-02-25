import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

interface Segment {
  id: string;
  sequenceNum: number;
  translations: Record<string, string>;
  originalLang: string;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const lang = url.searchParams.get("lang");
  const lastSeqRaw = url.searchParams.get("lastSeq");
  let lastSeq = lastSeqRaw ? parseInt(lastSeqRaw, 10) : -1;

  if (!sessionId || !lang) {
    return new Response("Missing sessionId or lang", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (
        eventType: string,
        data: unknown,
        id?: string
      ) => {
        let chunk = "";
        if (id) chunk += `id: ${id}\n`;
        chunk += `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      // Flush headers immediately
      send("heartbeat", { type: "heartbeat", ts: Date.now() });

      // 20s timeout for Hobby plan, client auto-reconnects
      const TIMEOUT_MS = 20_000;
      const deadline = Date.now() + TIMEOUT_MS;

      while (Date.now() < deadline) {
        try {
          const rawMembers = await redis.zrange(
            `session:${sessionId}:segments`,
            lastSeq + 1,
            "+inf",
            { byScore: true }
          );

          for (const raw of rawMembers) {
            const segment: Segment =
              typeof raw === "string" ? JSON.parse(raw) : (raw as Segment);

            // Only stream segments that have a translation for this language
            // or where the original language matches
            if (
              segment.translations[lang] !== undefined ||
              segment.originalLang === lang
            ) {
              send(
                "segment",
                { type: "segment", data: segment },
                segment.id
              );
              lastSeq = Math.max(lastSeq, segment.sequenceNum);
            }
          }

          // Check if session has ended
          const rawMeta = await redis.get<string>(
            `session:${sessionId}:meta`
          );
          if (rawMeta) {
            const meta =
              typeof rawMeta === "string" ? JSON.parse(rawMeta) : rawMeta;
            if (
              meta.status === "ended" ||
              meta.expiresAt < Date.now()
            ) {
              send("session_end", { type: "session_end" });
              break;
            }
          } else {
            send("session_end", { type: "session_end" });
            break;
          }
        } catch (err) {
          console.error("[SSE] KV error:", err);
        }

        await new Promise((r) => setTimeout(r, 500));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    },
  });
}
