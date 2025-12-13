/**
 * Interactive Word Documentation API
 *
 * GET /api/words/[id]/interactive-doc
 * Fetches word data and transforms it into interactive learning format
 *
 * POST /api/words/[id]/interactive-doc
 * Saves step progress (optional, for analytics)
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Visual types from backend
type VisualType = 'CONCEPT' | 'MNEMONIC' | 'RHYME';

interface WordVisual {
  id: string;
  type: VisualType;
  labelEn?: string;
  labelKo?: string;
  captionEn?: string;
  captionKo?: string;
  imageUrl?: string;
  promptEn?: string;
  order: number;
}

interface WordData {
  id: string;
  word: string;
  definition: string;
  definitionKo?: string;
  pronunciation?: string;
  phonetic?: string;
  partOfSpeech: string;
  difficulty: string;
  tips?: string;
  prefix?: string;
  root?: string;
  suffix?: string;
  morphologyNote?: string;
  synonymList?: string[];
  antonymList?: string[];
  rhymingWords?: string[];
  audioUrlUs?: string;
  audioUrlUk?: string;
  examples?: Array<{
    id: string;
    sentence: string;
    translation?: string;
    highlight?: string;
  }>;
  images?: Array<{
    id: string;
    imageUrl: string;
    thumbnailUrl?: string;
    description?: string;
  }>;
  mnemonics?: Array<{
    id: string;
    title: string;
    content: string;
    koreanHint?: string;
    imageUrl?: string;
  }>;
  etymology?: {
    id: string;
    origin: string;
    rootWord?: string;
    rootMeaning?: string;
    evolution?: string;
  };
  collocations?: Array<{
    id: string;
    phrase: string;
    meaning?: string;
  }>;
  rhymes?: Array<{
    id: string;
    rhymingWord: string;
    similarity: number;
    example?: string;
  }>;
  visuals?: WordVisual[];
}

// Block types for interactive learning
type BlockType = 'text' | 'image' | 'video' | 'audio' | 'diagram' | 'example' | 'quiz' | 'exercise' | 'tip' | 'warning' | 'success';

interface ContentBlock {
  id: string;
  type: BlockType;
  content: any;
  metadata?: {
    title?: string;
    description?: string;
    hint?: string;
    required?: boolean;
  };
}

/**
 * Generate interactive learning steps from word data
 */
function generateLearningSteps(word: WordData, visuals: WordVisual[]) {
  const steps = [];

  // Step 1: Introduction
  const introBlocks: ContentBlock[] = [
    {
      id: 'intro-text',
      type: 'text',
      content: {
        text: `Let's learn the word "${word.word}". This ${word.partOfSpeech.toLowerCase()} means: ${word.definition}`,
      },
      metadata: {
        title: 'What does it mean?',
      },
    },
  ];

  // Add Korean definition if available
  if (word.definitionKo) {
    introBlocks.push({
      id: 'intro-korean',
      type: 'text',
      content: {
        text: `한국어 뜻: ${word.definitionKo}`,
      },
      metadata: {
        title: '한국어 의미',
      },
    });
  }

  // Add pronunciation audio if available
  if (word.audioUrlUs || word.audioUrlUk) {
    introBlocks.push({
      id: 'intro-pronunciation',
      type: 'audio',
      content: {
        url: word.audioUrlUs || word.audioUrlUk,
      },
      metadata: {
        title: `Pronunciation: ${word.pronunciation || word.phonetic || ''}`,
      },
    });
  } else if (word.pronunciation || word.phonetic) {
    introBlocks.push({
      id: 'intro-pronunciation-text',
      type: 'text',
      content: {
        text: `Pronunciation: ${word.pronunciation || word.phonetic}`,
      },
      metadata: {
        title: 'How to pronounce',
      },
    });
  }

  // Add tips if available
  if (word.tips) {
    introBlocks.push({
      id: 'intro-tip',
      type: 'tip',
      content: {
        text: word.tips,
      },
    });
  }

  steps.push({
    id: 'step-introduction',
    stepNumber: 1,
    type: 'introduction',
    title: 'Introduction',
    description: `Learn the basic meaning and pronunciation of "${word.word}"`,
    estimatedTime: 2,
    blocks: introBlocks,
  });

  // Step 2: Visualization
  const visualBlocks: ContentBlock[] = [];

  // Add visuals from WordVisual model (CONCEPT, MNEMONIC, RHYME)
  const conceptVisual = visuals.find((v) => v.type === 'CONCEPT');
  const mnemonicVisual = visuals.find((v) => v.type === 'MNEMONIC');
  const rhymeVisual = visuals.find((v) => v.type === 'RHYME');

  if (conceptVisual?.imageUrl) {
    visualBlocks.push({
      id: 'visual-concept',
      type: 'image',
      content: {
        url: conceptVisual.imageUrl,
        alt: conceptVisual.labelEn || `Concept image for ${word.word}`,
        caption: conceptVisual.captionKo || conceptVisual.captionEn || '의미를 시각화한 이미지',
      },
      metadata: {
        title: conceptVisual.labelKo || '의미 이미지',
      },
    });
  }

  if (mnemonicVisual?.imageUrl) {
    visualBlocks.push({
      id: 'visual-mnemonic',
      type: 'image',
      content: {
        url: mnemonicVisual.imageUrl,
        alt: mnemonicVisual.labelEn || `Mnemonic image for ${word.word}`,
        caption: mnemonicVisual.captionKo || mnemonicVisual.captionEn || '연상 기억법 이미지',
      },
      metadata: {
        title: mnemonicVisual.labelKo || '연상 이미지',
      },
    });
  }

  if (rhymeVisual?.imageUrl) {
    visualBlocks.push({
      id: 'visual-rhyme',
      type: 'image',
      content: {
        url: rhymeVisual.imageUrl,
        alt: rhymeVisual.labelEn || `Rhyme image for ${word.word}`,
        caption: rhymeVisual.captionKo || rhymeVisual.captionEn || '라이밍 기억법 이미지',
      },
      metadata: {
        title: rhymeVisual.labelKo || '라이밍 이미지',
      },
    });
  }

  // Fallback to legacy WordImage if no visuals
  if (visualBlocks.length === 0 && word.images && word.images.length > 0) {
    word.images.forEach((img, idx) => {
      visualBlocks.push({
        id: `visual-legacy-${idx}`,
        type: 'image',
        content: {
          url: img.imageUrl,
          alt: img.description || `Image ${idx + 1} for ${word.word}`,
          caption: img.description,
        },
      });
    });
  }

  // Add mnemonic text if available
  if (word.mnemonics && word.mnemonics.length > 0) {
    const mnemonic = word.mnemonics[0];
    visualBlocks.push({
      id: 'visual-mnemonic-text',
      type: 'tip',
      content: {
        text: `${mnemonic.title}: ${mnemonic.content}${mnemonic.koreanHint ? `\n\n한국어 힌트: ${mnemonic.koreanHint}` : ''}`,
      },
      metadata: {
        title: 'Memory Trick',
      },
    });
  }

  // Add etymology if available
  if (word.etymology) {
    visualBlocks.push({
      id: 'visual-etymology',
      type: 'text',
      content: {
        text: `Origin: ${word.etymology.origin}${word.etymology.rootWord ? `\nRoot: ${word.etymology.rootWord} (${word.etymology.rootMeaning || ''})` : ''}${word.etymology.evolution ? `\nEvolution: ${word.etymology.evolution}` : ''}`,
      },
      metadata: {
        title: 'Word Origin',
      },
    });
  }

  // Add morphology analysis if available
  if (word.prefix || word.root || word.suffix) {
    const parts = [];
    if (word.prefix) parts.push(`Prefix: ${word.prefix}`);
    if (word.root) parts.push(`Root: ${word.root}`);
    if (word.suffix) parts.push(`Suffix: ${word.suffix}`);

    visualBlocks.push({
      id: 'visual-morphology',
      type: 'text',
      content: {
        text: parts.join(' | ') + (word.morphologyNote ? `\n${word.morphologyNote}` : ''),
      },
      metadata: {
        title: 'Word Structure',
      },
    });
  }

  // Default visualization if nothing else
  if (visualBlocks.length === 0) {
    visualBlocks.push({
      id: 'visual-placeholder',
      type: 'text',
      content: {
        text: `Visualize the word "${word.word}" in your mind. Think of a scene or image that represents its meaning: "${word.definition}"`,
      },
      metadata: {
        title: 'Mental Visualization',
      },
    });
  }

  steps.push({
    id: 'step-visualization',
    stepNumber: 2,
    type: 'visualization',
    title: 'Visual Learning',
    description: 'Connect the word with visual memory aids',
    estimatedTime: 3,
    blocks: visualBlocks,
  });

  // Step 3: Context (Examples)
  const contextBlocks: ContentBlock[] = [];

  if (word.examples && word.examples.length > 0) {
    word.examples.slice(0, 5).forEach((example, idx) => {
      contextBlocks.push({
        id: `context-example-${idx}`,
        type: 'example',
        content: {
          sentence: example.sentence,
          translation: example.translation,
          highlight: example.highlight || word.word,
        },
      });
    });
  }

  // Add collocations if available
  if (word.collocations && word.collocations.length > 0) {
    const collocText = word.collocations
      .slice(0, 5)
      .map((c) => `• ${c.phrase}${c.meaning ? ` - ${c.meaning}` : ''}`)
      .join('\n');

    contextBlocks.push({
      id: 'context-collocations',
      type: 'text',
      content: {
        text: collocText,
      },
      metadata: {
        title: 'Common Combinations',
      },
    });
  }

  // Add synonyms/antonyms if available
  if (word.synonymList && word.synonymList.length > 0) {
    contextBlocks.push({
      id: 'context-synonyms',
      type: 'text',
      content: {
        text: `Similar words: ${word.synonymList.slice(0, 5).join(', ')}`,
      },
      metadata: {
        title: 'Synonyms',
      },
    });
  }

  if (word.antonymList && word.antonymList.length > 0) {
    contextBlocks.push({
      id: 'context-antonyms',
      type: 'text',
      content: {
        text: `Opposite words: ${word.antonymList.slice(0, 5).join(', ')}`,
      },
      metadata: {
        title: 'Antonyms',
      },
    });
  }

  // Default if no examples
  if (contextBlocks.length === 0) {
    contextBlocks.push({
      id: 'context-create',
      type: 'exercise',
      content: {
        prompt: `Create your own sentence using "${word.word}":`,
        sampleAnswer: `The word "${word.word}" can be used to describe ${word.definition.toLowerCase()}.`,
      },
    });
  }

  steps.push({
    id: 'step-context',
    stepNumber: 3,
    type: 'context',
    title: 'Usage in Context',
    description: 'See how the word is used in real sentences',
    estimatedTime: 3,
    blocks: contextBlocks,
  });

  // Step 4: Practice
  const practiceBlocks: ContentBlock[] = [];

  // Quiz: Definition matching
  practiceBlocks.push({
    id: 'practice-quiz-1',
    type: 'quiz',
    content: {
      question: `What does "${word.word}" mean?`,
      options: generateQuizOptions(word.definition),
      correctIndex: 0,
      explanation: `Correct! "${word.word}" means: ${word.definition}`,
    },
  });

  // Exercise: Create a sentence
  practiceBlocks.push({
    id: 'practice-exercise-1',
    type: 'exercise',
    content: {
      prompt: `Write a sentence using "${word.word}":`,
      sampleAnswer:
        word.examples && word.examples.length > 0
          ? word.examples[0].sentence
          : `Example: The ${word.word} was evident in the situation.`,
    },
  });

  // Rhyming exercise if available
  if (word.rhymingWords && word.rhymingWords.length > 0) {
    practiceBlocks.push({
      id: 'practice-rhyme',
      type: 'tip',
      content: {
        text: `Rhyming words: ${word.rhymingWords.slice(0, 5).join(', ')}\n\nTry creating a rhyme or phrase to remember!`,
      },
      metadata: {
        title: 'Rhyming Memory Aid',
      },
    });
  }

  steps.push({
    id: 'step-practice',
    stepNumber: 4,
    type: 'practice',
    title: 'Practice',
    description: 'Test your understanding with exercises',
    estimatedTime: 4,
    blocks: practiceBlocks,
  });

  // Step 5: Mastery
  const masteryBlocks: ContentBlock[] = [
    {
      id: 'mastery-summary',
      type: 'success',
      content: {
        text: `You've learned "${word.word}" (${word.partOfSpeech})\n\nMeaning: ${word.definition}${word.definitionKo ? `\n한국어: ${word.definitionKo}` : ''}`,
      },
    },
    {
      id: 'mastery-quiz',
      type: 'quiz',
      content: {
        question: `Final check: Which of the following best describes "${word.word}"?`,
        options: generateFinalQuizOptions(word),
        correctIndex: 0,
        explanation: `Excellent! You've mastered the word "${word.word}"!`,
      },
    },
  ];

  steps.push({
    id: 'step-mastery',
    stepNumber: 5,
    type: 'mastery',
    title: 'Mastery Check',
    description: 'Confirm your understanding and complete the lesson',
    estimatedTime: 2,
    blocks: masteryBlocks,
  });

  return steps;
}

/**
 * Generate quiz options (correct answer first, then distractors)
 */
function generateQuizOptions(correctDefinition: string): string[] {
  const distractors = [
    'To increase rapidly in number',
    'A type of musical instrument',
    'Related to ancient history',
    'A method of transportation',
    'A feeling of great happiness',
    'To speak loudly and clearly',
    'A small amount of something',
    'Connected to technology',
  ];

  // Shuffle and pick 3 distractors
  const shuffled = distractors.sort(() => Math.random() - 0.5).slice(0, 3);

  return [correctDefinition, ...shuffled];
}

/**
 * Generate final quiz options based on word data
 */
function generateFinalQuizOptions(word: WordData): string[] {
  const correct = `${word.partOfSpeech}: ${word.definition}`;

  const wrongPOS = [
    'NOUN',
    'VERB',
    'ADJECTIVE',
    'ADVERB',
  ].filter((pos) => pos !== word.partOfSpeech);

  const distractors = wrongPOS.slice(0, 3).map((pos) => {
    const wrongDefs = [
      'A type of container used for storage',
      'The act of moving quickly through water',
      'Relating to extreme cold temperatures',
    ];
    return `${pos}: ${wrongDefs[Math.floor(Math.random() * wrongDefs.length)]}`;
  });

  return [correct, ...distractors];
}

/**
 * GET handler - Fetch word data and generate interactive doc
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wordId = params.id;

    // Fetch word with visuals from public endpoint (no auth required)
    const wordResponse = await fetch(`${API_URL}/words/${wordId}/with-visuals`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!wordResponse.ok) {
      if (wordResponse.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Word not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend returned ${wordResponse.status}`);
    }

    const wordResult = await wordResponse.json();
    const word: WordData = wordResult.word;

    // Visuals are included in the word object from with-visuals response
    let visuals: WordVisual[] = word.visuals || [];

    // Generate learning steps
    const steps = generateLearningSteps(word, visuals);

    // Calculate total estimated time
    const totalEstimatedTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);

    const interactiveDoc = {
      wordId: word.id,
      word: word.word,
      definition: word.definition,
      steps,
      totalEstimatedTime,
    };

    return NextResponse.json({
      success: true,
      data: interactiveDoc,
    });
  } catch (error) {
    console.error('Error generating interactive doc:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to generate interactive documentation',
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Save step progress (optional analytics)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { stepId, timeSpent, interactions, score, completed } = body;

    // Log progress (could be saved to database for analytics)
    console.log('Step progress:', {
      wordId: params.id,
      stepId,
      timeSpent,
      interactions,
      score,
      completed,
    });

    // For now, just acknowledge receipt
    return NextResponse.json({
      success: true,
      message: 'Progress saved',
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}
