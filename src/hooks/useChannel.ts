import { useEffect, useRef, useState } from "react";
import { supabase } from "~/lib/supabase.ts";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { TranslationSegment } from "~/types/session.ts";

interface UseChannelOptions {
  sessionId: string;
  onSegment: (segment: TranslationSegment) => void;
  enabled?: boolean;
}

type ConnectionState = "connecting" | "open" | "closed" | "error";

export function useChannel({
  sessionId,
  onSegment,
  enabled = true,
}: UseChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onSegmentRef = useRef(onSegment);
  onSegmentRef.current = onSegment;
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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionState("open");
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
  }, [sessionId, enabled]);

  return { connectionState };
}
