# Data sources and accuracy rules

## Sources used

| Source | Used for |
|---|---|
| [NASA Space Science Data Coordinated Archive (NSSDCA)](https://nssdc.gsfc.nasa.gov/) | Launch dates, landing sites, instruments and mission summaries for every artifact (one catalogue page per spacecraft, by COSPAR ID) |
| [NASA Science mission pages](https://science.nasa.gov/) | Mission overviews and current status (Voyager, Cassini, New Horizons) |
| NASA/JPL news, 17 April 2026 | Voyager 1 instrument shut-down and remaining instruments |
| [NASA History Office, SP-4029](https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_11a_Summary.htm) | Apollo 11 mission summary |
| [NASA Image and Video Library API](https://images.nasa.gov/) | Photos shown on artifact pages (loaded live, credited on screen) |

Each record in `frontend/src/data/artifacts.json` lists its own sources, and they are shown on the artifact page.

## Rules for adding or editing facts

1. **No source, no fact.** Every record needs at least one `https://` source, preferably a NASA page.
2. **Don't invent precision.** If only the month is known, use `YYYY-MM`. Coordinates are approximate landing sites.
3. **Dates are UTC.** Local dates can differ by one day.
4. **Statuses** must be one of `operational`, `inactive`, `decommissioned`, `lost-contact`, `unknown`, and the `statusNote` must explain it in plain words.
5. **Non-NASA hardware** (for example Lunokhod 1) must say who built it in `agency`, and it is labelled on screen.
6. **Check living spacecraft before every demo.** Voyager 1, Voyager 2 and New Horizons are still operating; their status can change.
7. After editing, run `npm run sync-data` in `frontend/`, then `pytest` in `backend/`.

## Records to double-check before final submission

These facts were written carefully but are worth a second look against the source pages:

- Viking 1 lander: exact date of last contact (recorded here as November 1982).
- Lunokhod 1: landing coordinates (approximate) and last-contact date.
- LCROSS: impact coordinates in Cabeus crater (approximate).
- Voyager 1: number of instruments still running (two science instruments as of April 2026).
