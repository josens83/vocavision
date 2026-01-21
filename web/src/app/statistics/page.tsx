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

  // 숙련도 색상 (은행 앱 스타일)
  const masteryColors = {
    NEW: 'bg-[#D1D5DB]',      // 회색 - 아직 안 본
    LEARNING: 'bg-[#F59E0B]', // 앰버 - 공부 중
    FAMILIAR: 'bg-[#3B82F6]', // 파랑 - 어느 정도 암기
    MASTERED: 'bg-[#10B981]', // 그린 - 완전 암기
  };

  const masteryLabels = {
    NEW: '아직 안 본 단어',
    LEARNING: '공부 중',
    FAMILIAR: '어느 정도 암기',
    MASTERED: '완전 암기',
  };

  // 레벨별 배경색 (은행 앱 스타일)
  const levelColors = {
    L1: 'bg-[#10B981]',  // 초급 - 그린
    L2: 'bg-[#3B82F6]',  // 중급 - 파랑
    L3: 'bg-[#A855F7]',  // 고급 - 보라
  };

  const levelLabels = {
    L1: '초급 (L1)',
    L2: '중급 (L2)',
    L3: '고급 (L3)',
  };

  const levelNames = {
    L1: '초급',
    L2: '중급',
    L3: '고급',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-[20px] p-5 h-32" />
              ))}
            </div>
            <div className="bg-white rounded-[20px] p-5 h-64 mb-6" />
            <div className="bg-white rounded-[20px] p-5 h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* 최상위 컨테이너: overflow-x 방지 */}
      <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full overflow-x-hidden space-y-4">
        {/* 데모 모드 배너 */}
        {isDemo && !user && (
          <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-[14px] p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#F59E0B] text-white rounded font-bold text-xs">체험</span>
                <span className="text-[#92400E] text-sm">샘플 데이터로 학습 분석 기능을 미리 체험해보세요</span>
              </div>
              <Link
                href="/auth/register"
                className="bg-[#F59E0B] text-white px-4 py-2 rounded-[10px] text-sm font-bold hover:bg-[#D97706] transition whitespace-nowrap"
              >
                무료 회원가입
              </Link>
            </div>
          </div>
        )}

        {/* 페이지 헤더 */}
        <header className="mb-2">
          <h1 className="text-[22px] font-bold text-[#1c1c1e]">상세 통계</h1>
          <p className="text-[14px] text-[#767676] mt-1">학습 진행 상황과 패턴을 분석합니다</p>
        </header>

        {/* 요약 통계 카드들 (은행 앱 스타일) */}
        <div className="grid grid-cols-2 gap-4">
          {/* 학습한 단어 */}
          <div className="bg-[#EFF6FF] rounded-[20px] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📚</span>
              <span className="text-[12px] text-[#3B82F6] font-medium">학습한 단어</span>
            </div>
            <p className="text-[28px] font-bold text-[#3B82F6]">{stats?.totalWordsLearned || 0}</p>
          </div>

          {/* 최장 연속 */}
          <div className="bg-[#FFF7ED] rounded-[20px] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏆</span>
              <span className="text-[12px] text-[#F59E0B] font-medium">최장 연속</span>
            </div>
            <p className="text-[28px] font-bold text-[#F59E0B]">{stats?.longestStreak || 0}일</p>
          </div>
        </div>

        {/* 추가 통계 (현재 연속, 정확도) */}
        <div className="grid grid-cols-2 gap-4">
          {/* 현재 연속 */}
          <div className="bg-[#FFF0F5] rounded-[20px] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔥</span>
              <span className="text-[12px] text-[#FF6B9D] font-medium">현재 연속</span>
            </div>
            <p className="text-[28px] font-bold text-[#FF6B9D]">{stats?.currentStreak || 0}일</p>
          </div>

          {/* 정확도 */}
          <div className="bg-[#ECFDF5] rounded-[20px] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <span className="text-[12px] text-[#10B981] font-medium">정확도</span>
            </div>
            <p className="text-[28px] font-bold text-[#10B981]">{accuracyRate}%</p>
          </div>
        </div>

        {/* 숙련도 분포 카드 (은행 앱 스타일) */}
        <section className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-[15px] font-bold text-[#1c1c1e]">숙련도 분포</h3>

            {/* 필터 */}
            <div className="flex gap-2">
              <select
                value={masteryExam}
                onChange={(e) => setMasteryExam(e.target.value)}
                className="text-[13px] bg-[#F8F9FA] border-none rounded-[10px] px-3 py-2 text-[#767676] font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/20"
              >
                <option value="CSAT">수능</option>
                <option value="TEPS">TEPS</option>
              </select>
              <select
                value={masteryLevel}
                onChange={(e) => setMasteryLevel(e.target.value)}
                className="text-[13px] bg-[#F8F9FA] border-none rounded-[10px] px-3 py-2 text-[#767676] font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/20"
              >
                <option value="all">전체</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
              </select>
            </div>
          </div>

          {/* 프로그레스 바들 */}
          <div className="space-y-4">
            {Object.entries(masteryDistData).map(([level, count]) => {
              const total = Object.values(masteryDistData).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const safePercentage = isNaN(percentage) ? 0 : Math.round(percentage);
              const safeCount = isNaN(count) ? 0 : count;

              return (
                <div key={level} className="w-full">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[13px] text-[#767676]">
                      {masteryLabels[level as keyof typeof masteryLabels]}
                    </span>
                    <span className="text-[13px] font-semibold text-[#1c1c1e]">
                      {safeCount}개 ({safePercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#f0f0f0] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${masteryColors[level as keyof typeof masteryColors]}`}
                      style={{ width: `${Math.max(safePercentage, 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 레벨별 학습 현황 카드 (은행 앱 스타일) */}
        <section className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-[#1c1c1e]">레벨별 학습 현황</h3>

            <select
              value={levelProgressExam}
              onChange={(e) => setLevelProgressExam(e.target.value)}
              className="text-[13px] bg-[#F8F9FA] border-none rounded-[10px] px-3 py-2 text-[#767676] font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/20"
            >
              <option value="CSAT">수능</option>
              <option value="TEPS">TEPS</option>
            </select>
          </div>

          <div className="space-y-3">
            {Object.entries(levelDist).map(([level, count]) => {
              const total = Object.values(levelDist).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const safePercentage = isNaN(percentage) ? 0 : Math.round(percentage);
              const safeCount = isNaN(count) ? 0 : count;

              return (
                <div
                  key={level}
                  className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-[14px]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center ${levelColors[level as keyof typeof levelColors]}`}>
                      <span className="text-white font-bold text-[14px]">{level}</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#1c1c1e]">
                        {levelNames[level as keyof typeof levelNames]}
                      </p>
                      <p className="text-[12px] text-[#767676]">
                        {levelLabels[level as keyof typeof levelLabels]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-bold text-[#1c1c1e]">{safeCount}개</p>
                    <p className="text-[12px] text-[#767676]">{safePercentage}% 학습</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 학습 활동 히트맵 (은행 앱 스타일) */}
        <div className="w-full max-w-full overflow-x-auto">
          <LearningHeatmap
            data={heatmapData.length > 0 ? heatmapData : undefined}
            currentStreakOverride={stats?.currentStreak || 0}
            longestStreakOverride={stats?.longestStreak || 0}
          />
        </div>

        {/* AI 학습 예측 (은행 앱 스타일) */}
        <div className="w-full max-w-full overflow-hidden">
          <PredictiveAnalytics />
        </div>
      </div>
    </DashboardLayout>
  );
}

// Loading component for Suspense
function StatisticsPageLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-[20px] p-5 h-32" />
            ))}
          </div>
          <div className="bg-white rounded-[20px] p-5 h-64 mb-6" />
          <div className="bg-white rounded-[20px] p-5 h-64" />
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
