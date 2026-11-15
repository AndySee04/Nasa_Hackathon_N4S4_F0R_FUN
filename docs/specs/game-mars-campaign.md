# Game: Mars campaign ("Mars Explorer Mission")

The second campaign. Same shape as the Moon (levels, three stars each, a badge and an unofficial certificate), but harder, with two new minigames.

## 1. Story, kept truthful

Mars once had rivers and lakes; today it is a cold desert. The machines that found the evidence are on the surface, slowly covered by dust (Opportunity and InSight ended when dust covered their solar panels; Spirit got stuck in soft sand). The game's dig is **pretend** and labelled "Pretend dig · Mars simulator". Each rock layer hides a **true** clue that the machine discovered, and the "Real story" step stays visibly separate from the pretend parts.

## 2. Levels

| Order | Machine | Vehicle in the drive step | Notes |
| --- | --- | --- | --- |
| 1 | Viking 1 lander | robotic arm | first photo from the surface |
| 2 | Sojourner (Mars Pathfinder) | rover | rounded pebbles = running water |
| 3 | Spirit | rover | silica from a dragging wheel; stuck at Troy |
| 4 | Opportunity | rover | hematite "blueberries", gypsum vein |
| 5 | Phoenix | robotic arm | water ice in a trench |
| Bonus | InSight | robotic arm | 1,319 marsquakes, liquid core |
| Bonus | Ingenuity | helicopter | first powered flight on another planet |

Mars is open from the start; it does not need the Moon badge. Dawn, NEAR Shoemaker, Pioneer 10/11 and Kepler are not on Mars and are kept for a later deep-space campaign.

## 3. Level flow

Dig → Mission card → Drive → Real story → Quiz (4 questions) → Done.

## 4. Stars (harder than the Moon)

- **Dig star**: uncover the whole machine without the dust-devil refill.
- **Drive star**: reach the target within 3 sols (3 sends).
- **Quiz star**: 3 of 4 right (`QUIZ_PASS_BY_CAMPAIGN.mars = 3`; the Moon stays 2 of 3).
- **Badge** "Mars Explorer": all 3 stars on all five core machines (`badgeNeedsStars: 3`). Bonus levels add stars but are not needed.

## 5. Mars Dig (`src/game/dig.ts`)

- 7 × 6 side view. Rows 1–2 dust (1 hit), 3–4 sand (2 hits), 5–6 bedrock (3 hits); 5 unbreakable boulders.
- The machine is two tiles wide in the bedrock. Three clue tiles hold true facts.
- You can dig a top-row tile or a tile next to an open one. Every hit costs 1 energy.
- Energy = cheapest possible tunnel (Dijkstra) + 6 (normal) or + 14 (easy).
- Scanner: 3 pings, each says how many tiles (Manhattan distance) to the machine.
- Out of energy: a dust devil can clean the panels once (+10 energy, no dig star). This happened for real to Spirit and Opportunity.
- Layouts are seeded by machine and attempt, always solvable (unit-tested), and keyboard playable (arrow keys + Enter).

## 6. Rover Drive (`src/game/drive.ts`)

- 6 × 6 map: rocks `#`, soft sand `~`, target `T`. Plan up to 10 moves (forward, turn left, turn right), then send.
- Real-life reason: a signal takes about 4 to 22 minutes to reach Mars, so drivers plan a whole sol of commands.
- Rocks stop the rover (like real hazard avoidance); sand traps it (like Spirit at Troy) and the simulator backs it out; the edge stops it.
- Robotic arm levels use the same rules with arm wording. The helicopter flies over rocks but gets lost over smooth sand ripples, which is what happened on Ingenuity's last flight.
- Every map is checked by breadth-first search to be solvable within two sends, leaving a spare sol for the star.
- Easy mode shows a preview of the planned path. After 3 sols a hint is offered.

## 7. Certificate

`/mars/certificate`, shared with the Moon through `components/game/Certificate.tsx`. Nickname only, never saved or sent. It keeps the line "Unofficial N4S4 F0R FUN achievement certificate. Not issued or endorsed by NASA." The game is built with NASA open data, but neither the certificate nor the badge is approved by NASA.

## 8. Sources

Facts come from each machine's record in `artifacts.json` (NASA mission pages and NASA/JPL news releases; `lastVerified` 2026-11-15) and from the NASA NSSDCA Mars Fact Sheet, NASA Science "Mars Facts" and the NASA Mars 2020 mission page (Jezero crater).
