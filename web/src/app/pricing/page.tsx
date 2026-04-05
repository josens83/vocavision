import { Metadata } from 'next';
import { headers } from 'next/headers';
import Navigation from "@/components/navigation/Navigation";
import PricingPage from "@/components/pricing/PricingPage";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isEn = host.includes('vocavision.app');

  return {
    title: isEn ? 'Pricing' : '요금제',
    description: isEn
      ? 'VocaVision AI free and premium plans. Start with SAT L1 words free, upgrade for 19,000+ words across all exams.'
      : 'VocaVision AI 무료 및 프리미엄 요금제를 확인하세요. 수능 필수 단어 951개 무료, 프리미엄으로 19,000개+ 단어 학습.',
    openGraph: {
      title: isEn ? 'VocaVision AI Pricing' : 'VocaVision AI 요금제',
      description: isEn
        ? 'Start free. Upgrade when you need more.'
        : '무료로 시작하고, 필요할 때 업그레이드하세요.',
    },
  };
}

export default function Pricing() {
  return (
    <>
      <Navigation />
      <main>
        <PricingPage />
      </main>
    </>
  );
}
