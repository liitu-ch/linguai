import { useRef, useState, useCallback } from "react";
import type { SupportedLanguage } from "~/types/session.ts";
import type { TranslateRequestBody, TranslateResponse, GlossaryEntry } from "~/types/api.ts";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeTranscriptionOptions {
  sourceLang: SupportedLanguage;
  targetLangs: SupportedLanguage[];
  channel: RealtimeChannel | null;
  glossary?: GlossaryEntry[];
  context?: string;
  silenceDurationMs?: number;
  vadThreshold?: number;
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string, seq: number) => void;
}

type Status = "idle" | "connecting" | "active" | "error";

/**
 * Build Realtime API instructions enriched with glossary terms and context.
 * This helps Whisper transcribe domain-specific terminology more accurately.
 */
function buildInstructions(
  glossary?: GlossaryEntry[],
  context?: string
): string {
  let instructions =
    "Transcribe the audio accurately. Output only the transcribed text.";

  if (glossary && glossary.length > 0) {
    const terms = glossary.map((g) => g.source).join(", ");
    instructions += `\n\nThe speaker may use the following domain-specific terms — transcribe them exactly as listed: ${terms}`;
  }

  if (context && context.trim()) {
    // Provide a condensed summary for the Realtime API (keep instructions short)
    const summary = context.trim().slice(0, 2000);
    instructions += `\n\nTopic context for accurate transcription:\n${summary}`;
  }

  return instructions;
}

export function useRealtimeTranscription({
  sourceLang,
  targetLangs,
  channel,
  glossary,
  context,
  silenceDurationMs = 600,
  vadThreshold = 0.5,
  onInterimTranscript,
  onFinalTranscript,
}: UseRealtimeTranscriptionOptions) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const seqRef = useRef(0);
  const [status, setStatus] = useState<Status>("idle");

  // Stable refs for session prep data — frozen at start(), read in callbacks.
  // This avoids re-creating the event handler callback when glossary/context change,
  // and avoids sending stale closures.
  const glossaryRef = useRef(glossary);
  const contextRef = useRef(context);
  const silenceDurationMsRef = useRef(silenceDurationMs);
  const vadThresholdRef = useRef(vadThreshold);
  glossaryRef.current = glossary;
  contextRef.current = context;
  silenceDurationMsRef.current = silenceDurationMs;
  vadThresholdRef.current = vadThreshold;

  // Stable refs for callbacks
  const channelRef = useRef(channel);
  channelRef.current = channel;
  const onInterimRef = useRef(onInterimTranscript);
  onInterimRef.current = onInterimTranscript;
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;
  const sourceLangRef = useRef(sourceLang);
  sourceLangRef.current = sourceLang;
  const targetLangsRef = useRef(targetLangs);
  targetLangsRef.current = targetLangs;

  const fetchEphemeralToken = useCallback(async (): Promise<string> => {
    const res = await fetch("/api/realtime-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error("Failed to fetch ephemeral token");
    const data = await res.json();
    return data.token as string;
  }, []);

  const handleRealtimeEvent = useCallback(
    (event: Record<string, unknown>) => {
      switch (event.type) {
        case "conversation.item.input_audio_transcription.delta": {
          const delta = event.delta as string | undefined;
          if (delta) onInterimRef.current?.(delta);
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          const transcript = event.transcript as string | undefined;
          if (!transcript?.trim()) break;

          const seq = ++seqRef.current;
          onFinalRef.current?.(transcript, seq);

          // Read current values from refs
          const currentGlossary = glossaryRef.current;
          const currentContext = contextRef.current;

          const body: TranslateRequestBody = {
            text: transcript.trim(),
            sourceLang: sourceLangRef.current,
            targetLangs: targetLangsRef.current,
            sequenceNum: seq,
            glossary: currentGlossary?.length ? currentGlossary : undefined,
            context: currentContext?.trim() || undefined,
          };

          fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
            .then((res) => res.json())
            .then((data: TranslateResponse) => {
              channelRef.current?.send({
                type: "broadcast",
                event: "segment",
                payload: data.segment,
              });
            })
            .catch((err) => console.error("[Realtime] translate failed:", err));
          break;
        }

        case "error": {
          console.error("[Realtime] API error:", event.error);
          setStatus("error");
          break;
        }
      }
    },
    [] // stable — all values read via refs
  );

  const start = useCallback(async () => {
    setStatus("connecting");
    try {
      const ephemeralKey = await fetchEphemeralToken();

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
        },
      });

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      for (const track of micStream.getTracks()) {
        pc.addTrack(track, micStream);
      }

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("message", (e: MessageEvent) => {
        handleRealtimeEvent(JSON.parse(e.data as string));
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) throw new Error("SDP negotiation failed");

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      await new Promise<void>((resolve) => {
        if (dc.readyState === "open") {
          resolve();
          return;
        }
        dc.addEventListener("open", () => resolve(), { once: true });
      });

      // Build instructions with glossary terms and presentation context
      // so the Realtime API transcribes domain-specific terms accurately
      const instructions = buildInstructions(
        glossaryRef.current,
        contextRef.current
      );

      dc.send(
        JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text"],
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: {
              type: "server_vad",
              silence_duration_ms: silenceDurationMsRef.current,
              threshold: vadThresholdRef.current,
            },
            instructions,
          },
        })
      );

      setStatus("active");
    } catch (err) {
      console.error("[Realtime] Setup failed:", err);
      setStatus("error");
    }
  }, [fetchEphemeralToken, handleRealtimeEvent]);

  const stop = useCallback(() => {
    dcRef.current?.close();
    pcRef.current?.getSenders().forEach((sender) => {
      sender.track?.stop();
    });
    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current = null;
    setStatus("idle");
  }, []);

  return { start, stop, status };
}
