import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vocavision.kr';
  const lastModified = new Date();

  return [
    // 메인
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1 },

    // 핵심 페이지
    { url: `${baseUrl}/pricing`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/packages/2026-csat-analysis`, lastModified, changeFrequency: 'weekly', priority: 0.9 },

    // 시험 카테고리
    { url: `${baseUrl}/exam/csat`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/exam/teps`, lastModified, changeFrequency: 'weekly', priority: 0.8 },

    // 학습
    { url: `${baseUrl}/learn`, lastModified, changeFrequency: 'weekly', priority: 0.8 },

    // 인증
    { url: `${baseUrl}/auth/login`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/auth/register`, lastModified, changeFrequency: 'monthly', priority: 0.7 },

    // 정보 페이지
    { url: `${baseUrl}/faq`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
