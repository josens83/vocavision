'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { isFreeUser } from '@/lib/subscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LearningHeatmap from '@/components/statistics/LearningHeatmap';
import { useStatistics, useActivityHeatmap, useMasteryDistribution, usePrefetchMasteryDistribution } from '@/hooks/useQueries';

// Benchmarking: Advanced statistics dashboard
// Phase 2-2: 고급 통계 및 예측 분석 대시보드

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
  needsReview?: boolean;
  reviewCorrectCount?: number;
  word: {
    word: string;
    difficulty: string;
    level?: string;
    examCategory?: string;
    examLevels?: { examCategory: string; level: string }[];
  };
}

// 새로운 API 응답 타입
interface MasteryDistribution {
  examCategory: string;
  level: string;
  accuracy: {
    correctWords: number;
    totalLearnedWords: number;
    percent: number;
  };
  mastery: {
    reviewTarget: number;
    reviewing: { count: number; percent: number };
    familiar: { count: number; percent: number };
    mastered: { count: number; percent: number };
  };
  overall: {
    totalWords: number;
    learnedWords: number;
    progressPercent: number;
  };
  // 기존 호환성
  distribution?: {
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
  { id: '1', wordId: 'w1', masteryLevel: 'MASTERED', correctCount: 5, incorrectCount: 0, totalReviews: 5, lastReviewDate: new Date().toISOString(), needsReview: false, reviewCorrectCount: 0, word: { word: 'abundant', difficulty: 'BEGINNER', level: 'L1', examCategory: 'CSAT' } },
  { id: '2', wordId: 'w2', masteryLevel: 'MASTERED', correctCount: 4, incorrectCount: 1, totalReviews: 5, lastReviewDate: new Date().toISOString(), needsReview: false, reviewCorrectCount: 0, word: { word: 'benevolent', difficulty: 'INTERMEDIATE', level: 'L2', examCategory: 'CSAT' } },
  { id: '3', wordId: 'w3', masteryLevel: 'FAMILIAR', correctCount: 3, incorrectCount: 1, totalReviews: 4, lastReviewDate: new Date().toISOString(), needsReview: true, reviewCorrectCount: 1, word: { word: 'comprehensive', difficulty: 'INTERMEDIATE', level: 'L2', examCategory: 'CSAT' } },
  { id: '4', wordId: 'w4', masteryLevel: 'FAMILIAR', correctCount: 2, incorrectCount: 1, totalReviews: 3, lastReviewDate: new Date().toISOString(), needsReview: true, reviewCorrectCount: 2, word: { word: 'diligent', difficulty: 'BEGINNER', level: 'L1', examCategory: 'CSAT' } },
  { id: '5', wordId: 'w5', masteryLevel: 'LEARNING', correctCount: 2, incorrectCount: 2, totalReviews: 4, lastReviewDate: new Date().toISOString(), needsReview: true, reviewCorrectCount: 0, word: { word: 'eloquent', difficulty: 'ADVANCED', level: 'L3', examCategory: 'CSAT' } },
  { id: '6', wordId: 'w6', masteryLevel: 'LEARNING', correctCount: 1, incorrectCount: 2, totalReviews: 3, lastReviewDate: new Date().toISOString(), needsReview: true, reviewCorrectCount: 0, word: { word: 'fluctuate', difficulty: 'ADVANCED', level: 'L3', examCategory: 'CSAT' } },
  { id: '7', wordId: 'w7', masteryLevel: 'NEW', correctCount: 0, incorrectCount: 1, totalReviews: 1, lastReviewDate: new Date().toISOString(), needsReview: true, reviewCorrectCount: 0, word: { word: 'gratitude', difficulty: 'BEGINNER', level: 'L1', examCategory: 'CSAT' } },
  { id: '8', wordId: 'w8', masteryLevel: 'NEW', correctCount: 0, incorrectCount: 0, totalReviews: 0, lastReviewDate: null, needsReview: false, reviewCorrectCount: 0, word: { word: 'hypothesis', difficulty: 'EXPERT', level: 'L1', examCategory: 'TEPS' } },
];

// 데모 모드용 히트맵 샘플 데이터 (최근 4주 학습 패턴)
const generateDemoHeatmapData = () => {
  const data: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> = [];
  const today = new Date();

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // 최근 30일만 학습 데이터 있음 (신규 사용자 시뮬레이션)
    let count = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;

    if (i <= 30) {
      // 최근 30일: 평일에 더 많이 학습
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (!isWeekend && Math.random() > 0.3) {
        count = Math.floor(Math.random() * 25) + 5; // 5-30개
      } else if (isWeekend && Math.random() > 0.6) {
        count = Math.floor(Math.random() * 15) + 3; // 3-18개
      }
    }

    // level 결정
    if (count === 0) level = 0;
    else if (count < 10) level = 1;
    else if (count < 20) level = 2;
    else if (count < 30) level = 3;
    else level = 4;

    data.push({ date: dateStr, count, level });
  }

  return data;
};

const DEMO_HEATMAP_DATA = generateDemoHeatmapData();

function StatisticsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // 숙련도 분포 필터 (독립적)
  const [masteryExam, setMasteryExam] = useState<string>('CSAT');
  const [masteryLevel, setMasteryLevel] = useState<string>('all');

  // 레벨별 학습 현황 필터 (독립적)
  const [levelProgressExam, setLevelProgressExam] = useState<string>('CSAT');

  // React Query 훅
  const { data: statisticsData, isLoading: statsLoading } = useStatistics(!!user && hasHydrated && !isDemo);
  const { data: activityData } = useActivityHeatmap(!!user && hasHydrated && !isDemo);
  const { data: masteryDist, isFetching: masteryFetching } = useMasteryDistribution(
    masteryExam,
    masteryLevel,
    !!user && hasHydrated && !isDemo
  );
  const prefetchMastery = usePrefetchMasteryDistribution();

  // 데이터 추출
  const stats: UserStats | null = isDemo ? DEMO_STATS : (statisticsData?.stats || null);
  const progress: Progress[] = isDemo ? DEMO_PROGRESS : (statisticsData?.progress || []);
  const heatmapData = activityData?.heatmapData || [];
  const loading = statsLoading && !isDemo;

  // 로그인 체크
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isDemo && !user) {
      router.push('/auth/login');
    }
  }, [user, hasHydrated, router, isDemo]);

  // 필터링된 progress (examLevels 기반) - 레벨별 학습 현황용
  const getFilteredProgress = (exam: string, level?: string) => {
    return progress.filter((p) => {
      if (p.word.examLevels && p.word.examLevels.length > 0) {
        const hasMatchingExamLevel = p.word.examLevels.some((el) => {
          const examMatch = el.examCategory === exam;
          const levelMatch = !level || level === 'all' || el.level === level;
          return examMatch && levelMatch;
        });
        return hasMatchingExamLevel;
      }
      if (p.word.examCategory && p.word.examCategory !== exam) {
        return false;
      }
      if (level && level !== 'all' && p.word.level !== level) {
        return false;
      }
      return true;
    });
  };

  // 데모 모드용 숙련도 계산
  const getDemoMasteryData = () => {
    const filtered = getFilteredProgress(masteryExam, masteryLevel);
    const reviewWords = filtered.filter(p => p.needsReview);
    const totalReview = reviewWords.length;

    const reviewing = reviewWords.filter(p => (p.reviewCorrectCount || 0) === 0).length;
    const familiar = reviewWords.filter(p => (p.reviewCorrectCount || 0) === 1).length;
    const mastered = reviewWords.filter(p => (p.reviewCorrectCount || 0) >= 2).length;

    const correctWords = filtered.filter(p => !p.needsReview).length;
    const totalLearned = filtered.length;

    return {
      accuracy: {
        correctWords,
        totalLearnedWords: totalLearned,
        percent: totalLearned > 0 ? Math.round((correctWords / totalLearned) * 100) : 0,
      },
      mastery: {
        reviewTarget: totalReview,
        reviewing: {
          count: reviewing,
          percent: totalReview > 0 ? Math.round((reviewing / totalReview) * 100) : 0,
        },
        familiar: {
          count: familiar,
          percent: totalReview > 0 ? Math.round((familiar / totalReview) * 100) : 0,
        },
        mastered: {
          count: mastered,
          percent: totalReview > 0 ? Math.round((mastered / totalReview) * 100) : 0,
        },
      },
      overall: {
        totalWords: 1000,
        learnedWords: totalLearned,
        progressPercent: Math.round((totalLearned / 1000) * 100),
      },
    };
  };

  // 시험별 레벨 키 목록
  const getExamLevels = (exam: string): string[] => {
    if (exam === 'CSAT_2026') return ['LISTENING', 'READING_2', 'READING_3'];
    if (exam === 'EBS') return ['LISTENING', 'READING_BASIC', 'READING_ADV'];
    if (exam === 'TEPS' || exam === 'TOEFL' || exam === 'TOEIC') return ['L1', 'L2'];
    return ['L1', 'L2', 'L3'];
  };

  // 레벨별 학습 현황 (독립적 필터)
  const getLevelDistribution = () => {
    const levels = getExamLevels(levelProgressExam);
    const distribution: Record<string, number> = {};
    levels.forEach(l => { distribution[l] = 0; });

    const filtered = getFilteredProgress(levelProgressExam);

    filtered.forEach((p) => {
      let level = levels[0];
      if (p.word.examLevels && p.word.examLevels.length > 0) {
        const matchingExamLevel = p.word.examLevels.find((el) => el.examCategory === levelProgressExam);
        level = matchingExamLevel?.level || p.word.level || levels[0];
      } else {
        level = p.word.level || levels[0];
      }
      if (distribution.hasOwnProperty(level)) {
        distribution[level as keyof typeof distribution]++;
      }
    });

    return distribution;
  };

  // 정확도 계산 (API 데이터 또는 데모 데이터 사용)
  // ⚠️ 콤보박스와 무관하게 전체 데이터 기준으로 계산
  const getTotalAccuracy = () => {
    if (isDemo) {
      // 데모 모드: 전체 DEMO_PROGRESS 기준
      const correctWords = progress.filter(p => !p.needsReview).length;
      const totalLearned = progress.length;
      return {
        correctWords,
        totalLearnedWords: totalLearned,
        percent: totalLearned > 0 ? Math.round((correctWords / totalLearned) * 100) : 0,
      };
    }

    // 실제 데이터: 전체 progress 배열 기준
    if (!progress || progress.length === 0) {
      return { correctWords: 0, totalLearnedWords: 0, percent: 0 };
    }
    const correctWords = progress.filter(p => !p.needsReview).length;
    const totalLearned = progress.length;
    return {
      correctWords,
      totalLearnedWords: totalLearned,
      percent: totalLearned > 0 ? Math.round((correctWords / totalLearned) * 100) : 0,
    };
  };

  // 숙련도 분포 데이터
  const getMasteryData = () => {
    if (masteryDist && !isDemo) {
      return masteryDist.mastery;
    }
    const demoData = getDemoMasteryData();
    return demoData.mastery;
  };

  const levelDist = getLevelDistribution();
  const totalAccuracy = getTotalAccuracy();
  const masteryData = getMasteryData();

  // 레벨별 배경색 (은행 앱 스타일)
  const levelColors: Record<string, string> = {
    L1: 'bg-[#10B981]',
    L2: 'bg-[#3B82F6]',
    L3: 'bg-[#A855F7]',
    LISTENING: 'bg-[#F59E0B]',
    READING_2: 'bg-[#3B82F6]',
    READING_3: 'bg-[#A855F7]',
    READING_BASIC: 'bg-[#3B82F6]',
    READING_ADV: 'bg-[#A855F7]',
  };

  const levelLabels: Record<string, string> = {
    L1: 'L1(기초)',
    L2: 'L2(중급)',
    L3: 'L3(고급)',
    LISTENING: '듣기영역',
    READING_2: '독해 2점',
    READING_3: '독해 3점',
    READING_BASIC: '독해 기본',
    READING_ADV: '독해 실력',
  };

  const levelNames: Record<string, string> = {
    L1: '기초',
    L2: '중급',
    L3: '고급',
    LISTENING: '듣기',
    READING_2: '독해2점',
    READING_3: '독해3점',
    READING_BASIC: '독해기본',
    READING_ADV: '독해실력',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 h-32" />
              ))}
            </div>
            <div className="bg-white rounded-2xl p-5 h-64 mb-6" />
            <div className="bg-white rounded-2xl p-5 h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 무료 회원 접근 제한 (데모 모드는 허용)
  if (!isDemo && isFreeUser(user)) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            {/* 자물쇠 아이콘 */}
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* 안내 텍스트 */}
            <h2 className="text-[20px] font-bold text-[#1c1c1e] mb-3">
              베이직/프리미엄 회원 전용 기능입니다
            </h2>
            <p className="text-[14px] text-gray-500 mb-6 max-w-sm">
              학습 통계를 확인하려면<br />
              베이직 또는 프리미엄으로 업그레이드하세요.
            </p>

            {/* 요금제 확인 버튼 */}
            <Link
              href="/pricing"
              className="bg-[#14B8A6] text-white px-6 py-3 rounded-xl font-semibold text-[14px] hover:bg-[#0D9488] transition-colors shadow-[0_4px_12px_rgba(20,184,166,0.3)]"
            >
              요금제 확인하기
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full overflow-x-hidden space-y-4">
        {/* 데모 모드 배너 */}
        {isDemo && !user && (
          <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4">
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
          <p className="text-[14px] text-gray-500 mt-1">학습 진행 상황과 패턴을 분석합니다</p>
        </header>

        {/* 요약 통계 카드들 (은행 앱 스타일) */}
        <div className="grid grid-cols-2 gap-4">
          {/* 학습한 단어 */}
          <div className="bg-[#EFF6FF] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📚</span>
              <span className="text-[12px] text-[#3B82F6] font-medium">학습한 단어</span>
            </div>
            <p className="text-[28px] font-bold text-[#3B82F6]">{stats?.totalWordsLearned || 0}</p>
          </div>

          {/* 최장 연속 */}
          <div className="bg-[#FFF7ED] rounded-2xl p-5">
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
          <div className="bg-[#ECFDF5] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔥</span>
              <span className="text-[12px] text-[#14B8A6] font-medium">현재 연속</span>
            </div>
            <p className="text-[28px] font-bold text-[#14B8A6]">{stats?.currentStreak || 0}일</p>
          </div>

          {/* 정확도 (새 로직) */}
          <div className="bg-[#ECFDF5] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <span className="text-[12px] text-[#10B981] font-medium">정확도</span>
            </div>
            <p className="text-[28px] font-bold text-[#10B981]">{totalAccuracy.percent}%</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {totalAccuracy.correctWords}/{totalAccuracy.totalLearnedWords} 단어
            </p>
          </div>
        </div>

        {/* 숙련도 분포 카드 (새 로직) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-[15px] font-bold text-[#1c1c1e]">숙련도 분포</h3>

            {/* 필터 */}
            <div className="flex gap-2 flex-shrink-0">
              <select
                value={masteryExam}
                onMouseEnter={() => {
                  prefetchMastery('CSAT', masteryLevel);
                  prefetchMastery('TEPS', masteryLevel === 'L3' ? 'all' : masteryLevel);
                }}
                onFocus={() => {
                  prefetchMastery('CSAT', masteryLevel);
                  prefetchMastery('TEPS', masteryLevel === 'L3' ? 'all' : masteryLevel);
                }}
                onChange={(e) => {
                  const newExam = e.target.value;
                  setMasteryExam(newExam);
                  // L1/L2만 있는 시험: L3 선택 시 전체로 리셋
                  const twoLevelExams = ['TEPS', 'TOEFL', 'TOEIC'];
                  if (twoLevelExams.includes(newExam) && masteryLevel === 'L3') {
                    setMasteryLevel('all');
                  }
                  // CSAT_2026/EBS는 다른 레벨 체계 → 전체로 리셋
                  if (['CSAT_2026', 'EBS'].includes(newExam) && ['L1', 'L2', 'L3'].includes(masteryLevel)) {
                    setMasteryLevel('all');
                  }
                  if (!['CSAT_2026', 'EBS'].includes(newExam) && !['all', 'L1', 'L2', 'L3'].includes(masteryLevel)) {
                    setMasteryLevel('all');
                  }
                }}
                className="text-[13px] bg-gray-100 border-none rounded-[10px] px-3 py-2 text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
              >
                <option value="CSAT">수능</option>
                <option value="TEPS">TEPS</option>
                <option value="CSAT_2026">2026 기출</option>
                <option value="EBS">EBS 연계</option>
                <option value="TOEFL">TOEFL</option>
                <option value="TOEIC">TOEIC</option>
              </select>
              <select
                value={masteryLevel}
                onMouseEnter={() => {
                  prefetchMastery(masteryExam, 'all');
                  prefetchMastery(masteryExam, 'L1');
                  prefetchMastery(masteryExam, 'L2');
                  if (masteryExam === 'CSAT') {
                    prefetchMastery(masteryExam, 'L3');
                  }
                }}
                onFocus={() => {
                  prefetchMastery(masteryExam, 'all');
                  prefetchMastery(masteryExam, 'L1');
                  prefetchMastery(masteryExam, 'L2');
                  if (masteryExam === 'CSAT') {
                    prefetchMastery(masteryExam, 'L3');
                  }
                }}
                onChange={(e) => setMasteryLevel(e.target.value)}
                className="text-[13px] bg-gray-100 border-none rounded-[10px] px-3 py-2 text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
              >
                <option value="all">전체</option>
                {masteryExam === 'CSAT_2026' ? (
                  <>
                    <option value="LISTENING">듣기</option>
                    <option value="READING_2">독해 2점</option>
                    <option value="READING_3">독해 3점</option>
                  </>
                ) : masteryExam === 'EBS' ? (
                  <>
                    <option value="LISTENING">듣기</option>
                    <option value="READING_BASIC">독해 기본</option>
                    <option value="READING_ADV">독해 실력</option>
                  </>
                ) : (
                  <>
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    {masteryExam === 'CSAT' && <option value="L3">L3</option>}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* 복습 대상 단어 (개수만, % 없음) */}
          <div className="bg-gray-100 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <span className="text-[14px] font-medium text-[#1c1c1e]">복습 대상 단어</span>
              </div>
              <span className="text-[18px] font-bold text-[#1c1c1e]">{masteryData.reviewTarget}개</span>
            </div>
            <p className="text-[12px] text-gray-500 mt-2">
              모름으로 표시한 단어들 (복습 퀴즈에서 학습)
            </p>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200 my-4" />

          {/* 숙련도 분포 (복습 대상 단어 기준 %) */}
          <div className="space-y-4 w-full min-w-0">
            {/* 미복습 (아직 복습 시작 안 함) */}
            {(() => {
              const notStarted = masteryData.reviewTarget - masteryData.reviewing.count - masteryData.familiar.count - masteryData.mastered.count;
              const notStartedPercent = masteryData.reviewTarget > 0
                ? Math.round((notStarted / masteryData.reviewTarget) * 100)
                : 0;
              return notStarted > 0 ? (
                <div className="w-full min-w-0">
                  <div className="flex justify-between items-center mb-1.5 gap-2">
                    <span className="text-[13px] text-gray-500 truncate min-w-0">
                      미복습
                    </span>
                    <span className="text-[13px] font-semibold text-[#1c1c1e] flex-shrink-0 whitespace-nowrap">
                      {notStarted}개 ({notStartedPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#f0f0f0] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gray-400"
                      style={{ width: `${notStartedPercent}%` }}
                    />
                  </div>
                </div>
              ) : null;
            })()}

            {/* 복습 중 (correctCount = 1) */}
            <div className="w-full min-w-0">
              <div className="flex justify-between items-center mb-1.5 gap-2">
                <span className="text-[13px] text-gray-500 truncate min-w-0">
                  복습 중
                </span>
                <span className="text-[13px] font-semibold text-[#1c1c1e] flex-shrink-0 whitespace-nowrap">
                  {masteryData.reviewing.count}개 ({masteryData.reviewTarget > 0
                    ? Math.round((masteryData.reviewing.count / masteryData.reviewTarget) * 100)
                    : 0}%)
                </span>
              </div>
              <div className="w-full bg-[#f0f0f0] rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-[#F59E0B]"
                  style={{ width: `${masteryData.reviewTarget > 0
                    ? Math.round((masteryData.reviewing.count / masteryData.reviewTarget) * 100)
                    : 0}%` }}
                />
              </div>
            </div>

            {/* 암기 완료 (correctCount >= 2) */}
            <div className="w-full min-w-0">
              <div className="flex justify-between items-center mb-1.5 gap-2">
                <span className="text-[13px] text-gray-500 truncate min-w-0">
                  암기 완료
                </span>
                <span className="text-[13px] font-semibold text-[#1c1c1e] flex-shrink-0 whitespace-nowrap">
                  {masteryData.familiar.count + masteryData.mastered.count}개 ({masteryData.reviewTarget > 0
                    ? Math.round(((masteryData.familiar.count + masteryData.mastered.count) / masteryData.reviewTarget) * 100)
                    : 0}%)
                </span>
              </div>
              <div className="w-full bg-[#f0f0f0] rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-[#10B981]"
                  style={{ width: `${masteryData.reviewTarget > 0
                    ? Math.round(((masteryData.familiar.count + masteryData.mastered.count) / masteryData.reviewTarget) * 100)
                    : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          {masteryData.reviewTarget === 0 && (
            <div className="mt-4 p-3 bg-[#ECFDF5] rounded-xl">
              <p className="text-[13px] text-[#10B981]">
                🎉 복습할 단어가 없습니다! 새로운 단어를 학습해보세요.
              </p>
            </div>
          )}
        </section>

        {/* 레벨별 학습 현황 카드 (은행 앱 스타일) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-[#1c1c1e]">레벨별 학습 현황</h3>

            <select
              value={levelProgressExam}
              onChange={(e) => setLevelProgressExam(e.target.value)}
              className="text-[13px] bg-gray-100 border-none rounded-[10px] px-3 py-2 text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
            >
              <option value="CSAT">수능</option>
              <option value="TEPS">TEPS</option>
              <option value="CSAT_2026">2026 기출</option>
              <option value="EBS">EBS 연계</option>
              <option value="TOEFL">TOEFL</option>
              <option value="TOEIC">TOEIC</option>
            </select>
          </div>

          <div className="space-y-3">
            {Object.entries(levelDist)
              .map(([level, count]) => {
              const filteredLevelDist = Object.entries(levelDist);
              const total = filteredLevelDist.reduce((a, [, c]) => a + c, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const safePercentage = isNaN(percentage) ? 0 : Math.round(percentage);
              const safeCount = isNaN(count) ? 0 : count;

              return (
                <div
                  key={level}
                  className="flex items-center justify-between p-4 bg-gray-100 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center ${levelColors[level] || 'bg-gray-400'}`}>
                      <span className="text-white font-bold text-[14px]">{levelNames[level] || level}</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#1c1c1e]">
                        {levelLabels[level] || level}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-bold text-[#1c1c1e]">{safeCount}개</p>
                    <p className="text-[12px] text-gray-500">{safePercentage}% 학습</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 학습 활동 히트맵 (은행 앱 스타일) */}
        <div className="w-full max-w-full overflow-x-auto">
          <LearningHeatmap
            data={isDemo ? DEMO_HEATMAP_DATA : (heatmapData.length > 0 ? heatmapData : undefined)}
            currentStreakOverride={isDemo ? DEMO_STATS.currentStreak : (stats?.currentStreak || 0)}
            longestStreakOverride={isDemo ? DEMO_STATS.longestStreak : (stats?.longestStreak || 0)}
          />
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
              <div key={i} className="bg-white rounded-2xl p-5 h-32" />
            ))}
          </div>
          <div className="bg-white rounded-2xl p-5 h-64 mb-6" />
          <div className="bg-white rounded-2xl p-5 h-64" />
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
