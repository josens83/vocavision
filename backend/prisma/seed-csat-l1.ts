/**
 * CSAT L1 (수능 초급) 1000 Words Seed Script
 *
 * Run with: npx tsx prisma/seed-csat-l1.ts
 */

import { PrismaClient, ExamCategory } from '@prisma/client';

const prisma = new PrismaClient();

const CSAT_L1_WORDS = [
  'abandon', 'abolish', 'absorb', 'abstract', 'abundant', 'abuse', 'academic', 'accelerate', 'accept', 'access',
  'accomplish', 'account', 'accumulate', 'accurate', 'accuse', 'achieve', 'acknowledge', 'acquire', 'adapt', 'address',
  'adequate', 'adjust', 'admire', 'admit', 'adopt', 'adult', 'advance', 'advantage', 'advertise', 'advocate',
  'affect', 'afford', 'agent', 'aggressive', 'agree', 'agriculture', 'aid', 'aim', 'alarm', 'alert',
  'alive', 'allow', 'alter', 'alternative', 'amaze', 'ambition', 'background', 'balance', 'ban', 'bare',
  'barely', 'barrier', 'base', 'basis', 'bear', 'beat', 'beauty', 'behalf', 'behave', 'behavior',
  'belief', 'believe', 'belong', 'beneath', 'benefit', 'besides', 'betray', 'beyond', 'bias', 'billion',
  'bind', 'blame', 'blank', 'blend', 'blind', 'cabinet', 'calculate', 'calm', 'campaign', 'cancel',
  'candidate', 'capable', 'capacity', 'capital', 'capture', 'carbon', 'career', 'careful', 'carry', 'case',
  'cast', 'category', 'cattle', 'cause', 'cease', 'celebrate', 'cell', 'central', 'century', 'ceremony',
  'certain', 'chain', 'challenge', 'chance', 'channel', 'chaos', 'chapter', 'character', 'charge', 'charity',
  'charm', 'chase', 'cheap', 'cheat', 'check', 'chemical', 'chief', 'choice', 'choose', 'circumstance',
  'cite', 'citizen', 'civil', 'claim', 'clarify', 'class', 'classic', 'classify', 'clean', 'clear',
  'client', 'climate', 'climb', 'close', 'code', 'cognitive', 'collapse', 'colleague', 'collect', 'colony',
  'combine', 'comfort', 'command', 'comment', 'commerce', 'commit', 'committee', 'common', 'communicate', 'community',
  'companion', 'company', 'compare', 'damage', 'danger', 'dare', 'data', 'deal', 'death', 'debate',
  'debt', 'decade', 'decay', 'deceive', 'decent', 'decide', 'decision', 'declare', 'decline', 'decrease',
  'dedicate', 'deep', 'defeat', 'defend', 'define', 'degree', 'delay', 'deliberate', 'delicate', 'delight',
  'deliver', 'demand', 'democracy', 'demonstrate', 'deny', 'department', 'depend', 'depict', 'depress', 'depth',
  'derive', 'describe', 'desert', 'deserve', 'design', 'desire', 'desperate', 'despite', 'destroy', 'detail',
  'detect', 'determine', 'develop', 'eager', 'earn', 'earth', 'ease', 'eastern', 'economic', 'economy',
  'edge', 'edit', 'educate', 'effect', 'effective', 'efficient', 'effort', 'elaborate', 'elderly', 'elect',
  'element', 'eliminate', 'elite', 'elsewhere', 'embarrass', 'embrace', 'emerge', 'emergency', 'emission', 'emotion',
  'emphasis', 'emphasize', 'empire', 'employ', 'employee', 'enable', 'encounter', 'encourage', 'endure', 'enemy',
  'energy', 'enforce', 'engage', 'engine', 'enhance', 'enjoy', 'enormous', 'ensure', 'enterprise', 'entire',
  'entitle', 'entrance', 'entry', 'environment', 'episode', 'fabric', 'face', 'facility', 'fact', 'factor',
  'factory', 'fade', 'fail', 'failure', 'fair', 'faith', 'false', 'fame', 'familiar', 'family',
  'famous', 'fancy', 'fantasy', 'farm', 'fascinate', 'fashion', 'fast', 'fate', 'fault', 'favor',
  'favorite', 'fear', 'feature', 'federal', 'fee', 'feed', 'fellow', 'female', 'fence', 'festival',
  'fiber', 'fiction', 'field', 'fierce', 'figure', 'file', 'film', 'final', 'finance', 'financial',
  'finding', 'fine', 'firm', 'fit', 'fix', 'gain', 'gap', 'gather', 'gaze', 'gender',
  'gene', 'general', 'generate', 'generation', 'generous', 'genetic', 'genius', 'gentle', 'genuine', 'giant',
  'gift', 'glad', 'glance', 'glimpse', 'global', 'glory', 'goal', 'goods', 'govern', 'habit',
  'handle', 'hang', 'happen', 'harbor', 'hard', 'hardly', 'harm', 'harmful', 'harmony', 'harsh',
  'harvest', 'hate', 'hazard', 'head', 'heal', 'health', 'healthy', 'hear', 'heart', 'heat',
  'heaven', 'heavy', 'ideal', 'identical', 'identify', 'identity', 'ideology', 'ignore', 'ill', 'illegal',
  'illusion', 'illustrate', 'image', 'imagination', 'imagine', 'immediate', 'immense', 'immigrant', 'immune', 'impact',
  'implement', 'imply', 'import', 'impose', 'impossible', 'impress', 'impression', 'improve', 'incentive', 'incident',
  'include', 'income', 'increase', 'indeed', 'independent', 'index', 'indicate', 'individual', 'industrial', 'industry',
  'inevitable', 'infant', 'infect', 'inflation', 'influence', 'inform', 'jail', 'jet', 'job', 'join',
  'joint', 'joke', 'journal', 'journey', 'keen', 'key', 'kick', 'kid', 'kill', 'kind',
  'label', 'labor', 'laboratory', 'lack', 'lake', 'land', 'landscape', 'lane', 'language', 'lap',
  'large', 'largely', 'last', 'late', 'latter', 'laugh', 'launch', 'law', 'lawyer', 'lay',
  'layer', 'lead', 'leader', 'lean', 'leap', 'learn', 'least', 'leather', 'leave', 'lecture',
  'legal', 'legend', 'legislation', 'legitimate', 'leisure', 'lend', 'length', 'lesson', 'let', 'letter',
  'machine', 'mad', 'magic', 'magnificent', 'mail', 'main', 'maintain', 'major', 'majority', 'male',
  'manage', 'manner', 'manufacture', 'margin', 'marine', 'mark', 'market', 'marriage', 'marry', 'mask',
  'mass', 'massive', 'master', 'match', 'mate', 'material', 'mathematics', 'matter', 'mature', 'maximum',
  'mayor', 'meal', 'mean', 'meaning', 'means', 'meanwhile', 'measure', 'meat', 'mechanism', 'media',
  'medical', 'medicine', 'medium', 'meet', 'melt', 'member', 'memory', 'mental', 'mention', 'merchant',
  'mere', 'merely', 'nail', 'naked', 'name', 'narrow', 'nation', 'native', 'natural', 'nature',
  'navigate', 'near', 'nearby', 'nearly', 'neat', 'necessary', 'necessity', 'neck', 'need', 'negative',
  'neglect', 'negotiate', 'neighbor', 'neither', 'nerve', 'object', 'objective', 'obligation', 'observe', 'obstacle',
  'obtain', 'obvious', 'occasion', 'occupation', 'occupy', 'occur', 'ocean', 'odd', 'offend', 'offense',
  'offer', 'office', 'officer', 'official', 'often', 'online', 'open', 'operate', 'operation', 'opinion',
  'opponent', 'pace', 'pack', 'package', 'pain', 'painful', 'paint', 'pair', 'palace', 'pale',
  'panel', 'panic', 'paper', 'paragraph', 'parallel', 'parent', 'park', 'parliament', 'part', 'participate',
  'particle', 'particular', 'partly', 'partner', 'party', 'pass', 'passage', 'passenger', 'passion', 'passive',
  'past', 'patch', 'path', 'patience', 'patient', 'pattern', 'pause', 'pay', 'payment', 'peace',
  'peaceful', 'peak', 'peasant', 'peculiar', 'peer', 'penalty', 'pension', 'perceive', 'percent', 'perfect',
  'perform', 'perhaps', 'period', 'permanent', 'permission', 'permit', 'persist', 'personal', 'personnel', 'perspective',
  'persuade', 'phase', 'phenomenon', 'philosophy', 'phone', 'photo', 'phrase', 'physical', 'pick', 'picture',
  'piece', 'pile', 'pilot', 'pioneer', 'pitch', 'place', 'plain', 'plan', 'planet', 'plant',
  'plastic', 'plate', 'platform', 'play', 'player', 'pleasant', 'pleasure', 'pledge', 'plenty', 'plot',
  'plus', 'pocket', 'poem', 'poet', 'poetry', 'point', 'poison', 'qualify', 'quality', 'quantity',
  'quarter', 'queen', 'race', 'racial', 'radical', 'rage', 'rail', 'rain', 'raise', 'range',
  'rank', 'rapid', 'rare', 'rate', 'rather', 'ratio', 'raw', 'reach', 'react', 'reaction',
  'read', 'reader', 'ready', 'real', 'realistic', 'reality', 'realize', 'really', 'realm', 'rear',
  'reason', 'reasonable', 'rebel', 'recall', 'receive', 'recent', 'recipe', 'recognize', 'recommend', 'record',
  'recover', 'recruit', 'reduce', 'refer', 'reference', 'reflect', 'reform', 'refuse', 'regard', 'regime',
  'region', 'register', 'regret', 'regular', 'regulate', 'reject', 'relate', 'relation', 'relative', 'relax',
  'release', 'relevant', 'reliable', 'relief', 'relieve', 'religion', 'religious', 'reluctant', 'rely', 'remain',
  'remark', 'remarkable', 'sacred', 'sacrifice', 'sad', 'safe', 'safety', 'sake', 'salary', 'sale',
  'salt', 'sample', 'satisfy', 'save', 'scale', 'scan', 'scandal', 'scarce', 'scene', 'schedule',
  'scheme', 'scholar', 'school', 'science', 'scientific', 'scientist', 'scope', 'score', 'scratch', 'screen',
  'sea', 'search', 'season', 'seat', 'secondary', 'secret', 'section', 'sector', 'secure', 'seek',
  'seem', 'seize', 'select', 'self', 'sell', 'senate', 'senator', 'send', 'senior', 'sense',
  'sensitive', 'sentence', 'separate', 'sequence', 'series', 'serious', 'servant', 'serve', 'service', 'session',
  'settle', 'settlement', 'severe', 'sex', 'shade', 'shadow', 'shake', 'shall', 'shame', 'shape',
  'share', 'sharp', 'shed', 'sheet', 'shelf', 'shell', 'shelter', 'shift', 'shine', 'ship',
  'shock', 'shoot', 'shop', 'shore', 'short', 'shot', 'shoulder', 'shout', 'show', 'shower',
  'shrink', 'shut', 'sick', 'sight', 'sign', 'signal', 'significant', 'silence', 'silent', 'silly',
  'silver', 'similar', 'simple', 'simply', 'sin', 'since', 'sincere', 'sing', 'single', 'sink',
  'site', 'situation', 'size', 'skill', 'skin', 'slave', 'sleep', 'slide', 'slight', 'slip',
  'slow', 'small', 'smart', 'smell', 'smile', 'smooth', 'snap', 'snow', 'social', 'society',
  'soft', 'software', 'soil', 'table', 'tackle', 'tail', 'take', 'tale', 'talent', 'talk',
  'tall', 'tank', 'tap', 'target', 'task', 'taste', 'tax', 'teach', 'team', 'tear',
  'technical', 'technique', 'technology', 'teenage', 'television', 'tell', 'temperature', 'temple', 'temporary', 'tend',
  'tendency', 'tender', 'tense', 'tension', 'tent', 'term', 'terrible', 'territory', 'terror', 'test',
  'testify', 'text', 'thank', 'theater', 'theme', 'theoretical', 'theory', 'therapy', 'therefore', 'thick',
  'thin', 'thing', 'think', 'third', 'thorough', 'though', 'thought', 'threat', 'threaten', 'thrive',
  'throat', 'throughout', 'throw', 'thus', 'ticket', 'tide', 'tie', 'ugly', 'ultimate', 'unable',
  'uncertain', 'uncle', 'undergo', 'underlying', 'understand', 'undertake', 'unemployment', 'unfold', 'unfortunate', 'uniform',
  'union', 'unique', 'unit', 'unite', 'unity', 'vacation', 'valid', 'valley', 'valuable', 'value',
  'van', 'vanish', 'variety', 'various', 'vary', 'vast', 'vegetable', 'vehicle', 'venture', 'venue',
  'version', 'versus', 'very', 'vessel', 'veteran', 'via', 'wage', 'wait', 'wake', 'walk',
  'wall', 'wander', 'want', 'war', 'warm', 'warn', 'warning', 'warrant', 'wash', 'waste',
  'watch', 'water', 'wave', 'way', 'weak', 'wealth', 'wealthy', 'weapon', 'wear', 'weather',
  'web', 'wedding', 'week', 'weekend', 'weigh', 'weight', 'welcome', 'welfare', 'west', 'western',
  'wet', 'wheel', 'whereas', 'wherever', 'whether', 'yard', 'year', 'yellow', 'yesterday', 'zone',
];

async function main() {
  console.log('Starting CSAT L1 word seed...');
  console.log(`Total words to process: ${CSAT_L1_WORDS.length}`);

  const examCategory: ExamCategory = 'CSAT';
  const level = 'L1';
  const difficulty = 'BASIC';

  // Get existing words
  const existingWords = await prisma.word.findMany({
    where: { word: { in: CSAT_L1_WORDS } },
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

  for (const wordText of CSAT_L1_WORDS) {
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
  console.log(`Total CSAT-L1 words in database: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
