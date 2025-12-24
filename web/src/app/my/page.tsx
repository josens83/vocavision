'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useExamCourseStore } from '@/lib/store';
import { progressAPI } from '@/lib/api';
import TabLayout from '@/components/layout/TabLayout';

interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalStudyTime?: number;
  averageAccuracy?: number;
}

interface TodayProgress {
  newWords: { current: number; goal: number };
  review: { current: number; goal: number };
  quiz: { score: number; total: number };
}

interface RecentWord {
  id: number;
  word: string;
  meaning: string;
  learnedAt: string;
}

export default function MyPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const activeExam = useExamCourseStore((state) => state.activeExam);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [todayProgress, setTodayProgress] = useState<TodayProgress>({
    newWords: { current: 0, goal: 10 },
    review: { current: 0, goal: 15 },
    quiz: { score: 0, total: 0 },
  });
  const [recentWords, setRecentWords] = useState<RecentWord[]>([]);
  const [examDate, setExamDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);

  // Exam names
  const examNames: Record<string, string> = {
    CSAT: '수능',
    SAT: 'SAT',
    TOEFL: 'TOEFL',
    TOEIC: 'TOEIC',
    TEPS: 'TEPS',
  };

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadStats();
    loadTodayProgress();
    loadRecentWords();
    loadExamDate();
  }, [user, hasHydrated, router]);

  const loadStats = async () => {
    try {
      const data = await progressAPI.getUserProgress();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayProgress = async () => {
    try {
      const data = await progressAPI.getTodayProgress();
      if (data) {
        setTodayProgress(data);
      }
    } catch (error) {
      // 오늘 진행도 API가 없으면 기본값 사용
      console.log('Today progress not available, using defaults');
    }
  };

  const loadRecentWords = async () => {
    try {
      const data = await progressAPI.getRecentWords(5);
      if (data?.words) {
        setRecentWords(data.words);
      }
    } catch (error) {
      // 최근 단어 API가 없으면 빈 배열 사용
      console.log('Recent words not available');
    }
  };

  const loadExamDate = () => {
    const savedDate = localStorage.getItem('examDate');
    if (savedDate) {
      setExamDate(savedDate);
    }
  };

  const saveExamDate = (date: string) => {
    localStorage.setItem('examDate', date);
    setExamDate(date);
    setShowDatePicker(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // Calculate D-day
  const calculateDDay = () => {
    if (!examDate) return null;
    const today = new Date();
    const exam = new Date(examDate);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const dDay = calculateDDay();

  if (!hasHydrated || loading) {
    return (
      <TabLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl text-gray-500">로딩 중...</div>
        </div>
      </TabLayout>
    );
  }

  return (
    <TabLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user?.name || '사용자'}</h1>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                user?.subscriptionStatus === 'ACTIVE'
                  ? 'bg-green-100 text-green-700'
                  : user?.subscriptionStatus === 'TRIAL'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {user?.subscriptionStatus === 'ACTIVE' && '프리미엄'}
                {user?.subscriptionStatus === 'TRIAL' && '무료 체험'}
                {user?.subscriptionStatus === 'FREE' && '무료'}
              </span>
            </div>
          </div>

          {/* Streak Display */}
          <div className="flex items-center justify-between bg-orange-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div>
                <p className="font-bold text-orange-700">{stats?.currentStreak || 0}일 연속</p>
                <p className="text-xs text-orange-600">최장 {stats?.longestStreak || 0}일</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">{stats?.totalWordsLearned || 0}</p>
              <p className="text-xs text-orange-500">학습한 단어</p>
            </div>
          </div>
        </div>

        {/* Primary CTA - 학습 시작 */}
        <Link
          href="/learn"
          className="block bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl p-6 mb-6 shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">지금 학습 시작</h2>
              <p className="text-pink-100 text-sm">오늘의 목표를 달성해보세요!</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Today's Progress - 오늘의 진행도 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">오늘의 진행도</h3>
          <div className="space-y-4">
            {/* New Words Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-lg">📚</span> 새로운 단어
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {todayProgress.newWords.current}/{todayProgress.newWords.goal}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayProgress.newWords.current / todayProgress.newWords.goal) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Review Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-lg">🔄</span> 복습
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {todayProgress.review.current}/{todayProgress.review.goal}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayProgress.review.current / todayProgress.review.goal) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Quiz Score */}
            {todayProgress.quiz.total > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-lg">✅</span> 퀴즈 점수
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {todayProgress.quiz.score}/{todayProgress.quiz.total}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${(todayProgress.quiz.score / todayProgress.quiz.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Words - 최근 학습 단어 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">최근 학습 단어</h3>
            {recentWords.length > 0 && (
              <Link href="/history" className="text-sm text-pink-600 font-medium">전체 보기 →</Link>
            )}
          </div>

          {recentWords.length > 0 ? (
            <div className="space-y-3">
              {recentWords.slice(0, 5).map((word) => (
                <div key={word.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{word.word}</p>
                    <p className="text-sm text-gray-500">{word.meaning}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(word.learnedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl mb-3 block">📖</span>
              <p className="text-gray-500 mb-4">아직 학습한 단어가 없어요</p>
              <Link
                href="/learn"
                className="inline-block bg-pink-100 text-pink-600 px-4 py-2 rounded-xl font-medium hover:bg-pink-200 transition"
              >
                첫 학습 시작하기
              </Link>
            </div>
          )}
        </div>

        {/* D-day Setting */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">시험일 설정</h3>

          {showDatePicker ? (
            <div className="space-y-3">
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveExamDate(examDate)}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-pink-500/25"
                >
                  저장
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                {examDate ? (
                  <>
                    <p className="text-sm text-gray-500">{examNames[activeExam || 'CSAT']} 시험일</p>
                    <p className="font-medium text-gray-900">{examDate}</p>
                    {dDay !== null && (
                      <p className={`text-lg font-bold ${dDay <= 7 ? 'text-red-500' : 'text-pink-600'}`}>
                        D-{dDay}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">시험일을 설정하면 D-day를 확인할 수 있어요</p>
                )}
              </div>
              <button
                onClick={() => setShowDatePicker(true)}
                className="bg-pink-100 text-pink-600 px-4 py-2 rounded-xl font-medium hover:bg-pink-200 transition"
              >
                {examDate ? '변경' : '설정'}
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">학습 통계</h3>
            <Link href="/statistics" className="text-sm text-pink-600 font-medium">상세 보기 →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats?.totalWordsLearned || 0}</p>
              <p className="text-xs text-gray-500 mt-1">총 학습 단어</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-500">{stats?.currentStreak || 0}일</p>
              <p className="text-xs text-gray-500 mt-1">현재 스트릭</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-500">{stats?.averageAccuracy || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">평균 정확도</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-500">{stats?.longestStreak || 0}일</p>
              <p className="text-xs text-gray-500 mt-1">최장 스트릭</p>
            </div>
          </div>
        </div>

        {/* Menu Links */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <Link href="/achievements" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <span className="font-medium text-gray-900">업적</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/history" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">📝</span>
              <span className="font-medium text-gray-900">학습 기록</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/decks" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">🃏</span>
              <span className="font-medium text-gray-900">커스텀 덱</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/leagues" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏅</span>
              <span className="font-medium text-gray-900">리그 / 랭킹</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/bookmarks" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <span className="text-xl">⭐</span>
              <span className="font-medium text-gray-900">북마크</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Settings & Support */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <Link href="/settings" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚙️</span>
              <span className="font-medium text-gray-900">설정</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/notifications" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <span className="font-medium text-gray-900">알림</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          {user?.subscriptionStatus !== 'ACTIVE' && (
            <Link href="/pricing" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xl">💎</span>
                <span className="font-medium text-pink-600">프리미엄 업그레이드</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          <Link href="/chat" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <span className="font-medium text-gray-900">도움말 / AI 도우미</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-medium hover:bg-gray-200 transition"
        >
          로그아웃
        </button>

        {/* App Version */}
        <p className="text-center text-xs text-gray-400 mt-6">
          VocaVision AI v1.0.0
        </p>
      </div>
    </TabLayout>
  );
}
