import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '요금제 - VocaVision',
  description: 'VocaVision 요금제를 확인하고 나에게 맞는 플랜을 선택하세요. 무료로 시작하고, 필요할 때 업그레이드하세요.',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
