/**
 * Mars Dig: rules for the Mars campaign's first challenge. Pure functions, tested without a browser.
 *
 * The ground is a grid seen from the side. Dust (1 hit), sand (2 hits) and bedrock (3 hits) get
 * harder the deeper you go, and boulders cannot be broken. You can only dig a tile in the top row
 * or next to a tile you have already opened, so you must plan a tunnel. Every hit costs solar
 * energy. Scanner pings tell you how far away the signal is. This is a pretend dig: the real
 * machines are on the surface, slowly covered by dust.
 */

export type Ground = 'dust' | 'sand' | 'bedrock' | 'boulder'

export const COLS = 7
export const ROWS = 6
export const HITS: Record<Ground, number> = { dust: 1, sand: 2, bedrock: 3, boulder: Infinity }
export const SCANS = 3
export const DUST_DEVIL_ENERGY = 10
/** Spare energy on top of the cheapest possible tunnel. Easy mode gives more. */
export const SLACK = { easy: 14, normal: 6 } as const

export interface Cell {
  col: number
  row: number
}

export interface DigLayout {
  ground: Ground[][] // [row][col]
  machine: [Cell, Cell] // the machine is two tiles wide
  clues: Cell[] // three hidden science clues
  /** Cheapest total hits to reach and uncover the whole machine. */
  bestCost: number
}

export interface DigState {
  hitsLeft: number[][] // [row][col]; 0 = open
  energy: number
  scansLeft: number
  usedDustDevil: boolean
  foundClues: number[] // indexes into layout.clues
}

export const groundForRow = (row: number): Ground => (row < 2 ? 'dust' : row < 4 ? 'sand' : 'bedrock')

const key = (c: Cell) => `${c.col},${c.row}`
const same = (a: Cell, b: Cell) => a.col === b.col && a.row === b.row

function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

const neighbours = ({ col, row }: Cell): Cell[] =>
  [
    { col: col - 1, row },
    { col: col + 1, row },
    { col, row: row - 1 },
    { col, row: row + 1 },
  ].filter((c) => c.col >= 0 && c.col < COLS && c.row >= 0 && c.row < ROWS)

/**
 * Cheapest number of hits to open every target tile, digging from the surface.
 * Tunnels to each target in turn with Dijkstra, reusing what is already open.
 */
export function cheapestCost(ground: Ground[][], targets: Cell[]): number {
  const open = new Set<string>()
  let total = 0
  for (const target of targets) {
    if (open.has(key(target))) continue
    const dist = new Map<string, number>()
    const prev = new Map<string, string>()
    const queue: [number, Cell][] = []
    for (let col = 0; col < COLS; col++) {
      const c = { col, row: 0 }
      const g = ground[0][col]
      if (g === 'boulder') continue
      const d = open.has(key(c)) ? 0 : HITS[g]
      dist.set(key(c), d)
      queue.push([d, c])
    }
    for (const k of open) {
      const [col, row] = k.split(',').map(Number)
      dist.set(k, 0)
      queue.push([0, { col, row }])
    }
    while (queue.length) {
      queue.sort((a, b) => a[0] - b[0])
      const [d, c] = queue.shift()!
      if (d > (dist.get(key(c)) ?? Infinity)) continue
      for (const n of neighbours(c)) {
        const g = ground[n.row][n.col]
        if (g === 'boulder') continue
        const nd = d + (open.has(key(n)) ? 0 : HITS[g])
        if (nd < (dist.get(key(n)) ?? Infinity)) {
          dist.set(key(n), nd)
          prev.set(key(n), key(c))
          queue.push([nd, n])
        }
      }
    }
    const d = dist.get(key(target))
    if (d === undefined) return Infinity
    total += d
    // Mark the path as open.
    let k: string | undefined = key(target)
    while (k) {
      open.add(k)
      k = prev.get(k)
    }
  }
  return total
}

/** A fixed layout per machine (and per replay), always solvable. */
export function digLayout(artifactId: string, attempt = 0): DigLayout {
  for (let tries = 0; tries < 200; tries++) {
    const rand = seededRandom(`${artifactId}:${attempt}:${tries}`)
    const pick = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))
    const ground: Ground[][] = Array.from({ length: ROWS }, (_, row) => Array.from({ length: COLS }, () => groundForRow(row)))
    const mRow = pick(4, 5)
    const mCol = pick(0, COLS - 2)
    const machine: [Cell, Cell] = [
      { col: mCol, row: mRow },
      { col: mCol + 1, row: mRow },
    ]
    const taken = new Set(machine.map(key))
    const clues: Cell[] = []
    while (clues.length < 3) {
      const c = { col: pick(0, COLS - 1), row: pick(1, ROWS - 1) }
      if (!taken.has(key(c))) {
        clues.push(c)
        taken.add(key(c))
      }
    }
    let boulders = 0
    while (boulders < 5) {
      const c = { col: pick(0, COLS - 1), row: pick(1, ROWS - 1) }
      if (!taken.has(key(c))) {
        ground[c.row][c.col] = 'boulder'
        taken.add(key(c))
        boulders++
      }
    }
    const bestCost = cheapestCost(ground, machine)
    // Every clue must be reachable too, and the machine shouldn't be trivially shallow.
    const cluesReachable = clues.every((c) => cheapestCost(ground, [c]) < Infinity)
    if (bestCost < Infinity && cluesReachable && bestCost >= 8) return { ground, machine, clues, bestCost }
  }
  throw new Error(`no solvable dig layout for ${artifactId}`)
}

export function startDig(layout: DigLayout, easy: boolean): DigState {
  return {
    hitsLeft: layout.ground.map((r) => r.map((g) => HITS[g])),
    energy: layout.bestCost + (easy ? SLACK.easy : SLACK.normal),
    scansLeft: SCANS,
    usedDustDevil: false,
    foundClues: [],
  }
}

export const isOpen = (s: DigState, c: Cell) => s.hitsLeft[c.row][c.col] === 0

/** You can dig the top row, or any tile touching an open tile. Boulders never. */
export function canDig(layout: DigLayout, s: DigState, c: Cell): boolean {
  if (layout.ground[c.row][c.col] === 'boulder' || isOpen(s, c)) return false
  return c.row === 0 || neighbours(c).some((n) => isOpen(s, n))
}

export type DigEvent =
  | { kind: 'blocked'; reason: 'boulder' | 'not-reachable' | 'open' }
  | { kind: 'no-energy' }
  | { kind: 'hit'; hitsLeft: number }
  | { kind: 'opened'; clue?: number; machinePart?: boolean; machineFound?: boolean }

/** One hit on a tile. Returns the new state and what happened. Never mutates. */
export function dig(layout: DigLayout, s: DigState, c: Cell): { state: DigState; event: DigEvent } {
  if (isOpen(s, c)) return { state: s, event: { kind: 'blocked', reason: 'open' } }
  if (layout.ground[c.row][c.col] === 'boulder') return { state: s, event: { kind: 'blocked', reason: 'boulder' } }
  if (!canDig(layout, s, c)) return { state: s, event: { kind: 'blocked', reason: 'not-reachable' } }
  if (s.energy <= 0) return { state: s, event: { kind: 'no-energy' } }
  const hitsLeft = s.hitsLeft.map((r) => [...r])
  hitsLeft[c.row][c.col] -= 1
  const state: DigState = { ...s, hitsLeft, energy: s.energy - 1 }
  if (hitsLeft[c.row][c.col] > 0) return { state, event: { kind: 'hit', hitsLeft: hitsLeft[c.row][c.col] } }
  const clue = layout.clues.findIndex((k) => same(k, c))
  if (clue >= 0) state.foundClues = [...s.foundClues, clue]
  const machinePart = layout.machine.some((m) => same(m, c))
  const machineFound = layout.machine.every((m) => hitsLeft[m.row][m.col] === 0)
  return { state, event: { kind: 'opened', clue: clue >= 0 ? clue : undefined, machinePart, machineFound } }
}

/** Scanner ping: how many tiles (up/down/left/right) from this tile to the nearest part of the machine. */
export function scan(layout: DigLayout, s: DigState, c: Cell): { state: DigState; distance: number } | null {
  if (s.scansLeft <= 0) return null
  const distance = Math.min(...layout.machine.map((m) => Math.abs(m.col - c.col) + Math.abs(m.row - c.row)))
  return { state: { ...s, scansLeft: s.scansLeft - 1 }, distance }
}

/** A passing dust devil cleans the solar panels once per dig: more energy, but no dig star. */
export function dustDevil(s: DigState): DigState | null {
  if (s.usedDustDevil) return null
  return { ...s, energy: s.energy + DUST_DEVIL_ENERGY, usedDustDevil: true }
}

export const machineFound = (layout: DigLayout, s: DigState) => layout.machine.every((m) => isOpen(s, m))

/** The dig star: found the machine without needing the dust devil. */
export const earnedDigStar = (layout: DigLayout, s: DigState) => machineFound(layout, s) && !s.usedDustDevil
