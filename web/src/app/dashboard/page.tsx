'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import { progressAPI, authAPI, wordsAPI } from '@/lib/api';
import TabLayout from '@/components/layout/TabLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Exam info for display
const examInfo: Record<string, { name: string; icon: string; gradient: string }> = {
  CSAT: { name: '수능', icon: '📝', gradient: 'from-blue-500 to-blue-600' },
  SAT: { name: 'SAT', icon: '🇺🇸', gradient: 'from-red-500 to-red-600' },
  TOEFL: { name: 'TOEFL', icon: '🌍', gradient: 'from-orange-500 to-orange-600' },
  TOEIC: { name: 'TOEIC', icon: '💼', gradient: 'from-green-500 to-green-600' },
  TEPS: { name: 'TEPS', icon: '🎓', gradient: 'from-purple-500 to-purple-600' },
};

// Level info
const levelInfo = [
  { id: 'L1', name: '초급', description: '기초 필수 단어', target: '3등급 목표', color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'L2', name: '중급', description: '핵심 어휘', target: '2등급 목표', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'L3', name: '고급', description: '고난도 어휘', target: '1등급 목표', color: 'bg-purple-100 text-purple-700 border-purple-300' },
];

interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

interface DueReview {
  count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [dueReviews, setDueReviews] = useState<DueReview>({ count: 0 });
  const [selectedLevel, setSelectedLevel] = useState('L1');
  const [dDay, setDDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // D-day calculation (stored exam date)
  const [examDate, setExamDate] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadDashboardData();
    loadExamDate();
  }, [user, hasHydrated, router]);

  const loadDashboardData = async () => {
    try {
      const [progressData, reviewsData] = await Promise.all([
        progressAPI.getUserProgress(),
        progressAPI.getDueReviews(),
      ]);

      setStats(progressData.stats);
      setDueReviews({ count: reviewsData.count });

      // Load saved level from localStorage
      const savedLevel = localStorage.getItem('selectedLevel');
      if (savedLevel) {
        setSelectedLevel(savedLevel);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExamDate = () => {
    // Load exam date from localStorage
    const savedDate = localStorage.getItem('examDate');
    if (savedDate) {
      setExamDate(savedDate);
      const today = new Date();
      const exam = new Date(savedDate);
      const diffTime = exam.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDDay(diffDays > 0 ? diffDays : null);
    }
  };

  const selectedExam = activeExam || 'CSAT';
  const examData = examInfo[selectedExam];
  const selectedLevelInfo = levelInfo.find(l => l.id === selectedLevel) || levelInfo[0];

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    localStorage.setItem('selectedLevel', level);
  };

  if (!hasHydrated || loading) {
    return (
      <TabLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">로딩 중...</div>
        </div>
      </TabLayout>
    );
  }

  return (
    <TabLayout
      headerRight={
        <div className="flex items-center gap-3">
          {/* Exam Selector */}
          <select
            value={selectedExam}
            onChange={(e) => setActiveExam(e.target.value as ExamType)}
            className="text-sm border rounded-lg px-2 py-1 bg-white"
          >
            <option value="CSAT">수능</option>
            <option value="TOEIC">TOEIC</option>
            <option value="TOEFL">TOEFL</option>
            <option value="TEPS">TEPS</option>
          </select>
          {/* Streak */}
          <div className="flex items-center gap-1 text-orange-500 font-bold">
            <span>🔥</span>
            <span>{stats?.currentStreak || 0}일</span>
          </div>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-6">
        {/* Level Selection */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">학습 레벨 선택</h3>
          <div className="grid grid-cols-3 gap-2">
            {levelInfo.map((level) => (
              <button
                key={level.id}
                onClick={() => handleLevelChange(level.id)}
                className={`p-3 rounded-xl border-2 transition text-left ${
                  selectedLevel === level.id
                    ? level.color + ' border-current'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <p className="font-bold text-sm">{level.name}</p>
                <p className="text-xs opacity-80">{level.target}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main CTA Card */}
        <div className={`bg-gradient-to-br ${examData.gradient} rounded-2xl p-6 text-white mb-6 shadow-lg`}>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{examData.icon}</span>
              <div>
                <p className="text-white/80 text-sm">{examData.name} • {selectedLevelInfo.name}</p>
                <p className="font-bold">{selectedLevelInfo.description}</p>
              </div>
            </div>
            <p className="text-white/70 text-sm">{selectedLevelInfo.target}</p>
          </div>

          {/* Primary CTA Button */}
          <Link
            href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}`}
            className="block w-full bg-white text-blue-600 py-4 rounded-xl text-center font-bold text-lg hover:bg-blue-50 transition shadow-md"
          >
            ▶ 학습 시작하기
          </Link>
        </div>

        {/* Sub Cards Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* D-day Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            {dDay !== null ? (
              <>
                <p className="text-xs text-gray-500 mb-1">{examData.name} 시험일</p>
                <p className={`text-3xl font-bold ${dDay <= 7 ? 'text-red-500' : 'text-blue-600'}`}>
                  D-{dDay}
                </p>
              </>
            ) : (
              <Link href="/my" className="block">
                <p className="text-xs text-gray-500 mb-1">시험일 설정</p>
                <p className="text-lg font-medium text-blue-600">설정하기 →</p>
              </Link>
            )}
          </div>

          {/* Total Words Learned */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">총 학습 단어</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.totalWordsLearned || 0}개</p>
            <p className="text-xs text-gray-400 mt-1">
              🔥 {stats?.currentStreak || 0}일 연속 학습 중
            </p>
          </div>
        </div>

        {/* Review Reminder */}
        {dueReviews.count > 0 && (
          <Link
            href="/review"
            className="block bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 hover:bg-yellow-100 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <p className="font-medium text-gray-900">복습할 단어가 있어요!</p>
                  <p className="text-sm text-gray-600">{dueReviews.count}개 단어 복습 대기 중</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Link>
        )}

        {/* Quick Actions - 최대 4개만 */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">빠른 학습</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/courses/${selectedExam.toLowerCase()}`}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <span className="text-2xl mb-2 block">📖</span>
              <p className="font-medium text-gray-900">Day별 학습</p>
              <p className="text-xs text-gray-500">30일 완성 코스</p>
            </Link>
            <Link
              href={`/quiz?exam=${selectedExam.toLowerCase()}`}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <span className="text-2xl mb-2 block">🎯</span>
              <p className="font-medium text-gray-900">퀴즈</p>
              <p className="text-xs text-gray-500">실력 테스트</p>
            </Link>
            <Link
              href="/games"
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <span className="text-2xl mb-2 block">🎮</span>
              <p className="font-medium text-gray-900">게임</p>
              <p className="text-xs text-gray-500">재미있게 복습</p>
            </Link>
            <Link
              href="/chat"
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <span className="text-2xl mb-2 block">🤖</span>
              <p className="font-medium text-gray-900">AI 도우미</p>
              <p className="text-xs text-gray-500">질문하기</p>
            </Link>
          </div>
        </div>

        {/* Weekly Stats Mini */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">이번 주 학습</h3>
            <Link href="/my" className="text-sm text-blue-600">상세 →</Link>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats?.totalWordsLearned || 0}</p>
              <p className="text-xs text-gray-500">학습 단어</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{stats?.currentStreak || 0}</p>
              <p className="text-xs text-gray-500">연속 일수</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{dueReviews.count}</p>
              <p className="text-xs text-gray-500">복습 대기</p>
            </div>
          </div>
        </div>
      </div>
    </TabLayout>
  );
}
