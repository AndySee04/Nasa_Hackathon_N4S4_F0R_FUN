/** Star rules for one level (see docs/specs/game-moon-campaign.md §4). Pure functions. */

export interface LevelResult {
  caught: boolean
  repaired: boolean
  /** Correct answers out of 3. */
  quizCorrect: number
}

export type Stars = 0 | 1 | 2 | 3

/** Quiz answers needed for the quiz star on the Moon (3 questions). */
export const QUIZ_PASS = 2

/** Each campaign sets its own quiz bar: Mars is harder (3 of 4). */
export const QUIZ_PASS_BY_CAMPAIGN: Record<string, number> = { moon: 2, mars: 3 }

export const quizPassFor = (campaignId: string): number => QUIZ_PASS_BY_CAMPAIGN[campaignId] ?? QUIZ_PASS

/**
 * One star each for the first challenge (catch on the Moon, dig on Mars), the second
 * (repair on the Moon, drive on Mars) and passing the quiz.
 */
export function starsFor(r: LevelResult, quizPass: number = QUIZ_PASS): Stars {
  return ((r.caught ? 1 : 0) + (r.repaired ? 1 : 0) + (r.quizCorrect >= quizPass ? 1 : 0)) as Stars
}

/** Combines two results so a replay can only ever improve the saved best. */
export function bestOf(a: LevelResult, b: LevelResult): LevelResult {
  return {
    caught: a.caught || b.caught,
    repaired: a.repaired || b.repaired,
    quizCorrect: Math.max(a.quizCorrect, b.quizCorrect),
  }
}
