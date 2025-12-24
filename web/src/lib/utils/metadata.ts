// Phase 3-5: Metadata Optimization for Core Web Vitals
// SEO and performance optimization through proper metadata

import { Metadata } from 'next';

/**
 * Default metadata for the app
 */
export const DEFAULT_METADATA: Metadata = {
  title: 'VocaVision AI - AI 기반 영어 단어 학습 플랫폼',
  description:
    'AI 이미지, 동영상, Rhyming, 연상법, 어원으로 배우는 영어 단어 학습. Duolingo, Quizlet, Anki, Memrise 스타일의 게임화된 학습 경험.',
  keywords: [
    '영어 학습',
    '단어 암기',
    '영어 어휘',
    'vocabulary',
    'flashcard',
    'spaced repetition',
    'gamification',
    'VocaVision AI',
  ],
  authors: [{ name: 'VocaVision AI Team' }],
  creator: 'VocaVision AI',
  publisher: 'VocaVision AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: 'VocaVision AI',
    title: 'VocaVision AI - AI 기반 영어 단어 학습 플랫폼',
    description: 'AI 기반 게임화된 영어 단어 학습으로 효과적으로 어휘를 확장하세요',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VocaVision AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VocaVision AI - AI 기반 영어 단어 학습 플랫폼',
    description: 'AI 기반 게임화된 영어 단어 학습으로 효과적으로 어휘를 확장하세요',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

/**
 * Generate metadata for word detail page
 */
export function generateWordMetadata(word: {
  word: string;
  definition: string;
  difficulty: string;
}): Metadata {
  const title = `${word.word} - 뜻, 발음, 예문 | VocaVision AI`;
  const description = `${word.word}: ${word.definition}. ${word.difficulty} 난이도 영어 단어를 이미지, 연상법, 예문으로 학습하세요.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

/**
 * Generate metadata for deck page
 */
export function generateDeckMetadata(deck: {
  name: string;
  description?: string;
  wordCount: number;
}): Metadata {
  const title = `${deck.name} - 단어장 | VocaVision AI`;
  const description = deck.description || `${deck.wordCount}개의 단어가 포함된 학습 덱입니다.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

/**
 * Resource hints for performance
 */
export const RESOURCE_HINTS = {
  // DNS prefetch for external domains
  dnsPrefetch: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://res.cloudinary.com',
  ],

  // Preconnect to critical origins
  preconnect: [
    {
      href: 'https://fonts.googleapis.com',
      crossOrigin: 'anonymous',
    },
    {
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
  ],

  // Prefetch routes for anticipated navigation
  prefetch: [
    '/dashboard',
    '/words',
    '/decks',
    '/games',
    '/statistics',
    '/leagues',
  ],
};

/**
 * JSON-LD structured data for SEO
 */
export function generateJsonLd(type: 'website' | 'article', data: any) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type === 'website' ? 'WebSite' : 'Article',
  };

  if (type === 'website') {
    return {
      ...baseData,
      name: 'VocaVision AI',
      url: process.env.NEXT_PUBLIC_APP_URL,
      description: 'AI 기반 영어 단어 학습 플랫폼',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${process.env.NEXT_PUBLIC_APP_URL}/words?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  }

  return {
    ...baseData,
    ...data,
  };
}

console.log('[Metadata] Module loaded');
