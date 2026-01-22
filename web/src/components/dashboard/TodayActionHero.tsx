'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface TodayActionHeroProps {
  dueCount: number;
  etaMinutes?: number;
  todayGoal?: number;
  onStartReview?: () => void;
}

export default function TodayActionHero({
  dueCount,
  etaMinutes,
  todayGoal = 20,
}: TodayActionHeroProps) {
  // 예상 소요 시간 계산 (6개/분 기준)
  const minutes = etaMinutes ?? Math.max(1, Math.ceil(dueCount * 0.3));
  const hasReview = dueCount > 0;

  return (
    <section className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg shadow-pink-500/25">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-teal-100 text-sm mb-1 font-medium">오늘의 학습</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {hasReview ? (
              <>복습할 단어 <span className="text-yellow-300">{dueCount}개</span></>
            ) : (
              <>새로운 단어를 학습해보세요</>
            )}
          </h2>
          {hasReview ? (
            <p className="text-teal-100">
              지금 시작하면 <strong className="text-white">{minutes}분</strong>이면 끝나요
            </p>
          ) : (
            <p className="text-teal-100">
              오늘 목표: 새 단어 <strong className="text-white">{todayGoal}개</strong> 학습하기
            </p>
          )}

          {/* Secondary Links */}
          <div className="flex gap-4 mt-3">
            <Link href="/learn" className="text-teal-200 hover:text-white text-sm transition-colors inline-flex items-center gap-1">
              새 단어 학습 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/words?filter=weak" className="text-teal-200 hover:text-white text-sm transition-colors inline-flex items-center gap-1">
              약한 단어 복습 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Today's Goal Mini Card */}
          <div className="hidden sm:block bg-white/10 backdrop-blur rounded-xl px-4 py-3 text-center border border-white/20">
            <div className="text-xs text-teal-100">오늘 목표</div>
            <div className="text-lg font-bold">{todayGoal}개</div>
          </div>

          {/* Primary CTA */}
          <Link
            href={hasReview ? '/review' : '/learn'}
            className="bg-white text-teal-600 px-8 py-4 rounded-xl font-bold text-center hover:bg-teal-50 transition shadow-lg whitespace-nowrap"
          >
            {hasReview ? '복습 시작' : '학습 시작'}
          </Link>
        </div>
      </div>
    </section>
  );
}
