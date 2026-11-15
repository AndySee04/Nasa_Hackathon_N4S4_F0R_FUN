/** Astro, our original friendly robot guide, drawn in the museum's crayon colours. */
export default function AstroAvatar({ className = 'h-12 w-12', thinking = false }: { className?: string; thinking?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Astro the robot">
      <path d="M32 10v6" stroke="#22203a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="7" r="4.2" fill="#f9c846" stroke="#22203a" strokeWidth="1.6">
        {thinking && <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />}
      </circle>
      <rect x="4" y="27" width="7" height="12" rx="3.5" fill="#f28ab2" stroke="#22203a" strokeWidth="1.8" />
      <rect x="53" y="27" width="7" height="12" rx="3.5" fill="#f28ab2" stroke="#22203a" strokeWidth="1.8" />
      <rect x="10" y="16" width="44" height="34" rx="16" fill="#63b7f0" stroke="#22203a" strokeWidth="2.5" />
      <rect x="16" y="23" width="32" height="18" rx="9" fill="#22203a" />
      <circle cx="25" cy="31" r="3.4" fill="#6fd3a8" />
      <circle cx="39" cy="31" r="3.4" fill="#6fd3a8" />
      <path d="M28 36.5q4 2.6 8 0" stroke="#6fd3a8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="23" y="50" width="18" height="7" rx="3.5" fill="#f9c846" stroke="#22203a" strokeWidth="1.8" />
    </svg>
  )
}
