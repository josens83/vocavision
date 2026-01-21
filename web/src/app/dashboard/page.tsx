'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import { progressAPI, wordsAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import ExamLevelSelector from '@/components/dashboard/ExamLevelSelector';

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

  const [stats, setStats] = useState<UserStats | null>(null);
  const [dueReviewCount, setDueReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [examLevelTotalWords, setExamLevelTotalWords] = useState(0);
  const [examLevelLearnedWords, setExamLevelLearnedWords] = useState(0);
  const [examLevelLoading, setExamLevelLoading] = useState(false);

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
    // 즉시 로딩 상태로 전환하고 이전 데이터 초기화 (버그 1 수정)
    setExamLevelLoading(true);
    setExamLevelLearnedWords(0);
    setExamLevelTotalWords(0);

    try {
      const examCategory = activeExam || 'CSAT';
      const level = activeLevel || 'L1';

      // 병렬 호출로 성능 개선 (5-8초 → 2-3초)
      const [totalData, unlearnedData] = await Promise.all([
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
      ]);

      const totalWords = totalData.pagination?.total || 0;
      const unlearnedWords = unlearnedData.pagination?.total || 0;

      setExamLevelTotalWords(totalWords);
      setExamLevelLearnedWords(totalWords - unlearnedWords);
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
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        {/* 모바일 헤더 - 시험 선택은 아래 ExamLevelSelector에서 */}
        <div className="lg:hidden mb-6">
          <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
        </div>

        {/* P0-2: 오늘의 학습 목표 Hero */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-pink-500/25">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-pink-100 text-sm mb-1">오늘의 학습 목표</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {todayRemaining > 0 ? (
                  <>다음 학습할 단어 <span className="text-yellow-300">{todayRemaining}개</span></>
                ) : (
                  <>축하합니다! 오늘 목표 달성! 🎉</>
                )}
              </h2>
              {todayRemaining > 0 ? (
                <p className="text-pink-100">
                  지금 시작하면 <strong className="text-white">{estimatedMinutes}분</strong>이면 끝나요
                </p>
              ) : (
                <p className="text-pink-100">
                  오늘 학습을 완료했어요! 추가로 더 학습하시겠어요?
                </p>
              )}
            </div>
            <Link
              href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}`}
              className="bg-white text-pink-600 px-8 py-4 rounded-xl font-bold text-center hover:bg-pink-50 transition shadow-lg whitespace-nowrap"
            >
              {todayRemaining > 0 ? '이어서 학습' : '추가 학습'}
            </Link>
          </div>
        </div>

        {/* 시험/레벨 선택 */}
        <ExamLevelSelector />

        {/* 2열 그리드 (데스크탑) */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* P0-3: 이어서 학습 카드 (정보 밀도 개선) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">바로 학습 이어가기</h2>
              <span className="text-sm text-pink-500 font-medium">
                🔥 {stats?.currentStreak || 0}일 연속
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${exam.gradient} flex items-center justify-center text-2xl flex-shrink-0`}>
                {exam.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{exam.name} {level.name}</p>
                <p className="text-sm text-gray-500">{level.description} • {level.target}</p>
              </div>
            </div>

            {/* Progress Info - 3분할 구분선 스타일 */}
            <div className="bg-gray-50 rounded-xl overflow-hidden mb-4">
              <div className="grid grid-cols-3 divide-x divide-gray-200">
                <div className="text-center py-4">
                  <p className="text-2xl font-bold text-blue-600">
                    {examLevelLoading ? (
                      <span className="inline-block w-8 h-6 bg-blue-200 rounded animate-pulse" />
                    ) : learnedWords}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">학습 완료</p>
                </div>
                <div className="text-center py-4">
                  <p className="text-2xl font-bold text-gray-400">
                    {examLevelLoading ? (
                      <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
                    ) : remainingWords}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">남은 단어</p>
                </div>
                <div className="text-center py-4">
                  <p className="text-2xl font-bold text-emerald-500">
                    {examLevelLoading ? (
                      <span className="inline-block w-8 h-6 bg-emerald-200 rounded animate-pulse" />
                    ) : `${progressPercent}%`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">진행률</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all ${examLevelLoading ? 'animate-pulse' : ''}`}
                    style={{ width: examLevelLoading ? '0%' : `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 최근 학습 정보 */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>마지막 학습: {stats?.lastActiveDate ? new Date(stats.lastActiveDate).toLocaleDateString('ko-KR') : '오늘'}</span>
              <span>오늘 목표: 20개</span>
            </div>

            <Link
              href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}`}
              className="block w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-bold text-center transition"
            >
              이어서 학습
            </Link>
          </div>

          {/* P0-4: 연속 학습일 + 캘린더 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">연속 학습일</h2>
              <span className="text-sm text-gray-500">{currentYear}년 {currentMonth + 1}월</span>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <span className="text-2xl">🔥</span>
                <p className="text-2xl font-bold text-orange-600">{stats?.currentStreak || 0}일</p>
                <p className="text-xs text-gray-500">현재 연속</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <span className="text-2xl">🏆</span>
                <p className="text-2xl font-bold text-red-600">{stats?.longestStreak || 0}일</p>
                <p className="text-xs text-gray-500">최장 기록</p>
              </div>
            </div>

            {/* 미니 캘린더 */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="py-1 text-gray-400 font-medium">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate();
                const hasActivity = day <= today.getDate() && day > today.getDate() - (stats?.currentStreak || 0);

                return (
                  <div
                    key={day}
                    className={`aspect-square flex items-center justify-center rounded-lg text-xs ${
                      isToday
                        ? 'bg-pink-500 text-white font-bold'
                        : hasActivity
                        ? 'bg-pink-100 text-pink-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
