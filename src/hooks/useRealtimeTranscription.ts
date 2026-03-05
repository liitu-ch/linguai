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
  onSpeechStart?: () => void;
  onSpeechStop?: () => void;
}

type Status = "idle" | "connecting" | "active" | "error";

/**
 * Converts an ArrayBuffer of PCM16 audio to a base64 string.
 */
function pcm16ToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Build a prompt for the transcription model from glossary + context.
 * Helps gpt-4o-transcribe recognize domain-specific terminology.
 */
function buildTranscriptionPrompt(
  glossary?: GlossaryEntry[],
  context?: string
): string {
  const parts: string[] = [];

  if (glossary && glossary.length > 0) {
    const terms = glossary.map((g) => g.source).join(", ");
    parts.push(
      `The speaker may use these domain-specific terms — transcribe them exactly: ${terms}`
    );
  }

  if (context?.trim()) {
    parts.push(`Topic context: ${context.trim().slice(0, 1500)}`);
  }

  return parts.join("\n");
}

export function useRealtimeTranscription({
  sourceLang,
  targetLangs,
  channel,
  glossary,
  context,
  silenceDurationMs = 200,
  vadThreshold = 0.5,
  onInterimTranscript,
  onFinalTranscript,
  onSpeechStart,
  onSpeechStop,
}: UseRealtimeTranscriptionOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const seqRef = useRef(0);
  const interimAccRef = useRef("");
  const [status, setStatus] = useState<Status>("idle");

  // Stable refs — frozen at start(), read in callbacks
  const glossaryRef = useRef(glossary);
  const contextRef = useRef(context);
  const silenceDurationMsRef = useRef(silenceDurationMs);
  const vadThresholdRef = useRef(vadThreshold);
  glossaryRef.current = glossary;
  contextRef.current = context;
  silenceDurationMsRef.current = silenceDurationMs;
  vadThresholdRef.current = vadThreshold;

  const channelRef = useRef(channel);
  channelRef.current = channel;
  const onInterimRef = useRef(onInterimTranscript);
  onInterimRef.current = onInterimTranscript;
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;
  const onSpeechStartRef = useRef(onSpeechStart);
  onSpeechStartRef.current = onSpeechStart;
  const onSpeechStopRef = useRef(onSpeechStop);
  onSpeechStopRef.current = onSpeechStop;
  const sourceLangRef = useRef(sourceLang);
  sourceLangRef.current = sourceLang;
  const targetLangsRef = useRef(targetLangs);
  targetLangsRef.current = targetLangs;

  const fetchEphemeralToken = useCallback(async (): Promise<string> => {
    const res = await fetch("/api/realtime-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: sourceLangRef.current }),
    });
    if (!res.ok) throw new Error("Failed to fetch ephemeral token");
    const data = await res.json();
    return data.token as string;
  }, []);

  const handleRealtimeEvent = useCallback(
    (event: Record<string, unknown>) => {
      switch (event.type) {
        case "input_audio_buffer.speech_started": {
          onSpeechStartRef.current?.();
          break;
        }

        case "input_audio_buffer.speech_stopped": {
          onSpeechStopRef.current?.();
          break;
        }

        case "conversation.item.input_audio_transcription.delta": {
          const delta = event.delta as string | undefined;
          if (delta) {
            interimAccRef.current += delta;
            onInterimRef.current?.(interimAccRef.current);

            // Broadcast interim text to listeners
            channelRef.current?.send({
              type: "broadcast",
              event: "interim",
              payload: { text: interimAccRef.current },
            });
          }
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          const transcript = event.transcript as string | undefined;
          interimAccRef.current = "";
          if (!transcript?.trim()) break;

          const seq = ++seqRef.current;
          onFinalRef.current?.(transcript, seq);

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

      // 1. Open WebSocket to OpenAI transcription endpoint
      const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?intent=transcription",
        [
          "realtime",
          `openai-insecure-api-key.${ephemeralKey}`,
          "openai-beta.realtime-v1",
        ]
      );
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        ws.addEventListener("open", () => resolve(), { once: true });
        ws.addEventListener("error", () => reject(new Error("WebSocket connection failed")), { once: true });
      });

      // Build prompt from glossary + context for better transcription accuracy
      const prompt = buildTranscriptionPrompt(
        glossaryRef.current,
        contextRef.current
      );

      // 2. Configure transcription session
      ws.send(
        JSON.stringify({
          type: "transcription_session.update",
          session: {
            input_audio_format: "pcm16",
            input_audio_transcription: {
              model: "gpt-4o-transcribe",
              language: sourceLangRef.current,
              ...(prompt ? { prompt } : {}),
            },
            turn_detection: {
              type: "server_vad",
              threshold: vadThresholdRef.current,
              silence_duration_ms: silenceDurationMsRef.current,
              prefix_padding_ms: 300,
            },
            input_audio_noise_reduction: {
              type: "near_field",
            },
          },
        })
      );

      // 3. Handle incoming events
      ws.addEventListener("message", (e: MessageEvent) => {
        handleRealtimeEvent(JSON.parse(e.data as string));
      });

      ws.addEventListener("close", () => {
        if (status === "active") {
          setStatus("idle");
        }
      });

      // 4. Capture microphone audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      micStreamRef.current = micStream;

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/pcm16-worklet.js");

      const source = audioContext.createMediaStreamSource(micStream);
      const workletNode = new AudioWorkletNode(audioContext, "pcm16-processor");

      workletNode.port.onmessage = (e: MessageEvent) => {
        if (ws.readyState === WebSocket.OPEN) {
          const base64Audio = pcm16ToBase64(e.data as ArrayBuffer);
          ws.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: base64Audio,
            })
          );
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      setStatus("active");
    } catch (err) {
      console.error("[Realtime] Setup failed:", err);
      setStatus("error");
    }
  }, [fetchEphemeralToken, handleRealtimeEvent]);

  const stop = useCallback(() => {
    // Close WebSocket
    wsRef.current?.close();
    wsRef.current = null;

    // Stop microphone
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;

    // Close audio context
    audioContextRef.current?.close();
    audioContextRef.current = null;

    setStatus("idle");
  }, []);

  return { start, stop, status };
}
