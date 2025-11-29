"use client";

import { useState, ReactNode } from "react";

// ============================================
// FAQ Item Component
// ============================================

export interface FAQItemData {
  question: string;
  answer: string;
}

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left gap-4 hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800 text-base pr-4">
          {question}
        </span>
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isOpen ? "bg-slate-300 rotate-45" : "bg-green-500"
          }`}
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5 pt-0">
          <p className="text-slate-600 text-sm leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FAQ Section Component
// ============================================

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  contactLink?: string;
  contactLabel?: string;
  items: FAQItemData[];
  allowMultiple?: boolean;
}

export function FAQSection({
  title = "Frequently Asked Questions",
  subtitle = "Common questions about our plans.",
  contactLink,
  contactLabel = "Get in touch",
  items,
  allowMultiple = false,
}: FAQSectionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setOpenIndexes((prev) =>
        prev.includes(index) ? [] : [index]
      );
    }
  };

  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">{title}</h2>
          <p className="text-slate-600">
            {subtitle}
            {contactLink && (
              <>
                <br />
                Didn't find the answer you need?{" "}
                <a
                  href={contactLink}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  {contactLabel}
                </a>
              </>
            )}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndexes.includes(index)}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// Default FAQ Data for VocaVision
// ============================================

export const vocaVisionFAQ: FAQItemData[] = [
  {
    question: "VocaVision은 무료로 계속 사용할 수 있나요?",
    answer:
      "네! 기본 학습 기능은 영원히 무료입니다. Pro 구독은 광고 제거, 무제한 학습, 고급 통계 등 추가 기능을 제공합니다.",
  },
  {
    question: "새로운 단어나 콘텐츠는 얼마나 자주 추가되나요?",
    answer:
      "매주 새로운 단어와 학습 콘텐츠를 추가하고 있습니다. 다양한 레벨과 주제의 단어를 지속적으로 업데이트합니다!",
  },
  {
    question: "결제는 안전한가요?",
    answer:
      "네, 물론입니다. 저희는 신뢰할 수 있는 결제 서비스를 사용하며, 모든 거래는 암호화되어 안전하게 처리됩니다.",
  },
  {
    question: "환불이 가능한가요?",
    answer:
      "구독 후 7일 이내에 학습 기록이 없는 경우 전액 환불이 가능합니다. 그 이후에는 언제든지 구독을 취소할 수 있으며, 현재 결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다.",
  },
  {
    question: "플랜을 나중에 변경할 수 있나요?",
    answer:
      "네! 월간 플랜으로 시작한 후 연간 플랜으로 언제든지 업그레이드할 수 있습니다. 이미 결제한 금액은 연간 결제에 적용됩니다.",
  },
  {
    question: "그룹 계정(학교, 학원)도 사용 가능한가요?",
    answer:
      "현재는 개인 사용자 전용입니다. 하지만 학교나 학원용 그룹 구독 옵션을 준비 중입니다. 관심 있으시면 문의해 주세요!",
  },
  {
    question: "어떤 레벨부터 시작해야 하나요?",
    answer:
      "레벨 테스트를 통해 현재 실력을 측정한 후 적합한 레벨부터 시작하는 것을 권장합니다. 학습을 진행하면서 각 스킬별 레벨 배지를 획득할 수 있습니다.",
  },
  {
    question: "모바일에서도 사용할 수 있나요?",
    answer:
      "네! VocaVision은 모바일 반응형으로 설계되어 스마트폰과 태블릿에서도 편리하게 학습할 수 있습니다. 전용 앱도 준비 중입니다.",
  },
];
