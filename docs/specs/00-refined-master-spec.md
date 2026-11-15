# N4S4 F0R FUN: refined master spec

**Space Artifacts Explorer: a gamified space-learning adventure with an AI tutor, for ages 8–12**

This document reviews the ChatGPT master prompt ([original-master-prompt.md](original-master-prompt.md)), keeps what works, corrects what is wrong, and cuts scope to what a hackathon team can finish well. Where this file and the original disagree, **this file wins**.

---

## 1. Verdict on the original prompt

The original is a strong product vision: a story-led Moon campaign, a catcher mini-game, three stars per artifact, and an AI tutor grounded in NASA sources. Its follow-up advice (one orchestrator, a curated knowledge base, a game that works without AI) is also sound.

It has **one factual error that would cost us with judges**, several internal inconsistencies, and far more scope than a hackathon allows. The table below lists every change we made.

| # | Original prompt says | Problem | Refined decision |
|---|---|---|---|
| R1 | Artifacts: Apollo 11, 14 and 15 Lunar Module **ascent stages**, plus Surveyor 3 | **Wrong objects.** The ascent stages are not at the landing sites. Apollo 11's was jettisoned into lunar orbit and its fate is unknown. Apollo 14's and Apollo 15's were deliberately crashed into the Moon elsewhere. What stands at each site today is the **descent stage**. | Use the **descent stages**: Eagle (Apollo 11), Antares (Apollo 14), Falcon + Lunar Roving Vehicle (Apollo 15), plus Surveyor 3. The ascent stages appear in the story as "where did the top half go?" facts. |
| R2 | "If the Moon campaign contains five artifacts, the maximum score is 15 stars" | Inconsistent: only four artifacts are listed. | **4 core artifacts = 12 stars.** Optional bonus artifact: Apollo 12 *Intrepid* (it landed about 180 m from Surveyor 3), +3 stars = 15. |
| R3 | "The rover's scientific equipment has been damaged…" | Suggests real hardware broke, which the prompt itself forbids. Also, three of the four artifacts are not rovers. | Every repair is set in **"Mission Control's training simulator"**, clearly labelled *Pretend mission*. A *Real story* card always follows, with the artifact's true historical status. |
| R4 | Six specialist **agents** plus a Manager | Six LLM agents are slow, costly and hard to debug. Safety and "educational response" are pipeline steps, not agents. | **One deterministic Manager** (plain code, no LLM) routes to **one of four knowledge modules**. At most **one LLM call** per question. Safety is a pipeline stage before and after. See the `ai` branch spec. |
| R5 | Vector database (pgvector) over NASA documents | Hosted Postgres adds cost and setup. The corpus is small (tens of curated documents). | **SQLite**: structured records, curated documents, source registry and cache. Keyword (BM25) retrieval first, with embeddings behind the same interface later. No bulk scraping. |
| R6 | Semantic caching | Embedding every query costs money. | **Exact cache** on the normalised question + context first. Add semantic matching only if hit rates are low. |
| R7 | AI image generation for "show me" requests | Cost, safety and accuracy risk for children. | **v1: NASA Image Library only** (real photos with credit). Generation is out of scope for the hackathon. If added later, every image is labelled *AI illustration*. |
| R8 | Certificate with "student display name" | Personal data from children (COPPA / Malaysia PDPA). | **Nickname only**, typed at print time, made **in the browser** and never sent or stored. Labelled *Unofficial N4S4 F0R FUN achievement certificate*, with no NASA logo or endorsement. |
| R9 | Seven campaigns + all ten Solar System bodies | Not finishable well in a hackathon. | **Hackathon scope: the Moon campaign + Cosmic AI.** Other worlds appear as *Coming soon* in the hub. The campaign data format is modular so new campaigns are data, not code. |
| R10 | Title "NASA Space Artifacts Explorer" | Could read as an official NASA product. | Use **"Space Artifacts Explorer (built with NASA open data)"**. Keep the existing "not affiliated with NASA" footer. |
| R11 | "Current mission status" | Statuses change (for example Voyager instruments). | Every status carries `last_verified`. Anything `operational` is re-checked before each demo. |
| R12 | Three.js / React Three Fiber everywhere | PR #16 replaced the 3D scene with a lighter 2D crayon canvas. | Keep the **8b crayon-and-paper design system** (Sniglet + Andika fonts, paper cards, stickers). Use 3D only if a specific screen needs it. |

---

## 2. Corrected Moon artifacts

Facts below come from NASA NSSDCA records and NASA Science. Each still gets a final `last_verified` check by the game team before publishing.

| Artifact (what is on the surface) | Mission | Landed (UT) | Crew / type | Where | Key facts for the game |
|---|---|---|---|---|---|
| **Eagle descent stage** | Apollo 11 | 20 Jul 1969 | Armstrong, Aldrin (Collins in orbit) | Sea of Tranquility, 0.674°N 23.473°E | 21.55 kg of samples; passive seismometer and dust detector; laser retroreflector needs no power. The ascent stage was jettisoned into lunar orbit, and its fate is unknown. |
| **Antares descent stage** | Apollo 14 | 5 Feb 1971 | Shepard, Mitchell (Roosa in orbit) | Fra Mauro highlands | First landing outside the dark "seas" (maria); a hand-pulled equipment cart (MET); ALSEP + laser reflector. The ascent stage was deliberately crashed into the Moon, and the Apollo 12 and 14 seismometers recorded the impact. |
| **Falcon descent stage + Lunar Roving Vehicle** | Apollo 15 | 30 Jul 1971 | Scott, Irwin (Worden in orbit) | Hadley–Apennine, 26.13°N 3.63°E | First rover: about 27.9 km over three drives (10.3, 12.5, 5.1 km); 77.31 kg of samples; a seven-experiment ALSEP, shut down 30 Sep 1977. The ascent stage impacted at 26.36°N 0.25°E on 3 Aug 1971. |
| **Surveyor 3** | Surveyor 3 (robotic) | 20 Apr 1967 | Robot lander | Ocean of Storms, ~3.0°S 23.4°W | Bounced twice on landing; TV camera + scoop; dug 4 trenches; 6,326 images. Apollo 12 astronauts visited in Nov 1969 and took parts home. |
| *Bonus:* **Intrepid descent stage** | Apollo 12 | 19 Nov 1969 | Conrad, Bean | Ocean of Storms, ~180 m from Surveyor 3 | Pinpoint landing; 34.35 kg of samples; its ascent stage was crashed on purpose (the first artificial moonquake). |

Sources: NSSDCA 1969-059C (Apollo 11 LM), the NSSDCA Apollo 14 mission page (the 1971-008C record page serves Apollo 11 text, so it is not cited), NSSDCA landing-site, precise-position and LM impact tables, 1971-063C (Apollo 15 LM), 1969-099C (Apollo 12 LM); NASA Science: Surveyor 3; NASA's Apollo 14 mission feature.

---

## 3. Agreed scope for the hackathon

**Must ship (in demo order):**
1. Moon landing scene with a clickable cartoon Moon and a mission briefing. *(game)*
2. Rocket catcher mini-game. *(game)*
3. Four artifact stories with real facts and NASA photos. *(game, data)*
4. Simulator repair challenge + quiz + three-star scoring. *(game)*
5. Cosmic AI tutor with retrieval, sources and contextual suggestions. *(ai)*
6. NASA image retrieval in AI answers. *(ai)*
7. Moon Explorer badge + printable certificate. *(game)*

**Future (designed for, not built):** the other Solar System bodies, Nebula, Black Holes, Kepler, Constellations, Galaxies, Asteroids.

**Demo script (3 minutes):** a child lands on the Moon, catches Antares, reads its real story, fixes the simulator, gets three stars, then asks Cosmic AI "Why did they crash the top half into the Moon?" and gets a sourced answer with follow-up questions.

---

## 4. Non-negotiable rules (both teams)

1. **Facts and fiction are visibly different.** Fiction is labelled *Pretend mission*; facts come from data with a source.
2. **No invented NASA data.** Every number, date or status traces to a source URL in the data.
3. **The game works with AI off.** If Cosmic AI is offline, the game still runs end to end.
4. **No personal data.** No accounts, no names stored, nothing sent to a server except a child's question to Cosmic AI (after safety checks).
5. **Cost guardrails.** At most one LLM call per question, cached where safe, with hard timeouts.
6. **Accessibility.** Keyboard play, read-aloud, reduced motion, large targets, never colour alone.
7. **Every pull request passes CI** (lint, tests, build, browser smoke tests).

## 5. Progression and badges (shared vocabulary)

| Level | Badge | How to earn it |
|---|---|---|
| 1 | **Moon Explorer** | Finish all four core Moon artifacts (any stars) |
| 2 | Solar System Explorer | *Future:* finish the required planet campaigns |
| 3 | Cosmic Scientist | *Future:* finish the advanced campaigns |
| 4 | Universe Master | *Future:* finish everything |

Stars: 1 for discovering (catching) the artifact, 1 for the simulator repair, 1 for the quiz. Replays keep the best score.
