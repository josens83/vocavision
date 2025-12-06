'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import { progressAPI } from '@/lib/api';
import TabLayout from '@/components/layout/TabLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

// Exam info
const examInfo: Record<string, { name: string; icon: string; gradient: string; color: string }> = {
  CSAT: { name: '수능', icon: '📝', gradient: 'from-blue-500 to-blue-600', color: 'blue' },
  TOEIC: { name: 'TOEIC', icon: '💼', gradient: 'from-green-500 to-green-600', color: 'green' },
  TOEFL: { name: 'TOEFL', icon: '🌍', gradient: 'from-orange-500 to-orange-600', color: 'orange' },
  TEPS: { name: 'TEPS', icon: '🎓', gradient: 'from-purple-500 to-purple-600', color: 'purple' },
};

// Level info
const levelInfo: Record<string, { name: string; description: string; target: string }> = {
  L1: { name: '초급', description: '기초 필수 단어', target: '3등급 목표' },
  L2: { name: '중급', description: '핵심 어휘', target: '2등급 목표' },
  L3: { name: '고급', description: '고난도 어휘', target: '1등급 목표' },
};

interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [dueReviewCount, setDueReviewCount] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState('L1');
  const [loading, setLoading] = useState(true);

  // Get current month calendar data
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

  const loadData = async () => {
    try {
      const [progressData, reviewsData] = await Promise.all([
        progressAPI.getUserProgress(),
        progressAPI.getDueReviews(),
      ]);
      setStats(progressData.stats);
      setDueReviewCount(reviewsData.count || 0);

      // Load saved preferences
      const savedLevel = localStorage.getItem('selectedLevel');
      if (savedLevel) setSelectedLevel(savedLevel);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    localStorage.setItem('selectedLevel', level);
  };

  const selectedExam = activeExam || 'CSAT';
  const exam = examInfo[selectedExam];
  const level = levelInfo[selectedLevel];

  // Calculate progress (mock - would come from API)
  const totalWords = 1500;
  const learnedWords = stats?.totalWordsLearned || 0;
  const progressPercent = Math.min(Math.round((learnedWords / totalWords) * 100), 100);

  if (!hasHydrated || loading) {
    return (
      <TabLayout>
        <SkeletonDashboard />
      </TabLayout>
    );
  }

  return (
    <TabLayout
      headerRight={
        <div className="flex items-center gap-3">
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
      }
    >
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Hero Section - Skillflo 스타일 */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            오늘도 영어 실력을 키워볼까요?
          </h1>
          <p className="text-gray-500">
            매일 조금씩, 꾸준히 학습하면 실력이 쑥쑥 늘어요.
          </p>
        </div>

        {/* 이어서 학습 섹션 - FastCampus 스타일 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">바로 학습을 이어갈까요?</h2>
            <span className="text-sm text-pink-500 font-medium">
              {stats?.currentStreak || 0}일 연속 학습 중
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${exam.gradient} flex items-center justify-center text-2xl`}>
                  {exam.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{exam.name} {level.name} 코스</p>
                  <p className="text-sm text-gray-500">{level.description} • {level.target}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">학습 진도</span>
                  <span className="font-medium text-blue-600">{learnedWords} / {totalWords} 단어</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}`}
              className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-xl font-bold text-center transition shadow-lg shadow-pink-500/25"
            >
              이어서 학습
            </Link>
          </div>
        </div>

        {/* 레벨 선택 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">학습 레벨</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(levelInfo).map(([key, info]) => (
              <button
                key={key}
                onClick={() => handleLevelChange(key)}
                className={`p-4 rounded-xl border-2 transition text-left ${
                  selectedLevel === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <p className={`font-bold ${selectedLevel === key ? 'text-blue-600' : 'text-gray-900'}`}>
                  {info.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{info.target}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 연속 수강일 - FastCampus 스타일 캘린더 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">연속 학습일</h2>
            <span className="text-sm text-gray-500">
              {currentYear}년 {currentMonth + 1}월
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Stats */}
            <div className="flex-shrink-0 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🔥</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats?.currentStreak || 0}일</p>
                  <p className="text-xs text-gray-500">현재 연속 학습일</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🏆</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats?.longestStreak || 0}일</p>
                  <p className="text-xs text-gray-500">최장 기록</p>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="flex-1">
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for first day offset */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === today.getDate();
                  const isSunday = (firstDayOfMonth + i) % 7 === 0;
                  const isSaturday = (firstDayOfMonth + i) % 7 === 6;
                  // Mock: assume recent days have activity
                  const hasActivity = day <= today.getDate() && day > today.getDate() - (stats?.currentStreak || 0);

                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                        isToday
                          ? 'bg-blue-500 text-white font-bold'
                          : hasActivity
                          ? 'bg-blue-100 text-blue-700'
                          : isSunday
                          ? 'text-red-400'
                          : isSaturday
                          ? 'text-blue-400'
                          : 'text-gray-600'
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

        {/* 학습 통계 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">학습 통계</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600">{stats?.totalWordsLearned || 0}</p>
              <p className="text-sm text-gray-500 mt-1">학습한 단어</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-3xl font-bold text-orange-500">{stats?.currentStreak || 0}일</p>
              <p className="text-sm text-gray-500 mt-1">연속 학습</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-3xl font-bold text-green-500">{dueReviewCount}</p>
              <p className="text-sm text-gray-500 mt-1">복습 대기</p>
            </div>
          </div>
        </div>

        {/* 복습 알림 */}
        {dueReviewCount > 0 && (
          <Link
            href="/review"
            className="block bg-yellow-50 border border-yellow-200 rounded-2xl p-5 hover:bg-yellow-100 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">📚</span>
                <div>
                  <p className="font-bold text-gray-900">복습할 단어가 {dueReviewCount}개 있어요!</p>
                  <p className="text-sm text-gray-600">지금 복습하면 기억이 더 오래 남아요</p>
                </div>
              </div>
              <span className="text-2xl text-gray-400">→</span>
            </div>
          </Link>
        )}
      </div>
    </TabLayout>
  );
}
