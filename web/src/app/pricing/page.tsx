'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

const plans = [
  {
    name: '무료',
    price: 0,
    period: '',
    description: '기본 학습 기능으로 시작해보세요',
    features: [
      '일일 10개 단어 학습',
      '기본 플래시카드',
      '간단한 퀴즈',
      '기본 통계',
    ],
    limitations: [
      '고급 학습 방법 제한',
      '이미지 및 비디오 제한',
      '업적 시스템 제한',
    ],
    cta: '무료 시작',
    popular: false,
    color: 'gray',
  },
  {
    name: '월간',
    price: 9990,
    period: '월',
    description: '월 단위로 유연하게 사용하세요',
    features: [
      '무제한 단어 학습',
      '모든 학습 방법 (이미지, 비디오, 라임, 연상법, 어원)',
      '고급 통계 및 분석',
      'AI 생성 연상법',
      '업적 시스템',
      '우선 고객 지원',
      '광고 없음',
    ],
    cta: '월간 시작',
    popular: false,
    color: 'blue',
  },
  {
    name: '연간',
    price: 99900,
    period: '년',
    originalPrice: 119880,
    savings: 19980,
    description: '17% 할인으로 1년 동안 학습하세요',
    features: [
      '무제한 단어 학습',
      '모든 학습 방법 (이미지, 비디오, 라임, 연상법, 어원)',
      '고급 통계 및 분석',
      'AI 생성 연상법',
      '업적 시스템',
      '우선 고객 지원',
      '광고 없음',
      '연간 20,000원 절약',
    ],
    cta: '연간 시작',
    popular: true,
    color: 'purple',
  },
];

const features = [
  {
    icon: '📚',
    title: '101+ 단어 데이터베이스',
    description: '초급부터 전문가 레벨까지 엄선된 영어 단어',
  },
  {
    icon: '🎯',
    title: 'SM-2 간격 반복 알고리즘',
    description: '과학적으로 검증된 최적의 복습 스케줄링',
  },
  {
    icon: '🧠',
    title: '다중 학습 방법',
    description: '이미지, 비디오, 라임, 연상법, 어원 등 다양한 방식',
  },
  {
    icon: '📊',
    title: '상세한 진행 상황 추적',
    description: '실시간 통계와 인사이트로 학습 효율 극대화',
  },
  {
    icon: '🏆',
    title: '업적 시스템',
    description: '게임화된 학습 경험으로 동기부여 유지',
  },
  {
    icon: '📱',
    title: '크로스 플랫폼',
    description: '웹, iOS, Android 어디서나 학습 가능',
  },
];

const faqs = [
  {
    question: '무료 체험이 있나요?',
    answer:
      '네! 무료 플랜으로 기본 기능을 체험하실 수 있습니다. 또한 프리미엄 플랜은 7일 무료 체험이 제공됩니다.',
  },
  {
    question: '언제든지 취소할 수 있나요?',
    answer:
      '네, 언제든지 취소하실 수 있습니다. 취소 후에도 결제 기간이 끝날 때까지 프리미엄 기능을 이용하실 수 있습니다.',
  },
  {
    question: '환불 정책은 어떻게 되나요?',
    answer:
      '구매 후 7일 이내에 환불 요청이 가능합니다. 자세한 내용은 고객 지원팀에 문의해주세요.',
  },
  {
    question: '플랜을 변경할 수 있나요?',
    answer:
      '네, 언제든지 플랜을 업그레이드하거나 다운그레이드하실 수 있습니다. 차액은 자동으로 조정됩니다.',
  },
  {
    question: '여러 기기에서 사용할 수 있나요?',
    answer:
      '네, 하나의 계정으로 웹, iOS, Android 등 모든 플랫폼에서 동시에 사용하실 수 있습니다.',
  },
  {
    question: '결제 방법은 무엇이 있나요?',
    answer:
      '신용카드, 체크카드, 카카오페이, 네이버페이 등 다양한 결제 수단을 지원합니다.',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleSelectPlan = (planName: string) => {
    if (!user) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    if (planName === '무료') {
      router.push('/dashboard');
      return;
    }

    // Redirect to Stripe checkout (to be implemented)
    alert(`${planName} 플랜 결제 페이지로 이동합니다.`);
    // In production: redirect to Stripe checkout session
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              VocaVision
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                대시보드
              </Link>
              {!user && (
                <>
                  <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                    로그인
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    시작하기
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">
              영어 단어 암기, 이제는 쉽고 재미있게
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              과학적 학습 방법과 AI 기술로 효과적인 어휘 학습을 경험하세요
            </p>
            <div className="inline-flex bg-white/20 rounded-lg p-1">
              <button
                className={`px-6 py-2 rounded-md transition ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-white/10'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                월간
              </button>
              <button
                className={`px-6 py-2 rounded-md transition ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-white/10'
                }`}
                onClick={() => setBillingCycle('yearly')}
              >
                연간 <span className="text-sm">(17% 절약)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              if (
                (billingCycle === 'monthly' && plan.name === '연간') ||
                (billingCycle === 'yearly' && plan.name === '월간')
              ) {
                return null;
              }

              return (
                <div
                  key={index}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden relative ${
                    plan.popular ? 'ring-4 ring-purple-500 scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center py-2 font-semibold">
                      가장 인기있는 플랜
                    </div>
                  )}

                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {plan.price.toLocaleString()}원
                        </span>
                        {plan.period && (
                          <span className="text-gray-600">/ {plan.period}</span>
                        )}
                      </div>
                      {plan.originalPrice && (
                        <div className="mt-2">
                          <span className="text-gray-400 line-through">
                            {plan.originalPrice.toLocaleString()}원
                          </span>
                          <span className="ml-2 text-green-600 font-semibold">
                            {plan.savings?.toLocaleString()}원 절약
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSelectPlan(plan.name)}
                      className={`w-full py-3 rounded-lg font-semibold mb-6 transition ${
                        plan.popular
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {plan.cta}
                    </button>

                    <div className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-green-500 text-xl">✓</span>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                      {plan.limitations &&
                        plan.limitations.map((limitation, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-gray-300 text-xl">✗</span>
                            <span className="text-gray-400">{limitation}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4">
              VocaVision의 핵심 기능
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              최첨단 기술로 당신의 영어 실력을 향상시키세요
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-4">자주 묻는 질문</h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            궁금하신 점이 있으신가요?
          </p>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 transition"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  <span className="text-2xl text-gray-400">
                    {openFaqIndex === index ? '−' : '+'}
                  </span>
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 pb-6 text-gray-600">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">지금 바로 시작하세요!</h2>
            <p className="text-xl text-purple-100 mb-8">
              7일 무료 체험으로 VocaVision의 모든 기능을 경험해보세요
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
            >
              무료로 시작하기
            </Link>
            <p className="mt-4 text-purple-200">신용카드 등록 불필요</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">VocaVision</h3>
              <p className="text-sm">
                AI 기반 영어 단어 학습 플랫폼으로 효과적인 어휘 학습을 지원합니다.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">제품</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/features" className="hover:text-white">
                    기능
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    가격
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    대시보드
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">지원</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/help" className="hover:text-white">
                    도움말
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    문의하기
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">회사</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white">
                    회사 소개
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    개인정보 처리방침
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    이용약관
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 VocaVision. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
