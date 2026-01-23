'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { leaguesAPI } from '@/lib/api';

// Benchmarking: Duolingo-style league system
// Phase 3-1: 경쟁적 학습 동기부여 - 리그 시스템

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  xp: number;
  isCurrentUser: boolean;
}

interface LeagueInfo {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'SAPPHIRE' | 'RUBY' | 'EMERALD' | 'AMETHYST' | 'PEARL' | 'OBSIDIAN' | 'DIAMOND';
  currentXP: number;
  weekStartDate: string;
  weekEndDate: string;
  promotionZone: number; // Top N users get promoted
  demotionZone: number; // Bottom N users get demoted
  stayZone: number; // Middle users stay
}

const LEAGUE_INFO = {
  BRONZE: {
    name: '브론즈',
    color: 'from-amber-700 to-amber-900',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-300',
    icon: '🥉',
    nextLeague: '실버',
  },
  SILVER: {
    name: '실버',
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-900',
    borderColor: 'border-gray-300',
    icon: '🥈',
    nextLeague: '골드',
  },
  GOLD: {
    name: '골드',
    color: 'from-yellow-400 to-yellow-600',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-900',
    borderColor: 'border-yellow-300',
    icon: '🥇',
    nextLeague: '사파이어',
  },
  SAPPHIRE: {
    name: '사파이어',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-900',
    borderColor: 'border-blue-300',
    icon: '💎',
    nextLeague: '루비',
  },
  RUBY: {
    name: '루비',
    color: 'from-red-400 to-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-900',
    borderColor: 'border-red-300',
    icon: '💍',
    nextLeague: '에메랄드',
  },
  EMERALD: {
    name: '에메랄드',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-900',
    borderColor: 'border-green-300',
    icon: '💚',
    nextLeague: '자수정',
  },
  AMETHYST: {
    name: '자수정',
    color: 'from-purple-400 to-cyan-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-900',
    borderColor: 'border-purple-300',
    icon: '🔮',
    nextLeague: '진주',
  },
  PEARL: {
    name: '진주',
    color: 'from-pink-200 to-pink-400',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-900',
    borderColor: 'border-teal-300',
    icon: '⚪',
    nextLeague: '흑요석',
  },
  OBSIDIAN: {
    name: '흑요석',
    color: 'from-gray-800 to-black',
    bgColor: 'bg-gray-900',
    textColor: 'text-white',
    borderColor: 'border-gray-700',
    icon: '⚫',
    nextLeague: '다이아몬드',
  },
  DIAMOND: {
    name: '다이아몬드',
    color: 'from-cyan-300 via-blue-400 to-purple-500',
    bgColor: 'bg-gradient-to-br from-cyan-50 to-purple-50',
    textColor: 'text-purple-900',
    borderColor: 'border-purple-400',
    icon: '💎',
    nextLeague: '최고 등급',
  },
};

export default function LeaguesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadLeagueData();
  }, [user]);

  const loadLeagueData = async () => {
    setLoading(true);
    try {
      const [myLeagueData, leaderboardData] = await Promise.all([
        leaguesAPI.getMyLeague(),
        leaguesAPI.getLeaderboard({ limit: 50 }),
      ]);

      setLeagueInfo(myLeagueData);
      setLeaderboard(leaderboardData.leaderboard || []);
    } catch (error) {
      console.error('Failed to load league data:', error);

      // Mock data for development
      const mockLeague: LeagueInfo = {
        tier: 'GOLD',
        currentXP: 1250,
        weekStartDate: getMonday(new Date()).toISOString(),
        weekEndDate: getSunday(new Date()).toISOString(),
        promotionZone: 10,
        demotionZone: 5,
        stayZone: 35,
      };

      const mockLeaderboard: LeaderboardEntry[] = Array.from({ length: 50 }, (_, i) => ({
        rank: i + 1,
        userId: i === 24 ? user?.id || 'current' : `user-${i}`,
        userName: i === 24 ? user?.name || '나' : `학습자${i + 1}`,
        xp: 2500 - i * 45 + Math.floor(Math.random() * 40),
        isCurrentUser: i === 24,
      }));

      setLeagueInfo(mockLeague);
      setLeaderboard(mockLeaderboard);
    } finally {
      setLoading(false);
    }
  };

  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getSunday(date: Date) {
    const monday = getMonday(date);
    return new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  }

  const getDaysUntilReset = () => {
    if (!leagueInfo) return 0;
    const now = new Date();
    const end = new Date(leagueInfo.weekEndDate);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getZoneForRank = (rank: number) => {
    if (!leagueInfo) return 'stay';
    if (rank <= leagueInfo.promotionZone) return 'promotion';
    if (rank >= 50 - leagueInfo.demotionZone + 1) return 'demotion';
    return 'stay';
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'promotion':
        return 'bg-green-50 border-green-300';
      case 'demotion':
        return 'bg-red-50 border-red-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const currentUserEntry = leaderboard.find((entry) => entry.isCurrentUser);
  const currentUserRank = currentUserEntry?.rank || 0;
  const currentUserZone = getZoneForRank(currentUserRank);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-600 text-lg">리그 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!leagueInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-600 text-lg mb-4">리그 정보를 불러올 수 없습니다.</p>
          <Link href="/dashboard" className="text-indigo-600 hover:underline">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const leagueDetails = LEAGUE_INFO[leagueInfo.tier];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← 대시보드
            </Link>
            <h1 className="text-2xl font-bold text-indigo-600">리그</h1>
            <button
              onClick={() => setShowRules(!showRules)}
              className="text-gray-600 hover:text-gray-900"
            >
              ℹ️ 규칙
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* League Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${leagueDetails.bgColor} rounded-2xl p-8 mb-6 shadow-lg border-4 ${leagueDetails.borderColor}`}
        >
          <div className="text-center">
            <div className="text-8xl mb-4">{leagueDetails.icon}</div>
            <h2 className={`text-4xl font-bold ${leagueDetails.textColor} mb-2`}>
              {leagueDetails.name} 리그
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              {getDaysUntilReset()}일 후 주간 리그 종료
            </p>

            {/* Current Rank */}
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-indigo-600">#{currentUserRank}</div>
                <div className="text-sm text-gray-600 mt-1">현재 순위</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-600">{leagueInfo.currentXP}</div>
                <div className="text-sm text-gray-600 mt-1">이번 주 XP</div>
              </div>
            </div>

            {/* Zone Status */}
            <div className="mt-6">
              {currentUserZone === 'promotion' && (
                <div className="bg-green-100 border-2 border-green-400 rounded-xl p-4">
                  <p className="text-green-900 font-bold">
                    🎉 승급 구간! {leagueDetails.nextLeague} 리그로 승급 예정입니다!
                  </p>
                </div>
              )}
              {currentUserZone === 'demotion' && (
                <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4">
                  <p className="text-red-900 font-bold">
                    ⚠️ 강등 위기! 더 열심히 학습하여 순위를 올리세요!
                  </p>
                </div>
              )}
              {currentUserZone === 'stay' && (
                <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4">
                  <p className="text-blue-900 font-bold">
                    💪 안전 구간! 상위 {leagueInfo.promotionZone}위 안에 들면 승급합니다!
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500">
            <h3 className="text-2xl font-bold text-white">주간 리더보드</h3>
            <p className="text-indigo-100 text-sm">매주 월요일 초기화됩니다</p>
          </div>

          {/* Zone Legend */}
          <div className="p-4 bg-gray-50 border-b flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded border border-green-400"></div>
              <span>승급 (상위 {leagueInfo.promotionZone}명)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white rounded border border-gray-300"></div>
              <span>유지</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 rounded border border-red-400"></div>
              <span>강등 (하위 {leagueInfo.demotionZone}명)</span>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {leaderboard.map((entry, index) => {
              const zone = getZoneForRank(entry.rank);
              const zoneColor = getZoneColor(zone);

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center justify-between p-4 border-b ${
                    entry.isCurrentUser ? 'bg-indigo-50 border-indigo-300' : zoneColor
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Rank */}
                    <div className="w-12 text-center">
                      {entry.rank <= 3 ? (
                        <span className="text-3xl">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className="text-xl font-bold text-gray-600">#{entry.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      entry.isCurrentUser
                        ? 'bg-gradient-to-br from-indigo-400 to-purple-500'
                        : 'bg-gradient-to-br from-gray-400 to-gray-600'
                    }`}>
                      {entry.userName.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">
                        {entry.userName}
                        {entry.isCurrentUser && (
                          <span className="ml-2 px-2 py-1 bg-indigo-500 text-white text-xs rounded-full">
                            나
                          </span>
                        )}
                      </div>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{entry.xp}</div>
                      <div className="text-xs text-gray-500">XP</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Encouragement */}
        <div className="mt-6 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border-2 border-purple-200">
          <p className="text-purple-900 text-center">
            💪 <strong>열심히 학습하여 XP를 획득하세요!</strong> 단어 학습, 퀴즈, 게임 등 모든
            활동이 XP로 환산됩니다.
          </p>
        </div>
      </main>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">🏆 리그 시스템 규칙</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-indigo-600 mb-3">리그란?</h3>
                  <p className="text-gray-700">
                    리그는 Duolingo 스타일의 경쟁 시스템입니다. 매주 50명의 학습자와 함께 XP를
                    모아 순위를 겨루며, 상위권은 승급, 하위권은 강등됩니다.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-indigo-600 mb-3">리그 등급</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(LEAGUE_INFO).map(([tier, info]) => (
                      <div key={tier} className={`${info.bgColor} p-3 rounded-lg border ${info.borderColor}`}>
                        <span className="text-2xl mr-2">{info.icon}</span>
                        <span className={`font-bold ${info.textColor}`}>{info.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-indigo-600 mb-3">승급 & 강등</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• 상위 {leagueInfo.promotionZone}명: 다음 리그로 승급</li>
                    <li>• 중위권: 현재 리그 유지</li>
                    <li>• 하위 {leagueInfo.demotionZone}명: 하위 리그로 강등</li>
                    <li>• 다이아몬드 리그: 강등 없이 유지</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-indigo-600 mb-3">XP 획득 방법</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• 단어 학습: 10 XP</li>
                    <li>• 퀴즈 완료: 20 XP</li>
                    <li>• 게임 완료: 15 XP</li>
                    <li>• 일일 목표 달성: 보너스 50 XP</li>
                    <li>• 완벽한 정답: 보너스 5 XP</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-indigo-600 mb-3">주간 리셋</h3>
                  <p className="text-gray-700">
                    매주 월요일 자정에 리그가 리셋되며, 새로운 50명의 경쟁자와 함께 시작합니다.
                    이전 주의 성적에 따라 승급/강등이 적용됩니다.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="w-full mt-6 bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-600 transition"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
