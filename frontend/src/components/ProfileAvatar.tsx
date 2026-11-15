import { useState } from 'react'
import { sizedAvatar } from '../context/authState'
import { useAuth } from '../hooks/useAuth'

/**
 * The signed-in grown-up's Google photo in a round sticker frame.
 * Falls back to their first initial if there is no photo or it fails to load.
 * Decorative: the name is always written next to it, so it has no alt text of its own.
 */
export default function ProfileAvatar({ px, className = '' }: { px: number; className?: string }) {
  const { profile, displayName } = useAuth()
  const url = profile?.avatarUrl ?? null
  const [failed, setFailed] = useState<string | null>(null)
  const showPhoto = url && failed !== url

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-sky text-ink ${className}`}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      {showPhoto ? (
        <img
          src={sizedAvatar(url, px)}
          alt=""
          width={px}
          height={px}
          className="h-full w-full object-cover"
          // Don't tell Google which page the photo was shown on.
          referrerPolicy="no-referrer"
          onError={() => setFailed(url)}
        />
      ) : (
        <span className="font-display font-extrabold" style={{ fontSize: px * 0.48 }}>
          {(displayName?.[0] ?? '?').toUpperCase()}
        </span>
      )}
    </span>
  )
}
