import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = 'https://vocavision.kr';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// 정적 페이지 목록
const staticPages: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: 'weekly', priority: 1.0 },
  { url: `${BASE_URL}/pricing`, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE_URL}/packages`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/packages/2026-csat-analysis`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL}/packages/ebs-vocab`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL}/packages/toefl-complete`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL}/exam/csat`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/exam/teps`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/exam/toefl`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/help`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.4 },
  { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
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

      wordEntries = words.map((word) => ({
        url: `${BASE_URL}/words/${word.id}`,
        lastModified: new Date(word.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    } else {
      console.error('[Sitemap] API responded with status:', response.status);
    }
  } catch (error) {
    console.error('[Sitemap] Failed to fetch words:', error);
  }

  console.log(`[Sitemap] Generated: ${staticPages.length} static + ${wordEntries.length} word pages`);

  return [...staticPages, ...wordEntries];
}
