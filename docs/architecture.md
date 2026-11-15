# Architecture

```
 Browser (React SPA on Vercel)                       FastAPI server (Python host)
 ┌─────────────────────────────────┐                ┌──────────────────────────────────────┐
 │ Pages + components              │  REST / JSON   │ /api/health                          │
 │ Crayon sky (2D canvas)          │ ─────────────▶ │ /api/ai/chat  /api/ai/explain        │
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
- **Look.** The crayon-and-paper style from design proposal 8b. Tokens and shared pieces live in `src/index.css`: paper for words (`components/Paper.tsx`, with scissor-cut edges), stickers for things you press, crayon buttons for big actions.
- **Solar system.** `lib/crayonSky.ts` draws the planets on a 2D canvas, coloured in like wax crayon, with no image downloads. It handles drag-to-spin, tap-to-select, a follow camera that flies to a chosen world, and scroll zoom on the home page. Motion stops when the visitor prefers reduced motion.
- **Astro everywhere.** `AstroProvider` holds the conversation and the current page/artifact context. `usePageContext()` on each page tells Astro what the child is looking at. The "Ask Astro" sticker in the header opens a chat drawer that shares its conversation with the full `/ask-astro` page.
- **Accounts (optional).** `AuthProvider` + `useAuth()` wrap Supabase Auth with Google sign-in. The client (`lib/supabase.ts`) is loaded on first use, so it adds nothing to the main bundle, and with no `VITE_SUPABASE_*` settings accounts are simply off. It uses the PKCE flow: Google returns to `/account` with a one-time code that the client swaps for a session, kept in `localStorage`. The header shows a first name only, never the email. Accounts are meant for grown-ups; children can use everything without one. Saved game progress will go in Supabase tables keyed by `auth.users.id`, protected by row level security.
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
