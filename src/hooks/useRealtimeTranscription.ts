import { useRef, useState, useCallback } from "react";
import type { SupportedLanguage } from "~/types/session.ts";
import type { TranslateRequestBody } from "~/types/api.ts";

interface UseRealtimeTranscriptionOptions {
  sessionId: string;
  sourceLang: SupportedLanguage;
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string, seq: number) => void;
}

type Status = "idle" | "connecting" | "active" | "error";

export function useRealtimeTranscription({
  sessionId,
  sourceLang,
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
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) throw new Error("Failed to fetch ephemeral token");
    const data = await res.json();
    return data.token as string;
  }, [sessionId]);

  const handleRealtimeEvent = useCallback(
    (event: Record<string, unknown>) => {
      switch (event.type) {
        // Interim transcript — show live to speaker
        case "conversation.item.input_audio_transcription.delta": {
          const delta = event.delta as string | undefined;
          if (delta) onInterimTranscript?.(delta);
          break;
        }

        // Final transcript — send for translation
        case "conversation.item.input_audio_transcription.completed": {
          const transcript = event.transcript as string | undefined;
          if (!transcript?.trim()) break;

          const seq = ++seqRef.current;
          onFinalTranscript?.(transcript, seq);

          const body: TranslateRequestBody = {
            sessionId,
            text: transcript.trim(),
            sourceLang,
            isFinal: true,
            sequenceNum: seq,
          };

          fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).catch((err) => console.error("[Realtime] POST failed:", err));
          break;
        }

        case "error": {
          console.error("[Realtime] API error:", event.error);
          setStatus("error");
          break;
        }
      }
    },
    [sessionId, sourceLang, onInterimTranscript, onFinalTranscript]
  );

  const start = useCallback(async () => {
    setStatus("connecting");
    try {
      const ephemeralKey = await fetchEphemeralToken();

      // Get microphone
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
        },
      });

      // Create PeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      for (const track of micStream.getTracks()) {
        pc.addTrack(track, micStream);
      }

      // Data channel for receiving transcription events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("message", (e: MessageEvent) => {
        handleRealtimeEvent(JSON.parse(e.data as string));
      });

      // SDP negotiation with OpenAI Realtime
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

      // Wait for data channel to open
      await new Promise<void>((resolve) => {
        if (dc.readyState === "open") {
          resolve();
          return;
        }
        dc.addEventListener("open", () => resolve(), { once: true });
      });

      // Configure session: transcription only, no AI response
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
