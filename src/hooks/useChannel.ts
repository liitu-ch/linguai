import { useEffect, useRef, useState } from "react";
import { supabase } from "~/lib/supabase.ts";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { TranslationSegment } from "~/types/session.ts";

interface UseChannelOptions {
  sessionId: string;
  onSegment: (segment: TranslationSegment) => void;
  onInterim?: (text: string) => void;
  onSpeechState?: (speaking: boolean) => void;
  enabled?: boolean;
  /** Track this client's presence so the speaker can see listener count */
  trackPresence?: boolean;
}

type ConnectionState = "connecting" | "open" | "closed" | "error";

export function useChannel({
  sessionId,
  onSegment,
  onInterim,
  onSpeechState,
  enabled = true,
  trackPresence = false,
}: UseChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onSegmentRef = useRef(onSegment);
  onSegmentRef.current = onSegment;
  const onInterimRef = useRef(onInterim);
  onInterimRef.current = onInterim;
  const onSpeechStateRef = useRef(onSpeechState);
  onSpeechStateRef.current = onSpeechState;
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("closed");

  useEffect(() => {
    if (!enabled || !sessionId) return;

    setConnectionState("connecting");

    const channel = supabase.channel(`session-${sessionId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "segment" }, ({ payload }) => {
        onSegmentRef.current(payload as TranslationSegment);
      })
      .on("broadcast", { event: "interim" }, ({ payload }) => {
        const { text } = payload as { text: string };
        onInterimRef.current?.(text);
      })
      .on("broadcast", { event: "speech_state" }, ({ payload }) => {
        const { speaking } = payload as { speaking: boolean };
        onSpeechStateRef.current?.(speaking);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionState("open");
          if (trackPresence) {
            // Register this listener in the presence state
            channel.track({ role: "listener", ts: Date.now() });
          }
        } else if (status === "CHANNEL_ERROR") {
          setConnectionState("error");
        } else if (status === "CLOSED") {
          setConnectionState("closed");
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setConnectionState("closed");
    };
  }, [sessionId, enabled, trackPresence]);

  return { connectionState };
}
