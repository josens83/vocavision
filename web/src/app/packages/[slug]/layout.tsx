import { Metadata } from 'next';
import { getServerLocale, getSiteUrl } from '@/lib/utils/getLocale';

const packageMetaKo: Record<string, { title: string; description: string }> = {
  '2026-csat-analysis': {
    title: '2026 수능기출완전분석 - 521개 핵심 어휘',
    description: '2026년 수능 영어영역 기출 단어 521개 완전 분석. 듣기·독해영역별 핵심 어휘를 AI 이미지와 어원 분석으로 학습.',
  },
  'ebs-vocab': {
    title: 'EBS 연계어휘 - 3,838개 단어',
    description: 'EBS 수능특강 영어듣기·영어·영어독해연습 3개 교재 연계 어휘. AI 이미지와 어원 분석으로 암기.',
  },
  'toefl-complete': {
    title: 'TOEFL Core Vocabulary - 3,172 Words',
    description: 'TOEFL essential and advanced vocabulary. Learn with AI images, etymology & rhymes.',
  },
  'toeic-complete': {
    title: 'TOEIC Score Booster - 2,411 Words',
    description: 'TOEIC vocabulary for 700+ scores. Business English mastered with AI images.',
  },
  'sat-complete': {
    title: 'SAT Advanced Vocabulary - 3,932 Words',
    description: 'SAT vocabulary organized by 20 themes. AI images, etymology & rhymes for every word.',
  },
  'gre-complete': {
    title: 'GRE Verbal Mastery - 4,270 Words',
    description: 'The largest GRE vocabulary pack. 4,270 words with AI images, Latin & Greek etymology.',
  },
  'ielts-complete': {
    title: 'IELTS Academic Mastery - 765 Words',
    description: 'IELTS Band 5-8 vocabulary. Academic words with AI images and etymology breakdowns.',
  },
  'act-complete': {
    title: 'ACT English & Reading - 716 Words',
    description: 'ACT vocabulary across Core, Tone, Transition, Science & Academic categories.',
  },
};

const packageMetaEn: Record<string, { title: string; description: string }> = {
  'toefl-complete': {
    title: 'TOEFL Core Vocabulary — 3,172 Words',
    description: 'Master TOEFL vocabulary with AI-generated images, etymology & rhymes. Essential + Advanced packs.',
  },
  'toeic-complete': {
    title: 'TOEIC Score Booster — 2,411 Words',
    description: 'TOEIC business vocabulary with AI images. Starter + Booster levels for 700+ scores.',
  },
  'sat-complete': {
    title: 'SAT Vocabulary — 3,932 Words in 20 Themes',
    description: 'SAT vocab organized by meaning: Mind, Emotion, Society, Science & more. AI images per word.',
  },
  'gre-complete': {
    title: 'GRE Verbal Mastery — 4,270 Words',
    description: 'The largest GRE word list in any app. AI images, Latin & Greek etymology for every word.',
  },
  'ielts-complete': {
    title: 'IELTS Academic — 765 Words (Band 5–8)',
    description: 'IELTS Academic vocabulary with AI images. Foundation + Academic levels.',
  },
  'act-complete': {
    title: 'ACT English & Reading — 716 Words',
    description: 'ACT vocabulary: Core Meaning, Tone & Attitude, Transitions, Science Reasoning, Academic.',
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const locale = getServerLocale();
  const isEn = locale === 'en';
  const siteUrl = getSiteUrl(locale);

  const meta = isEn
    ? (packageMetaEn[params.slug] || packageMetaKo[params.slug])
    : (packageMetaKo[params.slug]);

  if (!meta) return { title: isEn ? 'Vocabulary Pack | VocaVision AI' : '단어장 | VocaVision AI' };

  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, url: `${siteUrl}/packages/${params.slug}` },
  };
}

export default function PackageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
