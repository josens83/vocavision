import { Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { prisma } from '../index';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getLearningMethods = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        images: true,
        videos: true,
        rhymes: true,
        mnemonics: {
          orderBy: { rating: 'desc' },
        },
        etymology: true,
        examples: true,
        synonyms: true,
        antonyms: true,
      },
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    res.json({
      word,
      methods: {
        images: word.images,
        videos: word.videos,
        rhymes: word.rhymes,
        mnemonics: word.mnemonics,
        etymology: word.etymology,
        examples: word.examples,
        synonyms: word.synonyms,
        antonyms: word.antonyms,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateMnemonic = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.body;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    const prompt = `Create a creative and memorable mnemonic device to help remember the English word "${word.word}" which means "${word.definition}".

Please provide:
1. A catchy title
2. A detailed explanation connecting the word sound/spelling to its meaning
3. A Korean hint if possible

Make it fun and easy to remember!`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful English vocabulary teacher who creates memorable mnemonics.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    const response = completion.choices[0].message.content || '';

    // Parse the response (simplified)
    const mnemonic = await prisma.mnemonic.create({
      data: {
        wordId: word.id,
        title: `AI Mnemonic for ${word.word}`,
        content: response,
        source: 'AI_GENERATED',
        rating: 0,
        ratingCount: 0,
      },
    });

    res.json({
      message: 'Mnemonic generated successfully',
      mnemonic,
    });
  } catch (error) {
    next(error);
  }
};

export const generateImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.body;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    const prompt = `A clear, simple illustration representing the word "${word.word}" meaning "${word.definition}". Educational style, easy to understand.`;

    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
    });

    const imageUrl = image.data?.[0]?.url;

    if (!imageUrl) {
      throw new AppError('Failed to generate image', 500);
    }

    const wordImage = await prisma.wordImage.create({
      data: {
        wordId: word.id,
        imageUrl,
        description: prompt,
        source: 'AI_GENERATED',
        aiPrompt: prompt,
      },
    });

    res.json({
      message: 'Image generated successfully',
      image: wordImage,
    });
  } catch (error) {
    next(error);
  }
};
