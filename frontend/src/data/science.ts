export interface ScienceTopic {
  id: string
  question: string
  short: string
  steps: string[]
  example: string
  /** Which illustration component to show. */
  visual: 'wheels' | 'signal' | 'rock' | 'landing' | 'power' | 'light'
  relatedArtifacts: string[]
}

export const SCIENCE_TOPICS: ScienceTopic[] = [
  {
    id: 'rovers-move',
    question: 'How do Mars rovers move?',
    short: 'Six wheels, a clever suspension, and drivers who plan every move from Earth.',
    steps: [
      'NASA\'s Mars rovers have six wheels on a "rocker-bogie" suspension. It works like a seesaw on each side, so all six wheels stay on the ground while climbing over rocks.',
      'Radio messages take between about 3 and 22 minutes to travel between Earth and Mars, so nobody can steer a rover live like a remote-control car.',
      'Instead, rover drivers plan a route, send the commands, and the rover follows them. Rovers also use their cameras to spot dangers and stop or steer around them by themselves.',
    ],
    example: 'Sojourner, Spirit and Opportunity all used this six-wheel design. When one of Spirit\'s wheels broke, the team drove it backwards!',
    visual: 'wheels',
    relatedArtifacts: ['sojourner', 'spirit', 'opportunity'],
  },
  {
    id: 'communicate',
    question: 'How do spacecraft talk to Earth?',
    short: 'With radio waves, caught by giant dish antennas around the world.',
    steps: [
      'Spacecraft send information as radio waves, which travel at the speed of light.',
      'NASA\'s Deep Space Network has giant dish antennas in California, Spain and Australia. As Earth spins, at least one of them can always point at a faraway spacecraft.',
      'The farther away a spacecraft is, the weaker its signal and the longer it takes to arrive. Try the signal timer to see for yourself!',
    ],
    example: 'In late 2026, a message from Voyager 1 takes about a whole day to reach Earth.',
    visual: 'signal',
    relatedArtifacts: ['voyager-1', 'voyager-2', 'new-horizons'],
  },
  {
    id: 'analyse-rocks',
    question: 'How do instruments analyse rocks?',
    short: 'By zapping them gently and reading the "fingerprints" that come back.',
    steps: [
      'Rocks are made of chemical elements, like iron, silicon and oxygen. Each element reacts in its own special way when energy hits it.',
      'An instrument like an APXS gently zaps a rock with tiny particles and X-rays. The rock sends back energy, and the instrument measures it to work out which elements are inside.',
      'Some rovers also had a grinding tool to scrape off dusty outer layers, so they could study the fresh rock underneath.',
    ],
    example: 'Sojourner used its APXS on rocks nicknamed "Barnacle Bill" and "Yogi".',
    visual: 'rock',
    relatedArtifacts: ['sojourner', 'spirit', 'opportunity'],
  },
  {
    id: 'landing',
    question: 'How do landers land safely?',
    short: 'They slow down from thousands of kilometres per hour to almost zero, using different tricks.',
    steps: [
      'The Moon has no air, so Apollo\'s lunar modules used a rocket engine, pointed downwards, to slow down gently.',
      'Mars has a thin atmosphere. Landers use a heat shield and a parachute first to slow down.',
      'For the last part, some landers fired rockets (Viking, Phoenix, InSight). Others were wrapped in airbags and bounced to a stop (Pathfinder, Spirit and Opportunity).',
    ],
    example: 'Mars Pathfinder bounced across the ground in its airbags before rolling to a stop.',
    visual: 'landing',
    relatedArtifacts: ['apollo-11-eagle', 'mars-pathfinder', 'phoenix'],
  },
  {
    id: 'power',
    question: 'How do space probes get electricity?',
    short: 'From sunlight, or from the heat of radioactive material.',
    steps: [
      'Solar panels turn sunlight into electricity. They work well near the Sun, but on Mars, dust can slowly cover them.',
      'Far from the Sun, sunlight is too weak. Probes like Voyager, Pioneer and New Horizons use RTGs, which turn heat from slowly decaying radioactive material into electricity.',
      'An RTG\'s power drops a little every year. That is why engineers switch off Voyager\'s instruments one by one.',
    ],
    example: 'Opportunity was solar-powered. A dust storm in 2018 blocked the sunlight, and it could not recharge its batteries.',
    visual: 'power',
    relatedArtifacts: ['opportunity', 'insight', 'voyager-1'],
  },
  {
    id: 'composition',
    question: 'How do scientists know what planets are made of?',
    short: 'By splitting light into a rainbow and reading its secret code.',
    steps: [
      'When you split light into a rainbow, called a spectrum, you can see patterns of bright or dark lines.',
      'Every chemical element makes its own pattern of lines, like a fingerprint or a barcode.',
      'Spectrometers on spacecraft read these patterns to find out what planets, moons, air and even icy jets are made of.',
    ],
    example: 'Cassini flew through the icy jets of Saturn\'s moon Enceladus and "tasted" them to find water and other ingredients.',
    visual: 'light',
    relatedArtifacts: ['cassini', 'lcross', 'phoenix'],
  },
]

/** One-way light travel times for the signal timer. */
export const SIGNAL_DESTINATIONS = [
  { id: 'moon', label: 'The Moon', seconds: 1.3, display: 'about 1.3 seconds' },
  { id: 'mars-near', label: 'Mars (closest)', seconds: 3 * 60, display: 'about 3 minutes' },
  { id: 'mars-far', label: 'Mars (farthest)', seconds: 22 * 60, display: 'about 22 minutes' },
  { id: 'voyager-1', label: 'Voyager 1 (late 2026)', seconds: 24 * 3600, display: 'about 1 day' },
]

export interface QuizQuestion {
  question: string
  options: string[]
  answer: number
  explain: string
}

export const QUIZ: QuizQuestion[] = [
  {
    question: 'Why can\'t engineers steer a Mars rover live, like a remote-control car?',
    options: ['Mars is too windy', 'Radio messages take minutes to travel between Earth and Mars', 'Rovers do not have antennas'],
    answer: 1,
    explain: 'Signals take between about 3 and 22 minutes each way, so drivers send a plan and the rover follows it.',
  },
  {
    question: 'Why do Voyager 1 and 2 use RTGs instead of solar panels?',
    options: ['Sunlight is far too weak so far from the Sun', 'Solar panels had not been invented', 'RTGs are lighter'],
    answer: 0,
    explain: 'Out past the planets, sunlight is much too weak to power a spacecraft.',
  },
  {
    question: 'How did Mars Pathfinder land?',
    options: ['On a runway', 'Bouncing inside giant airbags', 'Hanging from a balloon'],
    answer: 1,
    explain: 'After its parachute and rockets slowed it down, Pathfinder bounced across Mars wrapped in airbags.',
  },
  {
    question: 'What does a spectrometer help scientists find out?',
    options: ['How old an astronaut is', 'What something is made of', 'How fast a rover is driving'],
    answer: 1,
    explain: 'Every element leaves its own pattern in light, and a spectrometer reads it.',
  },
  {
    question: 'Why do NASA\'s Mars rovers have six wheels on a "rocker-bogie" suspension?',
    options: ['To keep the wheels on the ground while climbing over rocks', 'To go faster than a car', 'Because Mars has roads'],
    answer: 0,
    explain: 'The rocker-bogie works like a seesaw on each side, keeping all six wheels touching the ground.',
  },
]
