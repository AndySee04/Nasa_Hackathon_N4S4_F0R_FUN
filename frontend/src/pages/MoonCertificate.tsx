import { motion, useReducedMotion } from 'framer-motion'
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MachineSprite } from '../components/game/Sprites'
import PageHeader from '../components/PageHeader'
import Paper from '../components/Paper'
import { artifactById } from '../data'
import { MOON_CAMPAIGN } from '../data/campaigns/moon'
import { cleanNickname, makeCertificateId, NICKNAME_MAX, UNOFFICIAL_NOTE } from '../game/certificate'
import { campaignStars } from '../game/progress'
import { useProgress } from '../game/useProgress'
import { usePageContext } from '../hooks/usePageContext'

const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** The Moon Explorer badge celebration and a printable, unofficial certificate. */
export default function MoonCertificate() {
  usePageContext('moon-campaign')
  const { progress } = useProgress()
  const still = useReducedMotion()
  const inputId = useId()
  const [nickname, setNickname] = useState('')
  const certificateId = useMemo(() => makeCertificateId('MOON'), [])
  const date = useMemo(() => today(), [])

  const campaign = progress.campaigns[MOON_CAMPAIGN.id]
  const hasBadge = campaign?.badges.includes(MOON_CAMPAIGN.badge.id) ?? false
  const stars = campaignStars(progress, MOON_CAMPAIGN)
  const name = nickname.trim()

  if (!hasBadge) {
    const missing = MOON_CAMPAIGN.artifacts.filter((a) => (campaign?.artifacts[a.artifactId]?.stars ?? 0) === 0)
    return (
      <PageHeader eyebrow="Moon campaign" title="Certificate locked 🔒">
        Catch all four Moon machines to earn the {MOON_CAMPAIGN.badge.name} badge and your certificate. Still to find:{' '}
        {missing.map((a) => artifactById(a.artifactId)?.missionName).join(', ')}.{' '}
        <Link to="/moon/campaign" className="link">
          Back to the Moon
        </Link>
      </PageHeader>
    )
  }

  return (
    <>
      <div className="print-hide">
        <PageHeader eyebrow="Moon campaign · Complete!" title={`${MOON_CAMPAIGN.badge.name} badge earned! 🏅`}>
          You found every machine on the Moon. Type a nickname to put on your certificate, then print it or save it as a PDF.
        </PageHeader>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="print-hide mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
          <motion.div
            className="text-7xl"
            aria-hidden="true"
            initial={still ? false : { scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 9 }}
          >
            🏅
          </motion.div>
          <div className="flex-1">
            <label htmlFor={inputId} className="font-display text-lg text-chalk">
              Your nickname (not your full name)
            </label>
            <input
              id={inputId}
              value={nickname}
              maxLength={NICKNAME_MAX}
              onChange={(e) => setNickname(cleanNickname(e.target.value))}
              placeholder="e.g. Star Explorer"
              autoComplete="off"
              className="mt-1 block min-h-12 w-full rounded-full border-[3px] border-ink/80 bg-sticker px-5 text-lg text-ink"
            />
            <p className="mt-1 text-sm text-dusk">Your nickname is only shown on this screen. It is not saved or sent anywhere.</p>
          </div>
          <button type="button" className="cbtn c-yellow" disabled={!name} onClick={() => window.print()}>
            🖨️ Print or save as PDF
          </button>
        </div>

        <div className="print-area">
          <Paper tone="cream" tilt={0} innerClassName="p-6 text-center sm:p-12">
            <section aria-label="Certificate">
              <p className="tape c-yellow mx-auto mb-4">N4S4 F0R FUN · Space Artifacts Explorer</p>
              <p className="font-display text-xl text-ink-soft">This certificate is awarded to</p>
              <p className="mt-2 min-h-[1.3em] text-4xl font-extrabold sm:text-5xl" data-testid="certificate-name">
                {name || '…your nickname…'}
              </p>
              <p className="mt-4 text-lg">
                for completing the <strong>{MOON_CAMPAIGN.title}</strong> campaign and earning the{' '}
                <strong>{MOON_CAMPAIGN.badge.name}</strong> badge.
              </p>
              <div className="mx-auto mt-6 flex max-w-lg flex-wrap items-end justify-center gap-4">
                {MOON_CAMPAIGN.artifacts.map((a) => (
                  <MachineSprite key={a.artifactId} kind={a.catcherSprite} className="h-14 w-auto" />
                ))}
              </div>
              <dl className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-ink-soft">Stars</dt>
                  <dd className="m-0 text-lg font-bold">
                    ⭐ {stars.earned} / {stars.max}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Date</dt>
                  <dd className="m-0 text-lg font-bold">{date}</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Certificate code</dt>
                  <dd className="m-0 font-mono font-bold">{certificateId}</dd>
                </div>
              </dl>
              <p className="mt-8 border-t-2 border-dashed border-ink/25 pt-3 text-sm text-ink-soft">{UNOFFICIAL_NOTE}</p>
            </section>
          </Paper>
        </div>

        <p className="print-hide mt-6 text-center">
          <Link to="/moon/campaign" className="link text-chalk">
            Back to the Moon
          </Link>
        </p>
      </div>
    </>
  )
}
