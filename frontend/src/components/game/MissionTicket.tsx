import { Link } from 'react-router-dom'
import { MARS_CAMPAIGN } from '../../data/campaigns/mars'
import { MOON_CAMPAIGN } from '../../data/campaigns/moon'
import { campaignStars } from '../../game/progress'
import { useProgress } from '../../game/useProgress'
import PaintedWorld from './PaintedWorld'

const MISSIONS = {
  moon: { campaign: MOON_CAMPAIGN, name: 'Moon Explorer Mission', what: 'Catch real machines with a rocket claw' },
  mars: { campaign: MARS_CAMPAIGN, name: 'Mars Explorer Mission', what: 'Dig up real machines, then drive them' },
} as const

/**
 * The way into a world's game from its archive: a dark sticker with ym's painted world peeking over the edge.
 * It says what you do in the game and how many stars you have, so it reads as a game, not just another button.
 */
export default function MissionTicket({ world }: { world: 'moon' | 'mars' }) {
  const { campaign, name, what } = MISSIONS[world]
  const { progress } = useProgress()
  const stars = campaignStars(progress, campaign)
  return (
    <Link
      to={`/${world}/campaign`}
      aria-label={`Play the ${name}`}
      className="sticker group relative ml-7 flex items-center rounded-[22px_18px_24px_16px] py-2.5 pl-14 pr-5 text-left"
      style={{ '--c': 'var(--color-night)', '--r': '-1.5deg', color: 'var(--color-chalk)' } as React.CSSProperties}
    >
      <PaintedWorld
        id={world}
        still
        className="absolute -left-9 top-1/2 h-20 w-20 -translate-y-1/2 drop-shadow-[0_4px_6px_rgba(20,23,58,0.45)] transition-transform duration-300 group-hover:rotate-12"
      />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-xl text-yellow">Play the {world === 'moon' ? 'Moon' : 'Mars'} mission</span>
        <span className="mt-0.5 hidden text-sm sm:block">{what}</span>
        <span className="mt-1 text-sm text-chalk/75">
          <span aria-hidden="true">⭐ </span>
          {stars.earned > 0 ? `${stars.earned} of ${stars.max} stars so far` : `${stars.max} stars to win`}
        </span>
      </span>
    </Link>
  )
}
