# KI-Simultanübersetzung — Prototyp

## 1. Projektbeschreibung

Web-App für KI-gestützte Simultanübersetzung bei Präsenz-Events. Ein Speaker nimmt seinen Vortrag über den Browser auf (OpenAI Realtime API / STT via WebRTC). Der transkribierte Text wird serverseitig in Echtzeit in die Zielsprachen übersetzt und via Server-Sent Events (SSE) an Zuhörer-Smartphones gestreamt. Zuhörer sehen das Live-Transkript und hören die Übersetzung per Text-to-Speech.

**Ziel-Event:** ~90 Teilnehmer, 3 Gruppen à 30, Sprachen: Englisch (Quelle) → Spanisch, Portugiesisch, Malaiisch (+ ggf. Tschechisch, Slowakisch).

**Session-Flow:**
1. Speaker erstellt Session mit Quell- und Zielsprachen
2. QR-Code wird angezeigt — Zuhörer scannen ihn mit dem Smartphone
3. Zuhörer wählen ihre Zielsprache, sehen das Live-Transkript und hören die Übersetzung

---

## 2. Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Build | Vite |
| Framework | React 19 + React Router 7 (SPA-Modus) |
| Sprache | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| STT | OpenAI Realtime API (WebRTC, `gpt-4o-realtime-preview`) |
| Übersetzung | OpenAI API (`gpt-4o`, Structured Output JSON) |
| TTS Standard | Browser Web Speech API (`SpeechSynthesis`) |
| TTS Premium | OpenAI TTS API (`tts-1`) |
| Echtzeit | Server-Sent Events (SSE) via Vercel Edge Functions |
| State Store | Vercel KV (Upstash Redis) |
| QR-Code | `qrcode.react` |
| IDs | `nanoid` |
| Hosting | Vercel (Serverless + Edge Functions) |

---

## 3. Architektur

```
Speaker (Browser)                    Vercel (Server)                    Clients (Smartphones)
┌──────────────┐                    ┌──────────────────┐               ┌──────────────────┐
│ Mikrofon     │                    │                  │               │                  │
│   ↓          │  POST /api/       │ POST /api/       │    SSE        │ EventSource      │
│ OpenAI       │  realtime-token   │ translate        │    Stream     │   ↓              │
│ Realtime API │─────────────────→ │   ↓ übersetzen   │──────────────→│ Transkript-View  │
│ (WebRTC/STT) │                   │   ↓ in KV speich.│               │   ↓              │
│   ↓          │  POST /api/      │                  │               │ TTS Playback     │
│ Text-Chunks  │──translate──────→│ GET /api/stream  │               │ (Browser/OpenAI) │
│              │                   │ ?sessionId&lang  │               │                  │
│ QR-Code      │                   │ (Edge Function)  │               │ Sprachwahl nach  │
│ Anzeige      │                   │ pollt KV → SSE   │               │ QR-Code Scan     │
└──────────────┘                    └──────────────────┘               └──────────────────┘
```

### Datenfluss im Detail
1. Speaker erstellt Session → `POST /api/session` → erhält Session-ID
2. Speaker startet Aufnahme → `POST /api/realtime-token` → Ephemeral Token → WebRTC zu OpenAI Realtime API
3. Realtime API transkribiert Sprache (VAD-basiert, ~600ms Silence-Detection)
4. Bei finalem Segment: Speaker-Browser → `POST /api/translate` mit Text + Sequence-Nummer
5. Server übersetzt in alle Zielsprachen (ein `gpt-4o` Call mit Structured Output) → `ZADD` in Vercel KV Sorted Set
6. SSE Edge Function pollt KV alle ~500ms via `ZRANGEBYSCORE(lastSeq+1, +inf)` → pusht neue Segmente
7. Client zeigt Text an + TTS-Queue spielt Übersetzung ab

### Warum SSE statt WebSockets
Vercel unterstützt keine persistenten WebSocket-Verbindungen. SSE funktioniert auf Vercel Edge Functions, ist unidirektional (Server→Client) — genau was die Zuhörer brauchen. Auto-Reconnect ist in `EventSource` eingebaut.

### Warum Vercel KV (Redis)
Vercel Serverless Functions sind stateless. Wenn der Speaker Text sendet, landet das in einer Function-Instanz. Die SSE-Connections laufen in anderen Edge-Function-Instanzen. Vercel KV (Upstash Redis) dient als gemeinsamer State Store zwischen diesen Instanzen.

---

## 4. Projektstruktur

```
KI-SIMULTAN/
├── src/
│   ├── routes/
│   │   ├── home.tsx                    # Session erstellen (CreateSessionForm)
│   │   ├── speaker.$sessionId.tsx      # Speaker-Dashboard + QR-Code + Transkript
│   │   └── session.$sessionId.tsx      # Client/Zuhörer: Sprachwahl → Transkript → TTS
│   ├── components/
│   │   ├── CreateSessionForm.tsx       # Formular: Name, Quellsprache, Zielsprachen
│   │   ├── QRCodeDisplay.tsx           # QR-Code + Session-URL anzeigen
│   │   ├── RecordingControls.tsx       # Start/Stop Aufnahme Button + Status
│   │   ├── TranscriptView.tsx          # Live-Transkript (scrollt automatisch)
│   │   ├── LanguageSelector.tsx        # Zielsprache wählen (Client-Seite)
│   │   └── TTSControls.tsx             # TTS Modus (Browser/OpenAI), Lautstärke, An/Aus
│   ├── hooks/
│   │   ├── useRealtimeTranscription.ts # OpenAI Realtime API (WebRTC + VAD)
│   │   ├── useSSE.ts                   # EventSource + Auto-Reconnect + Dedup
│   │   └── useTTS.ts                   # Hybrid TTS Queue (Browser + OpenAI)
│   ├── lib/
│   │   ├── openai.ts                   # OpenAI Client Helpers (server-side)
│   │   ├── session.ts                  # Session API Calls (client-side)
│   │   └── languages.ts               # Unterstützte Sprachen, Labels, BCP-47 Tags
│   ├── types/
│   │   ├── session.ts                  # TranslationSegment, SessionMeta, KV_KEYS
│   │   └── api.ts                      # Request/Response Types, SSEEvent
│   ├── root.tsx
│   └── entry.client.tsx
├── api/                                # Vercel Serverless/Edge Functions
│   ├── realtime-token.ts               # POST: Ephemeral Token (Node.js)
│   ├── session/
│   │   ├── index.ts                    # POST: Session erstellen (Node.js)
│   │   └── [id].ts                     # GET: Session-Info (Node.js)
│   ├── translate.ts                    # POST: Batch-Translate + KV Store (Node.js)
│   ├── stream.ts                       # GET: SSE Stream (Edge Runtime)
│   └── tts.ts                          # POST: OpenAI TTS Proxy (Edge Runtime)
├── public/
├── .env.example
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vercel.json
└── tailwind.config.ts
```

---

## 5. Datenmodell

### TypeScript Types

```typescript
// src/types/session.ts

export type SupportedLanguage = "en" | "es" | "pt" | "ms" | "cs" | "sk";

export interface TranslationSegment {
  id: string;                                          // nanoid
  sessionId: string;
  sequenceNum: number;                                 // monoton steigend
  originalText: string;
  originalLang: SupportedLanguage;
  translations: Partial<Record<SupportedLanguage, string>>;
  timestampMs: number;
  isFinal: boolean;                                    // false = interim, true = committed
}

export interface SessionMeta {
  sessionId: string;
  title: string;
  sourceLang: SupportedLanguage;
  targetLanguages: SupportedLanguage[];
  speakerName?: string;
  createdAt: number;
  expiresAt: number;
  status: "active" | "ended";
}

export const KV_KEYS = {
  sessionMeta: (sid: string) => `session:${sid}:meta`,
  segments: (sid: string) => `session:${sid}:segments`,
  latestSeq: (sid: string) => `session:${sid}:latest`,
  TTL_SECONDS: 6 * 60 * 60,
} as const;
```

```typescript
// src/types/api.ts

export interface TranslateRequestBody {
  sessionId: string;
  text: string;
  sourceLang: SupportedLanguage;
  isFinal: boolean;
  sequenceNum: number;
}

export interface TranslateResponse {
  segment: TranslationSegment;
}

export type SSEEvent =
  | { type: "segment"; data: TranslationSegment }
  | { type: "heartbeat"; ts: number }
  | { type: "session_end" };
```

### Vercel KV (Redis) Key-Schema

```
session:{id}:meta      → JSON String: SessionMeta
session:{id}:segments  → Sorted Set (score=sequenceNum): JSON-stringified TranslationSegment
session:{id}:latest    → String: latest sequenceNum (für effizientes Polling)
```

Alle Keys haben TTL von 6 Stunden, refreshed bei jedem Write.

`ZRANGEBYSCORE(key, lastSeq+1, +inf)` liefert exakt "alles nach Sequence N" — ideal für SSE-Polling und lückenlosen Client-Reconnect.

---

## 6. API Endpoints

| Methode | Pfad | Runtime | Beschreibung |
|---------|------|---------|-------------|
| `POST` | `/api/realtime-token` | Node.js | Erstellt Ephemeral Token für OpenAI Realtime API. Token läuft nach 60s ab. |
| `POST` | `/api/session` | Node.js | Session erstellen. Body: `{ title, sourceLang, targetLanguages[], speakerName }`. Returns `SessionMeta`. |
| `GET` | `/api/session/[id]` | Node.js | Session-Info abrufen (für Client-Seite: Sprachen, Status). |
| `POST` | `/api/translate` | Node.js (30s) | Empfängt transkribiertes Segment, übersetzt in alle Zielsprachen, speichert in KV. |
| `GET` | `/api/stream` | **Edge** | SSE-Stream. Query-Params: `?sessionId=...&lang=es&lastSeq=-1`. Pollt KV, pusht Segmente. |
| `POST` | `/api/tts` | Edge | Generiert OpenAI TTS Audio. Body: `{ text, lang, voice? }`. Returns `audio/mpeg` Stream. |

---

## 7. Schlüssel-Patterns

### 7.1 SSE Edge Function (`api/stream.ts`)

```typescript
export const config = { runtime: "edge" };

// Pattern: Edge Function hält Connection, pollt KV alle 500ms
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const lang = url.searchParams.get("lang");
  let lastSeq = parseInt(url.searchParams.get("lastSeq") ?? "-1", 10);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent, id?: string) => {
        let chunk = "";
        if (id) chunk += `id: ${id}\n`;
        chunk += `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      send({ type: "heartbeat", ts: Date.now() }); // Flush headers sofort

      const TIMEOUT_MS = 20_000; // 20s für Hobby, 300s für Pro
      const deadline = Date.now() + TIMEOUT_MS;

      while (Date.now() < deadline) {
        // Inkrementelles Polling: nur neue Segmente seit lastSeq
        const rawMembers = await kv.zrange(
          KV_KEYS.segments(sessionId),
          lastSeq + 1, "+inf",
          { byScore: true, limit: { offset: 0, count: 20 } }
        );

        for (const raw of rawMembers) {
          const segment = typeof raw === "string" ? JSON.parse(raw) : raw;
          // Nur die gewählte Sprache streamen
          if (segment.translations[lang] !== undefined) {
            send({ type: "segment", data: segment }, segment.id);
            lastSeq = Math.max(lastSeq, segment.sequenceNum);
          }
        }

        await new Promise((r) => setTimeout(r, 500));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no", // Verhindert CDN-Buffering
    },
  });
}
```

### 7.2 OpenAI Realtime API Hook (`src/hooks/useRealtimeTranscription.ts`)

```typescript
// Ephemeral Token Flow:
// 1. POST /api/realtime-token → { token: "eph_..." }
// 2. RTCPeerConnection erstellen
// 3. Mikrofon-Track hinzufügen
// 4. SDP Offer → POST https://api.openai.com/v1/realtime (mit Bearer eph_token)
// 5. SDP Answer setzen
// 6. Data Channel "oai-events" empfängt Transkriptions-Events

// Session-Konfiguration via Data Channel:
dc.send(JSON.stringify({
  type: "session.update",
  session: {
    modalities: ["text"],                    // Kein Audio-Output von OpenAI
    input_audio_transcription: { model: "whisper-1" },
    turn_detection: {
      type: "server_vad",
      silence_duration_ms: 600,              // 600ms Stille = Ende des Segments
      threshold: 0.5,
    },
  },
}));

// Relevante Events:
// - "conversation.item.input_audio_transcription.delta" → Interim Text (nur für Speaker-Anzeige)
// - "conversation.item.input_audio_transcription.completed" → Finaler Text → POST /api/translate
```

### 7.3 Batch-Übersetzung (`api/translate.ts`)

```typescript
// Ein API Call übersetzt in ALLE Zielsprachen gleichzeitig via Structured Output
const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  temperature: 0.1,
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "translations",
      strict: true,
      schema: {
        type: "object",
        properties: Object.fromEntries(
          targetLangs.map((l) => [l, { type: "string" }])
        ),
        required: targetLangs,
        additionalProperties: false,
      },
    },
  },
  messages: [
    {
      role: "system",
      content: `You are a professional simultaneous interpreter.
Translate from ${sourceLangName} into: ${targetList}.
Preserve tone and register. Keep translations concise for spoken delivery.
Respond ONLY with the JSON object.`,
    },
    { role: "user", content: text },
  ],
});

// Returns z.B.: { "es": "Hola mundo", "pt": "Olá mundo", "ms": "Helo dunia" }
```

### 7.4 Hybrid TTS Hook (`src/hooks/useTTS.ts`)

```typescript
// Queue-basiertes TTS: Texte werden nacheinander vorgelesen, kein Overlap
// Deduplizierung via Segment-ID Set (verhindert Replay nach SSE-Reconnect)

// Browser TTS (default, kostenlos):
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = BCP47_TAGS[lang]; // z.B. "es-ES", "pt-PT", "ms-MY"
speechSynthesis.speak(utterance);

// OpenAI TTS (premium):
const res = await fetch("/api/tts", {
  method: "POST",
  body: JSON.stringify({ text, lang, voice: "alloy" }),
});
const blob = await res.blob();
const audio = new Audio(URL.createObjectURL(blob));
audio.play();

// WICHTIG: speechSynthesis.getVoices() gibt initial ein leeres Array zurück.
// Voices erst nach dem "voiceschanged" Event verwenden.
```

### 7.5 Client SSE Hook (`src/hooks/useSSE.ts`)

```typescript
// EventSource mit Auto-Reconnect und Exponential Backoff
// lastSeq als Query-Param → lückenloser Reconnect nach Netzwerk-Unterbruch

const es = new EventSource(`/api/stream?sessionId=${id}&lang=${lang}&lastSeq=${lastSeq}`);

es.addEventListener("segment", (e) => {
  const event = JSON.parse(e.data);
  if (event.data.sequenceNum > lastSeq) {
    lastSeq = event.data.sequenceNum;
    onSegment(event.data);
  }
});

// Bei Fehler: Reconnect mit Backoff (1s, 2s, 4s, 8s ... max 30s)
es.addEventListener("error", () => {
  es.close();
  setTimeout(() => connect(), Math.min(1000 * 2 ** attempt, 30000));
});
```

---

## 8. Environment Variables

```bash
# .env.example

# OpenAI API Key (für Realtime API, Translation, TTS)
OPENAI_API_KEY=sk-...

# Vercel KV (automatisch gesetzt bei Vercel KV Integration)
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...

# App URL (für QR-Code Generierung)
VITE_APP_URL=https://your-app.vercel.app
```

---

## 9. Dev Commands

```bash
# Dependencies installieren
npm install

# Lokale Entwicklung (nur Frontend, ohne API Routes)
npm run dev

# Lokale Entwicklung MIT Vercel API Routes (empfohlen)
vercel dev

# Type-Check
npx tsc --noEmit

# Build
npm run build

# Deploy
vercel deploy          # Preview
vercel deploy --prod   # Production
```

---

## 10. Konventionen

- **Komponenten:** Funktionale Komponenten mit Hooks, kein Class-Based
- **State-Logik:** Custom Hooks (`useRealtimeTranscription`, `useSSE`, `useTTS`) kapseln komplexe Logik
- **Styling:** Tailwind CSS Utility Classes direkt in JSX, keine separaten CSS-Dateien
- **Code-Sprache:** Englisch (Variablen, Funktionen, Kommentare), UI-Texte auf Deutsch/Englisch
- **API-Routen:** Schmale Handler-Funktionen, Geschäftslogik in `src/lib/`
- **Typen:** Zentrale Types in `src/types/`, kein `any`
- **IDs:** `nanoid` für Session-IDs und Segment-IDs
- **Fehlerbehandlung:** Nur an System-Grenzen (API-Responses, SSE-Reconnect). Intern keine defensiven Checks

---

## 11. Bekannte Einschränkungen (Prototyp)

- **Kein Auth:** Jeder mit der Session-URL kann beitreten. Für Prototyp akzeptabel.
- **SSE-Polling Latenz:** ~500ms Polling-Intervall + Übersetzungszeit = 1–3s Gesamtlatenz. Akzeptabel für Simultanübersetzung.
- **Vercel Edge Timeout:** 20s (Hobby), 300s (Pro). Client reconnected automatisch — kein Datenverlust dank `lastSeq`.
- **Browser TTS Qualität:** Variiert stark je Gerät, OS und Sprache. Malaiisch-TTS ist auf vielen Geräten schwach.
- **Keine Persistenz:** Sessions verfallen nach 6h. Kein Export, keine Aufnahme-Historie.
- **Single Speaker:** Prototyp unterstützt einen Speaker pro Session.

---

## 12. Kosten-Abschätzung (API)

Bei 1 Segment alle ~3 Sekunden, 3 Zielsprachen, 1 Stunde Session:

| Komponente | Volumen | Kosten/Stunde |
|-----------|---------|--------------|
| OpenAI Realtime API (STT) | ~1200 Segmente | ~$2–4 |
| gpt-4o Translation | ~1200 Calls | ~$4–10 |
| OpenAI TTS (optional) | ~1200 Segmente × 3 Sprachen | ~$6–12 |
| Vercel KV | ~3600 Reads + 1200 Writes | ~$0 (Free Tier) |
| **Gesamt (ohne TTS)** | | **~$6–14/h** |
| **Gesamt (mit OpenAI TTS)** | | **~$12–26/h** |

Browser TTS ist kostenlos — empfohlen als Default.
