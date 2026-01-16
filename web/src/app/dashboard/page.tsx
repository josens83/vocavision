'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import { progressAPI, wordsAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { StatsOverview } from '@/components/dashboard';
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

// Badge definitions
const badges = [
  { id: 'streak7', name: '7일 연속 학습', icon: '🔥', description: '7일 연속 학습 달성', condition: (stats: any) => stats?.currentStreak >= 7 },
  { id: 'words100', name: '100단어 마스터', icon: '📚', description: '100개 단어 학습 완료', condition: (stats: any) => stats?.totalWordsLearned >= 100 },
  { id: 'words500', name: '500단어 마스터', icon: '🎯', description: '500개 단어 학습 완료', condition: (stats: any) => stats?.totalWordsLearned >= 500 },
];

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

  // Calculate estimated time (assuming 10 words per 3 minutes)
  const estimatedMinutes = Math.ceil(dueReviewCount * 0.3);

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
        {/* 모바일 헤더 */}
        <div className="lg:hidden mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
          <select
            value={selectedExam}
            onChange={(e) => setActiveExam(e.target.value as ExamType)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white font-medium"
          >
            {Object.entries(examInfo).map(([key, info]) => (
              <option key={key} value={key}>{info.name}</option>
            ))}
          </select>
        </div>

        {/* P0-2: 오늘 해야 할 일 Hero (Fastcampus 스타일) */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-pink-500/25">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-pink-100 text-sm mb-1">오늘의 할 일</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {dueReviewCount > 0 ? (
                  <>복습할 단어 <span className="text-yellow-300">{dueReviewCount}개</span></>
                ) : (
                  <>새로운 단어를 학습해보세요</>
                )}
              </h2>
              {dueReviewCount > 0 ? (
                <p className="text-pink-100">
                  지금 시작하면 <strong className="text-white">{estimatedMinutes}분</strong>이면 끝나요
                </p>
              ) : (
                <p className="text-pink-100">
                  오늘 목표: 새 단어 <strong className="text-white">20개</strong> 학습하기
                </p>
              )}
            </div>
            <Link
              href={dueReviewCount > 0 ? '/review' : `/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}`}
              className="bg-white text-pink-600 px-8 py-4 rounded-xl font-bold text-center hover:bg-pink-50 transition shadow-lg whitespace-nowrap"
            >
              {dueReviewCount > 0 ? '복습 시작' : '학습 시작'}
            </Link>
          </div>
        </div>

        {/* Quick Actions - Fastcampus 스타일 아이콘 네비 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Link href="/review" className="bg-white rounded-xl p-4 text-center hover:bg-gray-50 transition border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">🔄</span>
            </div>
            <span className="text-xs font-medium text-gray-700">오늘 복습</span>
            {dueReviewCount > 0 && (
              <span className="block text-xs text-orange-500 font-bold">{dueReviewCount}개</span>
            )}
          </Link>
          <Link href="/words?filter=weak" className="bg-white rounded-xl p-4 text-center hover:bg-gray-50 transition border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">🔥</span>
            </div>
            <span className="text-xs font-medium text-gray-700">약한 단어</span>
          </Link>
          <Link href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}`} className="bg-white rounded-xl p-4 text-center hover:bg-gray-50 transition border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">🆕</span>
            </div>
            <span className="text-xs font-medium text-gray-700">새 단어</span>
          </Link>
          <Link href="/quiz" className="bg-white rounded-xl p-4 text-center hover:bg-gray-50 transition border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">🎯</span>
            </div>
            <span className="text-xs font-medium text-gray-700">퀴즈</span>
          </Link>
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

            {/* Progress Info - 분모/분자 밀도 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center mb-3">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {examLevelLoading ? (
                      <span className="inline-block w-8 h-6 bg-blue-200 rounded animate-pulse" />
                    ) : learnedWords}
                  </p>
                  <p className="text-xs text-gray-500">학습 완료</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-400">
                    {examLevelLoading ? (
                      <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
                    ) : remainingWords}
                  </p>
                  <p className="text-xs text-gray-500">남은 단어</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {examLevelLoading ? (
                      <span className="inline-block w-8 h-6 bg-green-200 rounded animate-pulse" />
                    ) : `${progressPercent}%`}
                  </p>
                  <p className="text-xs text-gray-500">진행률</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all ${examLevelLoading ? 'animate-pulse' : ''}`}
                  style={{ width: examLevelLoading ? '0%' : `${progressPercent}%` }}
                />
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

        {/* KPI 통계 3개 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats?.totalWordsLearned || 0}</p>
            <p className="text-sm text-gray-500">학습한 단어</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{stats?.currentStreak || 0}일</p>
            <p className="text-sm text-gray-500">연속 학습</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{dueReviewCount}</p>
            <p className="text-sm text-gray-500">복습 대기</p>
          </div>
        </div>

        {/* P1-1: 배지 섹션 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">내 배지</h2>
            <Link href="/achievements" className="text-sm text-pink-600 font-medium inline-flex items-center gap-1">전체 보기 <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => {
              const isEarned = badge.condition(stats);
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl text-center transition ${
                    isEarned
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200'
                      : 'bg-gray-50 opacity-50'
                  }`}
                >
                  <span className={`text-3xl ${!isEarned && 'grayscale'}`}>{badge.icon}</span>
                  <p className={`text-sm font-medium mt-2 ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}>
                    {badge.name}
                  </p>
                  {!isEarned && (
                    <p className="text-xs text-gray-400 mt-1">미획득</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 상세 통계 */}
        <div className="mb-6">
          <StatsOverview exam={selectedExam} />
        </div>
      </div>
    </DashboardLayout>
  );
}
