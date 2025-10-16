// lib/content/approach-guides.ts

export type Performance = {
  actor: string
  role?: string
  note: string
}

export type CuratedFilm = {
  title: string
  year?: number
  why: string
  performances: Performance[]
}

export type GenreGuide = {
  key: string
  title: string
  blurb: string
  essence: string
  watchFor: string[]
  films: CuratedFilm[]
}

export const guides: GenreGuide[] = [
  {
    key: "horror",
    title: "Horror",
    blurb:
      "Fear as form: the ethics of showing and withholding, atmosphere as craft, performance as ritual.",
    essence: "Dread is architecture. Terror is choreography.",
    watchFor: [
      "Screenplay: setups/payoffs, rules of the world, how dread accrues between scenes.",
      "Performances: containment vs. rupture—how fear is held in gesture, breath, stillness.",
      "Camera: point of view, occlusion/negative space, slow push-ins, how frames bait attention.",
      "Color & light: sickly greens, sodium orange, chiaroscuro—palette modulates threat.",
      "Sound: drones, room tone, door hinges, breaths; silence as punctuation.",
      'Editing: rhythm that anticipates or denies release; cuts that "look away" (or don\'t).',
      "Production design: liminal hallways, clutter vs. emptiness, texture that carries dread.",
    ],
    films: [
      {
        title: "The Shining",
        year: 1980,
        why: "Kubrick turns domestic space into a maze of madness. Every Steadicam glide is a promise the film will keep—or break.",
        performances: [
          {
            actor: "Jack Nicholson",
            role: "Jack Torrance",
            note: "Sanity as a performance already cracking at the seams. Watch how he modulates from charm to menace in a single eyebrow raise.",
          },
          {
            actor: "Shelley Duvall",
            role: "Wendy Torrance",
            note: "Terror as endurance sport. Her unraveling is painfully, magnificently real—every scream earned.",
          },
        ],
      },
      {
        title: "Hereditary",
        year: 2018,
        why: "Aster weaponizes grief. The horror isn't just supernatural—it's the unbearable weight of family trauma made visible.",
        performances: [
          {
            actor: "Toni Collette",
            role: "Annie Graham",
            note: "A masterclass in emotional demolition. Watch her dinner table monologue—it's the film in miniature.",
          },
          {
            actor: "Alex Wolff",
            role: "Peter Graham",
            note: "Guilt as possession. His face becomes a map of psychological collapse.",
          },
        ],
      },
      {
        title: "The Wailing",
        year: 2016,
        why: "Na Hong-jin turns paranoia into a 156-minute feedback loop. Genre itself becomes unreliable.",
        performances: [
          {
            actor: "Kwak Do-won",
            role: "Jong-goo",
            note: "Bumbling incompetence meets primal terror. His everyman confusion makes the horror land harder.",
          },
          {
            actor: "Jun Kunimura",
            role: "The Stranger",
            note: "Stillness as threat. Every scene he's in, the air changes.",
          },
        ],
      },
      {
        title: "Black Christmas",
        year: 1974,
        why: "Clark invented the slasher phone call. The calls ARE the horror—voice as violence, domestic space as trap.",
        performances: [
          {
            actor: "Olivia Hussey",
            role: "Jess",
            note: "Proto-final girl with agency. She's scared but never stupid—watch how she weaponizes the house.",
          },
        ],
      },
    ],
  },
  {
    key: "sci-fi",
    title: "Science Fiction",
    blurb:
      "Ideas in motion: technology as metaphor, scale as feeling, future as mirror.",
    essence:
      'The genre that asks "what if?" and insists you sit with the answer.',
    watchFor: [
      "Screenplay: premise pressure—how a single idea bends character and world.",
      "Performances: the human in the machine—warmth, alienation, curiosity.",
      "Camera: sense of scale, horizon lines, lens choice for architecture vs. intimacy.",
      "Color & light: sterile whites, neon washes, day-for-night blues—palette as ideology.",
      "Sound: interface bleeps vs. vastness; electronic timbres; silence frames awe.",
      "Editing: contemplative duration vs. propulsion; when the cut lets us think.",
      "Design: interfaces, typography, vehicles; how world-building expresses theme.",
    ],
    films: [
      {
        title: "Blade Runner",
        year: 1982,
        why: "Scott's neon noir asks what makes us human by showing us beings more human than humans. Every frame is a painting with a pulse.",
        performances: [
          {
            actor: "Rutger Hauer",
            role: "Roy Batty",
            note: 'He improvised "tears in rain" and gave cinema one of its most aching meditations on mortality. Four years of life, four minutes of screen death.',
          },
          {
            actor: "Harrison Ford",
            role: "Rick Deckard",
            note: "Exhaustion as character. His detective is all burnt-out edges—watch how he refuses to give you a hero.",
          },
        ],
      },
      {
        title: "2001: A Space Odyssey",
        year: 1968,
        why: 'Kubrick said "screw exposition" and gave us pure cinema. A trip from ape to star-child with barely 40 minutes of dialogue.',
        performances: [
          {
            actor: "Douglas Rain",
            role: "HAL 9000 (voice)",
            note: "The voice of polite apocalypse. His calm is more terrifying than any scream.",
          },
          {
            actor: "Keir Dullea",
            role: "David Bowman",
            note: "Astronaut as monk. His stillness lets the cosmic horror breathe.",
          },
        ],
      },
      {
        title: "Under the Skin",
        year: 2013,
        why: "Glazer films the alien-among-us premise like a nature documentary shot by Stanley Kubrick. Mica Levi's score could strip paint.",
        performances: [
          {
            actor: "Scarlett Johansson",
            role: "The Female",
            note: "Humanity as learned behavior. Watch her learn to BE, then unlearn it. The beach scene will end you.",
          },
        ],
      },
      {
        title: "Annihilation",
        year: 2018,
        why: "Garland adapts VanderMeer into a kaleidoscope of self-destruction. The Shimmer is depression made literal—beautiful, alien, consumptive.",
        performances: [
          {
            actor: "Natalie Portman",
            role: "Lena",
            note: "Grief as science. Her biologist navigates trauma like a hostile ecosystem.",
          },
          {
            actor: "Tessa Thompson",
            role: "Josie Radek",
            note: "Her acceptance scene (you know the one) is transcendence as body horror.",
          },
        ],
      },
    ],
  },
  {
    key: "western",
    title: "Western",
    blurb:
      "Myth and landscape: the moral geometry of space, community, and violence.",
    essence: "Where men become monuments and the land keeps score.",
    watchFor: [
      "Screenplay: codes of honor, cycles of debt and revenge, community vs. outlaw.",
      "Performances: interior myth—laconic affect, glances as treaties.",
      "Camera: horizons, riders as punctuation, the weight of the wide shot.",
      "Color & light: dust, dusk, the blue of shade vs. the white of noon.",
      "Sound: wind and leather; gunshots as compositional beats.",
      "Editing: accrual of standoffs; when time stretches into judgment.",
      "Design: patina of tools, saloon geometry, town layouts as ethics.",
    ],
    films: [
      {
        title: "The Searchers",
        year: 1956,
        why: "Ford's Monument Valley + Wayne's Ethan = American cinema's most beautiful poison. A rescue mission that's also a revenge tragedy that's also a deconstruction of frontier myth.",
        performances: [
          {
            actor: "John Wayne",
            role: "Ethan Edwards",
            note: "His most complex role: racist, relentless, unredeemable—and totally magnetic. That final doorway shot is cinema's loneliest silhouette.",
          },
          {
            actor: "Jeffrey Hunter",
            role: "Martin Pawley",
            note: "The conscience to Wayne's id. Watch how Hunter uses silence to argue with a monument.",
          },
        ],
      },
      {
        title: "Unforgiven",
        year: 1992,
        why: "Eastwood's elegy for the genre—and his own iconography. Violence has consequences, heroes are myths, and pigs eat in the rain.",
        performances: [
          {
            actor: "Clint Eastwood",
            role: "William Munny",
            note: "The Man With No Name, now with a name, a past, and arthritis. Watch him try—and fail—to stay retired from being a legend.",
          },
          {
            actor: "Gene Hackman",
            role: "Little Bill Daggett",
            note: "The lawman as petty tyrant. Hackman makes him both banal and terrifying—bureaucracy with a badge and a whip.",
          },
        ],
      },
      {
        title: "The Assassination of Jesse James by the Coward Robert Ford",
        year: 2007,
        why: "Dominik shoots the West like a Terrence Malick fever dream. Celebrity, betrayal, and the American need to kill its heroes—all in 160 minutes of aching beauty.",
        performances: [
          {
            actor: "Brad Pitt",
            role: "Jesse James",
            note: "Movie star plays a folk hero playing himself. The self-awareness is the performance.",
          },
          {
            actor: "Casey Affleck",
            role: "Robert Ford",
            note: "The fan who becomes the assassin. Affleck makes obsession look like lovesickness.",
          },
        ],
      },
      {
        title: "Meek's Cutoff",
        year: 2010,
        why: "Reichardt reframes the Western as survival horror. Forget gunfights—this is about water, trust, and the violence of incompetent men making life-or-death decisions.",
        performances: [
          {
            actor: "Michelle Williams",
            role: "Emily Tetherow",
            note: "Pioneer as pragmatist. Watch her eyes do the math on survival while the men posture.",
          },
          {
            actor: "Bruce Greenwood",
            role: "Stephen Meek",
            note: "The unreliable guide as American archetype. Confidence as con.",
          },
        ],
      },
    ],
  },
  {
    key: "drama",
    title: "Drama",
    blurb:
      "The human close-up: choice, consequence, and the daily sublime.",
    essence: "No explosions. No easy answers. Just people, choosing.",
    watchFor: [
      "Screenplay: moral knots that tighten with each scene; how wants become needs become costs.",
      "Performances: interior weather—what's said vs. what's shown vs. what's swallowed.",
      "Camera: proximity as ethics; when to hold, when to cut away.",
      "Color & light: naturalism as style choice; golden hour as emotional state.",
      "Sound: silence as pressure; voiceover as confession or evasion.",
      "Editing: rhythm of revelation; ellipsis as respect for the audience.",
      "Design: objects as anchors—kitchens, workplaces, the material life of feeling.",
    ],
    films: [
      {
        title: "In the Mood for Love",
        year: 2000,
        why: "Wong Kar-wai films unconsummated longing like it's a heist. Every glance is a theft. Every corridor, a missed chance. Maggie Cheung's dresses do more acting than most actors.",
        performances: [
          {
            actor: "Maggie Cheung",
            role: "Su Li-zhen",
            note: "Restraint as seduction. Watch her posture—how she holds herself together while falling apart.",
          },
          {
            actor: "Tony Leung Chiu-wai",
            role: "Chow Mo-wan",
            note: "Master of the wounded glance. His face is a slow-motion confession.",
          },
        ],
      },
      {
        title: "Manchester by the Sea",
        year: 2016,
        why: "Lonergan makes grief into architecture—rooms you can't leave, conversations you can't finish. The most Boston movie ever made about the impossibility of going home.",
        performances: [
          {
            actor: "Casey Affleck",
            role: "Lee Chandler",
            note: "Shutdown as self-preservation. He plays a man who's already dead inside, just hasn't stopped moving yet.",
          },
          {
            actor: "Michelle Williams",
            role: "Randi Chandler",
            note: "That sidewalk scene. Five minutes, one take, a performance so raw it hurts to watch.",
          },
        ],
      },
      {
        title: "The Florida Project",
        year: 2017,
        why: "Baker shoots childhood poverty in candy colors and finds grace in the margins. The Magic Kingdom's shadow is purple motels and precarity.",
        performances: [
          {
            actor: "Brooklynn Prince",
            role: "Moonee",
            note: "Kid performance for the ages. She's a force of nature who doesn't know she's in a tragedy.",
          },
          {
            actor: "Willem Dafoe",
            role: "Bobby Hicks",
            note: "The patron saint of almost-safety. Dafoe's tenderness could break you.",
          },
        ],
      },
      {
        title: "A Separation",
        year: 2011,
        why: "Farhadi constructs a moral Rubik's cube: every turn reveals a new facet of truth. No one's lying. Everyone's right. Everybody loses.",
        performances: [
          {
            actor: "Peyman Moaadi",
            role: "Nader",
            note: "Righteousness as tragic flaw. Watch him be technically correct and humanly wrong.",
          },
          {
            actor: "Leila Hatami",
            role: "Simin",
            note: "The impossible choice between love and self. Her final courtroom look is devastating.",
          },
        ],
      },
    ],
  },
  {
    key: "romance",
    title: "Romance & Melodrama",
    blurb:
      "Feeling in form: devotion arranged by blocking, music, color, and time.",
    essence: "Love as narrative problem. Distance as visual language.",
    watchFor: [
      "Screenplay: obstacles as moral weather; how chance and ritual shape longing.",
      "Performances: restraint vs. confession—how bodies speak before words.",
      "Camera: two-shots as negotiation, doorways as thresholds, the grammar of distance.",
      "Color & light: blushes, candlelight, nocturnes—palette as emotion.",
      "Sound: leitmotifs; when silence becomes declaration.",
      "Editing: ellipsis as ache; returns and refrains across time.",
      "Design: letters, keepsakes, rooms as memory containers.",
    ],
    films: [
      {
        title: "Portrait of a Lady on Fire",
        year: 2019,
        why: "Sciamma films desire as a collaborative artwork. Two women, an island, and the revolutionary act of actually looking at each other.",
        performances: [
          {
            actor: "Noémie Merlant",
            role: "Marianne",
            note: "The artist learning she's also the canvas. Watch her eyes paint before her hands do.",
          },
          {
            actor: "Adèle Haenel",
            role: "Héloïse",
            note: 'The subject who seizes her objecthood. That bonfire turn? Cinema\'s greatest "I see you seeing me."',
          },
        ],
      },
      {
        title: "Brief Encounter",
        year: 1945,
        why: "Lean + Rachmaninoff + repressed British emotions = devastation. Proof that a train station can be as romantic as Paris if the lighting's right.",
        performances: [
          {
            actor: "Celia Johnson",
            role: "Laura Jesson",
            note: "The voiceover is her confession booth. Johnson makes duty and desire wage war on her face.",
          },
          {
            actor: "Trevor Howard",
            role: "Dr. Alec Harvey",
            note: "The Other Man who's actually decent. His restraint matches hers—two people drowning politely.",
          },
        ],
      },
      {
        title: "Carol",
        year: 2015,
        why: "Haynes shoots 1950s Highsmith like it's a Sirkian dream. The gloves, the glances, the Therese-is-Carol's-photographer structure—it's all subtext until it isn't.",
        performances: [
          {
            actor: "Cate Blanchett",
            role: "Carol Aird",
            note: "Elegance as armor. Watch how she uses her class privilege like a weapon, then lays it down.",
          },
          {
            actor: "Rooney Mara",
            role: "Therese Belivet",
            note: "The ingénue who grows into her want. That final look? She out-acts Blanchett by doing less.",
          },
        ],
      },
      {
        title: "In the Mood for Love",
        year: 2000,
        why: "Yes, it's here twice. It's a romance AND a drama. Wong Kar-wai gets both slots because he earned them.",
        performances: [
          {
            actor: "Maggie Cheung",
            role: "Su Li-zhen",
            note: "See Drama section. But also: those qipaos are emotional costuming as high art.",
          },
          {
            actor: "Tony Leung Chiu-wai",
            role: "Chow Mo-wan",
            note: "The man who says everything by saying almost nothing. Cheekbones as dialogue.",
          },
        ],
      },
    ],
  },
  {
    key: "noir",
    title: "Noir",
    blurb:
      "Moral fog and venetian blinds: shadow play, fate, and the geometry of guilt.",
    essence: "Everyone's guilty. The lighting just makes it prettier.",
    watchFor: [
      "Screenplay: voiceover as confession; flashback as trap; the past as inescapable.",
      "Performances: hard shell, soft hurt—how restraint leaks truth.",
      "Camera: Dutch angles, low angles; blinds, smoke, rain—occlusion as style.",
      "Color & light: high contrast B&W or sodium lamps and neon.",
      "Sound: jazz, footsteps, rain; the soundscape of paranoia.",
      "Editing: flashbacks as narrative quicksand.",
      "Design: urban mazes, dive bars, office towers—architecture of entrapment.",
    ],
    films: [
      {
        title: "Double Indemnity",
        year: 1944,
        why: "Wilder + Chandler + Stanwyck's anklet = the Platonic ideal of noir. An insurance scam as Greek tragedy, shot in chiaroscuro perfection.",
        performances: [
          {
            actor: "Barbara Stanwyck",
            role: "Phyllis Dietrichson",
            note: "The femme fatale blueprint. Stanwyck makes evil look like Tuesday—banal, efficient, lethal.",
          },
          {
            actor: "Fred MacMurray",
            role: "Walter Neff",
            note: "The chump who thinks he's smart. Watch him narrate his own doom with a cigarette and a death wish.",
          },
        ],
      },
      {
        title: "Chinatown",
        year: 1974,
        why: "Polanski's neo-noir where the mystery is corruption all the way down. Forget it, Jake—it's systemic rot as plot structure.",
        performances: [
          {
            actor: "Jack Nicholson",
            role: "J.J. Gittes",
            note: "The detective who thinks he can fix it. Nicholson's bandaged nose is a visual reminder: you're in over your head.",
          },
          {
            actor: "Faye Dunaway",
            role: "Evelyn Mulwray",
            note: 'Trauma as performance, performance as survival. "She\'s my sister AND my daughter" is delivered like a confession and an accusation.',
          },
        ],
      },
      {
        title: "The Third Man",
        year: 1949,
        why: "Reed + post-war Vienna + a zither score + Orson Welles in a doorway = perfection. The Ferris wheel scene is a masterclass in moral relativism.",
        performances: [
          {
            actor: "Orson Welles",
            role: "Harry Lime",
            note: "15 minutes of screen time. Owns the entire movie. The cuckoo clock speech was his improvisation.",
          },
          {
            actor: "Joseph Cotten",
            role: "Holly Martins",
            note: "The American innocent abroad, learning Europe has already chosen its compromises.",
          },
        ],
      },
      {
        title: "Sunset Boulevard",
        year: 1950,
        why: "Wilder's Hollywood gothic: a dead man narrates, a silent film star refuses to stay silent, and a mansion becomes a mausoleum.",
        performances: [
          {
            actor: "Gloria Swanson",
            role: "Norma Desmond",
            note: 'A silent film star playing a silent film star who won\'t accept she\'s silent. Meta-tragedy at full volume. "I AM big. It\'s the pictures that got small."',
          },
          {
            actor: "William Holden",
            role: "Joe Gillis",
            note: "The writer who sells out, then sells out again, then floats face-down in a pool. Holden makes cynicism look like survival—until it isn't.",
          },
        ],
      },
    ],
  },
  {
    key: "thriller",
    title: "Thriller",
    blurb:
      "Pressure systems: suspense as architecture, paranoia as point of view.",
    essence: "Information is ammunition. Timing is everything.",
    watchFor: [
      "Screenplay: ticking clocks, reveals, reversals; how information is metered.",
      "Performances: control vs. panic; microexpressions as tells.",
      "Camera: subjective POV, long lens paranoia, Steadicam pursuit.",
      "Color & light: cool palettes, underexposure, pools of light in darkness.",
      "Sound: score as heartbeat; silence before the drop.",
      "Editing: cross-cutting as pressure cooker; the rhythm of the chase.",
      "Design: surveillance, technology, maps—the tools of control and its loss.",
    ],
    films: [
      {
        title: "Sicario",
        year: 2015,
        why: "Villeneuve + Deakins + Jóhannsson = border war as Kafkaesque nightmare. The tunnel scene is a masterclass in sustained dread.",
        performances: [
          {
            actor: "Emily Blunt",
            role: "Kate Macer",
            note: "Idealism as liability. Watch Blunt's face register the moral freefall in real-time.",
          },
          {
            actor: "Benicio del Toro",
            role: "Alejandro Gillick",
            note: "Grief disguised as patience. He's the abyss with a backstory and a silencer.",
          },
        ],
      },
      {
        title: "Heat",
        year: 1995,
        why: "Mann's opus: professionalism as religion, the heist as ballet, and two titans finally sitting down for coffee.",
        performances: [
          {
            actor: "Al Pacino",
            role: "Vincent Hanna",
            note: "Caffeinated chaos. Pacino at 11, but controlled—watch how he uses volume as intimidation.",
          },
          {
            actor: "Robert De Niro",
            role: "Neil McCauley",
            note: "The anti-Pacino: stillness, discipline, the man with no attachments. Until.",
          },
        ],
      },
      {
        title: "No Country for Old Men",
        year: 2007,
        why: "The Coens adapt McCarthy into a Texan death poem. Chigurh isn't the villain—he's the weather.",
        performances: [
          {
            actor: "Javier Bardem",
            role: "Anton Chigurh",
            note: "The most terrifying haircut in cinema. Bardem makes fate look like a captive bolt pistol.",
          },
          {
            actor: "Tommy Lee Jones",
            role: "Ed Tom Bell",
            note: "The moral center who arrives too late, every time. Jones's exhaustion is existential.",
          },
        ],
      },
      {
        title: "The Conversation",
        year: 1974,
        why: "Coppola's surveillance paranoia chamber. Hackman's Harry Caul is a wire-tap monk who records his own unraveling.",
        performances: [
          {
            actor: "Gene Hackman",
            role: "Harry Caul",
            note: "Isolation as expertise. Watch him dismantle his apartment like he's debugging his own soul.",
          },
        ],
      },
    ],
  },
  {
    key: "documentary",
    title: "Documentary",
    blurb:
      "Looking with, not just at: presence, structure, and the ethics of attention.",
    essence: "Reality is already cinema. Framing is a moral choice.",
    watchFor: [
      "Structure: essay vs. observational vs. performative—how the film makes its argument.",
      "Camera: proximity, consent, steadiness—where the film stands with subjects.",
      "Sound: voiceover responsibility; room tone; archival vs. original recording.",
      "Editing: juxtaposition as meaning; when cuts question authorship.",
      "Design: captions, maps, timelines; legibility vs. poetry.",
      "Ethics: who speaks and when; what is withheld and why.",
    ],
    films: [
      {
        title: "Shoah",
        year: 1985,
        why: "Lanzmann's 9.5-hour refusal to show archival footage. Testimony IS the document. Landscape holds memory.",
        performances: [
          {
            actor: "Claude Lanzmann",
            role: "Director/Interviewer",
            note: "His presence is the film's ethical spine—when to push, when to hold silence.",
          },
        ],
      },
      {
        title: "The Act of Killing",
        year: 2012,
        why: "Oppenheimer hands the camera to mass murderers and lets them restage their crimes as movie genres. The result is horrifying, surreal, and unforgettable.",
        performances: [
          {
            actor: "Anwar Congo",
            role: "Himself",
            note: "A killer performing his kills until the performance cracks. His final rooftop retching is the film's moral reckoning.",
          },
        ],
      },
      {
        title: "Cameraperson",
        year: 2016,
        why: "Johnson stitches together 20 years of outtakes into a memoir of looking. Every frame asks: what does it mean to witness?",
        performances: [
          {
            actor: "Kirsten Johnson",
            role: "Cinematographer/Author",
            note: "Her camera IS her performance—shaky when uncertain, steady when committed.",
          },
        ],
      },
      {
        title: "Sans Soleil",
        year: 1983,
        why: "Marker's essayistic fever dream. Travelogue as philosophy, voiceover as ghost, memory as science fiction.",
        performances: [
          {
            actor: "Chris Marker",
            role: "Filmmaker (via Alexandra Stewart's voiceover)",
            note: "The unseen author, present in every frame and narration. Marker makes the essay film feel like a seance.",
          },
        ],
      },
    ],
  },
  {
    key: "comedy",
    title: "Comedy",
    blurb:
      "Rhythm and revelation: timing, framing, and the graceful logic of the gag.",
    essence: "Precision masquerading as chaos. Physics as punchline.",
    watchFor: [
      "Screenplay: premise escalation, rule clarity, call-backs as architecture.",
      'Performances: timing, micro-gestures, ensemble "give and take".',
      "Camera: fixed-frame choreography (Keaton, Tati) vs. punch-in emphasis (Apatow).",
      "Color & light: cheerful or austere palettes as comedic stance.",
      "Sound: deadpan silences, needle drops, dialogue overlap.",
      "Editing: breath before punchlines; montage as setup machine.",
      "Design: props as punchlines; spaces that set jokes in motion.",
    ],
    films: [
      {
        title: "Some Like It Hot",
        year: 1959,
        why: "Wilder's gender-swap farce is a perfect machine: every joke pays off, every line zings. \"Nobody's perfect\" is cinema's best last line.",
        performances: [
          {
            actor: "Tony Curtis",
            role: "Joe/Josephine",
            note: "Doing Cary Grant doing a millionaire while in drag. Layers on layers, all perfectly calibrated.",
          },
          {
            actor: "Jack Lemmon",
            role: "Jerry/Daphne",
            note: "Lemmon's maracas-shaking joy is the film's beating heart. He COMMITS.",
          },
        ],
      },
      {
        title: "Groundhog Day",
        year: 1993,
        why: "Ramis hides a Buddhist koan inside a rom-com time loop. Repetition as spiritual practice. Also, very funny.",
        performances: [
          {
            actor: "Bill Murray",
            role: "Phil Connors",
            note: "Existential despair via eyebrow. Murray makes nihilism hilarious, then finds grace.",
          },
          {
            actor: "Andie MacDowell",
            role: "Rita Hanson",
            note: "She's the stable center. Warm, smart, and just out of reach—the perfect comedic-romantic target.",
          },
        ],
      },
      {
        title: "The Big Lebowski",
        year: 1998,
        why: 'The Coens make a Raymond Chandler plot starring a stoner. Vibes as worldview. "The Dude abides" is lifestyle advice.',
        performances: [
          {
            actor: "Jeff Bridges",
            role: "The Dude",
            note: "Total relaxation as character. Bridges makes doing nothing look like a philosophy.",
          },
          {
            actor: "John Goodman",
            role: "Walter Sobchak",
            note: "Rage as comedy. Goodman's Walter is a volatile teddy bear with Vietnam flashbacks.",
          },
        ],
      },
      {
        title: "Modern Times",
        year: 1936,
        why: "Chaplin's Tramp vs. industrial modernity. Silent comedy as social critique, slapstick as empathy.",
        performances: [
          {
            actor: "Charlie Chaplin",
            role: "A Factory Worker",
            note: "Physical comedy as ballet. The assembly line sequence is still the best critique of capitalism ever filmed.",
          },
        ],
      },
    ],
  },
  {
    key: "animation",
    title: "Animation",
    blurb:
      "The hand of time: line, color, and movement as metaphors made visible.",
    essence: "Every frame is a choice. Every choice reveals a world.",
    watchFor: [
      "Design: line quality, texture, world rules; how physics conveys feeling.",
      "Color: seasonal palettes; emotional temperature across scenes.",
      "Sound: Foley invention; musical motifs; voice casting as gesture.",
      "Movement: weight, timing, exaggeration; how motion expresses character.",
      "Editing: transformation beats; rhythm of motion vs. cut.",
      "Ethics: who gets to imagine, and for whom; myths re-drawn.",
    ],
    films: [
      {
        title: "Spirited Away",
        year: 2001,
        why: "Miyazaki's bathhouse odyssey:童話 meets labor rights. Every background is a painting, every spirit has a motive. Capitalism as literal consumption.",
        performances: [
          {
            actor: "Rumi Hiiragi",
            role: "Chihiro (voice, Japanese)",
            note: "From whiny kid to worker to hero. Hiiragi voices the transformation without ever hitting a false note.",
          },
          {
            actor: "Miyu Irino",
            role: "Haku (voice, Japanese)",
            note: "The boy who's also a river. Irino makes ancient and adolescent coexist.",
          },
        ],
      },
      {
        title: "The Tale of the Princess Kaguya",
        year: 2013,
        why: "Takahata's final film: brush-stroke animation, folk-tale structure, and a critique of patriarchy that feels both ancient and urgent.",
        performances: [
          {
            actor: "Aki Asakura",
            role: "Kaguya (voice, Japanese)",
            note: "Joy and rage in equal measure. Her running scene is animated liberation.",
          },
        ],
      },
      {
        title: "Waltz with Bashir",
        year: 2008,
        why: "Folman uses animation to excavate repressed memory. The surrealism is the point—trauma doesn't do realism.",
        performances: [
          {
            actor: "Ari Folman",
            role: "Himself (voice)",
            note: "The director interrogating his own amnesia. His rotoscoped avatar makes dissociation visible.",
          },
        ],
      },
      {
        title: "Fantastic Planet",
        year: 1973,
        why: "Laloux's psychedelic sci-fi allegory. Humans as pets, revolution as evolution, and Terry Gilliam probably watched this 100 times.",
        performances: [
          {
            actor: "Jennifer Drake",
            role: "Tiwa (English voice)",
            note: "Voicing the oppressor with childlike cruelty. The dubbing is haunting.",
          },
        ],
      },
    ],
  },
  {
    key: "art-experimental",
    title: "Art & Experimental",
    blurb:
      "Form as inquiry: when image, time, and text become the argument.",
    essence: "Cinema asks: what if? Experimental answers: why not?",
    watchFor: [
      "Structure: loop, trance, tableau; what replaces plot as organizing principle.",
      "Camera: duration and distance; when a shot becomes a space to think.",
      "Color & texture: symbolic palettes; grain and surface as meaning.",
      "Sound: drones, voiceover, text-as-sound; the music of the cut.",
      'Editing: repetition and variation; where "sense" emerges (or doesn\'t).',
      "Ethics: what the work asks of a viewer—attention, patience, complicity.",
    ],
    films: [
      {
        title: "Jeanne Dielman, 23, quai du Commerce, 1080 Bruxelles",
        year: 1975,
        why: "Akerman films three days of domestic routine in real-time. Housework as labor, duration as form, and a climax that detonates everything. 201 minutes that changed cinema.",
        performances: [
          {
            actor: "Delphine Seyrig",
            role: "Jeanne Dielman",
            note: "One of the great film performances: all surface until it cracks. Seyrig makes routine hypnotic, then unbearable.",
          },
        ],
      },
      {
        title: "Meshes of the Afternoon",
        year: 1943,
        why: "Deren's 14-minute dream logic feedback loop. Knife, key, flower, mirror—objects as obsessions. Experimental film's Patient Zero.",
        performances: [
          {
            actor: "Maya Deren",
            role: "Herself/The Woman",
            note: "Director as avatar, body as landscape. Deren makes herself the site of the experiment.",
          },
        ],
      },
      {
        title: "Werckmeister Harmonies",
        year: 2000,
        why: "Tarr's apocalyptic slow cinema. 39 shots, 145 minutes, and a stuffed whale as harbinger. Watch the town square riot: 10 minutes, one take, civilization's collapse in real-time.",
        performances: [
          {
            actor: "Lars Rudolph",
            role: "János Valuska",
            note: "Innocence walking into the void. Rudolph's face is an open question the film never quite answers.",
          },
        ],
      },
      {
        title: "The Color of Pomegranates",
        year: 1969,
        why: "Parajanov's tableaux vivant biography of Armenian poet Sayat-Nova. Every frame is a tapestry. Narrative is for cowards.",
        performances: [
          {
            actor: "Sofiko Chiaureli",
            role: "The Poet (and others)",
            note: "Chiaureli plays multiple roles across genders and ages. Performance as iconography.",
          },
        ],
      },
    ],
  },
]