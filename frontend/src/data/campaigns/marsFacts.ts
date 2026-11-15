import type { Source } from '../../types/artifact'

/**
 * Mars facts shown when a child taps Mars on the campaign screen.
 * Numbers come from the NASA NSSDCA Mars Fact Sheet (the same figures are in the Cosmic AI
 * knowledge base, backend/app/kb/planetary_factsheet.json); explanations from NASA Science.
 */
export interface MarsFact {
  icon: string
  title: string
  text: string
}

export const MARS_FACTS: MarsFact[] = [
  { icon: '📏', title: 'How big?', text: 'About 6,792 km across, roughly half as wide as Earth.' },
  { icon: '🕐', title: 'A long day', text: 'A day on Mars (a "sol") lasts about 24.7 hours, a little longer than ours.' },
  { icon: '📅', title: 'A long year', text: 'Mars takes 687 Earth days to go around the Sun once.' },
  { icon: '🦘', title: 'Jump higher', text: 'Gravity is about 38% of Earth’s, so you could jump almost three times higher.' },
  { icon: '🥶', title: 'Very cold', text: 'The average temperature is about −65 °C.' },
  { icon: '🌙', title: 'Two moons', text: 'Mars has two small moons, Phobos and Deimos.' },
  { icon: '🟥', title: 'Why red?', text: 'Its dust and rocks contain iron that has rusted, which makes Mars look red.' },
  { icon: '🏞️', title: 'Once wet', text: 'More than 3.5 billion years ago, rivers spilled into Jezero crater and made a lake. Today Mars is a cold desert.' },
  { icon: '📡', title: 'Slow messages', text: 'A radio signal takes about 4 to 22 minutes to reach Mars, so rover drivers plan a whole day of moves at once.' },
]

export const MARS_FACT_SOURCES: Source[] = [
  { title: 'NASA NSSDCA: Mars Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html' },
  { title: 'NASA Science: Mars Facts', url: 'https://science.nasa.gov/mars/facts/' },
  { title: 'NASA Science: Mars 2020 Perseverance (Jezero crater)', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/' },
]
