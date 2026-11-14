/** Astro, our original friendly robot guide. */
export default function AstroAvatar({ className = 'h-12 w-12', thinking = false }: { className?: string; thinking?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Astro the robot">
      <defs>
        <linearGradient id="astro-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8ecff" />
          <stop offset="1" stopColor="#a9b2d6" />
        </linearGradient>
        <linearGradient id="astro-visor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <line x1="32" y1="6" x2="32" y2="14" stroke="#a9b2d6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="6" r="4" fill="#fbbf24">
        {thinking && <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />}
      </circle>
      <rect x="10" y="14" width="44" height="36" rx="16" fill="url(#astro-body)" />
      <rect x="16" y="21" width="32" height="20" rx="10" fill="url(#astro-visor)" />
      <circle cx="25" cy="31" r="3.5" fill="#050816" />
      <circle cx="39" cy="31" r="3.5" fill="#050816" />
      <circle cx="26.2" cy="29.8" r="1.2" fill="#fff" />
      <circle cx="40.2" cy="29.8" r="1.2" fill="#fff" />
      <path d="M27 37 Q32 40 37 37" stroke="#050816" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="4" y="26" width="6" height="12" rx="3" fill="#a78bfa" />
      <rect x="54" y="26" width="6" height="12" rx="3" fill="#a78bfa" />
      <rect x="22" y="50" width="20" height="8" rx="4" fill="#24306b" />
    </svg>
  )
}
