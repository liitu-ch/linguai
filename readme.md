# LinguAI

**KI-gestützte Simultanübersetzung für Präsenz-Events — kostenlos, mit deinem eigenen API Key.**

LinguAI ersetzt teure Simultandolmetscher durch KI-basierte Echtzeit-Übersetzung. Ein Speaker spricht in seiner Sprache — Zuhörer folgen live auf ihrem Smartphone in einer von über 39 Sprachen. Kein Equipment, keine App-Installation, keine Dolmetscherkabinen.

---

## Das Problem

Traditionelle Simultanübersetzung bei Events ist teuer und aufwändig:

- **CHF 400–800 pro Stunde** für professionelle Dolmetscher — pro Sprachpaar
- Teure Infrastruktur: Dolmetscherkabinen, Empfangsgeräte, Kopfhörer
- Lange Vorlaufzeiten für Buchung und Logistik
- Begrenzte Sprachauswahl (meist nur 2–3 Sprachen wirtschaftlich tragbar)

## Die Lösung

LinguAI nutzt modernste KI-Sprachmodelle, um gesprochene Sprache in Echtzeit zu transkribieren und zu übersetzen. Die Zuhörer brauchen nur ihr Smartphone und eigene Kopfhörer.

### So funktioniert's

1. **Session erstellen** — Der Speaker erstellt eine Session und wählt die verfügbaren Sprachen. Dauert unter 30 Sekunden.
2. **QR-Code teilen** — Der QR-Code wird z. B. auf dem Beamer angezeigt. Zuhörer scannen ihn mit dem Smartphone — kein Download, keine App.
3. **Live zuhören** — Jeder Zuhörer wählt seine Sprache und folgt dem Vortrag als Live-Text und/oder Audio-Übersetzung.

```
Speaker spricht              LinguAI verarbeitet           Zuhörer empfangen
┌──────────────┐            ┌──────────────────┐          ┌──────────────────┐
│ Mikrofon     │  ───────>  │ Sprache → Text   │  ─────>  │ Live-Transkript  │
│ (Browser)    │            │ Text → Übersetzung│          │ + Audio (TTS)    │
│              │            │ in alle Sprachen  │          │ auf Smartphone   │
└──────────────┘            └──────────────────┘          └──────────────────┘
                            Latenz: < 2 Sekunden
```

---

## Bring your own API Key

LinguAI ist **komplett kostenlos**. Du bringst deinen eigenen API-Schlüssel mit und zahlst nur die tatsächliche Nutzung direkt beim Anbieter — transparent, ohne Aufschlag.

### Unterstützte Anbieter

| Feature | OpenAI | ElevenLabs | Browser (kostenlos) |
|---|---|---|---|
| **Transkription (STT)** | `gpt-4o-transcribe` | — | — |
| **Übersetzung** | `gpt-4o` | — | — |
| **Text-to-Speech** | `gpt-4o-mini-tts` | `eleven_multilingual_v2` | Web Speech API |

**OpenAI** (erforderlich) — Wird für die Echtzeit-Transkription (Speech-to-Text) und die Übersetzung in alle Zielsprachen verwendet. Optional auch für KI-generierte Sprachausgabe.

**ElevenLabs** (optional) — Alternative für Text-to-Speech mit ultra-realistischen mehrsprachigen Stimmen.

**Browser** (kostenlos) — Die eingebaute Web Speech API des Browsers kann für die Sprachausgabe genutzt werden — ganz ohne API Key.

---

## Features

| Feature | Beschreibung |
|---|---|
| **39+ Sprachen** | Von Englisch und Deutsch über Japanisch bis Arabisch — alle gängigen Sprachen werden unterstützt |
| **Echtzeit-Übersetzung** | Latenz unter 2 Sekunden vom gesprochenen Wort zur Übersetzung |
| **Bring your own API Key** | Kostenlose Nutzung mit eigenen API-Keys — volle Kontrolle über Kosten |
| **Live-Transkript** | Zuhörer sehen die Übersetzung Wort für Wort auf ihrem Bildschirm erscheinen |
| **Audio-Wiedergabe (TTS)** | KI-generierte Sprachausgabe via OpenAI, ElevenLabs oder Browser |
| **Kein Equipment nötig** | Keine Dolmetscherkabinen, keine Empfangsgeräte — nur Smartphones und eigene Kopfhörer |
| **Keine App-Installation** | Zuhörer scannen einen QR-Code und sind sofort verbunden — alles läuft im Browser |
| **Session-Planung** | Sessions im Voraus erstellen, QR-Codes generieren und als Link oder Bild teilen |
| **Unbegrenzte Zuhörer** | Egal ob 10 oder 500 Teilnehmer — alle empfangen gleichzeitig |

---

## Einsatzszenarien

### Konferenzen & Vorträge
Ein Keynote-Speaker hält seinen Vortrag auf Deutsch. 200 internationale Gäste scannen den QR-Code und folgen live in Englisch, Französisch oder Japanisch.

### Empfang internationaler Mitarbeitender
Ein Team aus Singapur besucht die Zentrale in Zürich. Beim Town Hall scannen alle den QR-Code, wählen ihre Sprache und folgen der Begrüssung live auf dem Smartphone.

### Interne Schulungen & Workshops
Eine Compliance-Schulung für 120 Mitarbeitende in 5 Ländern. Ein QR-Code, und jeder folgt dem Training in seiner Muttersprache.

---

## Technologie

LinguAI basiert auf einem modernen Cloud-Stack:

- **Spracherkennung (STT):** OpenAI Realtime API — erkennt gesprochene Sprache in Echtzeit über den Browser
- **Übersetzung:** OpenAI GPT-4o — übersetzt den transkribierten Text gleichzeitig in alle Zielsprachen
- **Sprachausgabe (TTS):** Wahlweise Browser-Sprachausgabe (kostenlos), OpenAI `gpt-4o-mini-tts` oder ElevenLabs `eleven_multilingual_v2`
- **Echtzeit-Kommunikation:** Supabase Realtime — überträgt Übersetzungen sofort an alle verbundenen Geräte
- **Hosting:** Vercel — serverlose Infrastruktur, automatische Skalierung
- **Frontend:** Progressive Web App (PWA) — funktioniert auf jedem Gerät mit modernem Browser

### Datenschutz & Sicherheit

- API-Schlüssel werden serverseitig mit AES-256-GCM verschlüsselt gespeichert
- Authentifizierung über Supabase Auth
- Keine dauerhafte Speicherung von Audio-Daten — Verarbeitung erfolgt in Echtzeit

---

## Status

LinguAI befindet sich aktuell in aktiver Entwicklung (v0.1.0).
