"use client";

import { useState } from "react";

// ============================================
// Types
// ============================================

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQAccordionProps {
  items: FAQItem[];
}

export interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  contactLink?: string;
  items: FAQItem[];
}

// ============================================
// VocaVision FAQ Data
// ============================================

export const vocaVisionFAQ: FAQItem[] = [
  {
    question: "무료 플랜으로 어떤 기능을 사용할 수 있나요?",
    answer:
      "무료 플랜에서는 기본 단어장 접근, 일일 퀴즈 5회, 학습 진도 추적, 플래시카드 기능을 이용할 수 있습니다. 유료 플랜으로 업그레이드하시면 모든 단어장과 무제한 퀴즈, AI 개인화 학습 등 고급 기능을 사용하실 수 있습니다.",
  },
  {
    question: "결제 후 언제든지 취소할 수 있나요?",
    answer:
      "네, 언제든지 구독을 취소하실 수 있습니다. 취소 후에도 결제 기간이 끝날 때까지 프리미엄 기능을 계속 이용하실 수 있으며, 이후에는 자동으로 무료 플랜으로 전환됩니다. 환불 정책은 결제 후 7일 이내 전액 환불을 보장합니다.",
  },
  {
    question: "가족 공유는 어떻게 이용하나요?",
    answer:
      "프리미엄 플랜에서는 최대 5명의 가족 구성원과 계정을 공유할 수 있습니다. 설정 > 가족 관리에서 가족 구성원을 초대하실 수 있으며, 각 구성원은 개인 학습 기록과 진도를 따로 관리할 수 있습니다.",
  },
  {
    question: "오프라인 모드는 어떻게 작동하나요?",
    answer:
      "프로 이상 플랜에서는 단어장을 기기에 다운로드하여 인터넷 연결 없이도 학습할 수 있습니다. 다운로드된 콘텐츠에서 퀴즈와 플래시카드를 이용할 수 있으며, 온라인 연결 시 학습 기록이 자동으로 동기화됩니다.",
  },
  {
    question: "어떤 결제 수단을 지원하나요?",
    answer:
      "신용카드/체크카드, 카카오페이, 네이버페이, 토스, 휴대폰 결제 등 다양한 결제 수단을 지원합니다. 연간 결제 시 최대 44%까지 할인됩니다.",
  },
  {
    question: "학습 데이터는 안전하게 보관되나요?",
    answer:
      "네, 모든 학습 데이터는 암호화되어 안전하게 보관됩니다. 클라우드에 자동 백업되어 기기를 변경해도 학습 기록이 유지됩니다. 개인정보는 GDPR 및 국내 개인정보보호법을 준수하여 처리됩니다.",
  },
  {
    question: "수능/TOEIC 등 시험별 콘텐츠가 있나요?",
    answer:
      "네, 수능, TOEIC, TOEFL, TEPS, SAT 등 주요 시험별 맞춤 단어장을 제공합니다. 각 시험의 출제 경향을 분석하여 빈출 어휘 위주로 구성되어 있으며, 난이도별로 체계적인 학습이 가능합니다.",
  },
  {
    question: "플랜을 변경하고 싶으면 어떻게 하나요?",
    answer:
      "설정 > 구독 관리에서 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 업그레이드 시에는 즉시 적용되며, 다운그레이드는 현재 결제 기간이 끝난 후 적용됩니다.",
  },
];

// ============================================
// FAQAccordionItem Component
// ============================================

function FAQAccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: FAQItem & { isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors px-4 -mx-4 rounded-lg"
      >
        <span className="font-semibold text-slate-900 pr-8">{question}</span>
        <svg
          className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-slate-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ============================================
// FAQAccordion Component
// ============================================

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
      {items.map((item, index) => (
        <FAQAccordionItem
          key={index}
          {...item}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
  );
}

// ============================================
// FAQSection Component
// ============================================

export function FAQSection({
  title = "자주 묻는 질문",
  subtitle = "플랜에 관한 궁금한 점을 확인하세요.",
  contactLink = "/contact",
  items,
}: FAQSectionProps) {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-display-md font-bold text-slate-900 mb-4">{title}</h2>
          <p className="text-lg text-slate-600">{subtitle}</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <FAQAccordion items={items} />

          <div className="text-center mt-10">
            <p className="text-slate-600 mb-4">
              원하는 답을 찾지 못하셨나요?
            </p>
            <a
              href={contactLink}
              className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
            >
              고객센터에 문의하기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FAQAccordion;
