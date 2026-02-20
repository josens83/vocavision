import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vocavision.kr';

  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/pricing`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/packages`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/packages/2026-csat-analysis`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/packages/ebs-vocab`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/exam/csat`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/exam/teps`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/learn`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/help`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
