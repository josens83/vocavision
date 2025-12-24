'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import axios from 'axios';
import LearningHeatmap from '@/components/statistics/LearningHeatmap';
import PredictiveAnalytics from '@/components/statistics/PredictiveAnalytics';
import WordAccuracyChart from '@/components/statistics/WordAccuracyChart';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> 대시보드
            </Link>
            <h1 className="text-2xl font-bold text-blue-600">상세 통계</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
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

                return (
                  <div key={level}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        {masteryLabels[level as keyof typeof masteryLabels]}
                      </span>
                      <span className="text-gray-600">
                        {count}개 ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${
                          masteryColors[level as keyof typeof masteryColors]
                        } h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
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

                return (
                  <div key={level}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        {difficultyLabels[level as keyof typeof difficultyLabels]}
                      </span>
                      <span className="text-gray-600">
                        {count}개 ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${
                          difficultyColors[level as keyof typeof difficultyColors]
                        } h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
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
          <LearningHeatmap />
        </div>

        {/* NEW: Predictive Analytics - Phase 2-2 */}
        <div className="mb-8">
          <PredictiveAnalytics />
        </div>

        {/* NEW: Word Accuracy Chart - Phase 2-2 */}
        <div className="mb-8">
          <WordAccuracyChart limit={15} />
        </div>

        {/* Progress Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6">단어별 진행 상황</h2>

          {progress.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-2xl font-bold mb-2">아직 학습한 단어가 없습니다</h3>
              <p className="text-gray-600 mb-6">단어 학습을 시작하세요!</p>
              <Link
                href="/learn"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                학습 시작하기
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">단어</th>
                    <th className="px-4 py-3 text-left font-semibold">난이도</th>
                    <th className="px-4 py-3 text-left font-semibold">숙련도</th>
                    <th className="px-4 py-3 text-center font-semibold">정답</th>
                    <th className="px-4 py-3 text-center font-semibold">오답</th>
                    <th className="px-4 py-3 text-center font-semibold">총 복습</th>
                    <th className="px-4 py-3 text-center font-semibold">정확도</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {progress.slice(0, 20).map((p) => {
                    const accuracy = p.totalReviews > 0
                      ? Math.round((p.correctCount / p.totalReviews) * 100)
                      : 0;

                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/words/${p.wordId}`}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {p.word.word}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {difficultyLabels[p.word.difficulty as keyof typeof difficultyLabels]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                              masteryColors[p.masteryLevel as keyof typeof masteryColors]
                            }`}
                          >
                            {masteryLabels[p.masteryLevel as keyof typeof masteryLabels]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-green-600 font-medium">
                          {p.correctCount}
                        </td>
                        <td className="px-4 py-3 text-center text-red-600 font-medium">
                          {p.incorrectCount}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">
                          {p.totalReviews}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-bold ${
                              accuracy >= 80
                                ? 'text-green-600'
                                : accuracy >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {accuracy}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {progress.length > 20 && (
                <div className="text-center mt-6 text-gray-600">
                  상위 20개 단어만 표시됩니다. 전체 {progress.length}개 중
                </div>
              )}
            </div>
          )}
        </div>

        {/* Learning Insights */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="text-4xl mb-3">💡</div>
            <h3 className="text-lg font-bold mb-2">학습 팁</h3>
            <p className="text-sm text-gray-700">
              매일 꾸준히 학습하면 장기 기억으로 전환됩니다.
              복습 알림을 놓치지 마세요!
            </p>
          </div>

          <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-bold mb-2">목표 달성</h3>
            <p className="text-sm text-gray-700">
              현재 연속 {stats?.currentStreak || 0}일!
              {stats?.currentStreak && stats.currentStreak >= 7
                ? ' 환상적인 성과입니다!'
                : ' 7일 연속을 목표로 해보세요!'}
            </p>
          </div>

          <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-lg font-bold mb-2">다음 단계</h3>
            <p className="text-sm text-gray-700">
              {masteryDist.MASTERED > 10
                ? '더 어려운 단어에 도전해보세요!'
                : '기본 단어를 먼저 마스터하세요!'}
            </p>
          </div>
        </div>
      </main>
    </div>
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
