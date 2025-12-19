'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-brand-primary hover:underline mb-4 inline-block">
            &larr; 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">개인정보처리방침</h1>
          <p className="text-gray-500 mt-2">최종 수정일: 2025년 12월 19일</p>
        </div>

        {/* 본문 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {/* 제1조 개인정보 수집 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제1조 (개인정보의 수집 및 이용 목적)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              유니패스(이하 &quot;회사&quot;)는 VocaVision 서비스 제공을 위해 다음과 같은 목적으로 개인정보를 수집·이용합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>회원 가입 및 관리</li>
              <li>서비스 제공 및 콘텐츠 제공</li>
              <li>결제 및 정산</li>
              <li>고객 문의 응대 및 불만 처리</li>
              <li>서비스 개선 및 신규 서비스 개발</li>
            </ul>
          </section>

          {/* 제2조 수집 항목 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제2조 (수집하는 개인정보의 항목)</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. 필수 항목</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>이메일 주소</li>
                  <li>비밀번호 (암호화 저장)</li>
                  <li>닉네임</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. 선택 항목</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>프로필 이미지</li>
                  <li>학습 목표 설정 정보</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3. 자동 수집 항목</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>서비스 이용 기록</li>
                  <li>학습 진행 데이터</li>
                  <li>접속 IP, 브라우저 종류, 기기 정보</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4. 결제 시 (유료 서비스)</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>결제 정보 (토스페이먼츠를 통해 처리, 회사는 카드 정보를 직접 저장하지 않음)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제3조 보유 기간 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
              단, 관련 법령에 따라 보존해야 하는 경우 해당 기간 동안 보관합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
              <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)</li>
              <li>웹사이트 방문 기록: 3개월 (통신비밀보호법)</li>
            </ul>
          </section>

          {/* 제4조 제3자 제공 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제4조 (개인정보의 제3자 제공)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 다음의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          {/* 제5조 처리 위탁 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제5조 (개인정보 처리 위탁)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-2 text-left">수탁업체</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">위탁 업무</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">토스페이먼츠</td>
                    <td className="border border-gray-200 px-4 py-2">결제 처리</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Vercel Inc.</td>
                    <td className="border border-gray-200 px-4 py-2">웹 프론트엔드 호스팅</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Railway</td>
                    <td className="border border-gray-200 px-4 py-2">백엔드 API 서버 호스팅</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Supabase</td>
                    <td className="border border-gray-200 px-4 py-2">데이터베이스 호스팅</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Cloudinary</td>
                    <td className="border border-gray-200 px-4 py-2">이미지 저장 및 CDN</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 제6조 이용자 권리 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제6조 (이용자의 권리와 행사 방법)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
            <p className="text-gray-700 mt-4">
              위 권리 행사는 서비스 내 설정 메뉴 또는 이메일(support@vocavision.com)을 통해 가능합니다.
            </p>
          </section>

          {/* 제7조 개인정보 보호 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제7조 (개인정보의 안전성 확보 조치)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>비밀번호 암호화 저장</li>
              <li>SSL/TLS를 통한 데이터 전송 암호화</li>
              <li>해킹 등에 대비한 보안 프로그램 설치 및 갱신</li>
              <li>개인정보 접근 권한 제한</li>
            </ul>
          </section>

          {/* 제8조 쿠키 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제8조 (쿠키의 사용)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              회사는 이용자에게 맞춤형 서비스를 제공하기 위해 쿠키를 사용합니다.
              이용자는 웹브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
            </p>
          </section>

          {/* 제9조 개인정보 보호책임자 */}
          <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-bold text-blue-900 mb-4">제9조 (개인정보 보호책임자)</h2>
            <div className="text-gray-700 space-y-2">
              <p><strong>성명:</strong> 김도헌</p>
              <p><strong>직책:</strong> 대표</p>
              <p><strong>이메일:</strong> support@vocavision.com</p>
              <p><strong>연락처:</strong> 010-5167-7227</p>
            </div>
          </section>

          {/* 제10조 정책 변경 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">제10조 (개인정보처리방침의 변경)</h2>
            <p className="text-gray-700 leading-relaxed">
              본 방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지합니다.
            </p>
          </section>

          {/* 부칙 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">부칙</h2>
            <p className="text-gray-700">본 방침은 2025년 12월 19일부터 시행됩니다.</p>
          </section>
        </div>

        {/* 문의 */}
        <div className="mt-8 text-center text-gray-500">
          <p>개인정보 관련 문의가 있으시면 연락해 주세요.</p>
          <p className="mt-2">
            이메일: <a href="mailto:support@vocavision.com" className="text-brand-primary hover:underline">support@vocavision.com</a>
            {' | '}
            전화: <a href="tel:010-5167-7227" className="text-brand-primary hover:underline">010-5167-7227</a>
          </p>
        </div>
      </div>
    </div>
  );
}
