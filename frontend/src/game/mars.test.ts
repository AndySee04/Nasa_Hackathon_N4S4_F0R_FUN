import { describe, expect, it } from 'vitest'
import {
  canDig,
  cheapestCost,
  COLS,
  dig,
  digLayout,
  dustDevil,
  earnedDigStar,
  HITS,
  machineFound,
  ROWS,
  scan,
  SLACK,
  startDig,
  type Cell,
  type DigLayout,
  type DigState,
} from './dig'
import { MARS_CAMPAIGN } from '../data/campaigns/mars'
import { projectMars, spreadMarsPins } from './marsMap'
import { artifactById } from '../data'
import { MAX_SOLS, parseLevel, restingPlace, shortestSolution, simulate, type DriveLevel } from './drive'
import { awardBadge, emptyProgress, isCampaignComplete, recordResult } from './progress'

const ids = ['viking-1-lander', 'sojourner', 'spirit', 'opportunity', 'phoenix', 'insight', 'ingenuity']

/** A simple greedy digger: always hits the reachable tile that is closest to the next machine tile. */
function solve(layout: DigLayout, s: DigState): DigState {
  let state = s
  for (const target of layout.machine) {
    for (let guard = 0; guard < 300 && state.hitsLeft[target.row][target.col] > 0; guard++) {
      const candidates: Cell[] = []
      for (let row = 0; row < ROWS; row++)
        for (let col = 0; col < COLS; col++) if (canDig(layout, state, { col, row })) candidates.push({ col, row })
      const cost = (c: Cell) => state.hitsLeft[c.row][c.col] + 3 * (Math.abs(c.col - target.col) + Math.abs(c.row - target.row))
      candidates.sort((a, b) => cost(a) - cost(b))
      state = dig(layout, state, candidates[0]).state
    }
  }
  return state
}

describe('Mars Dig layouts', () => {
  it.each(ids)('%s: solvable, deep enough, same every time', (id) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const layout = digLayout(id, attempt)
      expect(layout.machine.every((m) => m.row >= 4)).toBe(true)
      expect(layout.bestCost).toBeGreaterThanOrEqual(8)
      expect(layout.bestCost).toBe(cheapestCost(layout.ground, layout.machine))
      expect(layout.clues).toHaveLength(3)
      expect(digLayout(id, attempt)).toEqual(layout)
    }
  })

  it('layers get harder with depth and boulders are unbreakable', () => {
    const layout = digLayout('spirit')
    for (let row = 0; row < ROWS; row++)
      for (const g of layout.ground[row]) if (g !== 'boulder') expect(HITS[g]).toBe(row < 2 ? 1 : row < 4 ? 2 : 3)
  })
})

describe('Mars Dig rules', () => {
  const layout = digLayout('opportunity')

  it('only lets you dig from the surface or next to an open tunnel', () => {
    const s = startDig(layout, false)
    const deep = { col: 3, row: 3 }
    expect(canDig(layout, s, deep)).toBe(false)
    expect(dig(layout, s, deep).event).toEqual({ kind: 'blocked', reason: 'not-reachable' })
    const top = [...Array(COLS).keys()].map((col) => ({ col, row: 0 })).find((c) => layout.ground[0][c.col] !== 'boulder')!
    expect(canDig(layout, s, top)).toBe(true)
  })

  it('costs one energy per hit and opens a tile when its hits run out', () => {
    let s = startDig(layout, false)
    const top = [...Array(COLS).keys()].map((col) => ({ col, row: 0 })).find((c) => layout.ground[0][c.col] !== 'boulder')!
    const r = dig(layout, s, top)
    expect(r.event.kind).toBe('opened')
    expect(r.state.energy).toBe(s.energy - 1)
    s = r.state
    const below = { col: top.col, row: 1 }
    if (layout.ground[1][top.col] !== 'boulder') expect(canDig(layout, s, below)).toBe(true)
  })

  it('a careful dig finds the machine within the energy budget and earns the star', () => {
    const s = solve(layout, startDig(layout, false))
    expect(machineFound(layout, s)).toBe(true)
    expect(s.energy).toBeGreaterThanOrEqual(0)
    expect(earnedDigStar(layout, s)).toBe(true)
  })

  it('normal mode is tighter than easy mode', () => {
    expect(startDig(layout, false).energy).toBe(layout.bestCost + SLACK.normal)
    expect(startDig(layout, true).energy).toBe(layout.bestCost + SLACK.easy)
  })

  it('scanner pings report distance and run out after three', () => {
    let s = startDig(layout, false)
    const m = layout.machine[0]
    const r = scan(layout, s, { col: m.col, row: 0 })!
    expect(r.distance).toBe(m.row)
    s = r.state
    s = scan(layout, s, { col: 0, row: 0 })!.state
    s = scan(layout, s, { col: 0, row: 0 })!.state
    expect(scan(layout, s, { col: 0, row: 0 })).toBeNull()
  })

  it('the dust devil helps once but costs the dig star', () => {
    const s = { ...startDig(layout, false), energy: 0 }
    expect(dig(layout, s, { col: 0, row: 0 }).event.kind === 'no-energy' || layout.ground[0][0] === 'boulder').toBe(true)
    const cleaned = dustDevil(s)!
    expect(cleaned.energy).toBe(10)
    expect(dustDevil(cleaned)).toBeNull()
    const done = solve(layout, { ...cleaned, energy: 999 })
    expect(machineFound(layout, done)).toBe(true)
    expect(earnedDigStar(layout, done)).toBe(false)
  })
})

describe('Rover Drive', () => {
  const level: DriveLevel = { vehicle: 'rover', map: ['S..#', '.#~.', '...T'], startDir: 'E', maxCommands: 8, targetLabel: 'test' }

  it('reads the map', () => {
    expect(parseLevel(level)).toEqual({ width: 4, height: 3, start: { x: 0, y: 0, dir: 'E' }, target: { x: 3, y: 2 } })
  })

  it('stops for rocks, sinks in sand, stops at edges, and arrives', () => {
    expect(simulate(level, ['F', 'F', 'F']).outcome).toBe('hazard')
    expect(simulate(level, ['F', 'F', 'R', 'F']).outcome).toBe('stuck')
    expect(simulate(level, ['L', 'F']).outcome).toBe('edge')
    expect(simulate(level, ['R', 'F', 'F', 'L', 'F', 'F', 'F']).outcome).toBe('arrived')
    expect(simulate(level, ['R', 'F']).outcome).toBe('short')
  })

  it('finds the shortest safe plan', () => {
    expect(shortestSolution(level)).toEqual(['R', 'F', 'F', 'L', 'F', 'F', 'F'])
    expect(MAX_SOLS).toBe(3)
  })

  it('helicopters fly over rocks but get lost over sand ripples', () => {
    const heli: DriveLevel = { ...level, vehicle: 'helicopter' }
    expect(simulate(heli, ['F', 'F', 'F']).outcome).toBe('short')
    expect(simulate(heli, ['F', 'F', 'R', 'F']).outcome).toBe('lost')
  })
})

describe('Mars campaign content', () => {
  const levels = [...MARS_CAMPAIGN.artifacts, ...MARS_CAMPAIGN.bonusArtifacts]

  it.each(levels.map((l) => [l.artifactId, l] as const))('%s: real record, 3 clues, 4 fair questions, solvable drive', (_id, level) => {
    const artifact = artifactById(level.artifactId)
    expect(artifact?.world).toBe('mars')
    expect(level.clues).toHaveLength(3)
    expect(level.quiz).toHaveLength(4)
    for (const q of level.quiz) {
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
      expect(new Set(q.options).size).toBe(q.options.length)
    }
    const best = shortestSolution(level.drive)
    expect(best).not.toBeNull()
    // Long routes take two sols of commands, leaving one spare sol for the drive star.
    expect(best!.length).toBeLessThanOrEqual(level.drive.maxCommands * 2)
    expect(new Set(level.drive.map.map((r) => r.length)).size).toBe(1)
  })

  it('needs full stars on the five core machines for the badge', () => {
    expect(MARS_CAMPAIGN.artifacts).toHaveLength(5)
    expect(MARS_CAMPAIGN.badgeNeedsStars).toBe(3)
    let p = emptyProgress()
    for (const l of MARS_CAMPAIGN.artifacts) p = recordResult(p, 'mars', l.artifactId, { caught: true, repaired: true, quizCorrect: 2 })
    expect(isCampaignComplete(p, MARS_CAMPAIGN)).toBe(false)
    for (const l of MARS_CAMPAIGN.artifacts) p = recordResult(p, 'mars', l.artifactId, { caught: true, repaired: true, quizCorrect: 3 })
    expect(isCampaignComplete(p, MARS_CAMPAIGN)).toBe(true)
    expect(awardBadge(p, MARS_CAMPAIGN).campaigns.mars.badges).toEqual(['mars-explorer'])
  })

  it('backs a stuck rover out of the sand for the next sol', () => {
    const level = MARS_CAMPAIGN.artifacts[2].drive
    const run = simulate(level, ['F', 'F', 'F'])
    expect(run.outcome).toBe('stuck')
    expect(restingPlace(run.path, run.outcome)).toEqual({ x: 2, y: 0, dir: 'E' })
  })
})

describe('Mars map', () => {
  it('projects latitude and longitude onto the flat map', () => {
    expect(projectMars(0, 0)).toEqual({ x: 50, y: 50 })
    expect(projectMars(90, -180)).toEqual({ x: 0, y: 0 })
    expect(projectMars(-90, 180)).toEqual({ x: 100, y: 100 })
  })

  it('keeps every Mars pin on the map and apart', () => {
    const levels = [...MARS_CAMPAIGN.artifacts, ...MARS_CAMPAIGN.bonusArtifacts]
    const raw = levels.map((l) => {
      const loc = artifactById(l.artifactId)!.location
      return projectMars(loc.lat ?? 0, loc.lon ?? 0)
    })
    const { points } = spreadMarsPins(raw)
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(5)
      expect(p.x).toBeLessThanOrEqual(95)
    }
    for (let i = 0; i < points.length; i++)
      for (let j = i + 1; j < points.length; j++)
        expect(Math.hypot(points[i].x - points[j].x, (points[i].y - points[j].y) / 2)).toBeGreaterThan(6)
  })
})
