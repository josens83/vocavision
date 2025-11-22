/**
 * Interactive Word Documentation Generator
 *
 * Generates n8n-style interactive learning documentation for words.
 * Creates 5 structured learning steps with interactive content blocks.
 *
 * @module lib/learning/interactiveDocGenerator
 */

import type {
  InteractiveWordDocData,
  LearningStep,
  ContentBlock,
  StepType,
  BlockType,
} from '@/components/learning/InteractiveWordDoc';

/**
 * Word data interface
 */
export interface WordData {
  id: string;
  word: string;
  definition: string;
  pronunciation?: string;
  phonetic?: string;
  partOfSpeech: string;
  difficulty: string;
  examples?: Array<{
    sentence: string;
    translation?: string;
  }>;
  images?: Array<{
    imageUrl: string;
    description?: string;
  }>;
  videos?: Array<{
    videoUrl: string;
    caption?: string;
  }>;
  etymology?: {
    origin: string;
    rootWords?: string[];
    evolution?: string;
    relatedWords?: string[];
  };
  synonyms?: Array<{
    synonym: string;
    nuance?: string;
  }>;
  antonyms?: Array<{
    antonym: string;
    explanation?: string;
  }>;
  mnemonics?: Array<{
    title: string;
    content: string;
    koreanHint?: string;
  }>;
}

/**
 * Generate interactive word documentation from word data
 */
export function generateInteractiveWordDoc(wordData: WordData): InteractiveWordDocData {
  const steps: LearningStep[] = [
    generateIntroductionStep(wordData),
    generateVisualizationStep(wordData),
    generateContextStep(wordData),
    generatePracticeStep(wordData),
    generateMasteryStep(wordData),
  ];

  const totalEstimatedTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);

  return {
    wordId: wordData.id,
    word: wordData.word,
    definition: wordData.definition,
    steps,
    totalEstimatedTime,
  };
}

/**
 * Step 1: Introduction
 * Basic introduction to the word with pronunciation, definition, and part of speech
 */
function generateIntroductionStep(wordData: WordData): LearningStep {
  const blocks: ContentBlock[] = [];

  // Welcome text
  blocks.push({
    id: `intro-welcome`,
    type: 'text',
    content: {
      text: `Welcome to the interactive learning journey for "${wordData.word}"! In this step-by-step guide, you'll master this word through visualization, context, and practice.`,
    },
    metadata: {
      title: '👋 Welcome',
    },
  });

  // Pronunciation
  if (wordData.pronunciation || wordData.phonetic) {
    blocks.push({
      id: `intro-pronunciation`,
      type: 'text',
      content: {
        text: `**Pronunciation**: ${wordData.pronunciation || wordData.phonetic}\n\n**Part of Speech**: ${wordData.partOfSpeech}`,
      },
      metadata: {
        title: '🗣️ How to Say It',
      },
    });
  }

  // Definition
  blocks.push({
    id: `intro-definition`,
    type: 'text',
    content: {
      text: wordData.definition,
    },
    metadata: {
      title: '📖 Definition',
      description: 'The core meaning of this word',
    },
  });

  // Difficulty level tip
  const difficultyTips = {
    BEGINNER: 'This is a foundational word. Focus on basic understanding and common usage.',
    INTERMEDIATE: 'This word requires some context. Pay attention to how it\'s used in different situations.',
    ADVANCED: 'This is a sophisticated word. Notice the nuances in meaning and usage.',
    EXPERT: 'This is an advanced-level word. Study the etymology and subtle contextual differences.',
  };

  blocks.push({
    id: `intro-difficulty-tip`,
    type: 'tip',
    content: {
      text: difficultyTips[wordData.difficulty as keyof typeof difficultyTips] || difficultyTips.INTERMEDIATE,
    },
  });

  // Learning objectives
  blocks.push({
    id: `intro-objectives`,
    type: 'success',
    content: {
      text: `By the end of this guide, you will:\n• Understand the meaning and pronunciation\n• Recognize it in context\n• Use it correctly in sentences\n• Remember it long-term`,
    },
  });

  return {
    id: 'step-introduction',
    stepNumber: 1,
    type: 'introduction',
    title: 'Introduction',
    description: `Learn the basics of "${wordData.word}"`,
    estimatedTime: 2,
    blocks,
    completionCriteria: {
      minTimeSpent: 30,
    },
  };
}

/**
 * Step 2: Visualization
 * Visual learning with images, etymology, and memory aids
 */
function generateVisualizationStep(wordData: WordData): LearningStep {
  const blocks: ContentBlock[] = [];

  // Introduction
  blocks.push({
    id: `viz-intro`,
    type: 'text',
    content: {
      text: `Let's visualize "${wordData.word}" to create a lasting mental image. Visual learning helps you remember words 3x better than text alone.`,
    },
    metadata: {
      title: '🎨 Visual Learning',
    },
  });

  // Images
  if (wordData.images && wordData.images.length > 0) {
    wordData.images.forEach((image, index) => {
      blocks.push({
        id: `viz-image-${index}`,
        type: 'image',
        content: {
          url: image.imageUrl,
          alt: `${wordData.word} - visual representation ${index + 1}`,
          caption: image.description || `Visual representation of "${wordData.word}"`,
        },
      });
    });
  } else {
    // Placeholder image block
    blocks.push({
      id: `viz-diagram`,
      type: 'diagram',
      content: {
        type: 'word-concept-map',
        centerWord: wordData.word,
      },
      metadata: {
        title: 'Concept Map',
        description: 'Visual representation of word relationships',
      },
    });
  }

  // Etymology (if available)
  if (wordData.etymology) {
    blocks.push({
      id: `viz-etymology`,
      type: 'text',
      content: {
        text: `**Origin**: ${wordData.etymology.origin}${
          wordData.etymology.evolution ? `\n\n**Evolution**: ${wordData.etymology.evolution}` : ''
        }${
          wordData.etymology.rootWords && wordData.etymology.rootWords.length > 0
            ? `\n\n**Root Words**: ${wordData.etymology.rootWords.join(', ')}`
            : ''
        }`,
      },
      metadata: {
        title: '📜 Etymology',
        description: 'Understanding the word\'s historical origins',
      },
    });
  }

  // Mnemonics
  if (wordData.mnemonics && wordData.mnemonics.length > 0) {
    const bestMnemonic = wordData.mnemonics[0];
    blocks.push({
      id: `viz-mnemonic`,
      type: 'text',
      content: {
        text: `**${bestMnemonic.title}**\n\n${bestMnemonic.content}${
          bestMnemonic.koreanHint ? `\n\n💡 **Korean Hint**: ${bestMnemonic.koreanHint}` : ''
        }`,
      },
      metadata: {
        title: '🧠 Memory Aid',
        description: 'A clever way to remember this word',
      },
    });
  }

  // Tip for visualization
  blocks.push({
    id: `viz-tip`,
    type: 'tip',
    content: {
      text: 'Take a moment to create your own mental image. What picture comes to mind when you hear this word? The more vivid and personal, the better you\'ll remember it!',
    },
  });

  return {
    id: 'step-visualization',
    stepNumber: 2,
    type: 'visualization',
    title: 'Visualization',
    description: 'See and remember the word visually',
    estimatedTime: 3,
    blocks,
    completionCriteria: {
      minTimeSpent: 45,
      requiredInteractions: 1,
    },
  };
}

/**
 * Step 3: Context
 * Understanding usage through examples, synonyms, and antonyms
 */
function generateContextStep(wordData: WordData): LearningStep {
  const blocks: ContentBlock[] = [];

  // Introduction
  blocks.push({
    id: `context-intro`,
    type: 'text',
    content: {
      text: `Now let's see "${wordData.word}" in action. Understanding context is key to using words correctly and naturally.`,
    },
    metadata: {
      title: '💡 Context & Usage',
    },
  });

  // Examples
  if (wordData.examples && wordData.examples.length > 0) {
    wordData.examples.forEach((example, index) => {
      blocks.push({
        id: `context-example-${index}`,
        type: 'example',
        content: {
          sentence: example.sentence,
          translation: example.translation,
        },
      });
    });
  } else {
    // Generate a sample example
    blocks.push({
      id: `context-example-0`,
      type: 'example',
      content: {
        sentence: `The ${wordData.word} was clearly evident in the situation.`,
        translation: `그 상황에서 ${wordData.word}는 명백히 드러났다.`,
      },
    });
  }

  // Synonyms
  if (wordData.synonyms && wordData.synonyms.length > 0) {
    const synonymsText = wordData.synonyms
      .map((syn) => `• **${syn.synonym}**${syn.nuance ? `: ${syn.nuance}` : ''}`)
      .join('\n');

    blocks.push({
      id: `context-synonyms`,
      type: 'text',
      content: {
        text: `**Similar words (Synonyms)**:\n\n${synonymsText}`,
      },
      metadata: {
        title: '🔄 Synonyms',
        description: 'Words with similar meanings',
      },
    });
  }

  // Antonyms
  if (wordData.antonyms && wordData.antonyms.length > 0) {
    const antonymsText = wordData.antonyms
      .map((ant) => `• **${ant.antonym}**${ant.explanation ? `: ${ant.explanation}` : ''}`)
      .join('\n');

    blocks.push({
      id: `context-antonyms`,
      type: 'text',
      content: {
        text: `**Opposite words (Antonyms)**:\n\n${antonymsText}`,
      },
      metadata: {
        title: '↔️ Antonyms',
        description: 'Words with opposite meanings',
      },
    });
  }

  // Context quiz
  blocks.push({
    id: `context-quiz`,
    type: 'quiz',
    content: {
      question: `Which sentence uses "${wordData.word}" correctly?`,
      options: wordData.examples
        ? [
            wordData.examples[0]?.sentence || 'Sample sentence 1',
            'This is an incorrect usage example.',
            'Another wrong example here.',
            wordData.examples[1]?.sentence || 'Another correct usage',
          ]
        : [
            `The ${wordData.word} was clearly evident.`,
            'This is incorrect usage.',
            'This does not fit.',
            'Wrong example here.',
          ],
      correctIndex: 0,
      explanation: `Notice how the word fits naturally in the context. ${
        wordData.examples?.[0]?.translation || ''
      }`,
    },
  });

  return {
    id: 'step-context',
    stepNumber: 3,
    type: 'context',
    title: 'Context & Usage',
    description: 'See how to use the word in real situations',
    estimatedTime: 4,
    blocks,
    completionCriteria: {
      minTimeSpent: 60,
      requiredInteractions: 1,
    },
  };
}

/**
 * Step 4: Practice
 * Interactive exercises to reinforce learning
 */
function generatePracticeStep(wordData: WordData): LearningStep {
  const blocks: ContentBlock[] = [];

  // Introduction
  blocks.push({
    id: `practice-intro`,
    type: 'text',
    content: {
      text: `Time to practice! Active usage is the best way to make "${wordData.word}" stick in your memory. Let's create some sentences together.`,
    },
    metadata: {
      title: '✏️ Practice Time',
    },
  });

  // Fill-in-the-blank quiz
  blocks.push({
    id: `practice-fill-blank`,
    type: 'quiz',
    content: {
      question: `Fill in the blank: "The _____ of the situation was immediately apparent."`,
      options: [
        wordData.word,
        wordData.synonyms?.[0]?.synonym || 'wrong',
        'incorrect',
        'not-this-one',
      ],
      correctIndex: 0,
      explanation: `Correct! "${wordData.word}" fits perfectly in this context.`,
    },
  });

  // Sentence creation exercise
  blocks.push({
    id: `practice-sentence`,
    type: 'exercise',
    content: {
      prompt: `Create your own sentence using "${wordData.word}". Make it personal and memorable!`,
      sampleAnswer: wordData.examples?.[0]?.sentence || `The ${wordData.word} was remarkable.`,
    },
  });

  // Multiple choice - synonym identification
  if (wordData.synonyms && wordData.synonyms.length > 0) {
    blocks.push({
      id: `practice-synonym-quiz`,
      type: 'quiz',
      content: {
        question: `Which word is a synonym of "${wordData.word}"?`,
        options: [
          wordData.synonyms[0].synonym,
          'completely-wrong',
          'not-related',
          'unrelated-word',
        ],
        correctIndex: 0,
        explanation: `Yes! "${wordData.synonyms[0].synonym}" has a similar meaning to "${wordData.word}".`,
      },
    });
  }

  // Usage tip
  blocks.push({
    id: `practice-tip`,
    type: 'tip',
    content: {
      text: `Pro tip: Use "${wordData.word}" in conversation today. Try to use it at least 3 times in the next 24 hours. Repetition in different contexts solidifies memory!`,
    },
  });

  // Warning about common mistakes
  blocks.push({
    id: `practice-warning`,
    type: 'warning',
    content: {
      text: `Common mistake: Don't confuse "${wordData.word}" with similar-sounding words. Always check the context to ensure proper usage.`,
    },
  });

  return {
    id: 'step-practice',
    stepNumber: 4,
    type: 'practice',
    title: 'Practice',
    description: 'Apply what you learned through exercises',
    estimatedTime: 5,
    blocks,
    completionCriteria: {
      minTimeSpent: 90,
      requiredInteractions: 3,
      quizScore: 75,
    },
  };
}

/**
 * Step 5: Mastery
 * Final test and summary
 */
function generateMasteryStep(wordData: WordData): LearningStep {
  const blocks: ContentBlock[] = [];

  // Introduction
  blocks.push({
    id: `mastery-intro`,
    type: 'text',
    content: {
      text: `Congratulations on reaching the final step! Let's test your mastery of "${wordData.word}" and review what you've learned.`,
    },
    metadata: {
      title: '🏆 Mastery Test',
    },
  });

  // Definition recall quiz
  blocks.push({
    id: `mastery-definition-quiz`,
    type: 'quiz',
    content: {
      question: `What is the definition of "${wordData.word}"?`,
      options: [
        wordData.definition,
        'A completely different definition',
        'This is not the right meaning',
        'Another wrong definition',
      ],
      correctIndex: 0,
      explanation: `Perfect! You remember the definition accurately.`,
    },
  });

  // Context usage quiz
  blocks.push({
    id: `mastery-usage-quiz`,
    type: 'quiz',
    content: {
      question: `Which scenario best demonstrates the use of "${wordData.word}"?`,
      options: wordData.examples
        ? [
            wordData.examples[0]?.sentence || 'Correct usage example',
            'Incorrect context',
            'Wrong usage',
            'Not appropriate',
          ]
        : ['Correct usage', 'Wrong usage 1', 'Wrong usage 2', 'Wrong usage 3'],
      correctIndex: 0,
      explanation: 'Excellent! You understand how to use this word in context.',
    },
  });

  // Final exercise
  blocks.push({
    id: `mastery-final-exercise`,
    type: 'exercise',
    content: {
      prompt: `Final challenge: Write a short paragraph (3-4 sentences) that includes "${wordData.word}" and shows you understand its meaning. Be creative!`,
      sampleAnswer: `Here's an example:\n\n${
        wordData.examples?.[0]?.sentence || `The ${wordData.word} was evident.`
      } ${
        wordData.examples?.[1]?.sentence || 'It made a lasting impression.'
      } Understanding this word has enriched my vocabulary significantly.`,
    },
  });

  // Summary
  blocks.push({
    id: `mastery-summary`,
    type: 'success',
    content: {
      text: `🎉 **You've mastered "${wordData.word}"!**\n\n**Key Takeaways**:\n• Definition: ${
        wordData.definition
      }\n• Part of Speech: ${wordData.partOfSpeech}\n• Difficulty: ${wordData.difficulty}${
        wordData.synonyms && wordData.synonyms.length > 0
          ? `\n• Key Synonym: ${wordData.synonyms[0].synonym}`
          : ''
      }\n\nKeep practicing to maintain your mastery!`,
    },
  });

  // Next steps
  blocks.push({
    id: `mastery-next-steps`,
    type: 'tip',
    content: {
      text: `**Next Steps**:\n1. Review this word again in 24 hours\n2. Use it in conversation or writing\n3. Teach it to someone else\n4. Add it to your flashcard deck for spaced repetition`,
    },
  });

  return {
    id: 'step-mastery',
    stepNumber: 5,
    type: 'mastery',
    title: 'Mastery Test',
    description: 'Prove you have mastered the word',
    estimatedTime: 6,
    blocks,
    completionCriteria: {
      minTimeSpent: 120,
      requiredInteractions: 3,
      quizScore: 100,
    },
  };
}

/**
 * Get sample interactive word documentation
 * (for testing/demo purposes)
 */
export function getSampleInteractiveWordDoc(): InteractiveWordDocData {
  const sampleWordData: WordData = {
    id: 'word_sample_123',
    word: 'ephemeral',
    definition: 'Lasting for a very short time; transient',
    pronunciation: '/ɪˈfɛm(ə)r(ə)l/',
    phonetic: 'ih-FEM-er-uhl',
    partOfSpeech: 'adjective',
    difficulty: 'ADVANCED',
    examples: [
      {
        sentence: 'The beauty of cherry blossoms is ephemeral, lasting only a few weeks.',
        translation: '벚꽃의 아름다움은 일시적이며, 단지 몇 주만 지속됩니다.',
      },
      {
        sentence: 'Social media fame can be quite ephemeral in nature.',
        translation: '소셜 미디어 명성은 본질적으로 매우 일시적일 수 있습니다.',
      },
    ],
    etymology: {
      origin: 'From Greek "ephēmeros" meaning "lasting only a day"',
      rootWords: ['epi (upon)', 'hēmera (day)'],
      evolution: 'Originally used in biology to describe short-lived organisms',
      relatedWords: ['ephemera', 'ephemerality', 'ephemerid'],
    },
    synonyms: [
      { synonym: 'transient', nuance: 'Emphasizes passing through' },
      { synonym: 'fleeting', nuance: 'Suggests quick disappearance' },
      { synonym: 'momentary', nuance: 'Lasting just a moment' },
    ],
    antonyms: [
      { antonym: 'permanent', explanation: 'Lasting indefinitely' },
      { antonym: 'eternal', explanation: 'Lasting forever' },
    ],
    mnemonics: [
      {
        title: 'Ephemeral = E-for-a-day',
        content: 'Think "E" for "ephemeral" = "E" for "ending quickly". Imagine something that exists for just "one day" like a mayfly.',
        koreanHint: '"이페메랄"을 "일일(one day)" 연상: 하루만 사는 하루살이처럼 짧은 것',
      },
    ],
  };

  return generateInteractiveWordDoc(sampleWordData);
}

/**
 * Export type definitions
 */
export type { WordData };
