/**
 * CSAT L2 (수능 중급) 1051 Words Seed Script
 *
 * Run with: npx tsx prisma/seed-csat-l2.ts
 */

import { PrismaClient, ExamCategory } from '@prisma/client';

const prisma = new PrismaClient();

const CSAT_L2_WORDS = [
  'abrupt', 'absence', 'absolute', 'absolutely', 'absorption', 'abstraction', 'absurd', 'abundance', 'academy', 'acceleration',
  'acceptable', 'acceptance', 'accessible', 'accessory', 'acclaim', 'accommodate', 'accommodation', 'accompany', 'accomplishment', 'accordance',
  'accordingly', 'accountability', 'accountant', 'accounting', 'accuracy', 'accusation', 'accused', 'acquisition', 'acre', 'activate',
  'activation', 'acute', 'adaptation', 'addiction', 'addition', 'additional', 'additionally', 'adjacent', 'adjustment', 'administrative',
  'administrator', 'admirable', 'admission', 'adolescent', 'adoption', 'advent', 'adverse', 'advertisement', 'advertising', 'aesthetic',
  'affair', 'affection', 'affiliate', 'affirmation', 'affordable', 'afterward', 'agenda', 'aggression', 'aging', 'agony',
  'agricultural', 'bachelor', 'backbone', 'backing', 'backup', 'backward', 'bacteria', 'badge', 'badly', 'bait',
  'bakery', 'ballot', 'bamboo', 'banana', 'bandwidth', 'bankruptcy', 'banner', 'banquet', 'baptism', 'bargaining',
  'bark', 'barn', 'baron', 'barrel', 'basement', 'basket', 'batch', 'battlefield', 'bay', 'beam',
  'beard', 'beast', 'behavioral', 'beloved', 'belt', 'benchmark', 'beneficial', 'beneficiary', 'bent', 'cab',
  'cabin', 'cage', 'calcium', 'calendar', 'calling', 'camel', 'camping', 'campus', 'canal', 'cancellation',
  'cannon', 'canvas', 'capability', 'cape', 'capitalism', 'capitalist', 'capsule', 'captain', 'caption', 'captive',
  'carbohydrate', 'cardinal', 'cardiovascular', 'cargo', 'caribbean', 'carnival', 'carpet', 'carrier', 'carrot', 'cart',
  'carve', 'cascade', 'casino', 'casualty', 'catalog', 'catalyst', 'cater', 'cathedral', 'caution', 'cautious',
  'cavalry', 'celebrity', 'celestial', 'cement', 'cemetery', 'census', 'ceramic', 'cereal', 'certainty', 'certification',
  'champagne', 'championship', 'chancellor', 'chapel', 'characterize', 'charming', 'charter', 'chat', 'checkpoint', 'chef',
  'cherish', 'chess', 'chest', 'childhood', 'chill', 'chip', 'choir', 'cholesterol', 'chord', 'chore',
  'chronic', 'chunk', 'cigarette', 'cinema', 'circuit', 'circular', 'circulate', 'circulation', 'citizenship', 'civic',
  'civilian', 'clarity', 'clash', 'classification', 'classroom', 'clay', 'cleanup', 'clearance', 'clerk', 'cliff',
  'climax', 'clinic', 'clinical', 'clip', 'cloak', 'clone', 'cloth', 'clothing', 'cluster', 'clutch',
  'dairy', 'dam', 'damn', 'dancer', 'darkness', 'dash', 'database', 'dawn', 'daylight', 'deadly',
  'dealer', 'dealing', 'dean', 'debris', 'debut', 'deceased', 'declaration', 'decorator', 'decree', 'dedication',
  'deem', 'deer', 'default', 'defect', 'defendant', 'defender', 'defensive', 'deficiency', 'deficit', 'definite',
  'definitely', 'definition', 'deflect', 'deforestation', 'degradation', 'deity', 'delegate', 'delegation', 'delete', 'deletion',
  'deliberately', 'delicious', 'delighted', 'delinquent', 'delta', 'deluxe', 'demanding', 'demographic', 'demolish', 'demon',
  'denial', 'denote', 'denounce', 'dense', 'density', 'dental', 'depart', 'departure', 'dependence', 'dependency',
  'dependent', 'deploy', 'deployment', 'depot', 'deputy', 'descend', 'eagle', 'earthquake', 'ecological', 'ecology',
  'ecosystem', 'editorial', 'effectiveness', 'efficiency', 'eject', 'elastic', 'elbow', 'elder', 'electoral', 'electrician',
  'electromagnetic', 'electron', 'electronics', 'elegance', 'elegant', 'elevation', 'eligibility', 'eligible', 'elimination', 'elitism',
  'eloquent', 'embed', 'embody', 'emergence', 'emperor', 'empirical', 'empower', 'empress', 'emptiness', 'enact',
  'enchant', 'encode', 'encompass', 'endanger', 'endeavor', 'ending', 'endless', 'endorse', 'endorsement', 'endurance',
  'energetic', 'fabulous', 'facade', 'facial', 'facilitate', 'faction', 'factual', 'faculty', 'fairness', 'fairy',
  'fake', 'fan', 'fare', 'farewell', 'fascinating', 'fascination', 'fashionable', 'fasten', 'fatal', 'fatigue',
  'fatty', 'favorable', 'feast', 'feat', 'feather', 'federation', 'feedback', 'feeding', 'feminist', 'fertile',
  'fertility', 'fertilizer', 'fever', 'fictional', 'filter', 'finale', 'finalist', 'financing', 'firefighter', 'firework',
  'firsthand', 'fiscal', 'fisherman', 'fist', 'gadget', 'galaxy', 'gallery', 'gallop', 'gambling', 'gaming',
  'gang', 'gangster', 'garage', 'gardening', 'garlic', 'garment', 'garrison', 'gasp', 'gateway', 'gauge',
  'gear', 'gel', 'gem', 'genetics', 'genocide', 'genre', 'geographical', 'geology', 'geometry', 'gesture',
  'getaway', 'ghost', 'gigantic', 'ginger', 'girlfriend', 'glacier', 'glamour', 'habitat', 'hack', 'hacker',
  'hail', 'hairy', 'halfway', 'hall', 'hallway', 'halt', 'hamlet', 'hammer', 'handful', 'handicap',
  'handy', 'happiness', 'harassment', 'hardcore', 'hardship', 'hardware', 'harness', 'haste', 'hasty', 'hatch',
  'haul', 'haunt', 'haven', 'hay', 'headache', 'heading', 'headline', 'headmaster', 'headquarters', 'heap',
  'heartbeat', 'heated', 'heavenly', 'icon', 'iconic', 'idealistic', 'identification', 'ideological', 'idiom', 'idle',
  'idol', 'ignorance', 'ignorant', 'illegally', 'illuminate', 'illustration', 'imagery', 'imaginative', 'imitate', 'imitation',
  'immature', 'immeasurable', 'immerse', 'imminent', 'immunity', 'impart', 'impartial', 'imperative', 'imperial', 'impetus',
  'implant', 'implementation', 'implication', 'implicit', 'importantly', 'importation', 'imposition', 'impractical', 'imprisonment', 'improper',
  'impulse', 'inability', 'inadequate', 'inappropriate', 'inaugural', 'incapable', 'incense', 'inception', 'inch', 'incidence',
  'incline', 'inclusion', 'inclusive', 'incomplete', 'inconvenient', 'incorporate', 'incorporation', 'incredibly', 'jam', 'jar',
  'jaw', 'jealous', 'jealousy', 'jeans', 'jelly', 'jersey', 'kidnap', 'kingdom', 'kit', 'landmark',
  'landowner', 'laptop', 'laser', 'lasting', 'lately', 'lateral', 'latitude', 'laughter', 'laundry', 'lava',
  'lavish', 'lawmaker', 'lawsuit', 'layout', 'leaflet', 'leak', 'leakage', 'legacy', 'legendary', 'lens',
  'lesbian', 'lesser', 'lethal', 'levy', 'liability', 'liable', 'liberate', 'liberation', 'machinery', 'macro',
  'maestro', 'magician', 'magistrate', 'magnet', 'magnetic', 'magnetism', 'magnify', 'magnitude', 'maid', 'maiden',
  'mainland', 'mainstream', 'majestic', 'maker', 'makeup', 'malaria', 'mammal', 'mandate', 'mandatory', 'mane',
  'maneuver', 'manga', 'manifest', 'manipulation', 'mankind', 'mantle', 'manual', 'manuscript', 'maple', 'marathon',
  'marble', 'marital', 'marker', 'marketplace', 'martial', 'marvel', 'marvelous', 'masculine', 'massacre', 'mast',
  'masterpiece', 'maternal', 'maternity', 'mathematician', 'mattress', 'maturity', 'maximize', 'meadow', 'meaningful', 'meantime',
  'measurable', 'measurement', 'mechanic', 'mechanical', 'mechanics', 'medal', 'medication', 'medieval', 'meditate', 'naive',
  'namely', 'nap', 'narrative', 'narrator', 'nasty', 'nationalism', 'nationalist', 'nationality', 'nationwide', 'naval',
  'navigation', 'navigator', 'navy', 'necklace', 'nectar', 'needle', 'needless', 'negligence', 'negotiation', 'neighboring',
  'oak', 'oath', 'obedient', 'obese', 'obesity', 'obey', 'objection', 'obscure', 'observable', 'observation',
  'obsess', 'obsession', 'obsolete', 'occupant', 'occupational', 'occurrence', 'octave', 'odds', 'odor', 'offence',
  'offender', 'offensive', 'offering', 'offset', 'offshore', 'offspring', 'olive', 'omit', 'ongoing', 'onion',
  'onset', 'opacity', 'opera', 'pacific', 'pact', 'paddle', 'pagan', 'pageant', 'painstaking', 'painter',
  'palette', 'pan', 'pandemic', 'pane', 'panther', 'paperwork', 'parade', 'paradigm', 'paradise', 'paradox',
  'paralysis', 'parameter', 'paramilitary', 'paramount', 'paranoid', 'paraphrase', 'parasite', 'parcel', 'pardon', 'parish',
  'parking', 'parliamentary', 'parole', 'parrot', 'parse', 'partial', 'partially', 'partisan', 'partition', 'partnership',
  'passerby', 'passionate', 'passport', 'pastoral', 'pasture', 'patent', 'paternal', 'pathetic', 'pathway', 'patriot',
  'patriotic', 'patrol', 'patron', 'patronage', 'pavement', 'paw', 'payable', 'paycheck', 'peacekeeping', 'pear',
  'pearl', 'pedestrian', 'pediatric', 'peel', 'pending', 'penetrate', 'penetration', 'penguin', 'peninsula', 'penny',
  'pentagon', 'pepper', 'perception', 'perennial', 'perfection', 'performer', 'perfume', 'peril', 'perimeter', 'periodical',
  'peripheral', 'perish', 'perk', 'permanence', 'permissible', 'perpetual', 'perplex', 'persecution', 'persistence', 'persistent',
  'persona', 'personalize', 'pest', 'pesticide', 'petition', 'petrol', 'petroleum', 'petty', 'pharmaceutical', 'pharmacist',
  'pharmacy', 'phenomenal', 'philosopher', 'philosophical', 'phoenix', 'phosphorus', 'photocopy', 'quantum', 'quarantine', 'rabbi',
  'rabbit', 'rack', 'radar', 'radiate', 'radiation', 'radiator', 'radically', 'radius', 'raft', 'raid',
  'railing', 'railroad', 'rainfall', 'rally', 'ranch', 'rancher', 'random', 'randomly', 'ranger', 'rap',
  'rape', 'rapper', 'rarity', 'rash', 'raspberry', 'rattle', 'raven', 'ray', 'razor', 'reactor',
  'readily', 'readiness', 'realism', 'realtor', 'reap', 'reappear', 'rearrange', 'reasoning', 'reassure', 'rebellion',
  'rebuild', 'rebuttal', 'recede', 'receipt', 'receiver', 'recession', 'recipient', 'reciprocal', 'recital', 'reckless',
  'reckon', 'reclaim', 'recollection', 'reconcile', 'reconciliation', 'reconsider', 'reconstruction', 'recorder', 'recount', 'recreation',
  'recreational', 'rectangle', 'rectangular', 'rectify', 'recur', 'recycle', 'redemption', 'redevelopment', 'redirect', 'redistribute',
  'redundant', 'reef', 'reel', 'referee', 'referendum', 'refine', 'refinement', 'refinery', 'reflection', 'reflective',
  'reflexive', 'sabotage', 'saddle', 'safari', 'safeguard', 'sage', 'saint', 'salad', 'salon', 'salvation',
  'sanctuary', 'sandal', 'sandy', 'sanitation', 'sanity', 'sarcasm', 'satellite', 'satire', 'saturate', 'sauce',
  'savage', 'scanner', 'scatter', 'scenario', 'scenic', 'scent', 'scheduler', 'schema', 'schematic', 'scissors',
  'scold', 'scoop', 'scooter', 'scorching', 'screenplay', 'screenshot', 'screw', 'scripture', 'scroll', 'scrutiny',
  'sculptor', 'sculpture', 'seal', 'seam', 'seamless', 'sect', 'secular', 'sediment', 'seduce', 'segment',
  'segregate', 'seldom', 'selection', 'selective', 'self-esteem', 'semester', 'semiconductor', 'seminar', 'sender', 'sensation',
  'sensational', 'sensible', 'sensor', 'sentiment', 'sentimental', 'separation', 'serial', 'sermon', 'serum', 'setback',
  'sew', 'sewage', 'sexuality', 'shack', 'shaft', 'shallow', 'sham', 'shampoo', 'shareholder', 'shark',
  'shatter', 'shave', 'sheer', 'sherbet', 'sheriff', 'shield', 'shipping', 'shipyard', 'shiver', 'shoemaker',
  'shooting', 'shopkeeper', 'shopper', 'shortage', 'shortcoming', 'shorten', 'shortfall', 'shorthand', 'shrub', 'shrug',
  'shuffle', 'shuttle', 'sibling', 'sickness', 'sidebar', 'siege', 'sigh', 'sighting', 'signify', 'silicon',
  'silk', 'simulate', 'simulation', 'tablet', 'tabloid', 'taboo', 'tact', 'tactical', 'tactics', 'tag',
  'tailor', 'taint', 'takeoff', 'tangible', 'tangle', 'tanker', 'tantalize', 'tar', 'tariff', 'tart',
  'taskforce', 'taxpayer', 'teamwork', 'technically', 'technician', 'tectonic', 'tedious', 'telescope', 'temperament', 'tempo',
  'tenant', 'tenet', 'tennis', 'tenure', 'terminal', 'terminate', 'termination', 'terrace', 'terrain', 'terrestrial',
  'terrify', 'territorial', 'testament', 'texture', 'thankful', 'thanksgiving', 'theatrical', 'theft', 'thereafter', 'thereby',
  'thermometer', 'thesis', 'thickness', 'thorn', 'thoughtful', 'ubiquitous', 'umbrella', 'unaware', 'unbelievable', 'unconstitutional',
  'uncover', 'underestimate', 'undergraduate', 'underlie', 'undermine', 'underscore', 'understated', 'undertaking', 'underway', 'undesirable',
  'undo', 'undoubtedly', 'undue', 'vacancy', 'vacant', 'vaccination', 'vaccine', 'vacuum', 'vain', 'validation',
  'vanilla', 'variance', 'variant', 'variation', 'vein', 'velvet', 'vendor', 'vengeance', 'ventilation', 'verbal',
  'verdict', 'verify', 'wag', 'wagon', 'waist', 'waitress', 'walnut', 'warehouse', 'warfare', 'warlike',
  'warmth', 'warrior', 'warship', 'wary', 'watchdog', 'waterfall', 'waterfront', 'watt', 'wavelength', 'wax',
  'weaken', 'weakness', 'weary', 'weave', 'webinar', 'weed', 'yacht', 'yarn', 'zeal', 'zealous',
  'zebra',
];

async function main() {
  console.log('Starting CSAT L2 word seed...');
  console.log(`Total words to process: ${CSAT_L2_WORDS.length}`);

  const examCategory: ExamCategory = 'CSAT';
  const level = 'L2';
  const difficulty = 'INTERMEDIATE';

  // Get existing words
  const existingWords = await prisma.word.findMany({
    where: { word: { in: CSAT_L2_WORDS } },
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

  for (const wordText of CSAT_L2_WORDS) {
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
  console.log(`Total CSAT-L2 words in database: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
