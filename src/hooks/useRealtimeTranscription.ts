import { useRef, useState, useCallback } from "react";
import type { SupportedLanguage } from "~/types/session.ts";
import type { TranslateRequestBody, TranslateResponse } from "~/types/api.ts";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeTranscriptionOptions {
  sourceLang: SupportedLanguage;
  targetLangs: SupportedLanguage[];
  channel: RealtimeChannel | null;
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string, seq: number) => void;
}

type Status = "idle" | "connecting" | "active" | "error";

export function useRealtimeTranscription({
  sourceLang,
  targetLangs,
  channel,
  onInterimTranscript,
  onFinalTranscript,
}: UseRealtimeTranscriptionOptions) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const seqRef = useRef(0);
  const [status, setStatus] = useState<Status>("idle");

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
          if (delta) onInterimTranscript?.(delta);
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          const transcript = event.transcript as string | undefined;
          if (!transcript?.trim()) break;

          const seq = ++seqRef.current;
          onFinalTranscript?.(transcript, seq);

          // Translate and broadcast via Supabase
          const body: TranslateRequestBody = {
            text: transcript.trim(),
            sourceLang,
            targetLangs,
            sequenceNum: seq,
          };

          fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
            .then((res) => res.json())
            .then((data: TranslateResponse) => {
              // Broadcast translated segment to all clients
              channel?.send({
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
    [sourceLang, targetLangs, channel, onInterimTranscript, onFinalTranscript]
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

      dc.send(
        JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text"],
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: {
              type: "server_vad",
              silence_duration_ms: 600,
              threshold: 0.5,
            },
            instructions:
              "Transcribe the audio accurately. Output only the transcribed text.",
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
