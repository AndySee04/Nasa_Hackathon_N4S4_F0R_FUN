import { useEffect, useState } from 'react'
import AstroAvatar from '../AstroAvatar'
import Paper from '../Paper'

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** The mission guide reads the briefing. "Read it to me" uses the browser's own voice (nothing is sent anywhere). */
export default function MissionBriefing({
  text,
  steps = [],
  tip,
  onStart,
  startLabel = 'Pick a signal on the Moon 👇',
  compact = false,
}: {
  /** The opening line. */
  text: string
  /** What to do, in order. Shown as a short numbered list instead of one long paragraph. */
  steps?: string[]
  tip?: string
  /** Shows a start button. Leave out when the map is already on screen. */
  onStart?: () => void
  startLabel?: string
  /** Smaller, for the side of the mission map. */
  compact?: boolean
}) {
  const [speaking, setSpeaking] = useState(false)
  const speech = canSpeak()

  // Stop talking if the child leaves the page.
  useEffect(() => () => (speech ? window.speechSynthesis.cancel() : undefined), [speech])

  function toggleSpeech() {
    if (!speech) return
    const synth = window.speechSynthesis
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    const u = new SpeechSynthesisUtterance([text, ...steps, tip ?? ''].join(' '))
    u.rate = 0.95
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    synth.cancel()
    synth.speak(u)
    setSpeaking(true)
  }

  return (
    <Paper
      tone="yellow"
      tilt={-0.8}
      innerClassName={`flex gap-4 ${compact ? 'items-start p-4 sm:p-5' : 'flex-col p-5 sm:flex-row sm:items-start sm:p-7'}`}
    >
      <AstroAvatar className={`${compact ? 'h-12 w-12' : 'h-20 w-20'} shrink-0`} thinking={speaking} />
      <div className="flex-1">
        <p className="tape c-white mb-2">Mission briefing</p>
        <p className={compact ? 'leading-snug' : 'text-lg sm:text-xl'}>{text}</p>
        {steps.length > 0 && (
          <ol className={`mt-2 space-y-1.5 ${compact ? '' : 'text-lg'}`}>
            {steps.map((step, i) => (
              <li key={step} className="flex items-start gap-2.5 leading-snug">
                <span
                  aria-hidden="true"
                  className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink/70 bg-sticker font-display text-sm"
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
        {tip && <p className="mt-2 font-display">{tip}</p>}
        <div className={`${compact ? 'mt-3' : 'mt-4'} flex flex-wrap gap-3`}>
          {onStart && (
            <button type="button" className="cbtn c-mint" onClick={onStart}>
              {startLabel}
            </button>
          )}
          {speech && (
            <button type="button" className="chip sticker c-white" aria-pressed={speaking} onClick={toggleSpeech}>
              {speaking ? '⏹ Stop reading' : '🔊 Read it to me'}
            </button>
          )}
        </div>
      </div>
    </Paper>
  )
}
