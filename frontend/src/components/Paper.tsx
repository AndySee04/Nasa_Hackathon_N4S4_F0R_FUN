import { useId, type CSSProperties, type ElementType, type HTMLAttributes } from 'react'
import { useCutEdges } from '../hooks/useCutEdges'

export type PaperTone = 'cream' | 'yellow' | 'mint' | 'pink' | 'sky' | 'orange' | 'lilac' | 'white'

const TONES: Record<PaperTone, string> = {
  cream: 'var(--color-paper)',
  yellow: 'var(--color-yellow)',
  mint: 'var(--color-mint)',
  pink: 'var(--color-pink)',
  sky: 'var(--color-sky)',
  orange: 'var(--color-orange)',
  lilac: 'var(--color-lilac)',
  white: 'var(--color-sticker)',
}

interface Props extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  tone?: PaperTone
  /** A small rotation in degrees, as if glued on by hand. */
  tilt?: number
  /** Classes for the paper itself (padding, layout). `className` styles the outer wrapper that casts the shadow. */
  innerClassName?: string
  /** Use 'span' when the paper sits inside a button or other inline-only element. */
  innerAs?: 'div' | 'span'
}

/**
 * A piece of paper with scissor-cut edges, glued onto the night sky.
 * Paper is for words: anything kids need to read sits on it.
 */
export default function Paper({ as: Tag = 'div', tone = 'cream', tilt = 0, className = '', innerClassName = '', innerAs: Inner = 'div', style, children, ...rest }: Props) {
  const id = useId()
  const ref = useCutEdges<HTMLElement>(id)
  const outer: CSSProperties = tilt ? { rotate: `${tilt}deg`, ...style } : (style ?? {})
  return (
    <Tag className={`paper-glue ${className}`} style={outer} {...rest}>
      <Inner ref={ref as React.Ref<HTMLDivElement & HTMLSpanElement>} className={`paper-cut ${innerClassName}`} style={{ '--paper': TONES[tone] } as CSSProperties}>
        {children}
      </Inner>
    </Tag>
  )
}
