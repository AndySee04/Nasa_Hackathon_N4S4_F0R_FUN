import type { Source } from '../../types/artifact'

/**
 * Moon facts shown when a child taps the Moon on the campaign screen.
 * Numbers come from the NASA NSSDCA Moon Fact Sheet; explanations from NASA Science.
 * The same figures are in the Cosmic AI knowledge base (backend/app/kb), so the game and the AI agree.
 */
export interface MoonFact {
  icon: string
  title: string
  text: string
}

export const MOON_FACTS: MoonFact[] = [
  { icon: '📏', title: 'How big?', text: 'About 3,475 km across. That is a bit more than a quarter of Earth’s width.' },
  { icon: '🛣️', title: 'How far?', text: 'About 384,400 km from Earth on average. A car driving non-stop at 100 km/h would take about 160 days.' },
  { icon: '🦘', title: 'Jump higher', text: 'Gravity is about one-sixth of Earth’s, so you could jump about six times higher.' },
  { icon: '🌡️', title: 'Hot and cold', text: 'At the equator the ground goes from about 120 °C in the day to about −180 °C at night.' },
  { icon: '🔄', title: 'Same face', text: 'The Moon spins once for every trip around Earth, so the same side always faces us.' },
  { icon: '🕳️', title: 'Why craters?', text: 'There is almost no air to slow down space rocks, so they hit the ground and leave craters.' },
  { icon: '🌑', title: 'Dark patches', text: 'The dark “seas” (maria) are giant old craters that filled with lava billions of years ago.' },
  { icon: '📡', title: 'Drifting away', text: 'Lasers bounced off mirrors left by astronauts show the Moon moves about 3.8 cm farther from Earth each year.' },
]

export const MOON_FACT_SOURCES: Source[] = [
  { title: 'NASA NSSDCA: Moon Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' },
  { title: 'NASA Science: Moon Facts', url: 'https://science.nasa.gov/moon/facts/' },
]
