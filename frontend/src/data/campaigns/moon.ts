import type { Campaign } from '../../types/campaign'

/**
 * The Moon campaign. Facts in `science` and `quiz` come from the matching
 * records in artifacts.json, which cite NASA NSSDCA and NASA pages. The
 * `repair` challenges are pretend training-simulator missions and must be
 * labelled that way in the UI.
 */
export const MOON_CAMPAIGN: Campaign = {
  id: 'moon',
  title: 'Moon Explorer',
  briefing:
    'Mission Control here! Our scanners have picked up old machines left on the Moon by real space missions. Fly your rocket claw over the Moon, catch each one, and find out what it did and where it is today.',
  artifacts: [
    {
      artifactId: 'apollo-11-eagle',
      catcherSprite: 'lander',
      repair: {
        kind: 'drag-parts',
        title: 'Rebuild a training lunar module',
        slots: [
          { id: 'descent', label: 'Descent stage', hint: 'The bottom half with the landing legs. It stays on the Moon.' },
          { id: 'ascent', label: 'Ascent stage', hint: 'The top half with the crew cabin. It flies the astronauts back up.' },
          { id: 'legs', label: 'Landing legs', hint: 'They hold the lander up on the ground.' },
          { id: 'mirror', label: 'Laser retroreflector', hint: 'Special mirrors that bounce laser light back to Earth.' },
        ],
      },
      science: {
        headline: 'The first footprints, and mirrors that still work',
        points: [
          'Neil Armstrong and Buzz Aldrin landed Eagle on 20 July 1969.',
          'They brought back about 21.5 kg of Moon rocks and soil.',
          'Scientists still bounce lasers off the mirrors they left, and have measured the Moon moving away from Earth by about 3.8 cm each year.',
          "Eagle's descent stage is still at Tranquility Base.",
        ],
      },
      quiz: [
        {
          question: 'Which half of Eagle is still sitting on the Moon?',
          options: ['The top half (ascent stage)', 'The bottom half (descent stage)', 'Both halves', 'Neither half'],
          answer: 1,
          explain: 'The top half flew the astronauts back up. The bottom half was their launch pad and stayed behind.',
        },
        {
          question: 'What does the laser retroreflector do?',
          options: ['Makes electricity', 'Digs up soil', 'Bounces laser light back to Earth', 'Takes photos'],
          answer: 2,
          explain: 'Timing the laser light there and back lets scientists measure the distance to the Moon very precisely.',
        },
        {
          question: 'About how much Moon rock and soil did Apollo 11 bring home?',
          options: ['2 kg', '21.5 kg', '200 kg', '2,000 kg'],
          answer: 1,
          explain: 'About 21.5 kg, roughly the weight of a big suitcase.',
        },
      ],
    },
    {
      artifactId: 'apollo-14-antares',
      catcherSprite: 'lander',
      repair: {
        kind: 'match-instruments',
        title: 'Match each training instrument to its job',
        pairs: [
          { instrument: 'Passive seismometer', job: 'Feels moonquakes and impacts' },
          { instrument: 'Laser ranging retroreflector', job: 'Helps measure the distance to the Moon' },
          { instrument: 'Modular Equipment Transporter', job: 'Carries tools and samples' },
          { instrument: 'Lunar portable magnetometer', job: 'Measures magnetism at different places' },
        ],
      },
      science: {
        headline: 'A landing in the hills, and a moonquake on purpose',
        points: [
          'Antares landed in the hilly Fra Mauro region on 5 February 1971.',
          'Alan Shepard and Edgar Mitchell stayed a record 33 hours and 30 minutes.',
          'After they left, the empty top half was crashed into the Moon on purpose. Two seismometers felt it for 1.5 hours.',
          'Seeds carried around the Moon on this mission grew into Moon Trees.',
        ],
      },
      quiz: [
        {
          question: 'Where did Antares land?',
          options: ['The Sea of Tranquility', 'The Fra Mauro highlands', 'Hadley Rille', 'The far side of the Moon'],
          answer: 1,
          explain: 'Antares landed in the hilly upland region north of Fra Mauro crater.',
        },
        {
          question: "Why did NASA crash Antares's empty top half into the Moon?",
          options: [
            'It was an accident',
            'To make a new crater for fun',
            'To get rid of rubbish',
            'To make a test moonquake for the seismometers',
          ],
          answer: 3,
          explain: 'A crash of known size and timing helps scientists understand what the inside of the Moon is like.',
        },
        {
          question: 'How long did the seismometers feel that crash?',
          options: ['10 seconds', '1 minute', 'About 1.5 hours', '3 days'],
          answer: 2,
          explain: 'Seismometers at the Apollo 12 and Apollo 14 sites both recorded the shaking for about 1.5 hours.',
        },
      ],
    },
    {
      artifactId: 'apollo-15-falcon',
      catcherSprite: 'lander-rover',
      repair: {
        kind: 'circuit',
        title: 'Wire up the training Moon car',
        nodes: ['TV camera', 'Battery', 'Wheel motors', 'Control panel'],
        correctPath: ['Battery', 'Control panel', 'Wheel motors', 'TV camera'],
      },
      science: {
        headline: 'The first car on the Moon',
        points: [
          'Falcon carried the folded-up Lunar Roving Vehicle on its side.',
          'David Scott and James Irwin drove about 27.9 km in three trips.',
          'They stayed 66 hours and 55 minutes and brought back 77.31 kg of rocks and soil.',
          'Their seven-instrument science station sent data until 1977.',
        ],
      },
      quiz: [
        {
          question: 'What did Falcon bring to the Moon for the first time?',
          options: ['A robot dog', 'A car (the Lunar Roving Vehicle)', 'A helicopter', 'A boat'],
          answer: 1,
          explain: 'The rover let the astronauts explore much farther than they could walk.',
        },
        {
          question: 'About how far did the rover drive in total?',
          options: ['280 m', '2.8 km', '27.9 km', '279 km'],
          answer: 2,
          explain: 'About 27.9 km over three trips, always staying within 5 km of Falcon.',
        },
        {
          question: "Where is Falcon's bottom half today?",
          options: ['Back on Earth in a museum', 'Orbiting the Sun', 'It burned up', 'Still at Hadley–Apennine on the Moon'],
          answer: 3,
          explain: 'The descent stage stayed behind, with the parked rover nearby.',
        },
      ],
    },
    {
      artifactId: 'surveyor-3',
      catcherSprite: 'robot-lander',
      repair: {
        kind: 'sequence',
        title: "Put the training robot's mission in order",
        steps: [
          'Launch from Earth',
          'Bounce twice while landing',
          'Dig trenches with the scoop',
          'Go silent when the lunar night comes',
          'Get a visit from Apollo 12 astronauts',
        ],
      },
      science: {
        headline: 'The robot that tested the ground for astronauts',
        points: [
          'Surveyor 3 landed in the Ocean of Storms on 20 April 1967.',
          'Its scoop showed the soil behaved like wet sand, firm enough to hold up a lunar module.',
          'Its camera took 6,326 pictures.',
          'In 1969 Apollo 12 astronauts walked over and took its camera and scoop home for study.',
        ],
      },
      quiz: [
        {
          question: 'Why did Surveyor 3 bounce when it landed?',
          options: [
            'A meteor hit it',
            'Moon gravity is bouncy',
            "Its engine didn't switch off at the right moment",
            'It landed on a trampoline-shaped crater',
          ],
          answer: 2,
          explain: 'Shiny rocks confused its radar, so the engine kept running and it bounced twice before settling.',
        },
        {
          question: "What did Surveyor 3's soil tests show?",
          options: [
            'The soil could hold up a landing spacecraft',
            'The soil was runny like water',
            'The ground was made of ice',
            'There was no soil at all',
          ],
          answer: 0,
          explain: 'The soil behaved like wet sand and was firm enough for an Apollo lunar module.',
        },
        {
          question: 'Who visited Surveyor 3 in 1969?',
          options: ['A Soviet rover', 'Nobody, ever', 'Apollo 11 astronauts', 'Apollo 12 astronauts Pete Conrad and Alan Bean'],
          answer: 3,
          explain: 'Their lunar module Intrepid landed about 180 m away, so they could walk over.',
        },
      ],
    },
  ],
  bonusArtifacts: [
    {
      artifactId: 'apollo-12-intrepid',
      catcherSprite: 'lander',
      repair: {
        kind: 'sequence',
        title: 'Plan the training pinpoint landing',
        steps: [
          'Launch from Earth',
          'Land in the Ocean of Storms',
          'Set up the science station',
          'Walk about 180 m to Surveyor 3',
          'Lift off and head home',
        ],
      },
      science: {
        headline: 'A pinpoint landing next to an old robot',
        points: [
          'Intrepid landed on 19 November 1969, within about 180 m of Surveyor 3.',
          'Pete Conrad and Alan Bean stayed 31 hours and 31 minutes and collected 34.35 kg of rocks and soil.',
          'They brought home parts of Surveyor 3.',
          'When the empty top half was crashed on purpose, the seismometer recorded signals for nearly an hour.',
        ],
      },
      quiz: [
        {
          question: 'What was special about where Intrepid landed?',
          options: [
            'It landed on top of a mountain',
            'It landed about 180 m from the Surveyor 3 robot',
            'It landed on the far side of the Moon',
            'It landed in a lake',
          ],
          answer: 1,
          explain: 'Apollo 12 proved astronauts could land exactly where they aimed.',
        },
        {
          question: 'What did the crew bring back from Surveyor 3?',
          options: ['Its camera and soil scoop', 'Its whole body', 'Nothing', 'Its landing legs'],
          answer: 0,
          explain: 'Scientists studied the parts to see how materials change after years on the Moon.',
        },
        {
          question: "How long did the seismometer record signals after Intrepid's top half crashed?",
          options: ['A few seconds', 'Nearly an hour', 'A whole week', 'It recorded nothing'],
          answer: 1,
          explain: 'The seismometer kept picking up signals for nearly an hour after the crash.',
        },
      ],
    },
  ],
  badge: {
    id: 'moon-explorer',
    name: 'Moon Explorer',
    description: 'Caught and studied every machine in the Moon campaign.',
  },
}
