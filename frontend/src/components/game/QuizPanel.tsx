import { useState } from 'react'
import { QUIZ_PASS } from '../../game/scoring'
import type { QuizQuestion } from '../../types/campaign'
import Paper from '../Paper'

/** Stage 6: a few questions, one at a time, with a kind explanation after every answer. */
export default function QuizPanel({
  questions,
  onDone,
  pass = QUIZ_PASS,
}: {
  questions: QuizQuestion[]
  onDone: (correct: number) => void
  /** Right answers needed for the quiz star. */
  pass?: number
}) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const q = questions[index]
  const last = index === questions.length - 1

  function answer(i: number) {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) setScore((s) => s + 1)
  }

  function next() {
    if (last) {
      setFinished(true)
      return
    }
    setIndex((n) => n + 1)
    setPicked(null)
  }

  if (finished) {
    const passed = score >= pass
    return (
      <Paper tone="yellow" tilt={0.5} innerClassName="p-6 sm:p-8">
        <h2 className="text-3xl">
          You got {score} out of {questions.length}! {passed ? '🌟' : '💪'}
        </h2>
        <p className="mt-2 text-lg">{passed ? 'Quiz star earned!' : `Get ${pass} right to earn the quiz star. You can play again any time.`}</p>
        <button type="button" className="cbtn c-mint mt-5" onClick={() => onDone(score)}>
          See my stars →
        </button>
      </Paper>
    )
  }

  const correct = picked === q.answer
  return (
    <Paper tone="cream" tilt={-0.4} innerClassName="p-6 sm:p-8">
      <p className="tape c-yellow mb-3">
        Question {index + 1} of {questions.length}
      </p>
      <h2 className="text-2xl sm:text-3xl">{q.question}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group" aria-label="Answers">
        {q.options.map((option, i) => {
          // Colours are set inline so they win over the chip's own "pressed" yellow.
          const colour = picked === null ? undefined : i === q.answer ? 'var(--color-mint)' : i === picked ? 'var(--color-pink)' : undefined
          return (
            <button
              key={option}
              type="button"
              style={colour ? ({ '--c': colour } as React.CSSProperties) : undefined}
              className={`chip sticker c-white min-h-14 justify-start text-base ${picked !== null && !colour ? 'opacity-60' : ''}`}
              aria-pressed={picked === i}
              disabled={picked !== null && i !== picked && i !== q.answer}
              onClick={() => answer(i)}
            >
              {picked !== null && i === q.answer && <span aria-hidden="true">✓</span>}
              {picked !== null && i === picked && i !== q.answer && <span aria-hidden="true">✗</span>}
              {option}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <>
          <div className="mt-5" role="status" aria-live="polite">
            <p className="text-lg font-bold">{correct ? 'Yes, that’s right! 🎉' : 'Good try! Here’s the answer:'}</p>
            <p className="mt-1">{q.explain}</p>
          </div>
          <div className="next-dock mt-4">
            <button type="button" className="cbtn c-yellow" onClick={next}>
              {last ? 'See my score' : 'Next question →'}
            </button>
          </div>
        </>
      )}
    </Paper>
  )
}
