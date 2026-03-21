import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 86400;

const BASE_URL_KO = 'https://vocavision.kr';
const BASE_URL_EN = 'https://vocavision.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// 정적 페이지 목록
const staticPages: MetadataRoute.Sitemap = [
  { url: BASE_URL_KO, changeFrequency: 'weekly', priority: 1.0 },
  { url: `${BASE_URL_KO}/pricing`, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE_URL_KO}/packages`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL_KO}/packages/2026-csat-analysis`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL_KO}/packages/ebs-vocab`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL_KO}/packages/toefl-complete`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL_KO}/exam/csat`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL_KO}/exam/teps`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL_KO}/exam/toefl`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL_KO}/help`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL_KO}/contact`, changeFrequency: 'monthly', priority: 0.4 },
  { url: `${BASE_URL_KO}/faq`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL_KO}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${BASE_URL_KO}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  // English pages
  { url: BASE_URL_EN, changeFrequency: 'weekly', priority: 1.0 },
  { url: `${BASE_URL_EN}/pricing`, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE_URL_EN}/packages`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL_EN}/packages/toefl-complete`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL_EN}/packages/gre-complete`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL_EN}/packages/ielts-complete`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL_EN}/packages/sat-complete`, changeFrequency: 'weekly', priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 단어 페이지 동적 생성
  let wordEntries: MetadataRoute.Sitemap = [];

  try {
    const response = await fetch(`${API_URL}/words/sitemap`, {
      next: { revalidate: 0 },
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      const words: Array<{ id: string; updatedAt: string }> = data.words || [];

      wordEntries = words.flatMap((word) => [
        {
          url: `${BASE_URL_KO}/words/${word.id}`,
          lastModified: new Date(word.updatedAt),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        },
        {
          url: `${BASE_URL_EN}/words/${word.id}`,
          lastModified: new Date(word.updatedAt),
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        },
      ]);
    } else {
      console.error('[Sitemap] API responded with status:', response.status);
    }
  } catch (error) {
    console.error('[Sitemap] Failed to fetch words:', error);
  }

  console.log(`[Sitemap] Generated: ${staticPages.length} static + ${wordEntries.length} word pages`);

  return [...staticPages, ...wordEntries];
}
