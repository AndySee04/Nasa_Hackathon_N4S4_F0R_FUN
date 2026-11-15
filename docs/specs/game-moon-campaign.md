# Game branch spec: the Moon campaign

**Branch:** `game` · **Read first:** [00-refined-master-spec.md](00-refined-master-spec.md), [contract-game-ai.md](contract-game-ai.md)
**Visual reference:** *Moon_Explorer_UI_Storyboard_v2.pptx* (screens S01–S30), restyled in the 8b crayon-and-paper design system already on `main`.

**Goal:** one complete, polished lunar mission a child can play from start to finish in about 10 minutes, with zero dependency on the AI.

---

## 1. Player journey (six stages per artifact)

| Stage | Screen(s) | What happens | Star |
|---|---|---|---|
| 1 Lunar landing | S01 Welcome, S02 Moon Hub, S03 Moon facts, S04 Moon map | Animated lunar landscape. A friendly guide reads the briefing: *"A mysterious signal has been detected on the Moon…"*. Tapping the cartoon Moon opens Moon facts. | none |
| 2 Rocket catcher | S05 How to play, S06 Claw, S07 Catch states | Steer the rocket claw (drag, ◀ ▶ or arrow keys), press DROP or Space. Easy mode (on by default) snaps to the nearest artifact. Hint after 2 misses. | ★ discovery |
| 3 Artifact discovery | S08 Scan reveal, S10–S13 Mission cards | Scan reveal, then the mission card: name, mission, launch, landing, agency, purpose, instruments, discoveries, final status, NASA photo, NASA links. | none |
| 4 Simulator repair | S17–S21 (adapted) | Labelled **Pretend mission: training simulator**. One challenge per artifact (see §3). | ★ repair |
| 5 Scientific discovery | *Real story* card | What scientists actually learned, in kid language, plus the artifact's true status today. | none |
| 6 Level complete | S22 Quiz, S23 Feedback, S24 Badge | 3-question quiz. Shows stars, challenges done, knowledge score and progress. Replay keeps the best. | ★ quiz |

After all four core artifacts: **Moon Explorer** badge, celebration, then the certificate screen (§6).

## 2. Data model (TypeScript)

Add to `frontend/src/types/campaign.ts`. Campaigns are **data**, so Nebula or Mars can be added later without new engine code.

```ts
export type StageId = 'landing' | 'catch' | 'discovery' | 'repair' | 'science' | 'quiz' | 'complete'

export interface Campaign {
  id: 'moon'                      // later: 'mars', 'nebula', …
  title: string
  briefing: string                // the "mysterious signal" story
  artifacts: CampaignArtifact[]   // order = suggested play order
  bonusArtifacts?: CampaignArtifact[]
  badge: BadgeDef                 // e.g. Moon Explorer
}

export interface CampaignArtifact {
  artifactId: string              // id in artifacts.json (facts live there, not here)
  catcherSprite: 'lander' | 'rover' | 'robot-lander'
  repair: RepairChallenge
  science: { headline: string; points: string[] }   // Stage 5, each point traceable to artifacts.json sources
  quiz: QuizQuestion[]            // exactly 3
}

export type RepairChallenge =
  | { kind: 'drag-parts'; slots: { id: string; label: string; hint: string }[] }
  | { kind: 'match-instruments'; pairs: { instrument: string; job: string }[] }
  | { kind: 'circuit'; nodes: string[]; correctPath: string[] }
  | { kind: 'sequence'; steps: string[] }          // put mission events in order

export interface QuizQuestion { question: string; options: string[]; answer: number; explain: string }
export interface BadgeDef { id: string; name: string; description: string }
```

Content file: `frontend/src/data/campaigns/moon.ts`.

## 3. The four core artifacts and their challenges

| Artifact id | Catcher sprite | Simulator repair (pretend) | Science reveal (real) |
|---|---|---|---|
| `apollo-11-eagle` | lander | **drag-parts**: descent stage, ascent stage, landing legs, laser mirror | First crewed landing. The laser mirror still bounces lasers today. The top half left; the bottom half is still there. |
| `apollo-14-antares` | lander | **match-instruments**: seismometer ↔ feels moonquakes; laser reflector ↔ measures distance; equipment cart (MET) ↔ carries tools | First landing in the highlands (Fra Mauro). The deliberate crash of the ascent stage was recorded by seismometers. |
| `apollo-15-falcon` | lander-rover (descent stage with the parked rover) | **circuit**: connect battery → rover controls → wheels → TV camera | The rover let astronauts travel about 27.9 km in three drives and collect 77.31 kg of samples. |
| `surveyor-3` | robot-lander | **sequence**: launch → bounce landing → dig trenches → go silent → Apollo 12 visit | Showed the soil could hold a lander. Its parts came back to Earth for study. |
| *bonus* `apollo-12-intrepid` | lander | **sequence**: find Surveyor 3, ~180 m away | Pinpoint landing next to an older robot. |

Every fact in the science column must exist in `artifacts.json` with a source. **Data to add** (then run `npm run sync-data`): `apollo-14-antares`, `apollo-15-falcon` (move the LRV into its record) and `apollo-12-intrepid`. All need `last_verified`.

## 4. Scoring and progress

```ts
// frontend/src/game/scoring.ts  (pure functions, unit-tested)
starsFor(result: { caught: boolean; repaired: boolean; quizCorrect: number }): 0 | 1 | 2 | 3
// 1 for caught, 1 for repaired, 1 for quizCorrect >= 2 of 3
campaignStars(progress): { earned: number; max: number }   // 12 core, 15 with bonus
isCampaignComplete(progress): boolean                      // all 4 core artifacts have >= 1 star
```

Saved in `localStorage` key `n4s4.progress.v1`:

```json
{ "version": 1, "campaigns": { "moon": { "artifacts": { "apollo-11-eagle": { "stars": 3, "best": { "caught": true, "repaired": true, "quizCorrect": 3 }, "plays": 2 } }, "badges": ["moon-explorer"] } }, "settings": { "easyMode": true, "sound": false, "readAloud": false, "reduceMotion": false } }
```

Rules: keep the best result per artifact; never decrease stars; a version field allows future migrations; **Start over** in Settings clears it.

## 5. Components and files

```
frontend/src/
  game/
    scoring.ts            star rules (pure)
    progress.ts           load/save/migrate localStorage
    useProgress.ts        React hook
  data/campaigns/moon.ts  campaign content (§3)
  types/campaign.ts       §2
  components/game/
    MoonScene.tsx         Stage 1 landscape + clickable Moon (canvas, reuse the crayon renderer)
    MissionBriefing.tsx   guide character + story text + read-aloud
    RocketCatcher.tsx     Stage 2 (canvas or SVG + Framer Motion); keyboard + pointer
    ScanReveal.tsx
    MissionCard.tsx       Stage 3, reads artifacts.json
    repair/DragParts.tsx, MatchInstruments.tsx, Circuit.tsx, Sequence.tsx
    RealStoryCard.tsx     Stage 5
    QuizPanel.tsx         Stage 6
    LevelComplete.tsx     stars + stats + replay
    Certificate.tsx       §6
  pages/MoonCampaign.tsx  route /moon/campaign; drives the stages
```

Reuse what's already there: `ArtifactImage`, `StatusBadge`, `Paper`, the crayon buttons and stickers, `ErrorBoundary`, and the Astro drawer (for the AI, through the contract).

## 6. Certificate

- Shown after the Moon Explorer badge. The child **types a nickname** (max 20 chars, letters, numbers and spaces only); it is not saved.
- Contents: nickname, campaign name, completion date, total stars, badge, certificate id (random, made in the browser, e.g. `N4S4-MOON-7K3Q-92XD`), and the line *"Unofficial N4S4 F0R FUN achievement certificate. Not issued or endorsed by NASA."*
- **PDF with no new dependency:** a print-only stylesheet plus `window.print()` (the browser's "Save as PDF"). Add a PDF library only if this proves unreliable.

## 7. Accessibility and feel

- Every action works by keyboard: ← → move, Space drops, Tab between buttons, Enter to choose.
- Targets ≥ 48 px. Read-aloud via the browser's `speechSynthesis`. Captions for any audio.
- `prefers-reduced-motion` turns flying and confetti into fades. Sound starts muted.
- Never "Wrong!": use *Good try* with a clue.

## 8. Milestones and acceptance criteria

| # | Milestone | Done when |
|---|---|---|
| G1 ✅ | Data + types | Antares, Falcon and Intrepid records added with sources; `campaign.ts`, `moon.ts`, `scoring.ts`, `progress.ts`; data tests pass |
| G2 ✅ | Landing + hub | `/moon/campaign` shows the scene, clickable Moon facts and the briefing; works on phone and desktop |
| G3 ✅ | Rocket catcher | Catch all 4 artifacts by mouse, touch and keyboard; Easy mode; hint after 2 misses |
| G4 ✅ | Discovery + real story | Mission card for each artifact with photo, facts, status and links; Real story card |
| G5 ✅ | Repairs + quiz + stars | 4 challenge types; quiz; stars saved; replay keeps the best |
| G6 | Badge + certificate | Moon Explorer badge; printable certificate with the unofficial wording |
| G7 | Polish + tests | e2e: full Antares mission from landing to 3 stars; Lighthouse accessibility ≥ 95 |

## 9. Testing

- **Unit (Vitest):** `scoring.ts`, `progress.ts` (load, migrate, best-score rules), campaign data (every artifactId exists, 3 quiz questions, valid answers).
- **E2E (Playwright, `frontend/e2e/moon-campaign.spec.ts`):** play one artifact end to end by keyboard; reload and confirm the stars persisted; finish four and see the badge; certificate page shows the unofficial label.
- **Offline AI check:** run the e2e with the backend stopped; the game must still pass.

## 10. Known limits

- Progress lives on one device and browser only (by design, for privacy).
- Ascent-stage facts are shown as story facts, not as catchable objects.
- Antares facts are sourced from the NSSDCA Apollo 14 mission page and NSSDCA landing, position and impact tables. The NSSDCA record page for 1971-008C served Apollo 11 text when checked on 2026-11-15, so it is not cited.
- All dates are UT, as NSSDCA uses. Some NASA pages give US local dates (for example, the Surveyor 3 visit on 19 Nov 1969 US time is 20 Nov UT).
