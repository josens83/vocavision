import { Metadata } from 'next';
import { getServerLocale, getSiteUrl } from '@/lib/utils/getLocale';

const examMetaKo: Record<string, { title: string; description: string }> = {
  csat: {
    title: '수능 영어 단어 학습 - 1,792개 필수 어휘',
    description: '수능 영어영역 필수 단어 1,792개. AI 이미지 연상법, 어원 분석으로 L1(기초)~L3(고급) 단계별 학습.',
  },
  teps: {
    title: 'TEPS 고급 어휘 학습 - 375개 핵심 단어',
    description: 'TEPS 시험 대비 고급 어휘 375개. AI 이미지와 함께 기본/필수 2단계 구성.',
  },
};

const examMetaEn: Record<string, { title: string; description: string }> = {
  sat: {
    title: 'SAT Vocabulary — 3,932 Words in 20 Themes',
    description: 'Master SAT vocabulary organized by meaning. AI images, etymology & rhymes for every word.',
  },
  gre: {
    title: 'GRE Verbal Vocabulary — 4,270 Words',
    description: 'The most comprehensive GRE vocabulary. AI images, Latin & Greek roots, spaced repetition.',
  },
  toefl: {
    title: 'TOEFL Vocabulary — 3,172 Essential Words',
    description: 'TOEFL Core & Advanced vocabulary with AI images, etymology & rhymes.',
  },
  ielts: {
    title: 'IELTS Academic Vocabulary — 765 Words',
    description: 'IELTS Band 5-8 vocabulary. Foundation & Academic levels with AI images.',
  },
  act: {
    title: 'ACT English & Reading Vocabulary — 716 Words',
    description: 'ACT vocabulary across Core, Tone, Transition, Science & Academic categories.',
  },
};

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const locale = getServerLocale();
  const isEn = locale === 'en';
  const siteUrl = getSiteUrl(locale);

  const meta = isEn
    ? (examMetaEn[params.category] || examMetaKo[params.category])
    : (examMetaKo[params.category]);

  if (!meta) return { title: isEn ? 'Exam Prep | VocaVision AI' : '시험 대비 | VocaVision AI' };

  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, url: `${siteUrl}/exam/${params.category}` },
  };
}

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
