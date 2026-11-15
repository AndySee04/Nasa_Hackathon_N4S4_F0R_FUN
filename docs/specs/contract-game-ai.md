# Contract between the game and Cosmic AI

The game and the AI tutor are built independently. This file is the **only** agreement between them. Changes need both teams to agree, and the change must be committed to both the `game` and `ai` branches.

## 1. Principles

- The game never needs the AI to work. If the AI is offline or slow, the game shows "Cosmic AI is resting" and carries on.
- The AI never changes game state (stars, progress, unlocks). It only answers questions.
- The game sends **context**, never personal data.

## 2. Endpoints (FastAPI backend)

Base URL: `VITE_API_URL` (default `http://localhost:8000`).

| Method | Path | Used by | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | game (status badge) | `{ status, ai_mode: "llm" \| "knowledge", artifacts_loaded }` |
| `POST` | `/api/ai/chat` | game chat drawer | Ask a question |
| `POST` | `/api/ai/explain` | game "What does this word mean?" | Explain one term |
| `GET` | `/api/ai/suggested-questions` | game (empty chat) | Starter questions for the current context |

These already exist on `main`. The changes below are **additive**, so older clients keep working.

## 3. Request: `POST /api/ai/chat`

```jsonc
{
  "message": "Why did they crash the top half into the Moon?",   // 1–500 chars
  "history": [ { "role": "user", "content": "..." }, { "role": "assistant", "content": "..." } ], // last 6 turns max
  "context": {
    "page": "moon-campaign",            // existing field
    "artifactId": "apollo-14-antares",  // existing field: id from artifacts.json
    "campaign": "moon",                 // NEW (optional): campaign id
    "stage": "discovery",               // NEW (optional): landing | catch | discovery | repair | science | quiz | complete
    "askedQuestions": ["What is a descent stage?"]  // NEW (optional): for not repeating suggestions; max 10
  }
}
```

## 4. Response

```jsonc
{
  "reply": "After the astronauts flew back up, the top part of Antares wasn't needed any more...",
  "sources": [ { "title": "NASA NSSDCA: Apollo 14 Lunar Module", "url": "https://nssdc.gsfc.nasa.gov/..." } ],
  "suggestions": ["What is a seismometer?", "Did other Apollo missions do this?", "What is Fra Mauro?"],
  "mode": "llm",                         // "llm" | "knowledge" | "cache"   (cache is NEW)
  "safety_note": null,                   // set when the safety layer changed or blocked the request
  "images": [                            // NEW (optional), max 2; only real NASA images in v1
    { "url": "https://images-assets.nasa.gov/...", "title": "...", "credit": "NASA", "page_url": "https://images.nasa.gov/details/...", "kind": "photo" }
  ],
  "topic": "missions",                   // NEW: solar_system | missions | deep_space | visual | general | blocked
  "confidence": "sourced"                // NEW: sourced | general_knowledge | unsure
}
```

The game must render: `reply`, `sources` as links, `suggestions` as tappable chips, `images` with credit, and a small *Not sure* label when `confidence` is `unsure`. `kind: "illustration"` (future) must show an **AI illustration** label.

## 5. Shared IDs

- Artifact ids are the `id` values in `frontend/src/data/artifacts.json`, mirrored to `backend/app/data/artifacts.json` (CI checks they match).
- New Moon campaign ids (to add on the `game` branch, then sync): `apollo-11-eagle` (exists), `apollo-14-antares` (new), `apollo-15-falcon` (new, replaces `apollo-15-lrv` as the catchable artifact, with the LRV inside its record), `surveyor-3` (exists), `apollo-12-intrepid` (new, bonus).

## 6. Errors

| HTTP | Meaning | Game shows |
|---|---|---|
| 422 | Bad input (too long, empty) | "Can you ask that in a shorter way?" |
| 429 | Rate limit | "Cosmic AI needs a little break. Try again in a minute." |
| 5xx / network | Server down | "Cosmic AI is resting. Keep exploring!" |
