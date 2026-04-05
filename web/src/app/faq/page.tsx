import { Metadata } from 'next';
import { headers } from 'next/headers';
import FAQContent from './FAQContent';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isEn = host.includes('vocavision.app');

  return {
    title: isEn ? 'FAQ' : '자주 묻는 질문',
    description: isEn
      ? 'Frequently asked questions about VocaVision AI — how to use, billing, refunds, and more.'
      : 'VocaVision AI 이용 방법, 결제, 환불 등 자주 묻는 질문과 답변.',
  };
}

export default function FAQPage() {
  return <FAQContent />;
}
