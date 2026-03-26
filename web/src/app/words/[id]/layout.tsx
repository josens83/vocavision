import { Metadata } from 'next';
import { getServerLocale, getSiteUrl } from '@/lib/utils/getLocale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vocavisionbackend-production.up.railway.app/api';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const locale = getServerLocale();
  const isEn = locale === 'en';
  const siteUrl = getSiteUrl(locale);

  try {
    const res = await fetch(`${API_URL}/words/${params.id}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return { title: isEn ? 'Word Detail | VocaVision AI' : '단어 상세 | VocaVision AI' };

    const data = await res.json();
    const w = data.word;

    const title = isEn
      ? `${w.word} — ${w.definition}`
      : `${w.word} 뜻 - ${w.definitionKo || w.definition}`;

    const desc = isEn
      ? `${w.word}: ${w.definition}. ${w.pronunciation ? `Pronunciation: ${w.pronunciation.replace(/\*\*/g, '')}.` : ''} Learn with AI images, etymology & rhymes.`
      : `${w.word}: ${w.definitionKo || w.definition}. ${w.pronunciation ? `발음: ${w.pronunciation.replace(/\*\*/g, '')}.` : ''} AI 이미지 연상법, 어원 분석으로 암기.`;

    const ogTitle = isEn ? `${w.word} | VocaVision AI` : `${w.word} 뜻 | VocaVision AI`;
    const ogImg = w.visuals?.find((v: any) => v.type === 'CONCEPT')?.imageUrl || `${siteUrl}/${isEn ? 'og-image-en.jpg' : 'og-image-v2.jpg'}`;

    return {
      title,
      description: desc,
      openGraph: {
        title: ogTitle,
        description: desc,
        url: `${siteUrl}/words/${params.id}`,
        images: [{ url: ogImg, width: 1200, height: 630, alt: `${w.word} - VocaVision AI` }],
        type: 'article',
      },
      twitter: { card: 'summary_large_image', title: ogTitle, description: desc, images: [ogImg] },
      alternates: { canonical: `/words/${params.id}` },
    };
  } catch {
    return { title: isEn ? 'Word Detail | VocaVision AI' : '단어 상세 | VocaVision AI' };
  }
}

export default function WordDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
