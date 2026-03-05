# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinguAI — Web app for AI-powered simultaneous translation at live events. A speaker records their talk via the browser (OpenAI Realtime API for STT via WebSocket). Transcribed text is translated server-side in real time and broadcast to listener smartphones via Supabase Realtime channels. Listeners see the live transcript and hear the translation via TTS.

**Session flow:** Speaker creates session → QR code displayed → listeners scan with smartphone → choose target language → see live transcript + hear TTS.

## Commands

```bash
npm run dev          # Frontend only (Vite dev server, port 5173)
npm run dev:api      # Vercel API routes only (port 3001)
npm run dev:full     # Both concurrently (recommended for full-stack dev)
vercel dev           # Alternative: Vercel CLI handles both
npm run build        # tsc -b && vite build
npm run typecheck    # tsc --noEmit
vercel deploy        # Preview deployment
vercel deploy --prod # Production deployment
```

The Vite dev server proxies `/api` requests to `localhost:3001` (configured in `vite.config.ts`).

## Tech Stack

- **Frontend:** React 19 + React Router 7 (SPA), TypeScript strict, Tailwind CSS v4, Vite
- **Realtime:** Supabase Realtime channels (broadcast + presence) — NOT SSE/Vercel KV
- **STT:** OpenAI Realtime API via WebSocket (`gpt-4o-transcribe`, PCM16 audio worklet)
- **Translation:** OpenAI `gpt-4o` with Structured Output JSON (one call translates to all target languages)
- **TTS:** Hybrid — Browser Web Speech API (free, default) or OpenAI `gpt-4o-mini-tts` (premium, supports voice instructions)
- **Backend:** Vercel Serverless Functions (`api/` directory)
- **Database/Auth:** Supabase (Postgres + Auth + Realtime)
- **PWA:** vite-plugin-pwa with workbox

## Architecture

```
Speaker Browser                     Vercel Serverless              Listener Smartphones
┌─────────────────┐                ┌──────────────┐              ┌──────────────────┐
│ Mic → PCM16     │                │              │              │                  │
│ AudioWorklet    │  WebSocket     │ /api/        │   Supabase   │ useChannel hook  │
│   ↓             │  (OpenAI)     │ translate    │   Realtime   │   ↓              │
│ OpenAI Realtime │──────────────→│   ↓ gpt-4o   │   broadcast  │ TranscriptView   │
│ Transcription   │                │   ↓ JSON out │──────────────→│   ↓              │
│   ↓             │  POST         │              │              │ useTTS hook      │
│ useRealtime     │──/api/────────→│ /api/tts     │              │ (browser/openai) │
│ Transcription   │  translate     │              │              │                  │
│                 │                │ /api/        │              │ Presence tracking│
│ Supabase channel│  broadcast     │ realtime-    │              │ (listener count) │
│ (broadcast)     │──────────────→│ token        │              │                  │
└─────────────────┘                └──────────────┘              └──────────────────┘
```

### Data Flow
1. Speaker starts recording → `POST /api/realtime-token` → ephemeral token
2. WebSocket to `wss://api.openai.com/v1/realtime?intent=transcription`
3. PCM16 audio streamed via AudioWorklet → `input_audio_buffer.append`
4. VAD detects speech end → `conversation.item.input_audio_transcription.completed`
5. Speaker browser → `POST /api/translate` with transcript text
6. Server translates to all target languages via gpt-4o Structured Output
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
- `src/hooks/useRealtimeTranscription.ts` — WebSocket to OpenAI Realtime API, PCM16 audio capture via AudioWorklet, VAD config, speech state events
- `src/hooks/useChannel.ts` — Supabase Realtime channel: broadcast listener (segment/interim/speech_state) + presence tracking
- `src/hooks/useTTS.ts` — Queue-based TTS with dedup (browser SpeechSynthesis or OpenAI gpt-4o-mini-tts with voice instructions)
- `src/hooks/useAuth.ts` — Supabase Auth

### API Routes (`api/` — Vercel Serverless)
- `api/realtime-token.ts` — Creates ephemeral token for OpenAI Realtime transcription session
- `api/translate.ts` — Batch translates text to all target languages via gpt-4o (30s timeout)
- `api/tts.ts` — OpenAI TTS proxy (gpt-4o-mini-tts, supports `instructions` for voice control)

### Types
- `src/types/session.ts` — `SupportedLanguage`, `TranslationSegment`, `TTSVoiceSettings`, `TTSVoice`
- `src/types/api.ts` — `TranslateRequestBody`, `TranslateResponse`, `GlossaryEntry`
- `src/types/database.ts` — Supabase generated types

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

```bash
OPENAI_API_KEY=sk-...                    # Server-side: STT, Translation, TTS
VITE_SUPABASE_URL=https://...supabase.co # Client-side: Supabase
VITE_SUPABASE_ANON_KEY=eyJ...            # Client-side: Supabase anon key
VITE_APP_URL=https://your-app.vercel.app # Client-side: QR code URL generation
```

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
