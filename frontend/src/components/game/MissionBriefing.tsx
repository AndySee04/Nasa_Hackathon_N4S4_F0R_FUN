import { useEffect, useState } from 'react'
import AstroAvatar from '../AstroAvatar'
import Paper from '../Paper'

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** The mission guide reads the briefing. "Read it to me" uses the browser's own voice (nothing is sent anywhere). */
export default function MissionBriefing({ text, onStart }: { text: string; onStart: () => void }) {
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
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.95
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    synth.cancel()
    synth.speak(u)
    setSpeaking(true)
  }

  return (
    <Paper tone="yellow" tilt={-0.8} innerClassName="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-7">
      <AstroAvatar className="h-20 w-20 shrink-0" thinking={speaking} />
      <div className="flex-1">
        <p className="tape c-white mb-2">Mission briefing</p>
        <p className="text-lg sm:text-xl" aria-live="polite">
          {text}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="cbtn c-mint" onClick={onStart}>
            Pick a signal on the Moon 👇
          </button>
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
