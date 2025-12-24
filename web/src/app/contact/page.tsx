import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '문의하기',
  description: 'VocaVision AI 고객 지원 및 문의 안내. 이메일로 문의하세요.',
};

const contactInfo = [
  {
    icon: '📧',
    label: '이메일',
    value: 'support@vocavision.kr',
    href: 'mailto:support@vocavision.kr',
  },
  {
    icon: '⏰',
    label: '운영시간',
    value: '평일 10:00 - 18:00 (주말/공휴일 휴무)',
    href: null,
  },
];

const inquiryTypes = [
  {
    icon: '💬',
    title: '일반 문의',
    description: '서비스 이용, 기능 관련 질문',
  },
  {
    icon: '💳',
    title: '결제/환불 문의',
    description: '결제 오류, 환불 요청, 구독 관리',
  },
  {
    icon: '🔧',
    title: '기술 지원',
    description: '버그 신고, 접속 오류, 기술적 문제',
  },
  {
    icon: '🤝',
    title: '제휴/협력 문의',
    description: '비즈니스 제안, 마케팅 협력',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-brand-primary hover:underline mb-4 inline-block">
            &larr; 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">문의하기</h1>
          <p className="text-gray-500 mt-2">궁금한 점이 있으시면 언제든 연락해 주세요.</p>
        </div>

        {/* 연락처 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">연락처 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactInfo.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-brand-primary hover:underline font-medium"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-gray-900 font-medium">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 문의 유형별 안내 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">문의 유형별 안내</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inquiryTypes.map((type) => (
              <div
                key={type.title}
                className="border border-gray-200 rounded-xl p-4 hover:border-brand-primary/30 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{type.icon}</span>
                  <h3 className="font-semibold text-gray-900">{type.title}</h3>
                </div>
                <p className="text-sm text-gray-600 ml-11">{type.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>빠른 답변을 원하시면:</strong> 문의 시 회원 이메일과 함께 문의 유형을 명시해 주시면 더 빠르게 도움 드릴 수 있습니다.
            </p>
          </div>
        </div>

        {/* 자주 묻는 질문 링크 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-sm p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">자주 묻는 질문을 먼저 확인해 보세요</h2>
              <p className="text-white/80">
                많은 질문들의 답변을 FAQ에서 바로 찾으실 수 있습니다.
              </p>
            </div>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap"
            >
              FAQ 보기
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* 추가 안내 */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>문의 접수 후 영업일 기준 1~2일 이내에 답변 드립니다.</p>
        </div>
      </div>
    </div>
  );
}
