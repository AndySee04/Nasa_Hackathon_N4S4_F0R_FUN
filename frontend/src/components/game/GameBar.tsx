import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Paper from '../Paper'

interface Props {
  back: { to: string; label: string }
  /** Which campaign and kind of level, on the tape above the title. */
  eyebrow?: string
  title: string
  subtitle?: string
  /** The level's steps in order, and the one being played. */
  steps?: readonly { id: string; label: string }[]
  current?: string
  /** Controls for this step, such as easy mode. */
  children?: ReactNode
}

/**
 * The slim strip at the top of every game screen: where you are, which step, and the way back.
 * It replaces a big title card plus a separate row of steps, so the game itself starts near the top of the screen.
 */
export default function GameBar({ back, eyebrow, title, subtitle, steps, current, children }: Props) {
  const at = steps ? steps.findIndex((s) => s.id === current) : -1
  return (
    <Paper tilt={-0.4} className="mb-5" innerClassName="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-5">
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {eyebrow && <p className="tape -ml-1 text-sm">{eyebrow}</p>}
          <Link to={back.to} className="link text-sm font-normal">
            ← {back.label}
          </Link>
        </div>
        <h1 className="text-2xl leading-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="muted text-sm leading-snug">{subtitle}</p>}
      </div>
      {(steps || children) && (
        // Steps above the step's own controls, so together they stay narrow and the title keeps one line.
        <div className="flex flex-col items-start gap-2 lg:items-end">
          {steps && (
            <ol className="flex flex-wrap items-center gap-1.5" aria-label="Level steps">
              {steps.map((s, i) => {
                const done = i < at
                const now = i === at
                return (
                  <li
                    key={s.id}
                    aria-current={now ? 'step' : undefined}
                    className={`label rounded-full px-2.5 text-sm ${now ? 'c-yellow' : done ? 'c-mint' : 'c-white opacity-70'}`}
                  >
                    {/* Phones show the current step's name and a number or tick for the others. */}
                    <span aria-hidden="true">{done ? '✓' : <span className={now ? 'hidden' : 'sm:hidden'}>{i + 1}</span>}</span>
                    <span className={now ? '' : 'sr-only sm:not-sr-only'}>
                      {done ? ' ' : ''}
                      {s.label}
                      {done && <span className="sr-only"> (done)</span>}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
          {children}
        </div>
      )}
    </Paper>
  )
}
