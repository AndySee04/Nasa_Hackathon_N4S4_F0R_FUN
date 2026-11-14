# Architecture

```
 Browser (React SPA on Vercel)                       FastAPI server (Python host)
 ┌─────────────────────────────────┐                ┌──────────────────────────────────────┐
 │ Pages + components              │  REST / JSON   │ /api/health                          │
 │ 3D scene (three.js, lazy chunk) │ ─────────────▶ │ /api/ai/chat  /api/ai/explain        │
 │ AstroProvider (chat state,      │ ◀───────────── │ /api/ai/suggested-questions          │
 │   page + artifact context)      │                │ /api/artifacts[/{id}]                │
 │ data/artifacts.json (bundled)   │                │                                      │
 └──────────────┬──────────────────┘                │ safety.py ─▶ knowledge_service.py    │
                │ images                            │        └─▶ ai_service.py ─▶ AI model  │
                ▼                                   │            (only if a key is set)    │
   NASA Image and Video Library API                 └──────────────────────────────────────┘
```

## Frontend

- **Data first.** All exhibit content lives in `src/data/artifacts.json`, typed by `src/types/artifact.ts`. Pages render from data, so adding an artifact means adding one record.
- **Routing.** `react-router-dom`. Archive pages share one `ArchivePage` component.
- **3D.** `SpaceScene` uses React Three Fiber. It is split into its own chunk (`LazySpaceScene`) so page text appears before three.js finishes downloading. Planet textures are drawn on a canvas. Motion stops when the visitor prefers reduced motion.
- **Astro everywhere.** `AstroProvider` holds the conversation and the current page/artifact context. `usePageContext()` on each page tells Astro what the child is looking at. The floating launcher and the full `/ask-astro` page share the same chat.
- **Images.** `services/nasaImages.ts` queries `images-api.nasa.gov` (no key) once per artifact and caches the result. On failure an original line illustration is shown.

## Backend (Astro AI)

Astro is a **controlled, retrieval-grounded assistant**, not an autonomous agent. It cannot browse, run code or take actions.

1. **Safety check** (`services/safety.py`): blocks personal information (emails, phone numbers, addresses, passwords, names/schools), responds supportively to self-harm and points to a trusted adult, refuses prompt-injection attempts, and redirects unsafe topics. Messages are capped at 500 characters.
2. **Retrieval** (`services/knowledge_service.py`): keyword scoring over the artifact records and the glossary, with a boost for the artifact the child is viewing. Simple and transparent by design.
3. **Answer** (`services/ai_service.py`):
   - *AI model mode* (when `ANTHROPIC_API_KEY` is set): the retrieved facts and a child-safe system prompt are sent to the model, which must reply in JSON (`reply` + `follow_ups`). It is told to use only the provided facts for mission details and to admit uncertainty.
   - *Knowledge mode* (no key, or the model call fails): an answer is assembled directly from the glossary or the named artifact's record. Unknown questions get an honest "I'm not sure".
4. **Output** is sanitised (links outside NASA/Smithsonian/ESA domains removed, length capped) and returned with the **sources** of the facts used.
5. **Rate limiting**: 20 requests per minute per IP by default.

Chats are not stored. Logs record only errors, never message content.

## Why these choices

- A static frontend plus a small API keeps the attack surface small and lets the site work (minus Astro) even if the API is down.
- Keeping one JSON source of truth for both the site and Astro means the AI cannot "know" different facts from the page the child is reading.
