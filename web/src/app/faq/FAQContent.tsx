'use client';

import Link from 'next/link';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: '서비스 이용',
    icon: '📚',
    items: [
      {
        question: 'VocaVision AI는 어떤 서비스인가요?',
        answer:
          'VocaVision AI는 AI 기반 영어 단어 학습 플랫폼입니다. 수능, TEPS, TOEFL 등 다양한 시험 대비 단어를 AI 이미지 연상법, 어원 분석, 라임 등을 통해 효과적으로 학습할 수 있습니다.',
      },
      {
        question: '무료로 이용할 수 있나요?',
        answer:
          '네, 수능 L1 필수 단어 1,000개는 무료로 학습할 수 있습니다. 전체 3,000개+ 단어와 추가 기능은 프리미엄 구독을 통해 이용 가능합니다.',
      },
      {
        question: '어떤 시험을 준비할 수 있나요?',
        answer:
          '현재 수능(CSAT) 어휘를 제공하며, TEPS, TOEFL, TOEIC 어휘는 곧 추가될 예정입니다.',
      },
    ],
  },
  {
    title: '결제 및 구독',
    icon: '💳',
    items: [
      {
        question: '결제 수단은 무엇이 있나요?',
        answer:
          '신용카드, 체크카드로 결제할 수 있습니다. 토스페이먼츠를 통해 안전하게 처리됩니다.',
      },
      {
        question: '구독을 취소하면 어떻게 되나요?',
        answer:
          '구독 취소 시 다음 결제일부터 결제가 중단되며, 남은 기간 동안은 계속 이용 가능합니다.',
      },
      {
        question: '환불은 어떻게 받나요?',
        answer:
          '결제 후 7일 이내 미이용 시 전액 환불, 이용 후에는 잔여 기간 일할 계산하여 환불됩니다. support@vocavision.kr로 문의해주세요.',
      },
    ],
  },
  {
    title: '계정 및 학습',
    icon: '📱',
    items: [
      {
        question: '여러 기기에서 이용할 수 있나요?',
        answer:
          '네, 동일한 계정으로 PC, 태블릿, 모바일에서 학습할 수 있으며 진행 상황이 자동 동기화됩니다.',
      },
      {
        question: '학습 기록은 저장되나요?',
        answer:
          '네, 학습한 단어, 정답률, 복습 주기 등 모든 학습 데이터가 자동으로 저장됩니다.',
      },
      {
        question: '비밀번호를 잊어버렸어요.',
        answer:
          '로그인 페이지에서 "비밀번호 찾기"를 클릭하시거나, 소셜 로그인(카카오/구글)을 이용해주세요.',
      },
    ],
  },
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{item.question}</span>
        <span
          className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="p-4 pt-0 text-gray-600 leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

export default function FAQContent() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isItemOpen = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    return openItems[key] || false;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-brand-primary hover:underline mb-4 inline-block">
            &larr; 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">자주 묻는 질문</h1>
          <p className="text-gray-500 mt-2">VocaVision AI에 대해 궁금한 점을 확인해 보세요.</p>
        </div>

        {/* FAQ 카테고리 */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div
              key={category.title}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{category.icon}</span>
                <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
              </div>
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => (
                  <FAQAccordion
                    key={itemIndex}
                    item={item}
                    isOpen={isItemOpen(categoryIndex, itemIndex)}
                    onToggle={() => toggleItem(categoryIndex, itemIndex)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 추가 문의 안내 */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-sm p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">원하는 답변을 찾지 못하셨나요?</h2>
              <p className="text-white/80">
                문의하기를 통해 직접 질문해 주시면 빠르게 답변 드리겠습니다.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap"
            >
              문의하기
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            이메일:{' '}
            <a href="mailto:support@vocavision.kr" className="text-brand-primary hover:underline">
              support@vocavision.kr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
