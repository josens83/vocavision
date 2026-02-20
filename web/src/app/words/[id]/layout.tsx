import { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.vocavision.kr/api';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/words/${params.id}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return { title: '단어 상세 | VocaVision AI' };

    const data = await res.json();
    const w = data.word;
    const title = `${w.word} 뜻 - ${w.definitionKo || w.definition}`;
    const desc = `${w.word}: ${w.definitionKo || w.definition}. ${w.pronunciation ? `발음: ${w.pronunciation.replace(/\*\*/g, '')}.` : ''} AI 이미지 연상법, 어원 분석으로 암기.`;
    const ogImg = w.visuals?.find((v: any) => v.type === 'CONCEPT')?.imageUrl || 'https://vocavision.kr/og-image-v2.jpg';

    return {
      title,
      description: desc,
      openGraph: {
        title: `${w.word} 뜻 | VocaVision AI`,
        description: desc,
        url: `https://vocavision.kr/words/${params.id}`,
        images: [{ url: ogImg, width: 1200, height: 630, alt: `${w.word} - VocaVision AI` }],
        type: 'article',
      },
      twitter: { card: 'summary_large_image', title: `${w.word} 뜻 | VocaVision AI`, description: desc, images: [ogImg] },
      alternates: { canonical: `/words/${params.id}` },
    };
  } catch {
    return { title: '단어 상세 | VocaVision AI' };
  }
}

export default function WordDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
