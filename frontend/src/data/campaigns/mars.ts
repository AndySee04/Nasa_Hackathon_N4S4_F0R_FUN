import type { MarsCampaign } from '../../types/campaign'

/**
 * The Mars campaign. Every clue, science point and quiz answer comes from the matching record in
 * artifacts.json, which cites NASA mission pages and NASA/JPL news releases.
 *
 * The dig and the drive are pretend simulator missions and the UI labels them that way. In real
 * life these machines sit on the surface, slowly covered by dust; nobody needs to dig them up.
 * The rock layers stand for what each machine discovered about Mars's watery past.
 */
export const MARS_CAMPAIGN: MarsCampaign = {
  id: 'mars',
  title: 'Mars Explorer',
  briefing:
    'Mission Control here! Long ago, Mars had rivers and lakes. Today it is a cold, dusty desert, and the clues to its watery past are hidden in its rocks. Real machines found those clues. Now dust and sand cover them, so grab your simulator drill! Dig down through the dust, sand and bedrock, collect the clues, and uncover each machine. Then plan its drive, just like real rover drivers on Earth. Careful: Mars is harder than the Moon!',
  badge: {
    id: 'mars-explorer',
    name: 'Mars Explorer',
    description: 'Earned every star on all five Mars machines.',
  },
  badgeNeedsStars: 3,
  artifacts: [
    {
      artifactId: 'viking-1-lander',
      sprite: 'robot-lander',
      clues: [
        { icon: '📷', label: 'First photo', fact: 'Viking 1 took the very first photo from the surface of Mars.' },
        { icon: '🧪', label: 'Tiny lab', fact: 'It carried a small biology lab to test the soil for signs of life.' },
        { icon: '🟡', label: 'Sulfur soil', fact: 'Its tests found the soil was rich in sulfur.' },
      ],
      drive: {
        vehicle: 'arm',
        map: ['S..#..', '.#....', '...#..', '#.....', '..#.#.', '.....T'],
        startDir: 'E',
        maxCommands: 10,
        targetLabel: 'a fresh patch of soil to scoop',
      },
      science: {
        headline: 'The first machine to work on Mars',
        points: [
          'Viking 1 landed on 20 July 1976 in Chryse Planitia, the "Plains of Gold".',
          'It sent back the first photo ever taken on the surface of Mars.',
          'Its biology lab tested the soil for life. The test for living things’ building blocks (organics) found none.',
          'It worked for more than six years, until a wrong command ended contact in November 1982.',
        ],
      },
      quiz: [
        {
          question: 'In which year did Viking 1 land on Mars?',
          options: ['1969', '1976', '1997', '2004'],
          answer: 1,
          explain: 'Viking 1 landed on 20 July 1976, seven years to the day after Apollo 11 landed on the Moon.',
        },
        {
          question: 'What "first" did Viking 1 achieve?',
          options: ['First helicopter flight', 'First photo from the surface of Mars', 'First Mars rock brought to Earth', 'First astronaut on Mars'],
          answer: 1,
          explain: 'It took the first photo from the surface of Mars, a picture of its own footpad and the rocks around it.',
        },
        {
          question: 'What was Viking 1’s little lab looking for?',
          options: ['Gold', 'Signs of life', 'Dinosaur bones', 'Oil'],
          answer: 1,
          explain: 'Its biology lab tested Martian soil for signs of life. It did not find any organics.',
        },
        {
          question: 'How did Viking 1’s mission end?',
          options: ['A dust storm', 'It ran out of fuel while driving', 'A wrong command ended contact', 'It was brought back to Earth'],
          answer: 2,
          explain: 'In November 1982 a faulty command sent from Earth ended contact with the lander.',
        },
      ],
    },
    {
      artifactId: 'sojourner',
      sprite: 'rover',
      clues: [
        { icon: '🪨', label: 'Round pebbles', fact: 'Rounded pebbles near Sojourner suggested running water shaped them long ago.' },
        { icon: '🌊', label: 'Flood plain', fact: 'It landed in Ares Vallis, an ancient flood plain.' },
        { icon: '🎈', label: 'Bouncy landing', fact: 'Airbags let the lander bounce about 15 times before it stopped.' },
      ],
      drive: {
        vehicle: 'rover',
        map: ['S.#...', '..#.~.', '....#.', '.##...', '...~#.', '.#...T'],
        startDir: 'S',
        maxCommands: 10,
        targetLabel: 'the big rock nicknamed Yogi',
      },
      science: {
        headline: 'The first rover on Mars was the size of a microwave oven',
        points: [
          'Mars Pathfinder landed on 4 July 1997 in Ares Vallis, an ancient flood plain. Airbags let it bounce about 15 times.',
          'Sojourner weighed only 10.6 kg and stood about 30 cm tall.',
          'It took 550 pictures and tested rocks and soil more than 15 times.',
          'Rounded pebbles at the landing site suggested running water, long ago when Mars was warmer.',
        ],
      },
      quiz: [
        {
          question: 'How did Mars Pathfinder land?',
          options: ['On a runway', 'Bouncing on airbags', 'With a parachute only', 'Lowered by a crane'],
          answer: 1,
          explain: 'Big airbags let it bounce about 15 times, some bounces as high as a five-storey building, before it rolled to a stop.',
        },
        {
          question: 'About how heavy was Sojourner on Earth?',
          options: ['1 kg', '10.6 kg', '185 kg', '1,000 kg'],
          answer: 1,
          explain: 'Only 10.6 kg, about as heavy as a small dog.',
        },
        {
          question: 'What did the rounded pebbles suggest?',
          options: ['Wind made them', 'Running water shaped them long ago', 'They fell from space', 'Astronauts polished them'],
          answer: 1,
          explain: 'Flowing water tumbles rocks and rounds their edges. Ares Vallis was an ancient flood plain.',
        },
        {
          question: 'What do we call the place where Pathfinder landed?',
          options: ['Gusev crater', 'Ares Vallis', 'Jezero crater', 'Tranquility Base'],
          answer: 1,
          explain: 'Ares Vallis, a flood plain where huge floods once flowed.',
        },
      ],
    },
    {
      artifactId: 'spirit',
      sprite: 'rover',
      clues: [
        { icon: '⚪', label: 'Silica', fact: 'Spirit’s stuck wheel scraped up soil that was more than 90% silica, a sign of hot springs or steam vents.' },
        { icon: '🏞️', label: 'Old lake?', fact: 'It landed in Gusev crater, which scientists thought might once have held a lake.' },
        { icon: '🫧', label: 'Carbonates', fact: 'It found carbonate rocks, which form in water that is not acidic.' },
      ],
      drive: {
        vehicle: 'rover',
        map: ['S..~..', '.#.#..', '.~...#', '...#..', '#~..~.', '...#.T'],
        startDir: 'E',
        maxCommands: 10,
        targetLabel: 'the bright soil near Home Plate',
      },
      science: {
        headline: 'A stuck wheel made a big discovery',
        points: [
          'Spirit landed on 3 January 2004 in Gusev crater. Its mission was planned to last 90 days.',
          'It drove about 7.7 km, much farther than planned.',
          'One wheel stopped working, so Spirit dragged it. The dragging wheel dug up soil that was more than 90% silica, a sign of ancient hot springs or steam vents.',
          'In 2009 it got stuck in soft sand at a place called Troy. Its last message came on 22 March 2010.',
        ],
      },
      quiz: [
        {
          question: 'How long was Spirit’s mission planned to last?',
          options: ['9 days', '90 days', '9 years', '90 years'],
          answer: 1,
          explain: 'It was planned for 90 days, but Spirit kept working for about six years.',
        },
        {
          question: 'How did Spirit find the silica?',
          options: ['With a drill', 'Its dragging wheel dug it up', 'An astronaut found it', 'It fell from the sky'],
          answer: 1,
          explain: 'A broken wheel dragged through the soil and uncovered bright, silica-rich soil.',
        },
        {
          question: 'What does lots of silica tell scientists?',
          options: ['There were hot springs or steam vents', 'It snowed', 'There were volcanoes on the Moon', 'Plants grew there'],
          answer: 0,
          explain: 'On Earth, silica like this forms around hot springs and steam vents, places with hot water.',
        },
        {
          question: 'Why did Spirit stop driving in 2009?',
          options: ['It flew away', 'It got stuck in soft sand', 'It was switched off on purpose', 'It drove into a lake'],
          answer: 1,
          explain: 'Its wheels sank into soft sand at a place called Troy, and it could not get free.',
        },
      ],
    },
    {
      artifactId: 'opportunity',
      sprite: 'rover',
      clues: [
        { icon: '🫐', label: 'Blueberries', fact: 'Opportunity found tiny round "blueberries" of hematite, a mineral that forms in water.' },
        { icon: '〰️', label: 'Ripple layers', fact: 'Curvy layers in the rocks showed that water once flowed over them.' },
        { icon: '🤍', label: 'Gypsum vein', fact: 'A bright vein of gypsum showed water once flowed through cracks in the rock.' },
      ],
      drive: {
        vehicle: 'rover',
        map: ['S.#..~', '.~..#.', '..~#..', '.#....', '..#.#.', '~...#T'],
        startDir: 'S',
        maxCommands: 10,
        targetLabel: 'the gypsum vein nicknamed Homestake',
      },
      science: {
        headline: 'The marathon rover that found signs of water',
        points: [
          'Opportunity landed on 24 January 2004 in Meridiani Planum, rolling right into a small crater: a "hole in one".',
          'It found hematite "blueberries" and rock layers that formed in water.',
          'It drove 45.16 km and worked for more than 14 years, instead of the planned 90 days.',
          'A huge dust storm in 2018 covered its solar panels. Its last message came on 10 June 2018.',
        ],
      },
      quiz: [
        {
          question: 'What were Opportunity’s "blueberries" made of?',
          options: ['Real fruit', 'Ice', 'Hematite, a mineral that forms in water', 'Plastic'],
          answer: 2,
          explain: 'They are tiny balls of hematite. On Earth this kind forms in water, so they were a clue to Mars’s wet past.',
        },
        {
          question: 'About how far did Opportunity drive?',
          options: ['4.5 km', '45 km', '450 km', '4,500 km'],
          answer: 1,
          explain: 'It drove 45.16 km, a bit more than a marathon.',
        },
        {
          question: 'How long did Opportunity work?',
          options: ['90 days', 'About 1 year', 'More than 14 years', '50 years'],
          answer: 2,
          explain: 'More than 14 years, even though it was planned for 90 days.',
        },
        {
          question: 'What ended Opportunity’s mission?',
          options: ['A huge dust storm', 'A marsquake', 'It fell into a crater', 'A wrong command'],
          answer: 0,
          explain: 'In 2018 a planet-wide dust storm blocked the sunlight its solar panels needed.',
        },
      ],
    },
    {
      artifactId: 'phoenix',
      sprite: 'robot-lander',
      clues: [
        { icon: '🧊', label: 'Ice!', fact: 'Bright chunks in Phoenix’s trench slowly vanished over four days: they were ice.' },
        { icon: '❄️', label: 'Mars snow', fact: 'Phoenix saw snow falling from clouds high above it.' },
        { icon: '🥄', label: 'Carbonate', fact: 'Its soil tests found calcium carbonate, which forms with liquid water.' },
      ],
      drive: {
        vehicle: 'arm',
        map: ['S.#.#.', '...~..', '#.....', '..~.#.', '.#..~.', '...#.T'],
        startDir: 'E',
        maxCommands: 10,
        targetLabel: 'the icy layer at the bottom of the trench',
      },
      science: {
        headline: 'Touching water ice on Mars',
        points: [
          'Phoenix landed on 25 May 2008 on the northern arctic plains, farther north than any Mars lander before it.',
          'Its robotic arm dug a trench and uncovered bright chunks that vanished over four days. They were ice.',
          'On 31 July 2008 its oven instrument confirmed water in a soil sample.',
          'It saw snow falling from clouds. As winter came, its solar power faded and the mission ended in November 2008.',
        ],
      },
      quiz: [
        {
          question: 'Where on Mars did Phoenix land?',
          options: ['At the equator', 'On the northern arctic plains', 'On top of a volcano', 'At the south pole'],
          answer: 1,
          explain: 'It landed on the arctic plains far in the north, where ice hides just under the soil.',
        },
        {
          question: 'How did scientists know the bright chunks were ice?',
          options: ['They melted into puddles', 'They slowly vanished over four days', 'They were blue', 'They made a cracking sound'],
          answer: 1,
          explain: 'In the thin, dry air the ice turned straight into gas and disappeared, just as ice does on Mars.',
        },
        {
          question: 'What did Phoenix see falling from Martian clouds?',
          options: ['Rain', 'Snow', 'Hail made of rock', 'Nothing'],
          answer: 1,
          explain: 'Its laser instrument saw snow falling from clouds, though it turned to gas before reaching the ground.',
        },
        {
          question: 'Which part of Phoenix dug the trench?',
          options: ['Its wheels', 'Its robotic arm', 'Its parachute', 'Its antenna'],
          answer: 1,
          explain: 'Phoenix could not move around, so it used its robotic arm and scoop to dig.',
        },
      ],
    },
  ],
  bonusArtifacts: [
    {
      artifactId: 'insight',
      sprite: 'robot-lander',
      clues: [
        { icon: '〽️', label: 'Marsquakes', fact: 'InSight felt 1,319 marsquakes.' },
        { icon: '🔥', label: 'Liquid core', fact: 'Its quake data showed the very centre of Mars is liquid.' },
        { icon: '☄️', label: 'Hidden ice', fact: 'A space rock that hit Mars nearby uncovered buried ice.' },
      ],
      drive: {
        vehicle: 'arm',
        map: ['S..#..', '.#...~', '..~.#.', '#.....', '..#...', '.~..#T'],
        startDir: 'S',
        maxCommands: 10,
        targetLabel: 'a flat spot for the seismometer',
      },
      science: {
        headline: 'Listening to the heart of Mars',
        points: [
          'InSight landed on 26 November 2018 on a flat plain called Elysium Planitia.',
          'It used its robotic arm to set a seismometer (a quake detector) on the ground.',
          'It detected 1,319 marsquakes. The biggest, on 4 May 2022, was magnitude 5.',
          'Dust slowly covered its solar panels, and NASA retired it in December 2022.',
        ],
      },
      quiz: [
        {
          question: 'What is a seismometer?',
          options: ['A camera', 'A quake detector', 'A drill', 'A weather balloon'],
          answer: 1,
          explain: 'A seismometer feels the ground shake. InSight used one to listen for marsquakes.',
        },
        {
          question: 'About how many marsquakes did InSight detect?',
          options: ['13', '131', '1,319', '1 million'],
          answer: 2,
          explain: 'It detected 1,319 marsquakes during its mission.',
        },
        {
          question: 'What did InSight learn about the centre of Mars?',
          options: ['It is hollow', 'It is liquid', 'It is made of ice', 'It is made of gold'],
          answer: 1,
          explain: 'Quake waves travelling through Mars showed that its core is liquid.',
        },
        {
          question: 'Why did InSight stop working?',
          options: ['Dust covered its solar panels', 'A rover bumped into it', 'Its battery was stolen', 'It got too hot'],
          answer: 0,
          explain: 'Dust built up on its solar panels until it could not make enough power.',
        },
      ],
    },
    {
      artifactId: 'ingenuity',
      sprite: 'helicopter',
      clues: [
        { icon: '🚁', label: 'First flight', fact: 'Ingenuity made the first powered flight on another planet, on 19 April 2021.' },
        { icon: '🔢', label: '72 flights', fact: 'It was planned to fly up to 5 times, but flew 72 times.' },
        { icon: '🏞️', label: 'Old river', fact: 'It flew over Jezero crater, which held a lake more than 3.5 billion years ago.' },
      ],
      drive: {
        vehicle: 'helicopter',
        map: ['S.~...', '..~.#.', '#...~.', '.~~...', '...~#.', '#~...T'],
        startDir: 'E',
        maxCommands: 10,
        targetLabel: 'the next airfield',
      },
      science: {
        headline: 'The first aircraft on another planet',
        points: [
          'Ingenuity rode to Mars with the Perseverance rover and first flew on 19 April 2021.',
          'It was planned as a test of up to 5 flights in 30 days. It flew 72 times, about 17 km in all.',
          'On its last flight, over smooth sand ripples, its navigation camera had few features to track. It landed hard and its rotor blades were damaged.',
          'Its mission ended on 25 January 2024. It stays at Valinor Hills in Jezero crater.',
        ],
      },
      quiz: [
        {
          question: 'Why was Ingenuity famous?',
          options: ['First rover on Mars', 'First powered flight on another planet', 'First astronaut on Mars', 'First photo of Mars'],
          answer: 1,
          explain: 'On 19 April 2021 it made the first powered, controlled flight on another planet.',
        },
        {
          question: 'How many times did Ingenuity fly?',
          options: ['5', '12', '72', '500'],
          answer: 2,
          explain: 'It was planned for up to 5 flights, but it flew 72 times.',
        },
        {
          question: 'What went wrong on its last flight?',
          options: [
            'It ran out of fuel',
            'Smooth sand had few features for its camera to track',
            'A dust devil blew it away',
            'It hit Perseverance',
          ],
          answer: 1,
          explain: 'Its navigation camera tracks features on the ground. Smooth sand ripples had very few.',
        },
        {
          question: 'Jezero crater, where Ingenuity flew, once held…',
          options: ['A volcano', 'A lake', 'An ocean of lava', 'A forest'],
          answer: 1,
          explain: 'More than 3.5 billion years ago, river channels spilled into the crater and made a lake.',
        },
      ],
    },
  ],
}
