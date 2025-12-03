/**
 * CSAT L3 (수능 고급) 1053 Words Seed Script
 *
 * Run with: npx tsx prisma/seed-csat-l3.ts
 */

import { PrismaClient, ExamCategory } from '@prisma/client';

const prisma = new PrismaClient();

const CSAT_L3_WORDS = [
  'aberration', 'abhor', 'abide', 'ablaze', 'abnormality', 'abolition', 'abrasive', 'abridge', 'abrogate', 'abruptly',
  'absolution', 'abstain', 'abstinence', 'abyss', 'accede', 'accentuate', 'accolade', 'accomplice', 'accredit', 'accrue',
  'acerbic', 'acquiesce', 'acquit', 'acrimony', 'acuity', 'backlash', 'backlog', 'baffle', 'baffled', 'banal',
  'bane', 'banish', 'banishment', 'banter', 'barbaric', 'barbed', 'baroque', 'barracks', 'barrage', 'barren',
  'barricade', 'cabal', 'cache', 'cacophony', 'cadaver', 'cadence', 'calamity', 'caliber', 'calibrate', 'callous',
  'callow', 'cameo', 'camouflage', 'candid', 'candor', 'canine', 'canopy', 'canteen', 'canter', 'canvass',
  'canyon', 'capillary', 'capitulate', 'capricious', 'capsize', 'captivate', 'captivity', 'carcass', 'careen', 'carefree',
  'caress', 'caricature', 'carnage', 'carnal', 'carnivore', 'carol', 'carp', 'cartilage', 'cartographer', 'daffodil',
  'dagger', 'dainty', 'dale', 'dampen', 'dapper', 'dappled', 'darling', 'darn', 'dart', 'daunt',
  'daunting', 'dawdle', 'daze', 'dazzle', 'deacon', 'deadlock', 'deafen', 'dearth', 'debacle', 'debase',
  'debilitate', 'debtor', 'debunk', 'deceit', 'deceitful', 'decelerate', 'decentralize', 'deceptive', 'decibel', 'deciduous',
  'decimation', 'decipher', 'decisive', 'declaim', 'decor', 'decorum', 'earmark', 'earnest', 'earring', 'earthen',
  'earthly', 'earthworm', 'easel', 'ebb', 'ebony', 'ebullient', 'eccentric', 'eccentricity', 'ecclesiastic', 'ecclesiastical',
  'economize', 'ecstasy', 'ecstatic', 'ecumenical', 'eddy', 'edible', 'edict', 'edification', 'edifice', 'edify',
  'eerie', 'efface', 'effeminate', 'effervesce', 'effervescent', 'efficacious', 'efficacy', 'effluent', 'effortless', 'effrontery',
  'effusive', 'fable', 'fabricate', 'fabrication', 'facet', 'facetious', 'fallacious', 'fallacy', 'falter', 'famished',
  'fanatical', 'fanaticism', 'fanfare', 'farce', 'farcical', 'farmhouse', 'farsighted', 'fathom', 'fauna', 'feasibility',
  'feckless', 'gab', 'gaffe', 'gag', 'gait', 'gala', 'gale', 'gall', 'gallant', 'gallantry',
  'galleon', 'galley', 'gallon', 'galore', 'galvanize', 'gambit', 'gambol', 'gangrene', 'gape', 'habitual',
  'habitually', 'habituate', 'hackneyed', 'haggard', 'haggle', 'hallow', 'hallucinate', 'hallucination', 'halo', 'hamper',
  'hamstring', 'handcraft', 'handkerchief', 'handout', 'hanger', 'hangover', 'haphazard', 'hapless', 'iambic', 'iceberg',
  'icicle', 'icing', 'iconoclast', 'iconography', 'icy', 'idealism', 'idealist', 'idealization', 'idealize', 'identifiable',
  'idiocy', 'idiolect', 'idiomatic', 'idiosyncrasy', 'idiosyncratic', 'idolatry', 'idolize', 'idyll', 'idyllic', 'igloo',
  'ignite', 'ignition', 'ignoble', 'ignominious', 'ignominy', 'illusionary', 'illusive', 'illusory', 'illustrious', 'imbecile',
  'imbibe', 'imbroglio', 'imbue', 'immaculate', 'immanent', 'immaterial', 'immeasurably', 'immediacy', 'immemorial', 'immobile',
  'immobility', 'immobilize', 'immodest', 'immolate', 'immortal', 'immortality', 'immortalize', 'immovable', 'immunization', 'immunize',
  'immutable', 'impair', 'impairment', 'impale', 'impalpable', 'impassable', 'impasse', 'impassioned', 'impassive', 'jab',
  'jabber', 'jackal', 'jackass', 'jackpot', 'jade', 'kaleidoscope', 'kangaroo', 'karate', 'karma', 'kayak',
  'laborious', 'labyrinth', 'labyrinthine', 'lace', 'lacerate', 'laceration', 'lackadaisical', 'lackey', 'lackluster', 'laconic',
  'lactate', 'lactation', 'lactose', 'lacuna', 'laden', 'ladle', 'lager', 'lagoon', 'lair', 'laity',
  'lambaste', 'lame', 'lament', 'lamentable', 'macabre', 'mace', 'machete', 'machination', 'machismo', 'macho',
  'mackerel', 'mackintosh', 'macrocosm', 'madcap', 'madden', 'maddening', 'madman', 'madrigal', 'maelstrom', 'magenta',
  'maggot', 'magi', 'magnanimity', 'magnanimous', 'magnate', 'magnificence', 'mahogany', 'maim', 'maitre', 'maladjusted',
  'malady', 'malaise', 'malapropism', 'malcontent', 'malefactor', 'malevolence', 'malevolent', 'malfeasance', 'malformed', 'malfunction',
  'malice', 'malicious', 'malign', 'malignancy', 'malignant', 'malinger', 'malingerer', 'mall', 'mallard', 'malleable',
  'malnutrition', 'malpractice', 'malt', 'nab', 'nadir', 'nag', 'nagging', 'naiveté', 'namesake', 'nanny',
  'narcissism', 'narcissist', 'narcissistic', 'narcotic', 'narrate', 'narration', 'narrowly', 'narrowness', 'nasal', 'nascent',
  'oafish', 'oaken', 'oar', 'oases', 'oasis', 'oatmeal', 'obdurate', 'obeisance', 'obelisk', 'obfuscate',
  'obituary', 'objectify', 'objectionable', 'objectivity', 'oblation', 'obligate', 'obligatory', 'oblique', 'obliterate', 'obliteration',
  'oblivion', 'oblivious', 'oblong', 'obnoxious', 'obscenity', 'obscurantism', 'pacifism', 'pacifist', 'pacify', 'padding',
  'paddock', 'paddy', 'padre', 'paean', 'paganism', 'pagoda', 'pail', 'paisley', 'pal', 'palatable',
  'palate', 'palatial', 'paleontology', 'pall', 'palladium', 'pallbearer', 'palliate', 'palliative', 'pallid', 'pallor',
  'palpable', 'palpably', 'palpitate', 'palpitation', 'palsy', 'paltry', 'pamper', 'pamphlet', 'panacea', 'panache',
  'pancake', 'panda', 'pandemonium', 'pander', 'pandering', 'panegyric', 'panelist', 'pang', 'panoply', 'panorama',
  'panoramic', 'pant', 'pantomime', 'pantry', 'papa', 'papacy', 'papal', 'paparazzi', 'papaya', 'paperback',
  'par', 'parabola', 'paradigmatic', 'paradoxical', 'paraffin', 'paragon', 'parallelism', 'paralyze', 'paramecium', 'paramedic',
  'paramour', 'paranoia', 'paranoiac', 'paraphernalia', 'paraplegia', 'paraplegic', 'parch', 'parched', 'parchment', 'parental',
  'parenthesis', 'parenthetical', 'parenthood', 'pariah', 'paring', 'parlance', 'parley', 'parlor', 'parody', 'parol',
  'paroxysm', 'parquet', 'parricide', 'parsimonious', 'parsimony', 'parsley', 'parson', 'quackery', 'quadrangle', 'quadrant',
  'quadrilateral', 'quadruped', 'quadruple', 'rabble', 'rabid', 'rabies', 'raccoon', 'racecourse', 'racetrack', 'rachitis',
  'racking', 'raconteur', 'racquet', 'racy', 'radiance', 'radiant', 'radicalism', 'radicalize', 'radioactive', 'radioactivity',
  'radiograph', 'radiography', 'radiology', 'radish', 'radon', 'raffish', 'raffle', 'rafter', 'rag', 'ragamuffin',
  'ragbag', 'ragged', 'raging', 'ragout', 'ragtag', 'ragtime', 'rah', 'raider', 'railroadman', 'raiment',
  'rainbow', 'raincoat', 'raindrop', 'rainforest', 'rainstorm', 'rainwater', 'rainy', 'rakish', 'rambunctious', 'ramification',
  'ramify', 'ramp', 'rampage', 'rampant', 'rampart', 'ramrod', 'ramshackle', 'rancid', 'rancor', 'rancorous',
  'randomize', 'randy', 'rangy', 'rankling', 'rankness', 'ransack', 'ransom', 'rant', 'sabbatical', 'saber',
  'sable', 'saboteur', 'saccharine', 'sacerdotal', 'sack', 'sacrament', 'sacramental', 'sacredness', 'sacrificial', 'sacrilege',
  'sacrilegious', 'sacrosanct', 'sadden', 'sadism', 'sadistic', 'sadness', 'saga', 'sagacious', 'sagacity', 'sagging',
  'sago', 'sail', 'sailboat', 'sailing', 'sailor', 'sainthood', 'saintly', 'salable', 'salacious', 'salaried',
  'salient', 'saline', 'salinity', 'salivary', 'salivate', 'sallow', 'salmonella', 'saloon', 'salubrious', 'salutary',
  'salutation', 'salute', 'salvageable', 'sampler', 'sampling', 'sanatorium', 'sanctify', 'sanctimonious', 'sanctimony', 'sanctioned',
  'sanctity', 'sandstone', 'sanguinary', 'sanguine', 'sanitarium', 'sanitize', 'sap', 'sapient', 'sapling', 'sapphire',
  'sappy', 'sarcastic', 'sarcophagus', 'sardine', 'sardonic', 'sari', 'sash', 'satanic', 'satchel', 'sateen',
  'satiate', 'satiety', 'satin', 'satiric', 'satirical', 'satirist', 'satirize', 'satisfactorily', 'satisfactory', 'saturated',
  'saturation', 'saturnine', 'satyr', 'saucer', 'saucy', 'sauna', 'saunter', 'sauté', 'savagery', 'savanna',
  'savant', 'savior', 'savour', 'savoury', 'savvy', 'sawdust', 'sawmill', 'saxophone', 'scab', 'scabbard',
  'scaffold', 'scaffolding', 'scald', 'scallop', 'scalloped', 'scalp', 'scalpel', 'scamp', 'scamper', 'scandalize',
  'scandalmonger', 'scandalous', 'scansion', 'scanty', 'scapegoat', 'scar', 'scarab', 'scarecrow', 'scarf', 'scarlet',
  'scarp', 'scary', 'scathe', 'scathing', 'scatterbrained', 'scatterplot', 'scavenge', 'scavenger', 'scenery', 'schemer',
  'scheming', 'schism', 'schismatic', 'schizoid', 'schizophrenia', 'schizophrenic', 'schlep', 'schmaltz', 'schmaltzy', 'schnapps',
  'schnauzer', 'scholarly', 'scholastic', 'scholasticism', 'schooling', 'schoolmaster', 'schoolmistress', 'schooner', 'sciatic', 'sciatica',
  'scimitar', 'scintilla', 'scintillate', 'scintillating', 'scion', 'scoff', 'scoffer', 'scolding', 'scorch', 'scorcher',
  'scoreboard', 'scorecard', 'scorer', 'scornful', 'scorpion', 'scotch', 'scoundrel', 'scour', 'scourge', 'tabernacle',
  'tableaux', 'tablecloth', 'tableland', 'tablespoon', 'tabletop', 'tableware', 'tabloidism', 'tabor', 'tabular', 'tabulate',
  'tabulation', 'tabulator', 'tacitly', 'taciturn', 'taciturnity', 'tack', 'tackler', 'tacky', 'taco', 'tactician',
  'tactile', 'tactless', 'tadpole', 'taffeta', 'taffy', 'tagger', 'tagging', 'tailgate', 'tailor-made', 'tailored',
  'tailoring', 'tailpipe', 'tailspin', 'tailwind', 'takeaway', 'takeout', 'takeover', 'talc', 'talebearer', 'talented',
  'talentless', 'talisman', 'talkative', 'talker', 'talking', 'tallness', 'tallow', 'tally', 'talon', 'tambourine',
  'tame', 'tamer', 'tamper', 'tampering', 'tampon', 'tan', 'tandem', 'tang', 'tangent', 'tangentially',
  'tangerine', 'tangibly', 'tango', 'tangy', 'tankard', 'tankful', 'tanned', 'tanner', 'tannery', 'tannin',
  'tanning', 'tantrum', 'tape', 'taper', 'tapering', 'tapestry', 'tapioca', 'tapir', 'tapper', 'tapping',
  'taproom', 'taproot', 'tardy', 'tare', 'tarmac', 'tarnish', 'taro', 'tarot', 'tarp', 'tarpaulin',
  'tarragon', 'tarry', 'tarsus', 'tartan', 'tartar', 'tartness', 'taskmaster', 'tassel', 'tasteful', 'tastefully',
  'tasteless', 'taster', 'tasting', 'tasty', 'tatter', 'tattered', 'tattle', 'tattler', 'ubiquitously', 'ubiquity',
  'udder', 'ufo', 'ugliness', 'ukulele', 'ulcer', 'ulcerate', 'ulceration', 'ulcerative', 'ulterior', 'ultimatum',
  'ultra', 'ultraconservative', 'ultrahigh', 'ultramarine', 'ultramodern', 'ultrasonic', 'ultrasonics', 'ultrasound', 'ultraviolet', 'ululate',
  'ululation', 'umbra', 'umbrage', 'umpire', 'umpteen', 'umpteenth', 'unabridged', 'unacceptable', 'unaccompanied', 'unaccountable',
  'unaccustomed', 'unacknowledged', 'unadulterated', 'unadvised', 'unaffected', 'unaffiliated', 'unaided', 'unalienable', 'unaligned', 'unalloyed',
  'unalterable', 'unambiguous', 'unanimity', 'unanimous', 'unanimously', 'unannounced', 'unanswerable', 'unanswered', 'unappealing', 'unappetizing',
  'unapproachable', 'unarmed', 'unashamed', 'unassailable', 'unassuming', 'unattached', 'unattainable', 'unattended', 'unattractive', 'unauthorized',
  'unavailable', 'unavailing', 'unavoidable', 'unawares', 'unbalanced', 'unbearable', 'unbeatable', 'unbeaten', 'unbecoming', 'unbeknown',
  'unbelief', 'unbeliever', 'unbend', 'unbending', 'unbiased', 'unbidden', 'unbind', 'unblemished', 'unblinking', 'unblock',
  'unblushing', 'unborn', 'unbosom', 'unbound', 'unbounded', 'unbowed', 'unbreakable', 'unbridled', 'unbroken', 'unbuckle',
  'unburden', 'unbutton', 'uncalled-for', 'uncannily', 'uncanny', 'uncap', 'uncapped', 'vacantly', 'vacate', 'vacationer',
  'vaccinate', 'vacillate', 'vacillation', 'vacuity', 'vacuous', 'vagabond', 'vagary', 'vagina', 'vaginal', 'vagrancy',
  'vagrant', 'vaguely', 'vagueness', 'vainglorious', 'vainglory', 'vainly', 'valance', 'vale', 'valediction', 'valedictorian',
  'valedictory', 'valence', 'valency', 'valentine', 'valet', 'valiant', 'valiantly', 'valise', 'valor', 'valorous',
  'valour', 'valuables', 'valuator', 'valueless', 'wacky', 'wad', 'wadding', 'waddle', 'wade', 'wader',
  'wadi', 'wafer', 'wafer-thin', 'waft', 'wager', 'waggish', 'waggle', 'wagoneer', 'waif', 'wail',
  'wainscot', 'wainscoting', 'waistband', 'waistcoat', 'waistline', 'waitperson', 'waive', 'waiver', 'wakeful', 'wakefulness',
  'waken', 'wale', 'walkabout', 'walkaway', 'walkout', 'walkover', 'walkup', 'walkway', 'wallaby', 'wallet',
  'wallflower', 'wallop', 'walloping', 'wallow', 'wallpaper', 'waltz', 'wampum', 'wan', 'wand', 'wanderer',
  'wandering', 'wanderlust', 'wane', 'wangle', 'wanna', 'wannabe', 'wanting', 'wanton', 'wantonly', 'wantonness',
  'warble', 'warbler', 'warden', 'warder', 'wardroom', 'warhead', 'warhorse', 'warily', 'wariness', 'warlock',
  'warlord', 'warm-blooded', 'xenon', 'yachtsman', 'yak', 'yam', 'yammer', 'yang', 'yank', 'zaftig',
  'zag', 'zany', 'zap',
];

async function main() {
  console.log('Starting CSAT L3 word seed...');
  console.log(`Total words to process: ${CSAT_L3_WORDS.length}`);

  const examCategory: ExamCategory = 'CSAT';
  const level = 'L3';
  const difficulty = 'ADVANCED';

  // Get existing words
  const existingWords = await prisma.word.findMany({
    where: { word: { in: CSAT_L3_WORDS } },
    select: {
      id: true,
      word: true,
      aiGeneratedAt: true,
      examLevels: { select: { examCategory: true } },
    },
  });

  const existingMap = new Map(existingWords.map(w => [w.word.toLowerCase(), w]));
  console.log(`Found ${existingWords.length} existing words`);

  const newWordTexts: string[] = [];
  const mappingsToAdd: { wordId: string; word: string }[] = [];
  const alreadyMapped: string[] = [];

  for (const wordText of CSAT_L3_WORDS) {
    const normalized = wordText.toLowerCase().trim();
    const existing = existingMap.get(normalized);

    if (!existing) {
      newWordTexts.push(normalized);
    } else {
      const hasMapping = existing.examLevels.some(el => el.examCategory === examCategory);
      if (hasMapping) {
        alreadyMapped.push(normalized);
      } else {
        mappingsToAdd.push({ wordId: existing.id, word: normalized });
      }
    }
  }

  console.log(`\nAnalysis:`);
  console.log(`- New words to create: ${newWordTexts.length}`);
  console.log(`- Existing words to add mapping: ${mappingsToAdd.length}`);
  console.log(`- Already mapped (skip): ${alreadyMapped.length}`);

  // Create new words in batches of 100
  if (newWordTexts.length > 0) {
    console.log(`\nCreating ${newWordTexts.length} new words...`);

    const batchSize = 100;
    for (let i = 0; i < newWordTexts.length; i += batchSize) {
      const batch = newWordTexts.slice(i, i + batchSize);

      await prisma.word.createMany({
        data: batch.map(word => ({
          word,
          definition: '',
          partOfSpeech: 'NOUN',
          examCategory,
          difficulty,
          level,
          frequency: 100,
          status: 'DRAFT',
        })),
        skipDuplicates: true,
      });

      console.log(`  Created batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newWordTexts.length / batchSize)}`);
    }

    // Get newly created words for exam level mapping
    const newlyCreated = await prisma.word.findMany({
      where: { word: { in: newWordTexts } },
      select: { id: true, word: true },
    });

    // Create WordExamLevel mappings for new words
    if (newlyCreated.length > 0) {
      console.log(`Creating ${newlyCreated.length} exam mappings for new words...`);

      for (let i = 0; i < newlyCreated.length; i += batchSize) {
        const batch = newlyCreated.slice(i, i + batchSize);

        await prisma.wordExamLevel.createMany({
          data: batch.map(w => ({
            wordId: w.id,
            examCategory,
            level,
            frequency: 0,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  // Add exam mappings for existing words
  if (mappingsToAdd.length > 0) {
    console.log(`\nAdding ${mappingsToAdd.length} exam mappings to existing words...`);

    const batchSize = 100;
    for (let i = 0; i < mappingsToAdd.length; i += batchSize) {
      const batch = mappingsToAdd.slice(i, i + batchSize);

      await prisma.wordExamLevel.createMany({
        data: batch.map(m => ({
          wordId: m.wordId,
          examCategory,
          level,
          frequency: 0,
        })),
        skipDuplicates: true,
      });
    }
  }

  // Final count
  const finalCount = await prisma.word.count({
    where: {
      examLevels: {
        some: { examCategory, level },
      },
    },
  });

  console.log(`\n=== Seed Complete ===`);
  console.log(`Total CSAT-L3 words in database: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
