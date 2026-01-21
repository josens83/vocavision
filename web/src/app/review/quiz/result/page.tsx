'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResultContent() {
  const searchParams = useSearchParams();
  const correct = parseInt(searchParams.get('correct') || '0');
  const total = parseInt(searchParams.get('total') || '0');
  const isDemo = searchParams.get('demo') === 'true';
  const exam = searchParams.get('exam') || 'CSAT';
  const level = searchParams.get('level') || 'L1';

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // 결과에 따른 메시지와 이모지
  const getResultMessage = () => {
    if (accuracy === 100) {
      return { emoji: '🏆', title: '완벽해요!', message: '모든 문제를 맞혔습니다!' };
    } else if (accuracy >= 80) {
      return { emoji: '🎉', title: '훌륭해요!', message: '거의 다 맞혔습니다!' };
    } else if (accuracy >= 60) {
      return { emoji: '👍', title: '잘했어요!', message: '조금만 더 복습하면 완벽해질 거예요.' };
    } else if (accuracy >= 40) {
      return { emoji: '💪', title: '괜찮아요!', message: '꾸준히 복습하면 실력이 늘어요.' };
    } else {
      return { emoji: '📚', title: '힘내세요!', message: '복습을 더 해봐요!' };
    }
  };

  const result = getResultMessage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        {/* 이모지 */}
        <div className="text-7xl mb-4">{result.emoji}</div>

        {/* 제목 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{result.title}</h1>
        <p className="text-gray-500 mb-8">{result.message}</p>

        {/* 점수 원형 */}
        <div className="relative w-40 h-40 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* 배경 원 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="10"
            />
            {/* 진행 원 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${accuracy * 2.83} 283`}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-900">{accuracy}%</span>
            <span className="text-sm text-gray-500">정답률</span>
          </div>
        </div>

        {/* 통계 */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{correct}</p>
            <p className="text-sm text-gray-500">정답</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-3xl font-bold text-red-500">{total - correct}</p>
            <p className="text-sm text-gray-500">오답</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-500">총 문제</p>
          </div>
        </div>

        {/* 버튼 */}
        {isDemo ? (
          <div className="space-y-3">
            <Link
              href="/auth/register"
              className="block w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/25"
            >
              무료 회원가입하고 계속 학습하기
            </Link>
            <Link
              href="/review/quiz?demo=true"
              className="block w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
            >
              다시 체험하기
            </Link>
            <Link
              href="/"
              className="block w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition"
            >
              메인으로 돌아가기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <Link
              href={`/review/quiz?exam=${exam}&level=${level}`}
              className="block w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/25"
            >
              다음 10개 복습하기
            </Link>
            <Link
              href="/review"
              className="block w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
            >
              복습 페이지로 돌아가기
            </Link>
            <Link
              href="/dashboard"
              className="block w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition"
            >
              대시보드로 이동
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
