import { Metadata } from 'next';
import { headers } from 'next/headers';
import ContactContent from './ContactContent';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isEn = host.includes('vocavision.app');

  return {
    title: isEn ? 'Contact' : '문의하기',
    description: isEn
      ? 'VocaVision AI customer support. Reach out via email for any questions.'
      : 'VocaVision AI 고객 지원 및 문의 안내. 이메일로 문의하세요.',
  };
}

export default function ContactPage() {
  return <ContactContent />;
}
