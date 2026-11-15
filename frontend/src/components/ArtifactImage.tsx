import { useState } from 'react'
import { useNasaImage } from '../hooks/useNasaImage'
import type { Artifact, HardwareType, World } from '../types/artifact'

/** Coloured paper behind the drawing while a photo loads, or if none is found. */
const WORLD_BG: Record<World, string> = {
  moon: '#d9d6e4',
  mars: '#f2b38e',
  'deep-space': '#cbbfff',
}

/** Simple original line illustrations, used while a NASA photo loads or if none is found. */
export function HardwareIllustration({ type, className = 'h-24 w-24' }: { type: HardwareType; className?: string }) {
  const stroke = { stroke: '#22203a', strokeWidth: 3, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {type === 'rover' && (
        <g {...stroke}>
          <rect x="25" y="38" width="50" height="18" rx="4" />
          <path d="M50 38V24M44 24h12" />
          <circle cx="28" cy="68" r="7" /><circle cx="50" cy="68" r="7" /><circle cx="72" cy="68" r="7" />
          <path d="M28 61l8-5M72 61l-8-5M50 61v-5" />
        </g>
      )}
      {(type === 'lander' || type === 'descent-stage') && (
        <g {...stroke}>
          <path d="M32 50h36l-6-16H38z" />
          <path d="M36 50l-12 22M64 50l12 22M44 50l-4 22M56 50l4 22" />
          <path d="M18 72h14M68 72h14" />
          {type === 'lander' && <path d="M50 34V20M42 22l8-4 8 4" />}
        </g>
      )}
      {type === 'probe' && (
        <g {...stroke}>
          <ellipse cx="50" cy="36" rx="22" ry="7" />
          <path d="M50 43v12M42 55h16v12H42zM58 61l22 10M42 61l-16 14" />
          <circle cx="80" cy="71" r="3" />
        </g>
      )}
      {type === 'orbiter' && (
        <g {...stroke}>
          <rect x="40" y="40" width="20" height="24" rx="3" />
          <ellipse cx="50" cy="34" rx="16" ry="5" />
          <path d="M40 52H16M60 52h24" />
          <rect x="8" y="46" width="10" height="12" /><rect x="82" y="46" width="10" height="12" />
        </g>
      )}
      {type === 'helicopter' && (
        <g>
          <path d="M18 30h64M50 30v14" />
          <path d="M24 38h52" />
          <rect x="38" y="44" width="24" height="18" rx="5" />
          <path d="M40 62l-10 20M60 62l10 20M44 62l-4 20M56 62l4 20" />
        </g>
      )}
      {type === 'impactor' && (
        <g {...stroke}>
          <path d="M30 20l26 26" />
          <rect x="52" y="42" width="14" height="22" rx="3" transform="rotate(-45 59 53)" />
          <path d="M20 80c10-12 50-12 60 0M42 70l-6-8M58 70l6-8M50 68v-10" />
        </g>
      )}
    </svg>
  )
}

interface Props {
  artifact: Artifact
  /** Classes for the photo box (its shape), e.g. an aspect ratio. */
  className?: string
  showCredit?: boolean
  /** Tilt of the printed photo in degrees. */
  tilt?: number
}

/** A NASA photo printed and glued on with a white border, with a credit line underneath. */
export default function ArtifactImage({ artifact, className = 'aspect-[4/3]', showCredit = false, tilt = 1 }: Props) {
  const state = useNasaImage(artifact.imageQuery)
  const [failed, setFailed] = useState(false)
  const showPhoto = state.status === 'ready' && !failed

  return (
    <figure className="m-0">
      <div
        className={`polaroid relative overflow-hidden ${className}`}
        style={{ background: WORLD_BG[artifact.world], '--r': `${tilt}deg` } as React.CSSProperties}
      >
        {!showPhoto && (
          <div className="absolute inset-0 flex items-center justify-center">
            <HardwareIllustration type={artifact.hardwareType} className={`h-1/2 w-1/2 ${state.status === 'loading' ? 'animate-pulse' : ''}`} />
          </div>
        )}
        {showPhoto && (
          <img
            src={state.image.url}
            alt={`NASA photo: ${state.image.title}`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
      {showCredit && (
        <figcaption className="muted mt-3 text-sm">
          {showPhoto ? (
            <>
              {state.image.title} · Credit: NASA{state.image.center ? ` (${state.image.center})` : ''} ·{' '}
              <a href={state.image.pageUrl} target="_blank" rel="noopener noreferrer" className="link font-normal">
                NASA Image Library
              </a>
            </>
          ) : state.status === 'loading' ? (
            'Looking for a photo in the NASA Image and Video Library…'
          ) : (
            'Drawing. No matching photo found in the NASA Image and Video Library.'
          )}
        </figcaption>
      )}
    </figure>
  )
}
