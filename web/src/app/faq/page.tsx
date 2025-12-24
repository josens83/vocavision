import { Metadata } from 'next';
import FAQContent from './FAQContent';

export const metadata: Metadata = {
  title: '자주 묻는 질문',
  description: 'VocaVision AI 이용 방법, 결제, 환불 등 자주 묻는 질문과 답변.',
};

export default function FAQPage() {
  return <FAQContent />;
}
