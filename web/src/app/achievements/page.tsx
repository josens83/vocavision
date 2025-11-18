'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  percentage: number;
}

export default function AchievementsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalUnlocked, setTotalUnlocked] = useState(0);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadAchievements();
  }, [user, router]);

  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/achievements`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAchievements(response.data.achievements);
      setTotalUnlocked(response.data.totalUnlocked);
      setTotalAchievements(response.data.totalAchievements);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === 'unlocked') return achievement.unlocked;
    if (filter === 'locked') return !achievement.unlocked;
    return true;
  });

  const typeLabels: Record<string, string> = {
    WORDS_LEARNED: '단어 학습',
    DAILY_STREAK: '연속 학습',
    PERFECT_REVIEWS: '완벽한 복습',
    METHODS_USED: '학습 방법',
    STUDY_TIME: '학습 시간',
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
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← 대시보드
            </Link>
            <h1 className="text-2xl font-bold text-blue-600">업적</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progress Summary */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">나의 업적</h2>
              <p className="text-purple-100">
                {totalUnlocked}개 / {totalAchievements}개 달성
              </p>
            </div>
            <div className="text-6xl">🏆</div>
          </div>

          <div className="bg-white/20 rounded-full h-4 mb-2">
            <div
              className="bg-white rounded-full h-4 transition-all duration-500"
              style={{
                width: `${totalAchievements > 0 ? (totalUnlocked / totalAchievements) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-sm text-purple-100">
            {totalAchievements > 0
              ? Math.round((totalUnlocked / totalAchievements) * 100)
              : 0}% 완료
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-3 px-6 font-medium transition ${
                filter === 'all'
                  ? 'bg-white border-b-2 border-purple-600 text-purple-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              전체 ({achievements.length})
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`flex-1 py-3 px-6 font-medium transition ${
                filter === 'unlocked'
                  ? 'bg-white border-b-2 border-purple-600 text-purple-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              달성 ({totalUnlocked})
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`flex-1 py-3 px-6 font-medium transition ${
                filter === 'locked'
                  ? 'bg-white border-b-2 border-purple-600 text-purple-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              미달성 ({totalAchievements - totalUnlocked})
            </button>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition ${
                achievement.unlocked
                  ? 'ring-2 ring-purple-500'
                  : 'opacity-75 grayscale hover:grayscale-0'
              }`}
            >
              {/* Icon & Badge */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`text-6xl ${
                    achievement.unlocked ? 'animate-bounce' : 'opacity-50'
                  }`}
                >
                  {achievement.icon}
                </div>
                {achievement.unlocked && (
                  <div className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    달성
                  </div>
                )}
              </div>

              {/* Name & Description */}
              <h3 className="text-xl font-bold mb-2">{achievement.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{achievement.description}</p>

              {/* Type Badge */}
              <div className="mb-4">
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                  {typeLabels[achievement.type] || achievement.type}
                </span>
              </div>

              {/* Progress */}
              {!achievement.unlocked && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">진행률</span>
                    <span className="font-semibold">
                      {achievement.progress} / {achievement.requirement}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 rounded-full h-2 transition-all duration-500"
                      style={{ width: `${achievement.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {achievement.percentage}%
                  </p>
                </div>
              )}

              {/* Unlocked Date */}
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    달성일: {new Date(achievement.unlockedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-2">
              {filter === 'unlocked' && '아직 달성한 업적이 없습니다'}
              {filter === 'locked' && '모든 업적을 달성했습니다!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'unlocked' && '학습을 시작하여 첫 업적을 달성해보세요!'}
              {filter === 'locked' && '축하합니다! 모든 목표를 달성했습니다!'}
            </p>
            <Link
              href="/learn"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              학습 시작하기
            </Link>
          </div>
        )}

        {/* Motivation Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">💪</div>
            <div>
              <h3 className="text-xl font-bold">계속 도전하세요!</h3>
              <p className="text-gray-600">
                업적을 달성하면 학습 동기부여가 높아지고, 더 많은 단어를 효과적으로
                기억할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">📚</div>
              <h4 className="font-bold mb-1">꾸준한 학습</h4>
              <p className="text-sm text-gray-600">매일 조금씩 학습하세요</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-bold mb-1">명확한 목표</h4>
              <p className="text-sm text-gray-600">업적으로 목표를 설정하세요</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">🏆</div>
              <h4 className="font-bold mb-1">성취감</h4>
              <p className="text-sm text-gray-600">달성의 기쁨을 느껴보세요</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
