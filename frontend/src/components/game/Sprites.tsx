import type { CatcherSprite } from '../../types/campaign'

/** Original crayon-style drawings for the catcher. Simple shapes, not copies of photos. */

export function RocketClaw({ open, className = '' }: { open: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 80 110" className={className} aria-hidden="true">
      <path d="M40 4c14 10 20 28 20 46H20C20 32 26 14 40 4z" fill="#f7f3e8" stroke="#22203a" strokeWidth="3" />
      <circle cx="40" cy="30" r="7" fill="#63b7f0" stroke="#22203a" strokeWidth="2.5" />
      <path d="M20 40l-10 14h10zM60 40l10 14H60z" fill="#f28ab2" stroke="#22203a" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="24" y="50" width="32" height="10" rx="3" fill="#f9c846" stroke="#22203a" strokeWidth="2.5" />
      <path d="M33 60l-3 8M47 60l3 8" stroke="#f48a4a" strokeWidth="4" strokeLinecap="round" />
      <rect x="37" y="60" width="6" height="16" fill="#9a98a6" stroke="#22203a" strokeWidth="2" />
      {/* Claw fingers: they swing open while aiming and close to grab. */}
      {[
        ['#22203a', 7],
        ['#f9c846', 3.5],
      ].map(([color, width]) => (
        <g key={color} stroke={color as string} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d={open ? 'M40 76l-16 12 4 16' : 'M40 76l-8 14 6 12'} />
          <path d={open ? 'M40 76l16 12-4 16' : 'M40 76l8 14-6 12'} />
        </g>
      ))}
    </svg>
  )
}

export function MachineSprite({ kind, className = '' }: { kind: CatcherSprite; className?: string }) {
  if (kind === 'lander-rover') {
    // Falcon's descent stage with the Lunar Roving Vehicle parked beside it.
    return (
      <svg viewBox="0 0 160 80" className={className} aria-hidden="true">
        <svg x="0" y="0" width="100" height="80" viewBox="0 0 100 80">
          <LanderShape />
        </svg>
        <svg x="96" y="34" width="64" height="40" viewBox="0 0 100 60">
          <RoverShape />
        </svg>
      </svg>
    )
  }
  if (kind === 'rover') {
    return (
      <svg viewBox="0 0 100 60" className={className} aria-hidden="true">
        <RoverShape />
      </svg>
    )
  }
  if (kind === 'robot-lander') {
    return (
      <svg viewBox="0 0 100 80" className={className} aria-hidden="true">
        <path d="M50 10L28 62M50 10l22 52M50 10v56" stroke="#22203a" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="36" y="22" width="28" height="18" rx="2" fill="#f7f3e8" stroke="#22203a" strokeWidth="3" />
        <rect x="56" y="4" width="22" height="12" fill="#63b7f0" stroke="#22203a" strokeWidth="2.5" />
        <path d="M36 34l-14 8" stroke="#22203a" strokeWidth="3" strokeLinecap="round" />
        <rect x="14" y="40" width="10" height="6" fill="#f9c846" stroke="#22203a" strokeWidth="2" />
        {[22, 78, 50].map((x) => (
          <ellipse key={x} cx={x} cy={x === 50 ? 70 : 66} rx="8" ry="3.5" fill="#9a98a6" stroke="#22203a" strokeWidth="2.5" />
        ))}
      </svg>
    )
  }
  // Lander: the descent stage, the bottom half left on the Moon, wrapped in gold foil.
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden="true">
      <LanderShape />
    </svg>
  )
}

function LanderShape() {
  return (
    <>
      <path d="M22 20h56l6 26H16z" fill="#f9c846" stroke="#22203a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 24l6 18M50 22v22M70 24l-6 18" stroke="#c99a52" strokeWidth="2.5" />
      <path d="M18 44L6 70M82 44l12 26M30 46l-6 24M70 46l6 24" stroke="#22203a" strokeWidth="3.5" strokeLinecap="round" />
      {[6, 94, 24, 76].map((x) => (
        <ellipse key={x} cx={x} cy="72" rx="7" ry="3" fill="#9a98a6" stroke="#22203a" strokeWidth="2.5" />
      ))}
      <path d="M44 46h12l-2 8h-8z" fill="#57536e" stroke="#22203a" strokeWidth="2.5" />
    </>
  )
}

function RoverShape() {
  return (
    <>
      <rect x="14" y="20" width="72" height="14" rx="3" fill="#cfcdd6" stroke="#22203a" strokeWidth="3" />
      <path d="M30 20v-10h10l4 10M62 20l6-14" stroke="#22203a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="68" cy="6" r="5" fill="#f9c846" stroke="#22203a" strokeWidth="2.5" />
      {[24, 76].map((x) => (
        <g key={x}>
          <circle cx={x} cy="44" r="12" fill="#57536e" stroke="#22203a" strokeWidth="3" />
          <circle cx={x} cy="44" r="4" fill="#cfcdd6" />
        </g>
      ))}
    </>
  )
}

export function MoonRock({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 36" className={className} aria-hidden="true">
      <path d="M6 32c-4-10 4-22 16-24 6-6 18-6 24 2 10 2 14 12 10 22z" fill="#8f8c9e" stroke="#22203a" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="24" cy="20" r="3" fill="#6f6c80" />
      <circle cx="40" cy="22" r="2" fill="#6f6c80" />
    </svg>
  )
}
