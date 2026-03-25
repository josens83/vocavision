'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';

export default function TermsPage() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const email = isEn ? 'support@vocavision.app' : 'support@vocavision.kr';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/" className="text-brand-primary hover:underline mb-4 inline-block">
            &larr; {isEn ? 'Back to Home' : '홈으로 돌아가기'}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{isEn ? 'Terms of Service' : '이용약관'}</h1>
          <p className="text-gray-500 mt-2">{isEn ? 'Last updated: January 1, 2025' : '최종 수정일: 2025년 1월 1일'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {isEn ? (
            <>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Article 1 (Purpose)</h2>
                <p className="text-gray-700 leading-relaxed">These Terms govern the conditions, procedures, rights, obligations, and responsibilities between VocaVision AI (&quot;Company&quot;) and users for the use of the VocaVision AI service (&quot;Service&quot;).</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Article 2 (Definitions)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>&quot;Service&quot; refers to the English vocabulary learning platform and related services provided by the Company.</li>
                  <li>&quot;User&quot; refers to members and non-members who use the Service under these Terms.</li>
                  <li>&quot;Member&quot; refers to a person who has entered into a service agreement with the Company and has been assigned a user ID.</li>
                  <li>&quot;Recurring payment&quot; refers to a service where payments are automatically processed according to the billing cycle chosen by the Member.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Article 3 (Effectiveness of Terms)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>These Terms become effective when posted on the Service or otherwise notified to Members.</li>
                  <li>The Company may amend these Terms to the extent permitted by applicable laws.</li>
                  <li>Amended Terms will be announced via notice. Failure to object within 7 days shall be deemed consent.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Article 4 (Service Use)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>The Service is provided 24/7, year-round, in principle.</li>
                  <li>The Company may temporarily suspend the Service for system maintenance, upgrades, or replacements.</li>
                  <li>Free services may have limited features. Full features are available with a paid subscription.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Article 5 (Paid Services & Billing)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Paid services are offered through monthly or annual recurring billing.</li>
                  <li>Recurring payments are automatically charged via the Member&apos;s chosen payment method.</li>
                  <li>Pricing and features are available on the Pricing page.</li>
                  <li>Cancellation is available at any time. Upon cancellation, billing stops from the next billing date.</li>
                </ol>
              </section>
              <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h2 className="text-xl font-bold text-blue-900 mb-4">Article 6 (Refund Policy)</h2>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">1. 14-Day Full Refund Guarantee</h3>
                    <p>VocaVision AI guarantees a full refund within 14 days of purchase, no questions asked.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">2. How to Request a Refund</h3>
                    <ul className="list-disc list-inside ml-4"><li>Email: {email}</li></ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">3. Processing Time</h3>
                    <p>Refunds are processed within 3–5 business days.</p>
                  </div>
                </div>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Article 7 (User Obligations)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Members must comply with these Terms and the Company&apos;s notices.</li>
                  <li>Members must securely manage their account information.</li>
                  <li>Members must not infringe on the rights of others or violate any laws.</li>
                  <li>Members must not reproduce, distribute, or modify Service content without authorization.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Article 8 (Company Obligations)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>The Company complies with applicable laws and strives to provide stable services.</li>
                  <li>The Company follows a Privacy Policy to protect Members&apos; personal information.</li>
                  <li>The Company promptly addresses Members&apos; opinions and complaints.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Article 9 (Dispute Resolution)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Disputes related to these Terms shall be governed by the laws of the Republic of Korea.</li>
                  <li>The court with jurisdiction over the Company&apos;s location shall be the competent court.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Supplementary Provisions</h2>
                <p className="text-gray-700">These Terms are effective from January 1, 2025.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">제1조 (목적)</h2>
                <p className="text-gray-700 leading-relaxed">이 약관은 유니패스 (이하 &quot;VocaVision AI&quot; 또는 &quot;회사&quot;)가 제공하는 VocaVision AI 서비스(이하 &quot;서비스&quot;)의 이용조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">제2조 (정의)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>&quot;서비스&quot;란 회사가 제공하는 영어 단어 학습 플랫폼 및 관련 제반 서비스를 의미합니다.</li>
                  <li>&quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                  <li>&quot;회원&quot;이란 회사와 서비스 이용계약을 체결하고 회원 아이디를 부여받은 자를 말합니다.</li>
                  <li>&quot;정기결제&quot;란 회원이 선택한 결제 주기에 따라 자동으로 결제가 이루어지는 서비스를 말합니다.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">제3조 (약관의 효력)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력을 발생합니다.</li>
                  <li>회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
                  <li>변경된 약관은 공지사항을 통해 공지되며, 공지 후 7일 이내에 거부 의사를 표시하지 않으면 동의한 것으로 간주합니다.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">제4조 (서비스 이용)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>서비스는 연중무휴 24시간 제공함을 원칙으로 합니다.</li>
                  <li>회사는 시스템 점검, 증설 및 교체 등의 사유로 서비스를 일시적으로 중단할 수 있습니다.</li>
                  <li>무료 서비스는 일부 기능에 제한이 있을 수 있으며, 유료 서비스 가입 시 모든 기능을 이용할 수 있습니다.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">제5조 (유료 서비스 및 결제)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>유료 서비스는 월간, 연간 정기결제 방식으로 제공됩니다.</li>
                  <li>정기결제는 회원이 선택한 결제 수단으로 매월 또는 매년 자동 결제됩니다.</li>
                  <li>결제 금액 및 제공 기능은 요금제 페이지에서 확인할 수 있습니다.</li>
                  <li>정기결제 해지는 언제든지 가능하며, 해지 시 다음 결제일부터 결제가 중단됩니다.</li>
                </ol>
              </section>
              <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h2 className="text-xl font-bold text-blue-900 mb-4">제6조 (환불 정책)</h2>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">1. 14일 무조건 전액 환불</h3>
                    <p>유니패스(VocaVision AI)는 구매일로부터 14일 이내에 이유를 불문하고 전액 환불을 보장합니다.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">2. 환불 신청 방법</h3>
                    <ul className="list-disc list-inside ml-4"><li>이메일: {email}</li></ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">3. 환불 처리 기간</h3>
                    <p>환불 신청 접수 후 영업일 기준 3~5일 이내에 처리됩니다.</p>
                  </div>
                </div>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">제7조 (회원의 의무)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>회원은 본 약관 및 회사의 공지사항을 준수해야 합니다.</li>
                  <li>회원은 자신의 계정 정보를 안전하게 관리해야 합니다.</li>
                  <li>회원은 타인의 권리를 침해하거나 법령에 위반되는 행위를 해서는 안 됩니다.</li>
                  <li>회원은 서비스 콘텐츠를 무단으로 복제, 배포, 수정해서는 안 됩니다.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">제8조 (회사의 의무)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>회사는 관련 법령을 준수하며, 안정적인 서비스 제공을 위해 노력합니다.</li>
                  <li>회사는 회원의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고 준수합니다.</li>
                  <li>회사는 서비스 이용과 관련한 회원의 의견이나 불만사항을 신속하게 처리합니다.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">제9조 (분쟁 해결)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>본 약관과 관련된 분쟁은 대한민국 법률에 따라 해석됩니다.</li>
                  <li>서비스 이용으로 발생한 분쟁에 대해서는 회사 소재지를 관할하는 법원을 관할 법원으로 합니다.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">부칙</h2>
                <p className="text-gray-700">본 약관은 2025년 1월 1일부터 시행됩니다.</p>
              </section>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-gray-500">
          <p>{isEn ? 'Questions about these Terms? Contact us.' : '약관에 대해 궁금한 점이 있으시면 문의해 주세요.'}</p>
          <p className="mt-2">
            {isEn ? 'Email: ' : '이메일: '}<a href={`mailto:${email}`} className="text-brand-primary hover:underline">{email}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
