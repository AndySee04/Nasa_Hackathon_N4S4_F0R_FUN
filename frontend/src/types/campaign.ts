/**
 * Data model for game campaigns (see docs/specs/game-moon-campaign.md).
 *
 * A campaign is content, not code: adding Mars or a nebula later means adding
 * a new data file, not new engine logic. Facts about each artifact live in
 * artifacts.json; a campaign only adds the game layer on top.
 */

export type StageId = 'landing' | 'catch' | 'discovery' | 'repair' | 'science' | 'quiz' | 'complete'

export const STAGES: StageId[] = ['landing', 'catch', 'discovery', 'repair', 'science', 'quiz', 'complete']

export type CampaignId = 'moon' | 'mars'

export interface Campaign {
  id: CampaignId
  title: string
  /** The opening line, read by the mission guide. */
  briefing: string
  /** What to do, one short step per line. */
  briefingSteps: string[]
  /** One extra line after the steps. */
  briefingTip?: string
  /** Order is the suggested play order. All are needed for the badge. */
  artifacts: CampaignArtifact[]
  /** Extra levels for more stars; not needed for the badge. */
  bonusArtifacts: CampaignArtifact[]
  badge: BadgeDef
}

export type CatcherSprite = 'lander' | 'lander-rover' | 'rover' | 'robot-lander' | 'helicopter'

export interface CampaignArtifact {
  /** Must match an id in artifacts.json. */
  artifactId: string
  catcherSprite: CatcherSprite
  /** Stage 4. Always shown as a pretend training-simulator mission. */
  repair: RepairChallenge
  /** Stage 5: what really happened. Every point must come from the artifact's record. */
  science: { headline: string; points: string[] }
  /** Stage 6: exactly three questions. */
  quiz: QuizQuestion[]
}

export interface DragSlot {
  id: string
  label: string
  hint: string
}

export type RepairChallenge =
  | { kind: 'drag-parts'; title: string; slots: DragSlot[] }
  | { kind: 'match-instruments'; title: string; pairs: { instrument: string; job: string }[] }
  | { kind: 'circuit'; title: string; nodes: string[]; correctPath: string[] }
  | { kind: 'sequence'; title: string; steps: string[] }

export interface QuizQuestion {
  question: string
  options: string[]
  /** Index into options. */
  answer: number
  /** Shown after answering, right or wrong. */
  explain: string
}

export interface BadgeDef {
  id: string
  name: string
  description: string
}

// ---------- Mars campaign ----------

/** A science clue hidden in the Mars Dig. Each is a true discovery from the machine's NASA record. */
export interface DigClue {
  icon: string
  label: string
  fact: string
}

export interface MarsLevel {
  artifactId: string
  sprite: CatcherSprite
  /** Stage 2: pretend dig. Three clues hidden in the ground. */
  clues: [DigClue, DigClue, DigClue]
  /** Stage 4: plan a drive, arm move or flight. */
  drive: import('../game/drive').DriveLevel
  science: { headline: string; points: string[] }
  /** Stage 6: four questions; three right earns the star. */
  quiz: QuizQuestion[]
}

export interface MarsCampaign {
  id: 'mars'
  title: string
  briefing: string
  briefingSteps: string[]
  briefingTip?: string
  artifacts: MarsLevel[]
  bonusArtifacts: MarsLevel[]
  badge: BadgeDef
  /** Full stars on every core level are needed for the Mars badge. */
  badgeNeedsStars: number
}
