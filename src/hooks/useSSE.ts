import { useEffect, useRef, useCallback, useState } from "react";
import type { TranslationSegment, SupportedLanguage } from "~/types/session.ts";
import type { SSEEvent } from "~/types/api.ts";

interface UseSSEOptions {
  sessionId: string;
  lang: SupportedLanguage;
  onSegment: (segment: TranslationSegment) => void;
  onSessionEnd?: () => void;
  enabled?: boolean;
}

type ConnectionState = "connecting" | "open" | "closed" | "error";

export function useSSE({
  sessionId,
  lang,
  onSegment,
  onSessionEnd,
  enabled = true,
}: UseSSEOptions) {
  const esRef = useRef<EventSource | null>(null);
  const lastSeqRef = useRef(-1);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("closed");

  // Store callbacks in refs to avoid reconnect on callback change
  const onSegmentRef = useRef(onSegment);
  onSegmentRef.current = onSegment;
  const onSessionEndRef = useRef(onSessionEnd);
  onSessionEndRef.current = onSessionEnd;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      sessionId,
      lang,
      lastSeq: String(lastSeqRef.current),
    });
    return `/api/stream?${params.toString()}`;
  }, [sessionId, lang]);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setConnectionState("connecting");
    const es = new EventSource(buildUrl());
    esRef.current = es;

    es.addEventListener("segment", (e: MessageEvent) => {
      const event = JSON.parse(e.data as string) as SSEEvent;
      if (event.type !== "segment") return;

      // Deduplicate — SSE may redeliver after reconnect
      if (event.data.sequenceNum > lastSeqRef.current) {
        lastSeqRef.current = event.data.sequenceNum;
        reconnectAttemptRef.current = 0;
        onSegmentRef.current(event.data);
      }
    });

    es.addEventListener("heartbeat", () => {
      setConnectionState("open");
      reconnectAttemptRef.current = 0;
    });

    es.addEventListener("session_end", () => {
      es.close();
      setConnectionState("closed");
      onSessionEndRef.current?.();
    });

    es.addEventListener("error", () => {
      es.close();
      esRef.current = null;
      setConnectionState("error");

      // Exponential backoff: 1s, 2s, 4s, 8s … capped at 30s
      const attempt = reconnectAttemptRef.current++;
      const delay = Math.min(1000 * Math.pow(2, attempt), 30_000);

      reconnectTimerRef.current = setTimeout(() => {
        if (enabled) connect();
      }, delay);
    });
  }, [buildUrl, enabled]);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect, enabled]);

  return { connectionState };
}
