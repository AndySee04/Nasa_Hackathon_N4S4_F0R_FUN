/**
 * ym's painted, gently moving worlds (public/planets): a looping video and a see-through still for each.
 * Used by the solar system drawing and the Moon and Mars game maps.
 */
export const PAINTED = new Set(['sun', 'earth', 'mars', 'moon'])

export const paintedUrl = (id: string, ext: 'mp4' | 'webp') => `${import.meta.env.BASE_URL}planets/${id}.${ext}`

/** How much of the painted picture's width the round world fills. */
export const DISC = 0.975
