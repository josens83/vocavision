import { Metadata } from 'next';
import ContactContent from './ContactContent';

export const metadata: Metadata = {
  title: '문의하기',
  description: 'VocaVision AI 고객 지원 및 문의 안내. 이메일로 문의하세요.',
};

export default function ContactPage() {
  return <ContactContent />;
}
