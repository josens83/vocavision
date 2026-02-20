import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VocaVision AI 학습 가이드 - 8섹션 학습법',
  description: 'AI 이미지, 어원 분석, 창의적 암기법, Rhyme 등 8가지 방법으로 영어 단어를 효과적으로 암기하세요.',
  openGraph: {
    title: 'VocaVision AI 학습 가이드',
    description: 'AI 이미지, 어원 분석, 창의적 암기법 등 8가지 방법으로 단어 암기',
    url: 'https://vocavision.kr/help',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
