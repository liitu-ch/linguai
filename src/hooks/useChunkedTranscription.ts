import { useRef, useState, useCallback } from "react";
import type { SupportedLanguage } from "~/types/session.ts";
import type { TranslateRequestBody, TranslateResponse, GlossaryEntry } from "~/types/api.ts";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseChunkedTranscriptionOptions {
  mode: "chunked" | "diarize";
  sourceLang: SupportedLanguage;
  targetLangs: SupportedLanguage[];
  channel: RealtimeChannel | null;
  glossary?: GlossaryEntry[];
  context?: string;
  chunkIntervalMs?: number;
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string, seq: number) => void;
  onSpeechStart?: () => void;
  onSpeechStop?: () => void;
}

type Status = "idle" | "connecting" | "active" | "error";

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

export function useChunkedTranscription({
  mode,
  sourceLang,
  targetLangs,
  channel,
  glossary,
  context,
  chunkIntervalMs = 5000,
  onInterimTranscript,
  onFinalTranscript,
  onSpeechStart,
  onSpeechStop,
}: UseChunkedTranscriptionOptions) {
  const micStreamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const seqRef = useRef(0);
  const mimeTypeRef = useRef("");
  const [status, setStatus] = useState<Status>("idle");

  // Stable refs
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
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const glossaryRef = useRef(glossary);
  glossaryRef.current = glossary;
  const contextRef = useRef(context);
  contextRef.current = context;

  const sendChunk = useCallback(async (blob: Blob) => {
    if (blob.size < 1000) return; // skip tiny chunks (silence)

    onSpeechStartRef.current?.();

    try {
      const isDiarize = modeRef.current === "diarize";
      const model = isDiarize ? "gpt-4o-transcribe-diarize" : "gpt-4o-transcribe";
      const prompt = isDiarize
        ? ""
        : buildTranscriptionPrompt(glossaryRef.current, contextRef.current);

      // Convert blob to base64 for JSON transport
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64,
          mimeType: blob.type || "audio/webm",
          model,
          language: sourceLangRef.current,
          prompt: prompt || undefined,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[Chunked] Transcription failed:", res.status, errText);
        return;
      }

      const data = await res.json();

      if (isDiarize && data.segments) {
        for (const seg of data.segments as Array<{ speaker: string; text: string }>) {
          if (!seg.text?.trim()) continue;
          const seq = ++seqRef.current;
          const labeledText = `[${seg.speaker}] ${seg.text.trim()}`;
          onFinalRef.current?.(labeledText, seq);
          translateAndBroadcast(labeledText, seq);
        }
      } else if (data.text?.trim()) {
        const seq = ++seqRef.current;
        onFinalRef.current?.(data.text, seq);

        channelRef.current?.send({
          type: "broadcast",
          event: "interim",
          payload: { text: data.text },
        });

        translateAndBroadcast(data.text, seq);
      }
    } catch (err) {
      console.error("[Chunked] Processing error:", err);
    } finally {
      onSpeechStopRef.current?.();
    }
  }, []);

  const translateAndBroadcast = useCallback((text: string, seq: number) => {
    const body: TranslateRequestBody = {
      text: text.trim(),
      sourceLang: sourceLangRef.current,
      targetLangs: targetLangsRef.current,
      sequenceNum: seq,
      glossary: glossaryRef.current?.length ? glossaryRef.current : undefined,
      context: contextRef.current?.trim() || undefined,
    };

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data: TranslateResponse) => {
        channelRef.current?.send({
          type: "broadcast",
          event: "segment",
          payload: data.segment,
        });
      })
      .catch((err) => console.error("[Chunked] translate failed:", err));
  }, []);

  /** Start a fresh MediaRecorder, accumulate data in chunksRef */
  const startRecorder = useCallback((stream: MediaStream) => {
    chunksRef.current = [];
    const mimeType = mimeTypeRef.current;

    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
    });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.start();
  }, []);

  /** Stop current recorder, collect the complete blob, send it, then start a new one */
  const rotateRecorder = useCallback(() => {
    const recorder = recorderRef.current;
    const stream = micStreamRef.current;
    if (!recorder || !stream || recorder.state === "inactive") return;

    // When we stop, ondataavailable fires one final time with remaining data
    recorder.onstop = () => {
      if (chunksRef.current.length > 0) {
        const completeBlob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || "audio/webm",
        });
        sendChunk(completeBlob);
      }
      // Start a fresh recorder for the next interval
      if (micStreamRef.current) {
        startRecorder(micStreamRef.current);
      }
    };

    recorder.stop();
  }, [sendChunk, startRecorder]);

  const start = useCallback(async () => {
    setStatus("connecting");
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      micStreamRef.current = micStream;

      // Determine best mime type
      mimeTypeRef.current = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      // Start first recorder
      startRecorder(micStream);

      // Rotate (stop → send → restart) at each interval
      intervalRef.current = setInterval(rotateRecorder, chunkIntervalMs);

      setStatus("active");
    } catch (err) {
      console.error("[Chunked] Setup failed:", err);
      setStatus("error");
    }
  }, [chunkIntervalMs, startRecorder, rotateRecorder]);

  const stop = useCallback(() => {
    // Clear rotation interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop and send final chunk
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const completeBlob = new Blob(chunksRef.current, {
            type: mimeTypeRef.current || "audio/webm",
          });
          sendChunk(completeBlob);
        }
      };
      recorder.stop();
    }
    recorderRef.current = null;

    // Stop microphone
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;

    setStatus("idle");
  }, [sendChunk]);

  return { start, stop, status };
}
