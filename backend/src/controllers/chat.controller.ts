import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// AI Response Generator - Mock implementation
// In production, this would integrate with OpenAI, Claude, or other LLM APIs
const generateAIResponse = async (
  message: string,
  context?: string,
  wordId?: string
): Promise<{
  content: string;
  suggestions?: string[];
  relatedWords?: { id: string; word: string; definition: string }[];
}> => {
  const lowerMessage = message.toLowerCase();

  // Word-specific context
  if (wordId) {
    try {
      const word = await prisma.word.findUnique({
        where: { id: wordId },
        include: {
          examples: true,
          mnemonics: true,
        },
      });

      if (word) {
        return {
          content: `"${word.word}"에 대해 알려드릴게요!

**뜻**: ${word.definition}
${word.pronunciation ? `**발음**: ${word.pronunciation}` : ''}
${word.partOfSpeech ? `**품사**: ${word.partOfSpeech}` : ''}

${word.examples && word.examples.length > 0 ? `**예문**:
${word.examples.slice(0, 2).map((ex: any) => `- "${ex.sentence}"${ex.translation ? ` (${ex.translation})` : ''}`).join('\n')}` : ''}

${word.mnemonics && word.mnemonics.length > 0 ? `**암기법**:
${word.mnemonics[0].content}` : ''}

더 궁금한 점이 있으시면 물어봐주세요!`,
          suggestions: [
            `"${word.word}" 예문 더 보기`,
            `"${word.word}" 관련 단어`,
            '다른 단어 검색하기',
          ],
        };
      }
    } catch (error) {
      console.error('Error fetching word:', error);
    }
  }

  // General responses based on message content
  if (lowerMessage.includes('추천') || lowerMessage.includes('오늘의 단어')) {
    const randomWords = await prisma.word.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, word: true, definition: true },
    });

    return {
      content: `오늘의 추천 단어입니다! 📚

${randomWords.map((w, i) => `${i + 1}. **${w.word}**: ${w.definition}`).join('\n\n')}

어떤 단어를 먼저 학습해볼까요?`,
      suggestions: randomWords.map((w) => `"${w.word}" 자세히 보기`),
      relatedWords: randomWords,
    };
  }

  if (lowerMessage.includes('팁') || lowerMessage.includes('방법') || lowerMessage.includes('어떻게')) {
    return {
      content: `효과적인 영어 단어 학습 팁을 알려드릴게요! 🎯

1. **간격 반복 학습 (Spaced Repetition)**
   복습 주기를 점점 늘려가며 학습하세요. VocaVision의 플래시카드가 이 방법을 사용합니다!

2. **연상 기억법 (Mnemonics)**
   단어와 관련된 이미지나 이야기를 만들어보세요. 커뮤니티 암기법을 참고해보세요!

3. **문맥 속 학습**
   예문과 함께 단어를 외우세요. 직접 문장을 만들어보면 더 효과적이에요.

4. **하루 목표 설정**
   매일 5-10개의 새 단어를 목표로 하세요. 꾸준함이 가장 중요합니다!

5. **어원 학습**
   단어의 어원을 알면 파생어까지 쉽게 외울 수 있어요.

어떤 방법에 대해 더 알고 싶으신가요?`,
      suggestions: [
        '간격 반복 학습이 뭐예요?',
        '암기법 예시 보여주세요',
        '오늘부터 학습 시작하기',
      ],
    };
  }

  if (lowerMessage.includes('퀴즈') || lowerMessage.includes('테스트')) {
    const randomWord = await prisma.word.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true, word: true, definition: true },
    });

    if (randomWord) {
      return {
        content: `좋아요! 간단한 퀴즈를 내볼게요! 🧠

다음 단어의 뜻은 무엇일까요?

**"${randomWord.word}"**

잠시 생각해보시고, 답을 말씀해주세요!

힌트가 필요하시면 "힌트"라고 말씀해주세요.`,
        suggestions: ['힌트 주세요', '정답 알려주세요', '다른 퀴즈 내줘'],
      };
    }
  }

  if (lowerMessage.includes('뜻') || lowerMessage.includes('의미') || lowerMessage.includes('무슨')) {
    // Extract word from quotes or common patterns
    const wordMatch = message.match(/"([^"]+)"|'([^']+)'|「([^」]+)」|(\w+)(?:의 뜻| 뜻| 의미| 무슨)/);
    const searchWord = wordMatch ? (wordMatch[1] || wordMatch[2] || wordMatch[3] || wordMatch[4]) : null;

    if (searchWord) {
      const word = await prisma.word.findFirst({
        where: {
          OR: [
            { word: { contains: searchWord, mode: 'insensitive' } },
            { word: { equals: searchWord, mode: 'insensitive' } },
          ],
        },
        include: { examples: true },
      });

      if (word) {
        return {
          content: `"${word.word}"의 뜻을 알려드릴게요! 📖

**뜻**: ${word.definition}
${word.pronunciation ? `**발음**: ${word.pronunciation}` : ''}

${word.examples && word.examples.length > 0 ? `**예문**: "${word.examples[0].sentence}"` : ''}

이 단어를 학습 목록에 추가하시겠어요?`,
          suggestions: [`"${word.word}" 더 자세히`, '학습 목록에 추가', '다른 단어 검색'],
          relatedWords: [{ id: word.id, word: word.word, definition: word.definition }],
        };
      }

      return {
        content: `죄송해요, "${searchWord}"를 데이터베이스에서 찾을 수 없었어요. 😅

다른 단어를 검색해보시거나, 단어 페이지에서 직접 찾아보시는 건 어떨까요?`,
        suggestions: ['단어 검색 페이지로', '오늘의 추천 단어', '다른 질문하기'],
      };
    }
  }

  // Default response
  return {
    content: `안녕하세요! VocaVision AI 학습 도우미입니다! 🎓

저는 다음과 같은 도움을 드릴 수 있어요:

📚 **단어 학습**
- 단어의 뜻, 발음, 예문 설명
- 암기법 및 어원 정보

🎯 **학습 팁**
- 효과적인 학습 방법 안내
- 오늘의 추천 단어

🧠 **퀴즈**
- 재미있는 단어 퀴즈
- 복습 테스트

무엇이 궁금하신가요?`,
    suggestions: [
      '오늘의 단어 추천해줘',
      '영어 공부 팁 알려줘',
      '단어 퀴즈 내줘',
    ],
  };
};

// Send a message and get AI response
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { message, conversationId, wordId, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '메시지를 입력해주세요.' });
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(message, context, wordId);

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
