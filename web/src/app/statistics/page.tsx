'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LearningHeatmap from '@/components/statistics/LearningHeatmap';
import PredictiveAnalytics from '@/components/statistics/PredictiveAnalytics';

// Benchmarking: Advanced statistics dashboard
// Phase 2-2: 고급 통계 및 예측 분석 대시보드

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

interface Progress {
  id: string;
  wordId: string;
  masteryLevel: string;
  correctCount: number;
  incorrectCount: number;
  totalReviews: number;
  lastReviewDate: string | null;
  word: {
    word: string;
    difficulty: string;
    level?: string;
    examCategory?: string;
    examLevels?: { examCategory: string; level: string }[];
  };
}

interface MasteryDistribution {
  examCategory: string;
  level: string;
  totalWords: number;
  distribution: {
    notSeen: number;
    learning: number;
    familiar: number;
    mastered: number;
  };
}

// 데모 모드용 샘플 데이터
const DEMO_STATS: UserStats = {
  totalWordsLearned: 156,
  currentStreak: 7,
  longestStreak: 14,
  lastActiveDate: new Date().toISOString(),
};

const DEMO_PROGRESS: Progress[] = [
  { id: '1', wordId: 'w1', masteryLevel: 'MASTERED', correctCount: 5, incorrectCount: 0, totalReviews: 5, lastReviewDate: new Date().toISOString(), word: { word: 'abundant', difficulty: 'BEGINNER', level: 'L1', examCategory: 'CSAT' } },
  { id: '2', wordId: 'w2', masteryLevel: 'MASTERED', correctCount: 4, incorrectCount: 1, totalReviews: 5, lastReviewDate: new Date().toISOString(), word: { word: 'benevolent', difficulty: 'INTERMEDIATE', level: 'L2', examCategory: 'CSAT' } },
  { id: '3', wordId: 'w3', masteryLevel: 'FAMILIAR', correctCount: 3, incorrectCount: 1, totalReviews: 4, lastReviewDate: new Date().toISOString(), word: { word: 'comprehensive', difficulty: 'INTERMEDIATE', level: 'L2', examCategory: 'CSAT' } },
  { id: '4', wordId: 'w4', masteryLevel: 'FAMILIAR', correctCount: 2, incorrectCount: 1, totalReviews: 3, lastReviewDate: new Date().toISOString(), word: { word: 'diligent', difficulty: 'BEGINNER', level: 'L1', examCategory: 'CSAT' } },
  { id: '5', wordId: 'w5', masteryLevel: 'LEARNING', correctCount: 2, incorrectCount: 2, totalReviews: 4, lastReviewDate: new Date().toISOString(), word: { word: 'eloquent', difficulty: 'ADVANCED', level: 'L3', examCategory: 'CSAT' } },
  { id: '6', wordId: 'w6', masteryLevel: 'LEARNING', correctCount: 1, incorrectCount: 2, totalReviews: 3, lastReviewDate: new Date().toISOString(), word: { word: 'fluctuate', difficulty: 'ADVANCED', level: 'L3', examCategory: 'CSAT' } },
  { id: '7', wordId: 'w7', masteryLevel: 'NEW', correctCount: 0, incorrectCount: 1, totalReviews: 1, lastReviewDate: new Date().toISOString(), word: { word: 'gratitude', difficulty: 'BEGINNER', level: 'L1', examCategory: 'CSAT' } },
  { id: '8', wordId: 'w8', masteryLevel: 'NEW', correctCount: 0, incorrectCount: 0, totalReviews: 0, lastReviewDate: null, word: { word: 'hypothesis', difficulty: 'EXPERT', level: 'L1', examCategory: 'TEPS' } },
];

function StatisticsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [masteryDist, setMasteryDist] = useState<MasteryDistribution | null>(null);
  const [heatmapData, setHeatmapData] = useState<Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>>([]);
  const [loading, setLoading] = useState(true);

  // 숙련도 분포 필터 (독립적)
  const [masteryExam, setMasteryExam] = useState<string>('CSAT');
  const [masteryLevel, setMasteryLevel] = useState<string>('all');

  // 레벨별 학습 현황 필터 (독립적)
  const [levelProgressExam, setLevelProgressExam] = useState<string>('CSAT');

  useEffect(() => {
    if (!hasHydrated) return;

    // 데모 모드일 경우 샘플 데이터 사용
    if (isDemo && !user) {
      setStats(DEMO_STATS);
      setProgress(DEMO_PROGRESS);
      setLoading(false);
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadStatistics();
  }, [user, hasHydrated, router, isDemo]);

  const loadStatistics = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const [progressResponse, activityResponse] = await Promise.all([
        axios.get(`${API_URL}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/progress/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(progressResponse.data.stats);
      setProgress(progressResponse.data.progress || []);
      setHeatmapData(activityResponse.data.heatmapData || []);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // 숙련도 분포 로드 (시험/레벨 변경 시 - 독립적)
  useEffect(() => {
    if (!hasHydrated || !user || isDemo) return;

    const loadMasteryDistribution = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${API_URL}/progress/mastery`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { examCategory: masteryExam, level: masteryLevel },
        });
        setMasteryDist(response.data);
      } catch (error) {
        console.error('Failed to load mastery distribution:', error);
      }
    };

    loadMasteryDistribution();
  }, [masteryExam, masteryLevel, user, hasHydrated, isDemo]);

  // 필터링된 progress (examLevels 기반) - 숙련도 분포용
  const getFilteredProgress = () => {
    return progress.filter((p) => {
      // examLevels 관계 사용
      if (p.word.examLevels && p.word.examLevels.length > 0) {
        const hasMatchingExamLevel = p.word.examLevels.some((el) => {
          const examMatch = el.examCategory === masteryExam;
          const levelMatch = masteryLevel === 'all' || el.level === masteryLevel;
          return examMatch && levelMatch;
        });
        return hasMatchingExamLevel;
      }
      // fallback: 기존 필드 사용
      if (p.word.examCategory && p.word.examCategory !== masteryExam) {
        return false;
      }
      if (masteryLevel !== 'all' && p.word.level !== masteryLevel) {
        return false;
      }
      return true;
    });
  };

  // API에서 가져온 숙련도 분포 사용 (데모 모드에서는 로컬 계산)
  const getMasteryDistributionData = () => {
    // API 데이터가 있으면 사용
    if (masteryDist && !isDemo) {
      return {
        NEW: masteryDist.distribution.notSeen,
        LEARNING: masteryDist.distribution.learning,
        FAMILIAR: masteryDist.distribution.familiar,
        MASTERED: masteryDist.distribution.mastered,
      };
    }

    // 데모 모드 또는 API 데이터 없을 때: 로컬 계산
    const distribution = {
      NEW: 0,
      LEARNING: 0,
      FAMILIAR: 0,
      MASTERED: 0,
    };

    const filtered = getFilteredProgress();
    filtered.forEach((p) => {
      distribution[p.masteryLevel as keyof typeof distribution]++;
    });

    return distribution;
  };

  // 레벨별 학습 현황 (독립적 필터)
  const getLevelDistribution = () => {
    const distribution = {
      L1: 0,
      L2: 0,
      L3: 0,
    };

    // 선택된 시험 기준으로 필터링 (레벨별 학습 현황 전용)
    const filtered = progress.filter((p) => {
      // examLevels 관계 사용
      if (p.word.examLevels && p.word.examLevels.length > 0) {
        return p.word.examLevels.some((el) => el.examCategory === levelProgressExam);
      }
      // fallback: 기존 필드 사용
      if (p.word.examCategory && p.word.examCategory !== levelProgressExam) {
        return false;
      }
      return true;
    });

    filtered.forEach((p) => {
      // examLevels에서 레벨 가져오기
      let level = 'L1';
      if (p.word.examLevels && p.word.examLevels.length > 0) {
        const matchingExamLevel = p.word.examLevels.find((el) => el.examCategory === levelProgressExam);
        level = matchingExamLevel?.level || p.word.level || 'L1';
      } else {
        level = p.word.level || 'L1';
      }
      if (distribution.hasOwnProperty(level)) {
        distribution[level as keyof typeof distribution]++;
      }
    });

    return distribution;
  };

  const getAccuracyRate = () => {
    const total = progress.reduce((sum, p) => sum + p.totalReviews, 0);
    const correct = progress.reduce((sum, p) => sum + p.correctCount, 0);
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const masteryDistData = getMasteryDistributionData();
  const levelDist = getLevelDistribution();
  const accuracyRate = getAccuracyRate();

  const masteryColors = {
    NEW: 'bg-gray-500',
    LEARNING: 'bg-yellow-500',
    FAMILIAR: 'bg-blue-500',
    MASTERED: 'bg-green-500',
  };

  const masteryLabels = {
    NEW: '아직 안 본 단어',
    LEARNING: '공부 중 (아직 어려움)',
    FAMILIAR: '어느 정도 암기됨',
    MASTERED: '완전히 암기 완료!',
  };

  const levelColors = {
    L1: 'bg-green-500',
    L2: 'bg-blue-500',
    L3: 'bg-orange-500',
  };

  const levelLabels = {
    L1: '초급 (L1)',
    L2: '중급 (L2)',
    L3: '고급 (L3)',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-40 bg-gray-200 rounded mb-8" />
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-32" />
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-2xl p-6 h-64" />
              <div className="bg-white rounded-2xl p-6 h-64" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* 최상위 컨테이너: overflow-x 방지 */}
      <div className="p-4 lg:p-8 max-w-6xl mx-auto w-full overflow-x-hidden">
        {/* 데모 모드 배너 */}
        {isDemo && !user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-bold text-xs">체험</span>
                <span className="text-amber-800 text-sm">샘플 데이터로 학습 분석 기능을 미리 체험해보세요</span>
              </div>
              <Link
                href="/auth/register"
                className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition whitespace-nowrap"
              >
                무료 회원가입
              </Link>
            </div>
          </div>
        )}

        {/* 페이지 헤더 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">상세 통계</h1>
          <p className="text-gray-500 text-sm mt-1">학습 진행 상황과 패턴을 분석합니다</p>
        </div>
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            icon="📚"
            title="학습한 단어"
            value={stats?.totalWordsLearned || 0}
            color="blue"
          />
          <StatCard
            icon="🔥"
            title="현재 연속"
            value={stats?.currentStreak || 0}
            suffix="일"
            color="orange"
          />
          <StatCard
            icon="🏆"
            title="최장 연속"
            value={stats?.longestStreak || 0}
            suffix="일"
            color="purple"
          />
          <StatCard
            icon="✅"
            title="정확도"
            value={accuracyRate}
            suffix="%"
            color="green"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8 w-full max-w-full">
          {/* Mastery Level Distribution */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">숙련도 분포</h2>
              <div className="flex gap-2 flex-shrink-0">
                <select
                  value={masteryExam}
                  onChange={(e) => setMasteryExam(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="CSAT">수능</option>
                  <option value="TEPS">TEPS</option>
                </select>
                <select
                  value={masteryLevel}
                  onChange={(e) => setMasteryLevel(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="all">전체</option>
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                </select>
              </div>
            </div>
            <div className="space-y-4 w-full">
              {Object.entries(masteryDistData).map(([level, count]) => {
                const total = Object.values(masteryDistData).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const safePercentage = isNaN(percentage) ? 0 : Math.round(percentage);
                const safeCount = isNaN(count) ? 0 : count;

                return (
                  <div key={level} className="w-full">
                    {/* 라벨 + 수치: 위에 배치 */}
                    <div className="flex justify-between items-center gap-2 mb-1.5">
                      <span className="font-medium text-xs sm:text-sm text-slate-700 truncate flex-1 min-w-0">
                        {masteryLabels[level as keyof typeof masteryLabels]}
                      </span>
                      <span className="text-slate-600 text-xs sm:text-sm whitespace-nowrap font-medium">
                        {safeCount}개 ({safePercentage}%)
                      </span>
                    </div>
                    {/* 프로그레스 바: 전체 너비 */}
                    <div className="w-full bg-slate-100 rounded-full h-2 sm:h-2.5 overflow-hidden">
                      <div
                        className={`${
                          masteryColors[level as keyof typeof masteryColors]
                        } h-full rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(safePercentage, 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level Distribution */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm w-full max-w-full overflow-hidden">
            <div className="flex justify-between items-center gap-2 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold truncate">레벨별 학습 현황</h2>
              <select
                value={levelProgressExam}
                onChange={(e) => setLevelProgressExam(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500 flex-shrink-0"
              >
                <option value="CSAT">수능</option>
                <option value="TEPS">TEPS</option>
              </select>
            </div>
            <div className="space-y-4 w-full">
              {Object.entries(levelDist).map(([level, count]) => {
                const total = Object.values(levelDist).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const safePercentage = isNaN(percentage) ? 0 : Math.round(percentage);
                const safeCount = isNaN(count) ? 0 : count;

                return (
                  <div key={level} className="w-full">
                    {/* 라벨 + 수치: 위에 배치 */}
                    <div className="flex justify-between items-center gap-2 mb-1.5">
                      <span className="font-medium text-xs sm:text-sm text-slate-700">
                        {levelLabels[level as keyof typeof levelLabels]}
                      </span>
                      <span className="text-slate-600 text-xs sm:text-sm whitespace-nowrap font-medium">
                        {safeCount}개 ({safePercentage}%)
                      </span>
                    </div>
                    {/* 프로그레스 바: 전체 너비 */}
                    <div className="w-full bg-slate-100 rounded-full h-2 sm:h-2.5 overflow-hidden">
                      <div
                        className={`${
                          levelColors[level as keyof typeof levelColors]
                        } h-full rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(safePercentage, 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* NEW: Learning Heatmap - Phase 2-2 */}
        <div className="mb-8 w-full max-w-full overflow-x-auto">
          <LearningHeatmap
            data={heatmapData.length > 0 ? heatmapData : undefined}
            currentStreakOverride={stats?.currentStreak || 0}
            longestStreakOverride={stats?.longestStreak || 0}
          />
        </div>

        {/* NEW: Predictive Analytics - Phase 2-2 */}
        <div className="mb-8 w-full max-w-full overflow-hidden">
          <PredictiveAnalytics />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  title,
  value,
  suffix = '',
  color,
}: {
  icon: string;
  title: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  }[color];

  return (
    <div className={`${colorClasses} rounded-2xl p-3 sm:p-6`}>
      <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{icon}</div>
      <div className="text-xs sm:text-sm opacity-80 mb-1">{title}</div>
      <div className="text-xl sm:text-3xl font-bold">
        {value}
        {suffix && <span className="text-sm sm:text-lg ml-1">{suffix}</span>}
      </div>
    </div>
  );
}

// Loading component for Suspense
function StatisticsPageLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 w-40 bg-gray-200 rounded mb-8" />
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 h-32" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-2xl p-6 h-64" />
            <div className="bg-white rounded-2xl p-6 h-64" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Suspense boundary로 감싸서 export
export default function StatisticsPage() {
  return (
    <Suspense fallback={<StatisticsPageLoading />}>
      <StatisticsPageContent />
    </Suspense>
  );
}
