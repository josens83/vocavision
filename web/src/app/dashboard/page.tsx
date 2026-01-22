'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import { progressAPI, wordsAPI } from '@/lib/api';
import { canAccessExam as canAccessExamUtil, canAccessLevel as canAccessLevelUtil } from '@/lib/subscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

// ============================================
// DashboardItem 컴포넌트 (은행 앱 스타일)
// ============================================
function DashboardItem({ value, label, color, loading }: { value: string | number, label: string, color: string, loading?: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      {loading ? (
        <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
      ) : (
        <span
          className="text-[22px] font-bold"
          style={{ color }}
        >
          {value}
        </span>
      )}
      <span className="text-[12px] text-[#767676]">{label}</span>
    </div>
  );
}

// Exam info
const examInfo: Record<string, { name: string; icon: string; gradient: string; color: string }> = {
  CSAT: { name: '수능', icon: '📝', gradient: 'from-blue-500 to-blue-600', color: 'blue' },
  TOEIC: { name: 'TOEIC', icon: '💼', gradient: 'from-green-500 to-green-600', color: 'green' },
  TOEFL: { name: 'TOEFL', icon: '🌍', gradient: 'from-orange-500 to-orange-600', color: 'orange' },
  TEPS: { name: 'TEPS', icon: '🎓', gradient: 'from-purple-500 to-purple-600', color: 'purple' },
};

// Level info - exam-specific
const getLevelInfo = (exam: string, level: string) => {
  if (exam === 'TEPS') {
    const tepsLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      L1: { name: '고급어휘 L1', description: 'TEPS 고급 어휘', target: '고득점 목표', wordCount: 1000 },
      L2: { name: '고급어휘 L2', description: 'TEPS 심화 어휘', target: '고득점 목표', wordCount: 1000 },
      L3: { name: '고급어휘 L3', description: 'TEPS 최고급 어휘', target: '고득점 목표', wordCount: 1000 },
    };
    return tepsLevels[level] || tepsLevels.L1;
  }

  const defaultLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
    L1: { name: '초급', description: '기초 필수 단어', target: '3등급 목표', wordCount: 1000 },
    L2: { name: '중급', description: '핵심 심화 단어', target: '2등급 목표', wordCount: 1000 },
    L3: { name: '고급', description: '고난도 단어', target: '1등급 목표', wordCount: 1000 },
  };
  return defaultLevels[level] || defaultLevels.L1;
};

interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);
  const setActiveLevel = useExamCourseStore((state) => state.setActiveLevel);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [dueReviewCount, setDueReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [examLevelTotalWords, setExamLevelTotalWords] = useState(0);
  const [examLevelLearnedWords, setExamLevelLearnedWords] = useState(0);
  const [examLevelLoading, setExamLevelLoading] = useState(false);
  const [weakWordCount, setWeakWordCount] = useState(0);

  // 구독 상태에 따른 접근 권한 체크 (공통 유틸 사용)
  const canAccessExam = (exam: string) => canAccessExamUtil(user, exam);
  const canAccessLevel = (exam: string, level: string) => canAccessLevelUtil(user, level);

  // Calendar data
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [user, hasHydrated, router]);

  // Load exam/level specific word counts when selection changes
  useEffect(() => {
    if (!hasHydrated || !user) return;
    loadExamLevelProgress();
  }, [activeExam, activeLevel, hasHydrated, user]);

  const loadData = async () => {
    try {
      const [progressData, reviewsData] = await Promise.all([
        progressAPI.getUserProgress(),
        progressAPI.getDueReviews(),
      ]);
      setStats(progressData.stats);
      setDueReviewCount(reviewsData.count || 0);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExamLevelProgress = async () => {
    setExamLevelLoading(true);
    setExamLevelLearnedWords(0);
    setExamLevelTotalWords(0);
    setWeakWordCount(0);

    try {
      const examCategory = activeExam || 'CSAT';
      const level = activeLevel || 'L1';

      const [totalData, unlearnedData, weakData] = await Promise.all([
        wordsAPI.getWords({
          examCategory,
          level,
          limit: 1,
        }),
        wordsAPI.getWords({
          examCategory,
          level,
          limit: 1,
          excludeLearned: true,
        }),
        progressAPI.getWeakWordsCount({ examCategory, level }),
      ]);

      const totalWords = totalData.pagination?.total || 0;
      const unlearnedWords = unlearnedData.pagination?.total || 0;

      setExamLevelTotalWords(totalWords);
      setExamLevelLearnedWords(totalWords - unlearnedWords);
      setWeakWordCount(weakData.count || 0);
    } catch (error) {
      console.error('Failed to load exam/level progress:', error);
    } finally {
      setExamLevelLoading(false);
    }
  };

  const selectedExam = activeExam || 'CSAT';
  const selectedLevel = activeLevel || 'L1';
  const exam = examInfo[selectedExam];
  const level = getLevelInfo(selectedExam, selectedLevel);

  // Use exam/level specific word counts (real data from API)
  const totalWords = examLevelTotalWords || level.wordCount;
  const learnedWords = examLevelLearnedWords;
  const remainingWords = Math.max(totalWords - learnedWords, 0);
  const progressPercent = totalWords > 0 ? Math.min(Math.round((learnedWords / totalWords) * 100), 100) : 0;

  // 학습 완료 여부
  const isCompleted = remainingWords === 0 && totalWords > 0;

  // 오늘의 학습 목표
  const dailyGoal = 20;
  const todayRemaining = Math.min(dailyGoal, remainingWords);
  const estimatedMinutes = Math.ceil(todayRemaining * 0.3);

  if (!hasHydrated || loading) {
    return (
      <DashboardLayout>
        <SkeletonDashboard />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
        {/* 모바일 헤더 */}
        <div className="lg:hidden">
          <h1 className="text-xl font-bold text-[#1c1c1e]">대시보드</h1>
        </div>

        {/* P0-2: 오늘의 학습 목표 Hero (은행 앱 스타일) */}
        <section className={`relative w-full rounded-[24px] overflow-hidden p-6 shadow-sm ${
          isCompleted ? 'bg-[#ECFDF5]' : 'bg-[#ECFDF5]'
        }`}>
          <div className="relative z-10">
            <span className={`text-[13px] font-semibold block mb-2 ${
              isCompleted ? 'text-[#10B981]' : 'text-[#14B8A6]'
            }`}>
              {isCompleted ? '🎉 학습 완료!' : '오늘의 학습 목표'}
            </span>

            {isCompleted ? (
              <>
                <h2 className="text-[22px] font-bold text-[#1c1c1e] leading-[1.35] mb-2">
                  {exam.name} {level.name} 마스터!<br />
                  <span className="text-[#10B981]">{totalWords}개</span> 단어 완료
                </h2>
                <p className="text-[14px] text-[#767676] mb-4">
                  {weakWordCount > 0
                    ? `잘 모르는 단어 ${weakWordCount}개를 복습해보세요!`
                    : '완벽하게 암기했어요! 다음 레벨에 도전해보세요.'}
                </p>
                <div className="space-y-2">
                  <Link
                    href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}&restart=true`}
                    className="block w-full bg-white rounded-[14px] py-4 text-[#10B981] font-bold text-[15px] text-center shadow-sm hover:shadow-md transition-shadow"
                  >
                    처음부터 다시 학습
                  </Link>
                  {weakWordCount > 0 && (
                    <Link
                      href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}&mode=weak`}
                      className="block w-full bg-[#FFF7ED] rounded-[14px] py-4 text-[#F59E0B] font-bold text-[15px] text-center hover:bg-[#FFEDD5] transition-colors"
                    >
                      잘 모르는 {weakWordCount}개만 학습
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-[22px] font-bold text-[#1c1c1e] leading-[1.35] mb-2">
                  다음 학습할 단어<br />
                  <span className="text-[#14B8A6]">{todayRemaining}개</span>
                </h2>
                <p className="text-[14px] text-[#767676] mb-4">
                  지금 시작하면 <span className="font-semibold text-[#1c1c1e]">{estimatedMinutes}분</span>이면 끝나요
                </p>
                <Link
                  href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}`}
                  className="block w-full bg-white rounded-[14px] py-4 text-[#14B8A6] font-bold text-[15px] text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  {learnedWords === 0 ? '학습 시작' : '이어서 학습'}
                </Link>
              </>
            )}
          </div>

          {/* 장식 요소 */}
          <div className="absolute top-4 right-4 opacity-60 select-none pointer-events-none">
            <div className="flex gap-1">
              <span className="text-[36px] transform -rotate-12">{isCompleted ? '🎉' : '📚'}</span>
              <span className="text-[32px] transform rotate-6">{isCompleted ? '✅' : '✨'}</span>
            </div>
          </div>
        </section>

        {/* 시험 선택 섹션 (은행 앱 스타일) */}
        <section className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]">
          <h3 className="text-[15px] font-bold text-[#1c1c1e] mb-4">시험 선택</h3>

          <div className="flex gap-3">
            <button
              onClick={() => setActiveExam('CSAT' as ExamType)}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[16px] transition-all ${
                selectedExam === 'CSAT'
                  ? 'bg-[#14B8A6] text-white shadow-sm'
                  : 'bg-[#F8F9FA] text-[#767676] hover:bg-[#f0f0f0]'
              }`}
            >
              <span className="text-xl">📝</span>
              <span className="font-semibold">수능</span>
            </button>

            <button
              onClick={() => {
                if (canAccessExam('TEPS')) {
                  setActiveExam('TEPS' as ExamType);
                } else {
                  router.push('/pricing');
                }
              }}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[16px] transition-all ${
                !canAccessExam('TEPS')
                  ? 'bg-[#F8F9FA] text-[#999999] cursor-not-allowed'
                  : selectedExam === 'TEPS'
                  ? 'bg-[#A855F7] text-white shadow-sm'
                  : 'bg-[#F8F9FA] text-[#767676] hover:bg-[#f0f0f0]'
              }`}
            >
              <span className="text-xl">🎓</span>
              <span className="font-semibold">TEPS</span>
              {!canAccessExam('TEPS') && <span className="text-sm">🔒</span>}
            </button>
          </div>
        </section>

        {/* 레벨 선택 섹션 (은행 앱 스타일) */}
        <section className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]">
          <h3 className="text-[15px] font-bold text-[#1c1c1e] mb-4">레벨 선택</h3>

          <div className="flex gap-3">
            {(['L1', 'L2', 'L3'] as const).map((lvl) => {
              const isLocked = !canAccessLevel(selectedExam, lvl);
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    if (isLocked) {
                      router.push('/pricing');
                    } else {
                      setActiveLevel(lvl);
                    }
                  }}
                  className={`flex-1 flex flex-col items-center py-4 rounded-[16px] transition-all ${
                    isLocked
                      ? 'bg-[#F8F9FA] text-[#999999] cursor-not-allowed'
                      : selectedLevel === lvl
                      ? 'bg-[#3B82F6] text-white shadow-sm'
                      : 'bg-[#F8F9FA] text-[#767676] hover:bg-[#f0f0f0]'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[16px]">{lvl}</span>
                    {isLocked && <span className="text-sm">🔒</span>}
                  </div>
                  <span className={`text-[12px] mt-1 ${
                    isLocked
                      ? 'text-[#999999]'
                      : selectedLevel === lvl
                      ? 'text-blue-100'
                      : 'text-[#999999]'
                  }`}>
                    {lvl === 'L1' ? '초급' : lvl === 'L2' ? '중급' : '고급'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2열 그리드 (데스크탑) */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* P0-3: 바로 학습 이어가기 카드 (은행 앱 스타일) */}
          <section className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1c1c1e]">바로 학습 이어가기</h3>
              <span className="text-[13px] text-[#14B8A6] font-semibold flex items-center gap-1">
                🔥 {stats?.currentStreak || 0}일 연속
              </span>
            </div>

            {/* 현재 학습 정보 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-[48px] h-[48px] rounded-full bg-[#ECFDF5] flex items-center justify-center">
                <span className="text-2xl">{exam.icon}</span>
              </div>
              <div>
                <p className="text-[16px] font-bold text-[#1c1c1e]">
                  {exam.name} {level.name}
                </p>
                <p className="text-[13px] text-[#767676]">
                  {level.description} • {level.target}
                </p>
              </div>
            </div>

            {/* 통계 3분할 */}
            <div className="flex justify-between items-center py-4 border-y border-[#f0f0f0] mb-4">
              <DashboardItem value={learnedWords} label="학습 완료" color="#3B82F6" loading={examLevelLoading} />
              <div className="w-[1px] h-10 bg-[#f0f0f0]" />
              <DashboardItem value={remainingWords} label="남은 단어" color="#F59E0B" loading={examLevelLoading} />
              <div className="w-[1px] h-10 bg-[#f0f0f0]" />
              <DashboardItem value={`${progressPercent}%`} label="진행률" color="#10B981" loading={examLevelLoading} />
            </div>

            {/* 프로그레스 바 */}
            <div className="w-full h-2 bg-[#f0f0f0] rounded-full mb-4 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] rounded-full transition-all duration-500 ${examLevelLoading ? 'animate-pulse' : ''}`}
                style={{ width: examLevelLoading ? '0%' : `${progressPercent}%` }}
              />
            </div>

            {/* 부가 정보 */}
            <div className="flex justify-between text-[13px] text-[#767676] mb-4">
              <span>마지막 학습: {stats?.lastActiveDate ? new Date(stats.lastActiveDate).toLocaleDateString('ko-KR') : '오늘'}</span>
              <span>오늘 목표: {dailyGoal}개</span>
            </div>

            {/* 버튼 */}
            {isCompleted ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 py-3 bg-[#ECFDF5] rounded-[14px]">
                  <span className="text-xl">✅</span>
                  <span className="text-[15px] font-semibold text-[#10B981]">학습 완료!</span>
                </div>
                <Link
                  href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}&restart=true`}
                  className="block w-full py-3 bg-[#F8F9FA] hover:bg-[#f0f0f0] rounded-[14px] text-[#767676] font-semibold text-center transition-colors"
                >
                  처음부터 다시 학습
                </Link>
                {weakWordCount > 0 && (
                  <Link
                    href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}&mode=weak`}
                    className="block w-full py-3 bg-[#FFF7ED] hover:bg-[#FFEDD5] rounded-[14px] text-[#F59E0B] font-semibold text-center transition-colors"
                  >
                    잘 모르는 단어 {weakWordCount}개만 학습
                  </Link>
                )}
              </div>
            ) : (
              <Link
                href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}`}
                className="block w-full py-4 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white font-bold text-[15px] rounded-[14px] text-center shadow-sm hover:shadow-md transition-shadow"
              >
                {learnedWords === 0 ? '학습 시작' : '이어서 학습'}
              </Link>
            )}
          </section>

          {/* P0-4: 연속 학습일 + 캘린더 (은행 앱 스타일) */}
          <section className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1c1c1e]">연속 학습일</h3>
              <span className="text-[13px] text-[#767676]">{currentYear}년 {currentMonth + 1}월</span>
            </div>

            {/* 현재/최장 연속 */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-[#ECFDF5] rounded-[14px] p-4 text-center">
                <span className="text-2xl mb-1 block">🔥</span>
                <p className="text-[22px] font-bold text-[#14B8A6]">{stats?.currentStreak || 0}일</p>
                <p className="text-[12px] text-[#767676]">현재 연속</p>
              </div>
              <div className="flex-1 bg-[#FFF7ED] rounded-[14px] p-4 text-center">
                <span className="text-2xl mb-1 block">🏆</span>
                <p className="text-[22px] font-bold text-[#F59E0B]">{stats?.longestStreak || 0}일</p>
                <p className="text-[12px] text-[#767676]">최장 기록</p>
              </div>
            </div>

            {/* 캘린더 그리드 */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* 요일 헤더 */}
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="text-[11px] text-[#999999] py-1">{day}</div>
              ))}
              {/* 빈 셀 */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="py-2" />
              ))}
              {/* 날짜들 */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate();
                const hasActivity = day <= today.getDate() && day > today.getDate() - (stats?.currentStreak || 0);

                return (
                  <div
                    key={day}
                    className={`py-2 text-[13px] rounded-full ${
                      isToday
                        ? 'bg-[#14B8A6] text-white font-bold'
                        : hasActivity
                        ? 'bg-[#ECFDF5] text-[#14B8A6] font-semibold'
                        : 'text-[#1c1c1e]'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
