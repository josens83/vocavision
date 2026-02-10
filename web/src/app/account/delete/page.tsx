import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '계정 삭제 요청 - VocaVision AI',
  description: 'VocaVision AI 계정 및 관련 데이터 삭제를 요청하는 방법을 안내합니다.',
};

export default function AccountDeletePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-brand-primary hover:underline mb-4 inline-block">
            &larr; 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">계정 및 데이터 삭제 요청</h1>
          <p className="text-gray-500 mt-2">VocaVision AI — 유니패스</p>
        </div>

        {/* 본문 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">

          {/* 개요 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">계정 삭제 안내</h2>
            <p className="text-gray-700 leading-relaxed">
              VocaVision AI 서비스의 계정을 삭제하면 관련된 모든 개인정보와 학습 데이터가 영구적으로 삭제됩니다.
              삭제된 데이터는 복구할 수 없으므로 신중하게 결정해 주세요.
            </p>
          </section>

          {/* 삭제 방법 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">계정 삭제 방법</h2>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">방법 1: 앱/웹사이트 내에서 직접 삭제</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-2">
                  <li>VocaVision AI에 로그인합니다.</li>
                  <li><strong>설정(Settings)</strong> 메뉴로 이동합니다.</li>
                  <li><strong>&quot;계정 삭제&quot;</strong> 버튼을 클릭합니다.</li>
                  <li>확인 메시지에서 <strong>&quot;삭제 확인&quot;</strong>을 선택합니다.</li>
                  <li>계정과 모든 관련 데이터가 즉시 삭제됩니다.</li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">방법 2: 이메일로 삭제 요청</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-2">
                  <li>아래 이메일 주소로 삭제 요청을 보냅니다.</li>
                  <li>가입 시 사용한 이메일 주소를 본문에 포함해 주세요.</li>
                  <li>요청 접수 후 <strong>7영업일 이내</strong>에 처리됩니다.</li>
                </ol>
                <p className="mt-4 text-gray-700">
                  📧 이메일: <a href="mailto:support@vocavision.kr" className="text-brand-primary hover:underline font-semibold">support@vocavision.kr</a>
                </p>
              </div>
            </div>
          </section>

          {/* 삭제되는 데이터 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">삭제되는 데이터</h2>
            <p className="text-gray-700 mb-4">계정 삭제 시 다음 데이터가 영구적으로 삭제됩니다:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-3 text-left">데이터 유형</th>
                    <th className="border border-gray-200 px-4 py-3 text-left">설명</th>
                    <th className="border border-gray-200 px-4 py-3 text-left">삭제 시점</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-semibold">계정 정보</td>
                    <td className="border border-gray-200 px-4 py-3">이메일, 닉네임, 프로필 이미지</td>
                    <td className="border border-gray-200 px-4 py-3">즉시 삭제</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-semibold">학습 기록</td>
                    <td className="border border-gray-200 px-4 py-3">플래시카드 진행률, 퀴즈 기록, 복습 데이터, 통계</td>
                    <td className="border border-gray-200 px-4 py-3">즉시 삭제</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-semibold">구독/결제 정보</td>
                    <td className="border border-gray-200 px-4 py-3">구독 상태, 빌링키</td>
                    <td className="border border-gray-200 px-4 py-3">즉시 삭제 (결제 기록은 법령에 따라 5년 보관)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-semibold">사용자 설정</td>
                    <td className="border border-gray-200 px-4 py-3">일일 학습 목표, 알림 설정</td>
                    <td className="border border-gray-200 px-4 py-3">즉시 삭제</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 보관되는 데이터 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">법령에 따라 보관되는 데이터</h2>
            <p className="text-gray-700 mb-4">
              다음 데이터는 관련 법령에 따라 일정 기간 보관 후 파기됩니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>결제 및 대금 지급에 관한 기록: <strong>5년</strong> (전자상거래법)</li>
              <li>소비자 불만 또는 분쟁 처리 기록: <strong>3년</strong> (전자상거래법)</li>
              <li>접속 로그 기록: <strong>3개월</strong> (통신비밀보호법)</li>
            </ul>
          </section>

          {/* 주의사항 */}
          <section className="bg-red-50 rounded-xl p-6 border border-red-200">
            <h2 className="text-xl font-bold text-red-900 mb-4">⚠️ 주의사항</h2>
            <ul className="list-disc list-inside space-y-2 text-red-800 ml-2">
              <li>삭제된 계정과 데이터는 <strong>복구할 수 없습니다.</strong></li>
              <li>활성 구독이 있는 경우, 계정 삭제 전에 구독을 먼저 해지해 주세요.</li>
              <li>소셜 로그인(카카오, 구글)으로 가입한 경우에도 동일하게 삭제됩니다.</li>
            </ul>
          </section>

          {/* 문의 */}
          <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-bold text-blue-900 mb-4">문의</h2>
            <div className="text-gray-700 space-y-2">
              <p><strong>서비스명:</strong> VocaVision AI</p>
              <p><strong>개발자:</strong> 유니패스 (김도헌)</p>
              <p><strong>이메일:</strong> <a href="mailto:support@vocavision.kr" className="text-brand-primary hover:underline">support@vocavision.kr</a></p>
              <p><strong>웹사이트:</strong> <a href="https://vocavision.kr" className="text-brand-primary hover:underline">https://vocavision.kr</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
