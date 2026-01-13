'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* 메인 푸터 */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 브랜드 */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold">
                <span className="text-indigo-400">Voca</span>
                <span className="text-pink-400">Vision</span>
                <span className="text-gray-300 ml-1">AI</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              AI 기반 스마트 영어 단어 학습 플랫폼<br />
              과학적으로 검증된 간격 반복 학습과 AI 이미지 연상법으로<br />
              효율적인 어휘력 향상을 경험하세요.
            </p>
          </div>

          {/* 서비스 */}
          <div>
            <h3 className="text-white font-semibold mb-4">서비스</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/learn" className="hover:text-white transition-colors">
                  학습하기
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="hover:text-white transition-colors">
                  퀴즈
                </Link>
              </li>
              <li>
                <Link href="/flashcard" className="hover:text-white transition-colors">
                  플래시카드
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  요금제
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h3 className="text-white font-semibold mb-4">고객지원</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  문의하기
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div className="text-center md:text-left">
              <p>&copy; 2025 유니패스. All rights reserved.</p>
              <p className="mt-1">
                상호명: 유니패스 | 대표자명: 김도헌
              </p>
              <p className="mt-1">
                사업자등록번호: 719-02-03518
              </p>
              <p className="mt-1">
                통신판매업신고: 제 2025-화성동탄-5651 호
              </p>
              <p className="mt-1">
                주소: 경기도 화성시 동탄대로시범길 19
              </p>
              <p className="mt-1">
                이메일: support@vocavision.kr
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-gray-300 transition-colors">
                이용약관
              </Link>
              <span>|</span>
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
