import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.vocavision.kr/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://vocavision.kr';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/packages`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/packages/2026-csat-analysis`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/packages/ebs-vocab`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/exam/csat`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/exam/teps`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/learn`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/auth/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/auth/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  let wordPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/words/sitemap`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      wordPages = (data.words || []).map((w: { id: string; updatedAt?: string }) => ({
        url: `${baseUrl}/words/${w.id}`,
        lastModified: w.updatedAt ? new Date(w.updatedAt) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (e) {
    console.error('Sitemap: Failed to fetch words', e);
  }

  return [...staticPages, ...wordPages];
}
