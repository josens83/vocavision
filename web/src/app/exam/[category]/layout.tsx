import { Metadata } from 'next';

const examMeta: Record<string, { title: string; description: string }> = {
  csat: {
    title: '수능 영어 단어 학습 - 1,789개 필수 어휘',
    description: '수능 영어영역 필수 단어 1,789개. AI 이미지 연상법, 어원 분석으로 L1(기초)~L3(고급) 단계별 학습.',
  },
  teps: {
    title: 'TEPS 고급 어휘 학습 - 391개 핵심 단어',
    description: 'TEPS 시험 대비 고급 어휘 391개. AI 이미지와 함께 기본/필수 2단계 구성.',
  },
};

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const meta = examMeta[params.category];
  if (!meta) return { title: '시험 대비 | VocaVision AI' };
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, url: `https://vocavision.kr/exam/${params.category}` },
  };
}

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
