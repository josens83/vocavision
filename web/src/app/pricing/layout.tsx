import { Metadata } from 'next';
import { getServerLocale } from '@/lib/utils/getLocale';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const isEn = locale === 'en';

  return {
    title: isEn ? 'Pricing — VocaVision AI' : '요금제 - VocaVision AI',
    description: isEn
      ? 'Choose your plan. SAT Starter free forever. Basic $4.99/mo, Premium $9.99/mo. Learn vocabulary with AI images.'
      : 'VocaVision AI 요금제를 확인하고 나에게 맞는 플랜을 선택하세요. 무료로 시작하고, 필요할 때 업그레이드하세요.',
  };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
