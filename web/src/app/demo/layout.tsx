import Link from 'next/link';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 데모 안내 배너 */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-accent text-white text-center py-3 px-4">
        <p className="text-sm">
          🎮 <strong>체험 모드</strong> | VocaVision AI 기능을 미리 체험해보세요
          <Link href="/auth/login" className="ml-3 underline hover:no-underline">
            로그인하고 전체 기능 사용하기 →
          </Link>
        </p>
      </div>

      {/* 페이지 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4">
        <div className="max-w-4xl mx-auto flex justify-center gap-6">
          <Link
            href="/demo/flashcard"
            className="text-sm text-gray-600 hover:text-brand-primary transition"
          >
            📚 플래시카드
          </Link>
          <Link
            href="/demo/quiz"
            className="text-sm text-gray-600 hover:text-brand-primary transition"
          >
            🎯 퀴즈
          </Link>
          <Link
            href="/demo/analytics"
            className="text-sm text-gray-600 hover:text-brand-primary transition"
          >
            📊 학습 분석
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-brand-primary transition"
          >
            🏠 메인
          </Link>
        </div>
      </nav>
    </div>
  );
}
