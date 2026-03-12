# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinguAI — Free, open web app for AI-powered simultaneous translation at live events. "Bring your own API Key" model: users provide their own OpenAI (required) and ElevenLabs (optional) API keys. A speaker records their talk via the browser (OpenAI Realtime API for STT via WebSocket). Transcribed text is translated server-side in real time and broadcast to listener smartphones via Supabase Realtime channels. Listeners see the live transcript and hear the translation via TTS.

**Session flow:** Speaker creates session → QR code displayed → listeners scan with smartphone → choose target language → see live transcript + hear TTS.

## Commands

```bash
npm run dev          # Frontend only (Vite dev server, port 5173)
npm run dev:api      # Supabase Edge Functions locally (supabase functions serve)
npm run dev:full     # Both concurrently (recommended for full-stack dev)
npm run build        # tsc -b && vite build
npm run typecheck    # tsc --noEmit
vercel deploy        # Preview deployment (frontend only)
vercel deploy --prod # Production deployment (frontend only)
supabase functions deploy <name>  # Deploy individual Edge Function
supabase secrets set KEY=value    # Set Edge Function secrets
```

Frontend calls Edge Functions via `${VITE_SUPABASE_URL}/functions/v1/<name>` (see `src/lib/api.ts`).

## Tech Stack

- **Frontend:** React 19 + React Router 7 (SPA), TypeScript strict, Tailwind CSS v4, Vite
- **Realtime:** Supabase Realtime channels (broadcast + presence) — NOT SSE/Vercel KV
- **STT:** OpenAI Realtime API GA via WebSocket (`gpt-4o-transcribe`, PCM16 audio worklet)
- **Translation:** OpenAI `gpt-4o` with Structured Output JSON (one call translates to all target languages)
- **TTS:** Multi-provider — Browser Web Speech API (free, default), OpenAI `gpt-4o-mini-tts`, or ElevenLabs `eleven_multilingual_v2`
- **Backend:** Supabase Edge Functions (`supabase/functions/`, Deno runtime)
- **Database/Auth:** Supabase (Postgres + Auth + Realtime)
- **API Key Management:** User-owned API keys (OpenAI, ElevenLabs) stored encrypted (AES-256-GCM) in `api_keys` table
- **PWA:** vite-plugin-pwa with workbox

## Architecture

```
Speaker Browser                     Supabase Edge Functions         Listener Smartphones
┌─────────────────┐                ┌──────────────────┐           ┌──────────────────┐
│ Mic → PCM16     │                │                  │           │                  │
│ AudioWorklet    │  WebSocket     │ translate        │  Supabase │ useChannel hook  │
│   ↓             │  (OpenAI)     │   ↓ gpt-4o       │  Realtime │   ↓              │
│ OpenAI Realtime │──────────────→│   ↓ JSON out     │  broadcast│ TranscriptView   │
│ Transcription   │                │                  │──────────→│   ↓              │
│   ↓             │  POST         │ tts              │           │ useTTS hook      │
│ useRealtime     │──fn URL──────→│ realtime-token   │           │ (browser/openai) │
│ Transcription   │  translate     │ api-keys         │           │                  │
│                 │                │ validate-key     │           │ Presence tracking│
│ Supabase channel│  broadcast     │ transcribe       │           │ (listener count) │
│ (broadcast)     │──────────────→│                  │           │                  │
└─────────────────┘                └──────────────────┘           └──────────────────┘
```

### Data Flow
1. Speaker starts recording → `POST .../functions/v1/realtime-token` → ephemeral client secret via `/v1/realtime/client_secrets`
2. WebSocket to `wss://api.openai.com/v1/realtime?intent=transcription` (GA API, no beta header)
3. PCM16 audio streamed via AudioWorklet → `input_audio_buffer.append`
4. VAD detects speech end → `conversation.item.input_audio_transcription.completed`
5. Speaker browser → `POST .../functions/v1/translate` with transcript text
6. Edge Function translates to all target languages via gpt-4o Structured Output
7. Speaker broadcasts `TranslationSegment` via Supabase channel
8. Listeners receive segment, display text, enqueue TTS

### Key: Supabase Channel Events
- `segment` — final translated segment (TranslationSegment)
- `interim` — partial transcription text (original language, for live typing effect)
- `speech_state` — `{ speaking: boolean }` for "spricht…" indicator on listeners

## Key Files

### Routes (SPA, React Router 7)
- `src/routes/home.tsx` — Landing page
- `src/routes/dashboard.tsx` — Session list + create form (authenticated)
- `src/routes/speaker.tsx` — Speaker dashboard: QR code, transcript, recording controls, session prep modal
- `src/routes/session.tsx` — Listener page: language selection → live transcript → TTS settings

### Hooks (core logic)
- `src/hooks/useRealtimeTranscription.ts` — WebSocket to OpenAI Realtime API (GA), PCM16 audio capture via AudioWorklet, VAD config, speech state events. Passes Supabase JWT for user-key resolution.
- `src/hooks/useChannel.ts` — Supabase Realtime channel: broadcast listener (segment/interim/speech_state) + presence tracking
- `src/hooks/useTTS.ts` — Queue-based TTS with dedup. Supports `ttsProvider` option (`openai` | `elevenlabs` | `browser`). Server modes pass auth header for user-key resolution.
- `src/hooks/useAuth.ts` — Supabase Auth
- `src/hooks/useApiKeys.ts` — CRUD for user API keys (fetch, save, delete, validate). Used in Settings page.

### Supabase Edge Functions (`supabase/functions/` — Deno runtime)
- `realtime-token/index.ts` — Creates ephemeral client secret via `POST /v1/realtime/client_secrets` (GA API). Supports user API key via auth header.
- `translate/index.ts` — Batch translates text to all target languages via gpt-4o. Per-request OpenAI client with user key.
- `tts/index.ts` — Multi-provider TTS proxy. Dispatches to OpenAI (`gpt-4o-mini-tts`) or ElevenLabs (`eleven_multilingual_v2`) based on `provider` body param.
- `transcribe/index.ts` — Chunked audio transcription proxy. Supports diarization mode.
- `api-keys/index.ts` — CRUD for encrypted API keys (`GET/POST/DELETE`). Validates keys on save.
- `validate-key/index.ts` — Stateless key validation endpoint.
- `_shared/encryption.ts` — AES-256-GCM encryption/decryption via Web Crypto API.
- `_shared/auth.ts` — Supabase JWT verification + user API key resolution with env-var fallback.
- `_shared/cors.ts` — CORS headers and response helpers (cross-origin: Vercel frontend → Supabase Edge Functions).

### Types
- `src/types/session.ts` — `SupportedLanguage`, `TranslationSegment`, `TTSVoiceSettings`, `TTSVoice`
- `src/types/api.ts` — `TranslateRequestBody`, `TranslateResponse`, `GlossaryEntry`
- `src/types/database.ts` — Supabase generated types + `ApiKeyRow`, `ApiProvider`, `TTSProvider`

## Conventions

- **Language:** Code in English (variables, functions), UI text in German
- **Components:** Functional with hooks, no class components
- **Styling:** Tailwind CSS v4 utility classes in JSX, no separate CSS files. Custom variant: `@custom-variant dark (&:is(.dark, .dark *))`. Primary color: indigo (`oklch(0.51 0.22 264)`)
- **Theming:** ThemeProvider in `src/contexts/ThemeContext.tsx` applies `.dark` to `<html>`. Use semantic CSS variables (`text-foreground`, `bg-background`, `bg-muted/40`, `border-border`), NOT hardcoded dark classes
- **Types:** Central types in `src/types/`, no `any`. Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- **Path alias:** `~/` maps to `src/` (configured in tsconfig and vite)
- **State:** Complex logic encapsulated in custom hooks. Callback refs pattern used extensively to avoid stale closures in WebSocket/channel handlers
- **Error handling:** Only at system boundaries (API responses, WebSocket errors). No defensive checks internally
- **Icons:** lucide-react
- **UI components:** shadcn/ui in `src/components/ui/`

## Environment Variables

### Frontend (Vercel env vars)
```bash
VITE_SUPABASE_URL=https://...supabase.co # Client-side: Supabase + Edge Function base URL
VITE_SUPABASE_ANON_KEY=eyJ...            # Client-side: Supabase anon key
VITE_APP_URL=https://your-app.vercel.app # Client-side: QR code URL generation
```

### Edge Functions (Supabase secrets via `supabase secrets set`)
```bash
API_KEY_ENCRYPTION_SECRET=<64-hex-chars> # AES-256-GCM key for encrypting user API keys
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase
# No OPENAI_API_KEY needed — always resolved from authenticated user's stored key
```

## OpenAI Audio API Reference (knowledge/)

The `knowledge/` directory contains OpenAI API documentation for all audio features used in this project. **Consult these files when implementing or modifying audio-related functionality:**

- `knowledge/realtime-transcription.md` — Realtime API transcription sessions (WebSocket, VAD, session config, delta/completed events)
- `knowledge/speech-to-text.md` — STT overview: transcription models (`gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `whisper-1`), diarization (`gpt-4o-transcribe-diarize`), streaming, prompting, timestamps
- `knowledge/create-transcriptions.md` — `POST /audio/transcriptions` endpoint: parameters, response formats (json, diarized_json, verbose_json), usage stats
- `knowledge/create-translations.md` — `POST /audio/translations` endpoint: translates audio to English (whisper-1 only)
- `knowledge/text-to-speech.md` — TTS overview: models (`gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`), 13 built-in voices, `instructions` parameter, streaming, custom voices, output formats
- `knowledge/create-speech.md` — `POST /audio/speech` endpoint: parameters (input, model, voice, instructions, response_format, speed, stream_format)

### Key facts from the docs
- **TTS voices:** alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse, marin, cedar (marin/cedar recommended for quality)
- **TTS instructions:** Only work with `gpt-4o-mini-tts`, NOT with `tts-1`/`tts-1-hd`
- **Realtime transcription models:** `whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`
- **Realtime audio formats:** `audio/pcm` (24kHz), `audio/pcmu` (G.711 μ-law), `audio/pcma` (G.711 A-law)
- **Realtime API:** Uses GA interface (no `OpenAI-Beta` header). Session config uses `session.update` with `type: "transcription"` and nested `audio.input.*` structure. Token via `POST /v1/realtime/client_secrets`
- **Realtime events:** `conversation.item.input_audio_transcription.delta` (incremental) and `.completed` (final)
- **Noise reduction:** `near_field` (default) or `far_field`
- **Max TTS input:** 4096 characters
- **Max upload:** 25 MB for transcription files

## Important Patterns

### Callback Ref Pattern (used in hooks)
WebSocket and Supabase channel handlers are created once but need access to latest props. All callbacks and dependencies are stored in refs and read inside the handler:
```typescript
const onSegmentRef = useRef(onSegment);
onSegmentRef.current = onSegment; // updated every render
// In handler: onSegmentRef.current(payload) — always latest
```

### TTS Voice Instructions (gpt-4o-mini-tts)
The `instructions` parameter controls accent, tone, emotional range, speed, intonation, impressions, and whispering. Built from `TTSVoiceSettings` in `useTTS.ts → buildTTSInstructions()`.

### PCM16 Audio Worklet
Speaker audio is captured at 24kHz via `AudioWorkletNode` using `/public/pcm16-worklet.js`, converted to base64, and sent over WebSocket to OpenAI.
