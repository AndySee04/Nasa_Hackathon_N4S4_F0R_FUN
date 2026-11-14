export interface Body {
  id: string
  name: string
  /** Visual radius in scene units (not to scale). */
  size: number
  /** Orbit radius in scene units (not to scale). */
  orbit: number
  /** Relative orbit speed for the animation (not to scale). */
  speed: number
  colors: [string, string]
  banded?: boolean
  rings?: boolean
  description: string
  hardware: string
  archive?: { label: string; to: string }
}

/**
 * Sizes and distances are squashed so everything fits on screen.
 * The descriptions say so, because the real solar system is mostly empty space.
 */
export const BODIES: Body[] = [
  {
    id: 'sun', name: 'Sun', size: 2.4, orbit: 0, speed: 0, colors: ['#ffd36b', '#ff8a1f'],
    description: 'Our star. It holds about 99.8% of all the mass in the solar system, and its gravity keeps every planet in orbit.',
    hardware: 'Solar observatories study it from a distance. Nothing has landed on the Sun!',
  },
  {
    id: 'mercury', name: 'Mercury', size: 0.38, orbit: 4.2, speed: 1.6, colors: ['#b8aea4', '#6f6862'],
    description: 'The smallest planet and the closest to the Sun. A year on Mercury lasts just 88 Earth days.',
    hardware: 'NASA\'s MESSENGER orbiter ended its mission by crashing into Mercury in 2015.',
  },
  {
    id: 'venus', name: 'Venus', size: 0.62, orbit: 5.8, speed: 1.2, colors: ['#f3d9a4', '#c99a52'],
    description: 'The hottest planet, hidden under thick clouds. Its surface is hot enough to melt lead.',
    hardware: 'NASA\'s Magellan orbiter mapped Venus with radar and ended by diving into its atmosphere in 1994.',
  },
  {
    id: 'earth', name: 'Earth', size: 0.66, orbit: 7.6, speed: 1, colors: ['#4aa3ff', '#1f5fbf'],
    description: 'Our home, and the only place we know of with life. Every spacecraft in this museum started its journey here.',
    hardware: 'Earth\'s Moon holds Apollo landers, rovers and science experiments.',
    archive: { label: 'Visit the Moon Archive', to: '/moon' },
  },
  {
    id: 'mars', name: 'Mars', size: 0.48, orbit: 9.6, speed: 0.8, colors: ['#e0794a', '#9c3f1e'],
    description: 'The Red Planet. Its colour comes from iron-rich dust that has rusted. Long ago, liquid water flowed on its surface.',
    hardware: 'Landers and rovers from Viking to InSight now rest on its surface.',
    archive: { label: 'Open the Mars Archive', to: '/mars' },
  },
  {
    id: 'jupiter', name: 'Jupiter', size: 1.35, orbit: 12.8, speed: 0.45, colors: ['#e9c79b', '#a8754a'], banded: true,
    description: 'The biggest planet: more than 1,300 Earths could fit inside it. Its Great Red Spot is a storm bigger than Earth.',
    hardware: 'Pioneer 10 and 11 and both Voyagers flew past it. NASA\'s Galileo orbiter ended by diving into it in 2003.',
    archive: { label: 'See the probes in Deep Space', to: '/deep-space' },
  },
  {
    id: 'saturn', name: 'Saturn', size: 1.15, orbit: 16.2, speed: 0.33, colors: ['#f1dca6', '#c2a061'], banded: true, rings: true,
    description: 'Famous for its rings, made of countless pieces of ice and rock. Some of its moons may hide oceans.',
    hardware: 'Cassini orbited Saturn for 13 years and ended by diving into it in 2017.',
    archive: { label: 'Meet Cassini in Deep Space', to: '/artifact/cassini' },
  },
  {
    id: 'uranus', name: 'Uranus', size: 0.85, orbit: 19.4, speed: 0.23, colors: ['#bdf2f2', '#6cc5cf'],
    description: 'An ice giant that spins tipped on its side, so its poles take turns facing the Sun.',
    hardware: 'Only one spacecraft has ever visited: Voyager 2, in 1986.',
    archive: { label: 'Meet Voyager 2', to: '/artifact/voyager-2' },
  },
  {
    id: 'neptune', name: 'Neptune', size: 0.82, orbit: 22.4, speed: 0.18, colors: ['#5b8cff', '#2a46b8'],
    description: 'The farthest planet from the Sun, with the fastest winds in the solar system.',
    hardware: 'Voyager 2 is still the only spacecraft to have visited, in 1989.',
    archive: { label: 'Meet Voyager 2', to: '/artifact/voyager-2' },
  },
]

/** Earth's Moon is selectable in the 3D scene too (it orbits Earth there). */
export const MOON_BODY: Body = {
  id: 'moon', name: 'The Moon', size: 0.18, orbit: 0, speed: 0, colors: ['#c9c9cf', '#8d8d96'],
  description: 'Earth\'s only natural satellite, about 384,000 km away. It is the only other world where humans have walked.',
  hardware: 'Apollo descent stages, lunar rovers, Surveyor landers and laser reflectors that scientists still use today.',
  archive: { label: 'Open the Moon Archive', to: '/moon' },
}

export const bodyById = (id: string | null | undefined): Body | undefined =>
  id === 'moon' ? MOON_BODY : BODIES.find((b) => b.id === id)
