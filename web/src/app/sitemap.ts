import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vocavision.kr';

  // 정적 페이지
  const staticPages = [
    '',
    '/pricing',
    '/learn',
    '/terms',
    '/privacy',
    '/contact',
    '/faq',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // TODO: 동적 페이지 (단어 페이지 등) 추가 가능
  // const words = await getPublishedWords();
  // const wordPages = words.map(...)

  return [...staticPages];
}
