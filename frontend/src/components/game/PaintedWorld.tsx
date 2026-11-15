import { useReducedMotion } from 'framer-motion'
import { DISC, paintedUrl } from '../../lib/paintedWorlds'

/**
 * ym's painted world as a round picture that fills its box. The video loops gently; with reduced motion
 * only the still is shown (or pass `still` for small pictures that don't need to move). The video has a black square around the world, so it is cut to a circle and
 * scaled so the world's edge meets the circle's edge.
 */
export default function PaintedWorld({
  id,
  className = '',
  still: forceStill = false,
}: {
  id: 'moon' | 'mars'
  className?: string
  still?: boolean
}) {
  const still = useReducedMotion() || forceStill
  const fill = { transform: `scale(${1 / DISC})` }
  return (
    <div className={`overflow-hidden rounded-full ${className}`}>
      {still ? (
        <img src={paintedUrl(id, 'webp')} alt="" className="h-full w-full object-cover" style={fill} />
      ) : (
        <video
          src={paintedUrl(id, 'mp4')}
          poster={paintedUrl(id, 'webp')}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="h-full w-full bg-transparent object-cover"
          style={fill}
        />
      )}
    </div>
  )
}
