import { Metadata } from 'next';

const packageMeta: Record<string, { title: string; description: string }> = {
  '2026-csat-analysis': {
    title: '2026 수능기출완전분석 - 521개 핵심 어휘',
    description: '2026년 수능 영어영역 기출 단어 521개 완전 분석. 듣기·독해영역별 핵심 어휘를 AI 이미지와 어원 분석으로 학습.',
  },
  'ebs-vocab': {
    title: 'EBS 연계어휘 - 3,837개 단어',
    description: 'EBS 수능특강 영어듣기·영어·영어독해연습 3개 교재 연계 어휘. AI 이미지와 어원 분석으로 암기.',
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const meta = packageMeta[params.slug];
  if (!meta) return { title: '단어장 | VocaVision AI' };
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, url: `https://vocavision.kr/packages/${params.slug}` },
  };
}

export default function PackageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
