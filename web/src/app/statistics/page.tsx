'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  };
}

export default function StatisticsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadStatistics();
  }, [user, router]);

  const loadStatistics = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const [progressResponse] = await Promise.all([
        axios.get(`${API_URL}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(progressResponse.data.stats);
      setProgress(progressResponse.data.progress || []);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryDistribution = () => {
    const distribution = {
      NEW: 0,
      LEARNING: 0,
      FAMILIAR: 0,
      MASTERED: 0,
    };

    progress.forEach((p) => {
      distribution[p.masteryLevel as keyof typeof distribution]++;
    });

    return distribution;
  };

  const getDifficultyDistribution = () => {
    const distribution = {
      BEGINNER: 0,
      INTERMEDIATE: 0,
      ADVANCED: 0,
      EXPERT: 0,
    };

    progress.forEach((p) => {
      distribution[p.word.difficulty as keyof typeof distribution]++;
    });

    return distribution;
  };

  const getAccuracyRate = () => {
    const total = progress.reduce((sum, p) => sum + p.totalReviews, 0);
    const correct = progress.reduce((sum, p) => sum + p.correctCount, 0);
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const masteryDist = getMasteryDistribution();
  const difficultyDist = getDifficultyDistribution();
  const accuracyRate = getAccuracyRate();

  const masteryColors = {
    NEW: 'bg-gray-500',
    LEARNING: 'bg-yellow-500',
    FAMILIAR: 'bg-blue-500',
    MASTERED: 'bg-green-500',
  };

  const masteryLabels = {
    NEW: '새로운',
    LEARNING: '학습 중',
    FAMILIAR: '익숙함',
    MASTERED: '마스터',
  };

  const difficultyColors = {
    BEGINNER: 'bg-green-500',
    INTERMEDIATE: 'bg-blue-500',
    ADVANCED: 'bg-orange-500',
    EXPERT: 'bg-red-500',
  };

  const difficultyLabels = {
    BEGINNER: '초급',
    INTERMEDIATE: '중급',
    ADVANCED: '고급',
    EXPERT: '전문가',
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
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">상세 통계</h1>
          <p className="text-gray-500 text-sm mt-1">학습 진행 상황과 패턴을 분석합니다</p>
        </div>
        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
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

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Mastery Level Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">숙련도 분포</h2>
            <div className="space-y-4">
              {Object.entries(masteryDist).map(([level, count]) => {
                const total = Object.values(masteryDist).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const safePercentage = isNaN(percentage) ? 0 : Math.round(percentage);
                const safeCount = isNaN(count) ? 0 : count;

                return (
                  <div key={level}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        {masteryLabels[level as keyof typeof masteryLabels]}
                      </span>
                      <span className="text-gray-600">
                        {safeCount}개 ({safePercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${
                          masteryColors[level as keyof typeof masteryColors]
                        } h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${safePercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">난이도 분포</h2>
            <div className="space-y-4">
              {Object.entries(difficultyDist).map(([level, count]) => {
                const total = Object.values(difficultyDist).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const safePercentage = isNaN(percentage) ? 0 : Math.round(percentage);
                const safeCount = isNaN(count) ? 0 : count;

                return (
                  <div key={level}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        {difficultyLabels[level as keyof typeof difficultyLabels]}
                      </span>
                      <span className="text-gray-600">
                        {safeCount}개 ({safePercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${
                          difficultyColors[level as keyof typeof difficultyColors]
                        } h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${safePercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* NEW: Learning Heatmap - Phase 2-2 */}
        <div className="mb-8">
          <LearningHeatmap
            currentStreakOverride={stats?.currentStreak || 0}
            longestStreakOverride={stats?.longestStreak || 0}
          />
        </div>

        {/* NEW: Predictive Analytics - Phase 2-2 */}
        <div className="mb-8">
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
    <div className={`${colorClasses} rounded-2xl p-6`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm opacity-80 mb-1">{title}</div>
      <div className="text-3xl font-bold">
        {value}
        {suffix && <span className="text-lg ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
