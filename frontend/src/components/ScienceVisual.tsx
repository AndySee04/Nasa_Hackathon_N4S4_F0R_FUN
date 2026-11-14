import { motion } from 'framer-motion'
import type { ScienceTopic } from '../data/science'

/** Small animated diagrams for the Science Lab. Each one shows the idea, not a technical drawing. */
export default function ScienceVisual({ visual }: { visual: ScienceTopic['visual'] }) {
  const loop = { repeat: Infinity, ease: 'easeInOut' as const }
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label={LABELS[visual]}>
      <rect width="320" height="180" rx="18" fill="#0d1433" />
      {visual === 'wheels' && (
        <>
          <path d="M0 150 Q60 150 90 138 Q120 126 150 150 L320 150 L320 180 L0 180Z" fill="#9c3f1e" />
          <motion.g animate={{ x: [0, 150, 0] }} transition={{ duration: 8, ...loop }}>
            <rect x="40" y="96" width="70" height="22" rx="5" fill="#e8ecff" />
            <path d="M75 96V78M66 78h18" stroke="#e8ecff" strokeWidth="4" />
            <path d="M48 118l12 14M102 118l-12 14M75 118v14" stroke="#a9b2d6" strokeWidth="4" />
            {[48, 75, 102].map((cx) => (
              <circle key={cx} cx={cx} cy={140} r="9" fill="#24306b" stroke="#22d3ee" strokeWidth="3" />
            ))}
          </motion.g>
          <text x="16" y="28" fill="#a9b2d6" fontSize="13" fontFamily="Nunito, ui-sans-serif, sans-serif">Six wheels on a rocker-bogie</text>
        </>
      )}
      {visual === 'signal' && (
        <>
          <circle cx="40" cy="120" r="22" fill="#4aa3ff" />
          <path d="M70 70 l18 -26 l18 26z" fill="#a9b2d6" />
          <rect x="250" y="40" width="40" height="16" rx="3" fill="#e8ecff" />
          <path d="M270 56v14M258 70h24" stroke="#e8ecff" strokeWidth="3" />
          {[0, 1, 2].map((i) => (
            <motion.circle key={i} r="5" fill="#22d3ee" initial={{ cx: 265, cy: 70, opacity: 0 }}
              animate={{ cx: [265, 95], cy: [70, 62], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i, ease: 'linear' }} />
          ))}
          <text x="16" y="28" fill="#a9b2d6" fontSize="13" fontFamily="Nunito, ui-sans-serif, sans-serif">Radio waves travel at the speed of light</text>
          <text x="20" y="165" fill="#a9b2d6" fontSize="12" fontFamily="Nunito, ui-sans-serif, sans-serif">Earth + Deep Space Network dish</text>
        </>
      )}
      {visual === 'rock' && (
        <>
          <path d="M150 150 L170 100 L230 90 L260 150Z" fill="#7a5a48" />
          <rect x="60" y="80" width="60" height="16" rx="4" fill="#e8ecff" />
          {[0, 1, 2, 3].map((i) => (
            <motion.circle key={i} r="3.5" fill={i % 2 ? '#a78bfa' : '#fbbf24'}
              animate={{ cx: [120, 175, 120], cy: [88, 115 + i * 5, 88], opacity: [1, 1, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }} />
          ))}
          <text x="16" y="28" fill="#a9b2d6" fontSize="13" fontFamily="Nunito, ui-sans-serif, sans-serif">Zap the rock, read what comes back</text>
          <text x="180" y="170" fill="#a9b2d6" fontSize="12" fontFamily="Nunito, ui-sans-serif, sans-serif">Fe · Si · O · Ca</text>
        </>
      )}
      {visual === 'landing' && (
        <>
          <rect x="0" y="152" width="320" height="28" fill="#9c3f1e" />
          <motion.g animate={{ y: [0, 92, 92] }} transition={{ duration: 5, times: [0, 0.8, 1], ...loop }}>
            <path d="M120 10 Q160 -20 200 10Z" fill="#e8ecff" opacity="0.8" />
            <path d="M125 10 L150 40 M195 10 L170 40" stroke="#a9b2d6" strokeWidth="1.5" />
            <circle cx="160" cy="48" r="13" fill="#fbbf24" opacity="0.9" />
          </motion.g>
          <text x="16" y="28" fill="#a9b2d6" fontSize="13" fontFamily="Nunito, ui-sans-serif, sans-serif">Heat shield → parachute → rockets or airbags</text>
        </>
      )}
      {visual === 'power' && (
        <>
          <circle cx="40" cy="60" r="20" fill="#fbbf24" />
          <rect x="110" y="70" width="90" height="40" rx="4" fill="#24306b" stroke="#22d3ee" strokeWidth="2" />
          {[0, 1, 2].map((i) => (
            <motion.line key={i} x1="62" y1={56 + i * 8} x2="108" y2={76 + i * 10} stroke="#fbbf24" strokeWidth="2"
              animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }} />
          ))}
          <rect x="235" y="70" width="34" height="50" rx="8" fill="#a78bfa" />
          <motion.circle cx="252" cy="95" r="8" fill="#fb923c" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
          <text x="16" y="28" fill="#a9b2d6" fontSize="13" fontFamily="Nunito, ui-sans-serif, sans-serif">Solar panel (left) · RTG heat power (right)</text>
        </>
      )}
      {visual === 'light' && (
        <>
          <defs>
            <linearGradient id="rainbow" x1="0" x2="1">
              <stop offset="0" stopColor="#7c3aed" /><stop offset="0.25" stopColor="#3b82f6" /><stop offset="0.5" stopColor="#22c55e" />
              <stop offset="0.75" stopColor="#facc15" /><stop offset="1" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <path d="M20 90 L120 90" stroke="#fff" strokeWidth="4" />
          <path d="M120 60 L160 120 L80 120Z" fill="#a9b2d6" opacity="0.6" />
          <rect x="180" y="72" width="120" height="36" fill="url(#rainbow)" />
          {[198, 226, 262, 284].map((x, i) => (
            <motion.rect key={x} x={x} y="72" width="3" height="36" fill="#050816" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }} />
          ))}
          <text x="16" y="28" fill="#a9b2d6" fontSize="13" fontFamily="Nunito, ui-sans-serif, sans-serif">Dark lines = element fingerprints</text>
        </>
      )}
    </svg>
  )
}

const LABELS: Record<ScienceTopic['visual'], string> = {
  wheels: 'Animation of a six-wheeled rover driving over a bump',
  signal: 'Animation of radio signals travelling from a spacecraft to a dish antenna on Earth',
  rock: 'Animation of an instrument zapping a rock and reading the signals that bounce back',
  landing: 'Animation of a lander descending under a parachute',
  power: 'Diagram of sunlight powering a solar panel next to a glowing RTG',
  light: 'Diagram of light passing through a prism into a rainbow with dark lines',
}
