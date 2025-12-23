import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '이용약관',
  description: 'VocaVision 서비스 이용약관을 확인하세요.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-brand-primary hover:underline mb-4 inline-block">
            &larr; 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">이용약관</h1>
          <p className="text-gray-500 mt-2">최종 수정일: 2025년 1월 1일</p>
        </div>

        {/* 본문 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {/* 제1조 목적 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제1조 (목적)</h2>
            <p className="text-gray-700 leading-relaxed">
              이 약관은 유니패스(이하 &quot;회사&quot;)가 제공하는 VocaVision 서비스(이하 &quot;서비스&quot;)의 이용조건 및 절차,
              회사와 이용자의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 정의 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제2조 (정의)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>&quot;서비스&quot;란 회사가 제공하는 영어 단어 학습 플랫폼 및 관련 제반 서비스를 의미합니다.</li>
              <li>&quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
              <li>&quot;회원&quot;이란 회사와 서비스 이용계약을 체결하고 회원 아이디를 부여받은 자를 말합니다.</li>
              <li>&quot;정기결제&quot;란 회원이 선택한 결제 주기에 따라 자동으로 결제가 이루어지는 서비스를 말합니다.</li>
            </ol>
          </section>

          {/* 제3조 약관의 효력 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제3조 (약관의 효력)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력을 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
              <li>변경된 약관은 공지사항을 통해 공지되며, 공지 후 7일 이내에 거부 의사를 표시하지 않으면 동의한 것으로 간주합니다.</li>
            </ol>
          </section>

          {/* 제4조 서비스 이용 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제4조 (서비스 이용)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>서비스는 연중무휴 24시간 제공함을 원칙으로 합니다.</li>
              <li>회사는 시스템 점검, 증설 및 교체 등의 사유로 서비스를 일시적으로 중단할 수 있습니다.</li>
              <li>무료 서비스는 일부 기능에 제한이 있을 수 있으며, 유료 서비스 가입 시 모든 기능을 이용할 수 있습니다.</li>
            </ol>
          </section>

          {/* 제5조 유료 서비스 및 결제 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제5조 (유료 서비스 및 결제)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>유료 서비스는 월간, 연간 정기결제 방식으로 제공됩니다.</li>
              <li>정기결제는 회원이 선택한 결제 수단으로 매월 또는 매년 자동 결제됩니다.</li>
              <li>결제 금액 및 제공 기능은 요금제 페이지에서 확인할 수 있습니다.</li>
              <li>정기결제 해지는 언제든지 가능하며, 해지 시 다음 결제일부터 결제가 중단됩니다.</li>
            </ol>
          </section>

          {/* 제6조 환불 정책 - 핵심 */}
          <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-bold text-blue-900 mb-4">제6조 (환불 정책)</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. 전액 환불</h3>
                <p>결제 후 7일 이내에 서비스를 전혀 이용하지 않은 경우, 전액 환불이 가능합니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. 부분 환불</h3>
                <p>서비스 이용 시작 후에는 잔여 이용 기간에 대해 일할 계산하여 환불합니다.</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm">
                  <li>월간 결제: (잔여일수 / 30) × 결제금액</li>
                  <li>연간 결제: (잔여일수 / 365) × 결제금액</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3. 환불 신청 방법</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>이메일: support@vocavision.kr</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4. 환불 처리 기간</h3>
                <p>환불 신청 접수 후 영업일 기준 3~5일 이내에 처리됩니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">5. 환불 불가 사유</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>서비스 이용 후 7일이 경과한 경우 (단, 부분 환불은 가능)</li>
                  <li>이용약관 위반으로 인한 서비스 이용 정지의 경우</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제7조 회원의 의무 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제7조 (회원의 의무)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>회원은 본 약관 및 회사의 공지사항을 준수해야 합니다.</li>
              <li>회원은 자신의 계정 정보를 안전하게 관리해야 합니다.</li>
              <li>회원은 타인의 권리를 침해하거나 법령에 위반되는 행위를 해서는 안 됩니다.</li>
              <li>회원은 서비스 콘텐츠를 무단으로 복제, 배포, 수정해서는 안 됩니다.</li>
            </ol>
          </section>

          {/* 제8조 회사의 의무 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제8조 (회사의 의무)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>회사는 관련 법령을 준수하며, 안정적인 서비스 제공을 위해 노력합니다.</li>
              <li>회사는 회원의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고 준수합니다.</li>
              <li>회사는 서비스 이용과 관련한 회원의 의견이나 불만사항을 신속하게 처리합니다.</li>
            </ol>
          </section>

          {/* 제9조 분쟁 해결 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제9조 (분쟁 해결)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>본 약관과 관련된 분쟁은 대한민국 법률에 따라 해석됩니다.</li>
              <li>서비스 이용으로 발생한 분쟁에 대해서는 회사 소재지를 관할하는 법원을 관할 법원으로 합니다.</li>
            </ol>
          </section>

          {/* 부칙 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">부칙</h2>
            <p className="text-gray-700">본 약관은 2025년 1월 1일부터 시행됩니다.</p>
          </section>
        </div>

        {/* 문의 */}
        <div className="mt-8 text-center text-gray-500">
          <p>약관에 대해 궁금한 점이 있으시면 문의해 주세요.</p>
          <p className="mt-2">
            이메일: <a href="mailto:support@vocavision.kr" className="text-brand-primary hover:underline">support@vocavision.kr</a>
          </p>
        </div>
      </div>
    </div>
  );
}
