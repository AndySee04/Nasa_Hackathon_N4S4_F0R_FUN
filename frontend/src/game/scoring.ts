/** Star rules for one level (see docs/specs/game-moon-campaign.md §4). Pure functions. */

export interface LevelResult {
  caught: boolean
  repaired: boolean
  /** Correct answers out of 3. */
  quizCorrect: number
}

export type Stars = 0 | 1 | 2 | 3

/** Quiz answers needed for the quiz star. */
export const QUIZ_PASS = 2

/** One star each for catching, repairing and passing the quiz. */
export function starsFor(r: LevelResult): Stars {
  return ((r.caught ? 1 : 0) + (r.repaired ? 1 : 0) + (r.quizCorrect >= QUIZ_PASS ? 1 : 0)) as Stars
}

/** Combines two results so a replay can only ever improve the saved best. */
export function bestOf(a: LevelResult, b: LevelResult): LevelResult {
  return {
    caught: a.caught || b.caught,
    repaired: a.repaired || b.repaired,
    quizCorrect: Math.max(a.quizCorrect, b.quizCorrect),
  }
}
