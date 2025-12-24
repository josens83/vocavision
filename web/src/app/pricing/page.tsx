import { Metadata } from 'next';
import Navigation from "@/components/navigation/Navigation";
import PricingPage from "@/components/pricing/PricingPage";

export const metadata: Metadata = {
  title: '요금제',
  description: 'VocaVision AI 무료 및 프리미엄 요금제를 확인하세요. 수능 필수 단어 1,000개 무료, 프리미엄으로 3,000개+ 단어 학습.',
  openGraph: {
    title: 'VocaVision AI 요금제',
    description: '무료로 시작하고, 필요할 때 업그레이드하세요.',
  },
};

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
