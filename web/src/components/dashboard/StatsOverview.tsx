'use client';

import { useUserStats } from '@/hooks/useUserStats';
import OverallAccuracy from './OverallAccuracy';
import LevelAccuracy from './LevelAccuracy';
import ModeAccuracy from './ModeAccuracy';
import WeeklyActivity from './WeeklyActivity';
import { BarChart3, RefreshCw } from 'lucide-react';

interface StatsOverviewProps {
  exam: string;
}

export default function StatsOverview({ exam }: StatsOverviewProps) {
  const { stats, isLoading, refetch } = useUserStats(exam);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-500" />
          <h2 className="text-lg font-bold text-gray-900">나의 학습 통계</h2>
        </div>
        <button
          onClick={refetch}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="새로고침"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* 전체 정답률 */}
      <OverallAccuracy
        accuracy={stats.overall.accuracy}
        totalQuestions={stats.overall.totalQuestions}
        correctAnswers={stats.overall.correctAnswers}
      />

      {/* 레벨별 정답률 */}
      <LevelAccuracy levels={stats.byLevel} />

      {/* 모드별 정답률 */}
      <ModeAccuracy modes={stats.byMode} />

      {/* 이번 주 활동 */}
      <WeeklyActivity activity={stats.weeklyActivity} streak={stats.streak} />
    </div>
  );
}
