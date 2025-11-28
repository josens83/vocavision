import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for the vocabulary learning assistant
const SYSTEM_PROMPT = `당신은 VocaVision의 AI 영어 학습 도우미입니다. 한국어 사용자를 위한 영어 단어 학습을 돕습니다.

역할:
- 영어 단어의 뜻, 발음, 예문을 친절하게 설명
- 효과적인 암기법(Mnemonics)과 어원(Etymology) 정보 제공
- 간격 반복 학습(Spaced Repetition) 팁 제공
- 재미있는 퀴즈와 학습 게임 진행
- 학습 동기부여와 격려

스타일:
- 친근하고 격려적인 톤 사용
- 이모지를 적절히 활용
- 복잡한 개념은 쉽게 풀어서 설명
- 마크다운 형식 사용 (볼드, 리스트 등)
- 답변 끝에 관련 추천 질문 제시

금지 사항:
- 학습과 무관한 주제 논의
- 부적절하거나 불쾌한 내용
- 틀린 정보 제공`;

// AI Response Generator using OpenAI GPT-4
const generateAIResponse = async (
  message: string,
  context?: string,
  wordId?: string,
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
): Promise<{
  content: string;
  suggestions?: string[];
  relatedWords?: { id: string; word: string; definition: string }[];
}> => {
  // Build context with word information if wordId is provided
  let wordContext = '';
  let relatedWords: { id: string; word: string; definition: string }[] = [];

  if (wordId) {
    try {
      const word = await prisma.word.findUnique({
        where: { id: wordId },
        include: {
          examples: true,
          mnemonics: true,
          etymology: true,
        },
      }) as any;

      if (word) {
        wordContext = `\n\n[현재 학습 중인 단어 정보]
단어: ${word.word}
뜻: ${word.definition}
발음: ${word.pronunciation || '정보 없음'}
품사: ${word.partOfSpeech || '정보 없음'}
난이도: ${word.difficulty || '정보 없음'}
${word.examples && word.examples.length > 0 ? `예문:\n${word.examples.slice(0, 3).map((ex: any) => `- "${ex.sentence}"${ex.translation ? ` (${ex.translation})` : ''}`).join('\n')}` : ''}
${word.mnemonics && word.mnemonics.length > 0 ? `암기법:\n${word.mnemonics.slice(0, 2).map((m: any) => `- ${m.content}`).join('\n')}` : ''}
${word.etymology ? `어원: ${word.etymology.origin}` : ''}`;

        relatedWords = [{ id: word.id, word: word.word, definition: word.definition }];
      }
    } catch (error) {
      console.error('Error fetching word:', error);
    }
  }

  // Search for words mentioned in the message
  const lowerMessage = message.toLowerCase();
  const wordMatch = message.match(/"([^"]+)"|'([^']+)'|「([^」]+)」|(\b[a-zA-Z]{3,}\b)/);
  const searchWord = wordMatch ? (wordMatch[1] || wordMatch[2] || wordMatch[3] || wordMatch[4]) : null;

  if (searchWord && !wordId) {
    try {
      const foundWord = await prisma.word.findFirst({
        where: {
          OR: [
            { word: { equals: searchWord, mode: 'insensitive' } },
            { word: { contains: searchWord, mode: 'insensitive' } },
          ],
        },
        include: { examples: true, mnemonics: true, etymology: true },
      }) as any;

      if (foundWord) {
        wordContext = `\n\n[데이터베이스에서 찾은 단어 정보]
단어: ${foundWord.word}
뜻: ${foundWord.definition}
발음: ${foundWord.pronunciation || '정보 없음'}
${foundWord.examples && foundWord.examples.length > 0 ? `예문: "${foundWord.examples[0].sentence}"` : ''}
${foundWord.mnemonics && foundWord.mnemonics.length > 0 ? `암기법: ${foundWord.mnemonics[0].content}` : ''}`;

        relatedWords = [{ id: foundWord.id, word: foundWord.word, definition: foundWord.definition }];
      }
    } catch (error) {
      console.error('Error searching word:', error);
    }
  }

  // Get random words for recommendations
  let recommendedWords: { id: string; word: string; definition: string }[] = [];
  if (lowerMessage.includes('추천') || lowerMessage.includes('오늘의 단어')) {
    try {
      const randomWords = await prisma.word.findMany({
        take: 5,
        skip: Math.floor(Math.random() * 50),
        select: { id: true, word: true, definition: true },
      });
      recommendedWords = randomWords;
      if (randomWords.length > 0) {
        wordContext += `\n\n[추천 단어 목록]
${randomWords.map((w, i) => `${i + 1}. ${w.word}: ${w.definition}`).join('\n')}`;
      }
    } catch (error) {
      console.error('Error fetching random words:', error);
    }
  }

  // Build messages array for OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT + wordContext },
  ];

  // Add conversation history if available
  if (conversationHistory && conversationHistory.length > 0) {
    // Keep only last 10 messages to avoid token limits
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current message
  messages.push({ role: 'user', content: message });

  try {
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiContent = completion.choices[0]?.message?.content || '죄송합니다. 응답을 생성하는 데 문제가 발생했습니다.';

    // Generate contextual suggestions
    let suggestions: string[] = [];
    if (relatedWords.length > 0) {
      suggestions = [
        `"${relatedWords[0].word}" 예문 더 보기`,
        `"${relatedWords[0].word}" 암기법 알려줘`,
        '비슷한 단어 추천해줘',
      ];
    } else if (recommendedWords.length > 0) {
      suggestions = recommendedWords.slice(0, 3).map(w => `"${w.word}" 자세히 알려줘`);
    } else {
      suggestions = [
        '오늘의 단어 추천해줘',
        '영어 공부 팁 알려줘',
        '단어 퀴즈 내줘',
      ];
    }

    return {
      content: aiContent,
      suggestions,
      relatedWords: relatedWords.length > 0 ? relatedWords : (recommendedWords.length > 0 ? recommendedWords.slice(0, 3) : undefined),
    };
  } catch (error: any) {
    console.error('OpenAI API Error:', error);

    // Fallback response when OpenAI is unavailable
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return {
        content: `⚠️ AI 서비스가 현재 구성되지 않았습니다.

관리자에게 OpenAI API 키 설정을 요청해주세요.

그동안 단어 학습, 플래시카드, 퀴즈 기능은 정상적으로 사용하실 수 있습니다!`,
        suggestions: ['단어 목록 보기', '퀴즈 풀기', '플래시카드 학습'],
      };
    }

    return {
      content: `죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.

오류 내용: ${error?.message || '알 수 없는 오류'}`,
      suggestions: ['다시 시도', '다른 질문하기'],
    };
  }
};

// Send a message and get AI response
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { message, conversationId, wordId, context, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '메시지를 입력해주세요.' });
    }

    // Generate AI response with conversation history
    const aiResponse = await generateAIResponse(message, context, wordId, history);

    // Optionally save to database (if you want server-side history)
    // For now, we rely on client-side storage

    res.json({
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: aiResponse.content,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      suggestions: aiResponse.suggestions,
      relatedWords: aiResponse.relatedWords,
    });
  } catch (error) {
    next(error);
  }
};

// Get quick suggestions
export const getSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { context } = req.query;

    let suggestions: string[];

    switch (context) {
      case 'word_help':
        suggestions = [
          '이 단어의 예문을 더 보여줘',
          '비슷한 단어를 알려줘',
          '암기법을 추천해줘',
          '발음을 어떻게 해요?',
        ];
        break;
      case 'quiz':
        suggestions = [
          '쉬운 퀴즈 내줘',
          '어려운 퀴즈 내줘',
          '힌트 주세요',
          '다른 문제 내줘',
        ];
        break;
      default:
        suggestions = [
          '오늘의 단어를 추천해줘',
          '영어 공부 팁을 알려줘',
          '단어 퀴즈 내줘',
          '학습 현황을 알려줘',
        ];
    }

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};

// Get word-specific help
export const getWordHelp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wordId } = req.params;
    const { helpType } = req.query;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        examples: true,
        mnemonics: true,
        images: true,
      },
    });

    if (!word) {
      return res.status(404).json({ error: '단어를 찾을 수 없습니다.' });
    }

    let content: string;

    switch (helpType) {
      case 'meaning':
        content = `**${word.word}**의 뜻은 "${word.definition}"입니다.`;
        break;
      case 'example':
        content = word.examples && word.examples.length > 0
          ? `**예문**:\n${word.examples.map((ex: any) => `- "${ex.sentence}"`).join('\n')}`
          : '아직 예문이 등록되지 않았어요.';
        break;
      case 'mnemonic':
        content = word.mnemonics && word.mnemonics.length > 0
          ? `**암기법**:\n${word.mnemonics.map((m: any) => m.content).join('\n\n')}`
          : '아직 암기법이 등록되지 않았어요. 직접 만들어보시겠어요?';
        break;
      case 'pronunciation':
        content = word.pronunciation
          ? `**${word.word}**의 발음은 ${word.pronunciation}입니다.`
          : '발음 정보가 없습니다.';
        break;
      default:
        content = `**${word.word}**: ${word.definition}`;
    }

    res.json({
      wordId: word.id,
      word: word.word,
      helpType,
      content,
    });
  } catch (error) {
    next(error);
  }
};

// Get conversation history (placeholder - uses client-side storage)
export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In this implementation, conversations are stored client-side
    // This endpoint can be used for server-side backup in the future
    res.json({
      conversations: [],
      message: '대화 기록은 로컬에 저장됩니다.',
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific conversation (placeholder)
export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    res.json({
      id: conversationId,
      messages: [],
      message: '대화 기록은 로컬에 저장됩니다.',
    });
  } catch (error) {
    next(error);
  }
};

// Delete a conversation (placeholder)
export const deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    res.json({
      success: true,
      message: '대화가 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};
