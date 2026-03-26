import { Metadata } from 'next';
import { getServerLocale, getSiteUrl } from '@/lib/utils/getLocale';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const isEn = locale === 'en';
  const siteUrl = getSiteUrl(locale);

  const title = isEn ? 'Learning Guide — 8-Section Method' : 'VocaVision AI 학습 가이드 - 8섹션 학습법';
  const description = isEn
    ? 'Master vocabulary with 8 learning sections: AI images, etymology, mnemonics, rhymes, pronunciation, collocations, and more.'
    : 'AI 이미지, 어원 분석, 창의적 암기법, Rhyme 등 8가지 방법으로 영어 단어를 효과적으로 암기하세요.';

  return {
    title,
    description,
    openGraph: { title, description, url: `${siteUrl}/help` },
  };
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
