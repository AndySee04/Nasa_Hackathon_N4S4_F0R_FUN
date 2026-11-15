/**
 * Rover Drive: rules for the Mars campaign's second challenge. Pure functions, tested without a browser.
 *
 * True to life: rover drivers can't steer live, because a radio signal takes about 4 to 22 minutes
 * to reach Mars one way. So they plan a whole list of commands, send it, and see what happened later.
 * Here you plan a list of moves, press Send, and watch the rover follow it. Rocks stop the rover
 * (real rovers stop themselves when they see a hazard); soft sand traps it, like Spirit at Troy.
 */

export type Dir = 'N' | 'E' | 'S' | 'W'
export type Command = 'F' | 'L' | 'R'

/**
 * rover: rocks stop it, soft sand traps it.
 * arm: a lander's robotic arm; rocks and hardware stop it.
 * helicopter: flies over rocks, but featureless sand ripples confuse its navigation camera.
 */
export type Vehicle = 'rover' | 'arm' | 'helicopter'

export interface DriveLevel {
  vehicle: Vehicle
  /** Rows of the map, top first. S = start, T = target, # = rock, ~ = soft sand / sand ripples, . = open ground. */
  map: string[]
  startDir: Dir
  /** Most commands allowed in one send. */
  maxCommands: number
  /** What the target is, e.g. "the rock nicknamed Yogi". */
  targetLabel: string
}

export interface Pos {
  x: number
  y: number
  dir: Dir
}

export type Outcome = 'arrived' | 'hazard' | 'stuck' | 'lost' | 'edge' | 'short'

export const MAX_SOLS = 3

const TURN_LEFT: Record<Dir, Dir> = { N: 'W', W: 'S', S: 'E', E: 'N' }
const TURN_RIGHT: Record<Dir, Dir> = { N: 'E', E: 'S', S: 'W', W: 'N' }
const STEP: Record<Dir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }

export function parseLevel(level: DriveLevel): { width: number; height: number; start: Pos; target: { x: number; y: number } } {
  let start: Pos | null = null
  let target: { x: number; y: number } | null = null
  level.map.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === 'S') start = { x, y, dir: level.startDir }
      if (ch === 'T') target = { x, y }
    }),
  )
  if (!start || !target) throw new Error('map needs S and T')
  return { width: level.map[0].length, height: level.map.length, start, target }
}

const tile = (level: DriveLevel, x: number, y: number) => level.map[y]?.[x]

export function step(pos: Pos, cmd: Command): Pos {
  if (cmd === 'L') return { ...pos, dir: TURN_LEFT[pos.dir] }
  if (cmd === 'R') return { ...pos, dir: TURN_RIGHT[pos.dir] }
  const [dx, dy] = STEP[pos.dir]
  return { ...pos, x: pos.x + dx, y: pos.y + dy }
}

/** Runs a list of commands. `path` holds every position the rover reaches, starting position first. */
export function simulate(level: DriveLevel, commands: Command[], from?: Pos): { path: Pos[]; outcome: Outcome } {
  const { width, height, start: mapStart, target } = parseLevel(level)
  const start = from ?? mapStart
  const path: Pos[] = [start]
  let pos = start
  for (const cmd of commands) {
    const next = step(pos, cmd)
    if (cmd === 'F') {
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) return { path, outcome: 'edge' }
      const t = tile(level, next.x, next.y)
      const flying = level.vehicle === 'helicopter'
      if (t === '#' && !flying) return { path, outcome: 'hazard' }
      path.push(next)
      if (t === '~') return { path, outcome: flying ? 'lost' : 'stuck' }
      if (next.x === target.x && next.y === target.y) return { path, outcome: 'arrived' }
    } else {
      path.push(next)
    }
    pos = next
  }
  return { path, outcome: 'short' }
}

/**
 * Where the rover waits for the next sol's plan. In the simulator, a rover stuck in sand is
 * backed out to its last firm tile (the real Spirit could not be freed).
 */
export function restingPlace(path: Pos[], outcome: Outcome): Pos {
  if ((outcome === 'stuck' || outcome === 'lost') && path.length > 1) {
    const before = path[path.length - 2]
    return { ...before }
  }
  return path[path.length - 1]
}

/** Fewest commands that reach the target safely, or null if impossible (breadth-first search). */
export function shortestSolution(level: DriveLevel, from?: Pos): Command[] | null {
  const start = from ?? parseLevel(level).start
  const seen = new Set<string>()
  const queue: [Pos, Command[]][] = [[start, []]]
  while (queue.length) {
    const [pos, cmds] = queue.shift()!
    const k = `${pos.x},${pos.y},${pos.dir}`
    if (seen.has(k)) continue
    seen.add(k)
    for (const c of ['F', 'L', 'R'] as Command[]) {
      const next = [...cmds, c]
      const { outcome } = simulate(level, next, start)
      if (outcome === 'arrived') return next
      if (outcome === 'short') queue.push([step(pos, c), next])
    }
  }
  return null
}

const COMMON: Record<'edge' | 'short', string> = {
  edge: 'That would go off the map! It stopped.',
  short: 'The commands ran out before reaching the target. Add more moves.',
}

export const OUTCOME_TEXT: Record<Vehicle, Record<Outcome, string>> = {
  rover: {
    arrived: 'You reached the target! Great driving.',
    hazard: 'The rover saw a rock ahead and stopped itself, just like real rovers do. Plan a new route.',
    stuck: 'Oh no, soft sand! The wheels are spinning, like Spirit at Troy in 2009. Plan a route around the sand.',
    lost: '',
    ...COMMON,
  },
  arm: {
    arrived: 'The scoop is in place! Great arm control.',
    hazard: 'The arm stopped before bumping into something. Plan a new path.',
    stuck: 'The scoop got stuck in sticky soil. Try another path.',
    lost: '',
    ...COMMON,
  },
  helicopter: {
    arrived: 'A safe landing at the new airfield! Great flying.',
    hazard: '',
    stuck: '',
    lost: 'Smooth sand ripples have few features for the navigation camera to track. That is what went wrong on Ingenuity\'s last real flight! Fly around them.',
    ...COMMON,
  },
}

export const VEHICLE_WORDS: Record<Vehicle, { name: string; forward: string; send: string }> = {
  rover: { name: 'rover', forward: 'Drive forward', send: 'Send drive plan' },
  arm: { name: 'robotic arm', forward: 'Move forward', send: 'Send arm plan' },
  helicopter: { name: 'helicopter', forward: 'Fly forward', send: 'Send flight plan' },
}
