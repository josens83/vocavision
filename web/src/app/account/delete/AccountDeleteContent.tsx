'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';

export default function AccountDeleteContent() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const supportEmail = isEn ? 'support@vocavision.app' : 'support@vocavision.kr';
  const siteUrl = isEn ? 'https://vocavision.app' : 'https://vocavision.kr';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/" className="text-brand-primary hover:underline mb-4 inline-block">
            &larr; {isEn ? 'Back to Home' : '홈으로 돌아가기'}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEn ? 'Account & Data Deletion Request' : '계정 및 데이터 삭제 요청'}
          </h1>
          <p className="text-gray-500 mt-2">VocaVision AI — {isEn ? 'Unipath' : '유니패스'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isEn ? 'Account Deletion Guide' : '계정 삭제 안내'}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {isEn
                ? 'Deleting your VocaVision AI account will permanently remove all personal information and learning data. Deleted data cannot be recovered, so please decide carefully.'
                : 'VocaVision AI 서비스의 계정을 삭제하면 관련된 모든 개인정보와 학습 데이터가 영구적으로 삭제됩니다. 삭제된 데이터는 복구할 수 없으므로 신중하게 결정해 주세요.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isEn ? 'How to Delete Your Account' : '계정 삭제 방법'}
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">
                  {isEn ? 'Method 1: Delete within the app/website' : '방법 1: 앱/웹사이트 내에서 직접 삭제'}
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-2">
                  <li>{isEn ? 'Log in to VocaVision AI.' : 'VocaVision AI에 로그인합니다.'}</li>
                  <li>{isEn ? 'Go to Settings.' : '설정(Settings) 메뉴로 이동합니다.'}</li>
                  <li>{isEn ? 'Click "Delete Account".' : '"계정 삭제" 버튼을 클릭합니다.'}</li>
                  <li>{isEn ? 'Select "Confirm Deletion" in the confirmation dialog.' : '확인 메시지에서 "삭제 확인"을 선택합니다.'}</li>
                  <li>{isEn ? 'Your account and all associated data will be deleted immediately.' : '계정과 모든 관련 데이터가 즉시 삭제됩니다.'}</li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">
                  {isEn ? 'Method 2: Request via email' : '방법 2: 이메일로 삭제 요청'}
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-2">
                  <li>{isEn ? 'Send a deletion request to the email address below.' : '아래 이메일 주소로 삭제 요청을 보냅니다.'}</li>
                  <li>{isEn ? 'Include the email address you used to sign up.' : '가입 시 사용한 이메일 주소를 본문에 포함해 주세요.'}</li>
                  <li>{isEn ? 'Your request will be processed within 7 business days.' : '요청 접수 후 7영업일 이내에 처리됩니다.'}</li>
                </ol>
                <p className="mt-4 text-gray-700">
                  📧 {isEn ? 'Email' : '이메일'}: <a href={`mailto:${supportEmail}`} className="text-brand-primary hover:underline font-semibold">{supportEmail}</a>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isEn ? 'Data That Will Be Deleted' : '삭제되는 데이터'}
            </h2>
            <p className="text-gray-700 mb-4">
              {isEn
                ? 'The following data will be permanently deleted when you delete your account:'
                : '계정 삭제 시 다음 데이터가 영구적으로 삭제됩니다:'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-3 text-left">{isEn ? 'Data Type' : '데이터 유형'}</th>
                    <th className="border border-gray-200 px-4 py-3 text-left">{isEn ? 'Description' : '설명'}</th>
                    <th className="border border-gray-200 px-4 py-3 text-left">{isEn ? 'Timing' : '삭제 시점'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-semibold">{isEn ? 'Account Info' : '계정 정보'}</td>
                    <td className="border border-gray-200 px-4 py-3">{isEn ? 'Email, nickname, profile image' : '이메일, 닉네임, 프로필 이미지'}</td>
                    <td className="border border-gray-200 px-4 py-3">{isEn ? 'Immediately' : '즉시 삭제'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-semibold">{isEn ? 'Learning History' : '학습 기록'}</td>
                    <td className="border border-gray-200 px-4 py-3">{isEn ? 'Flashcard progress, quiz records, review data, statistics' : '플래시카드 진행률, 퀴즈 기록, 복습 데이터, 통계'}</td>
                    <td className="border border-gray-200 px-4 py-3">{isEn ? 'Immediately' : '즉시 삭제'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-semibold">{isEn ? 'Subscription/Payment' : '구독/결제 정보'}</td>
                    <td className="border border-gray-200 px-4 py-3">{isEn ? 'Subscription status, billing key' : '구독 상태, 빌링키'}</td>
                    <td className="border border-gray-200 px-4 py-3">{isEn ? 'Immediately (payment records retained for 5 years per law)' : '즉시 삭제 (결제 기록은 법령에 따라 5년 보관)'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-semibold">{isEn ? 'User Settings' : '사용자 설정'}</td>
                    <td className="border border-gray-200 px-4 py-3">{isEn ? 'Daily learning goals, notification settings' : '일일 학습 목표, 알림 설정'}</td>
                    <td className="border border-gray-200 px-4 py-3">{isEn ? 'Immediately' : '즉시 삭제'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {!isEn && (
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
          )}

          <section className="bg-red-50 rounded-xl p-6 border border-red-200">
            <h2 className="text-xl font-bold text-red-900 mb-4">
              ⚠️ {isEn ? 'Important Notice' : '주의사항'}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-red-800 ml-2">
              <li>{isEn ? 'Deleted accounts and data cannot be recovered.' : '삭제된 계정과 데이터는 복구할 수 없습니다.'}</li>
              <li>{isEn ? 'If you have an active subscription, please cancel it before deleting your account.' : '활성 구독이 있는 경우, 계정 삭제 전에 구독을 먼저 해지해 주세요.'}</li>
              <li>{isEn ? 'Accounts created via social login (Kakao, Google) will also be fully deleted.' : '소셜 로그인(카카오, 구글)으로 가입한 경우에도 동일하게 삭제됩니다.'}</li>
            </ul>
          </section>

          <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-bold text-blue-900 mb-4">{isEn ? 'Contact' : '문의'}</h2>
            <div className="text-gray-700 space-y-2">
              <p><strong>{isEn ? 'Service' : '서비스명'}:</strong> VocaVision AI</p>
              <p><strong>{isEn ? 'Developer' : '개발자'}:</strong> {isEn ? 'Unipath (Do Hurn Kim)' : '유니패스 (김도헌)'}</p>
              <p><strong>{isEn ? 'Email' : '이메일'}:</strong> <a href={`mailto:${supportEmail}`} className="text-brand-primary hover:underline">{supportEmail}</a></p>
              <p><strong>{isEn ? 'Website' : '웹사이트'}:</strong> <a href={siteUrl} className="text-brand-primary hover:underline">{siteUrl}</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
