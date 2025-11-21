/**
 * StreakWidget Component
 *
 * 벤치마킹: Duolingo의 스트릭 시스템
 * - 불꽃 애니메이션으로 시각적 매력 증가
 * - 스트릭 프리즈 시스템 (연속 손실 방지)
 * - 마일스톤 배지 (7일, 30일, 100일 등)
 * - 스트릭 손실 위험 알림
 *
 * 핵심 개선사항:
 * 1. 현재: 단순 이모지 + 숫자 → 개선: 애니메이션 + 인터랙티브
 * 2. 현재: 스트릭 손실 대응 없음 → 개선: 프리즈 시스템
 * 3. 현재: 마일스톤 표시 없음 → 개선: 배지 컬렉션
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  streakFreezeCount?: number; // 스트릭 프리즈 아이템 개수
  lastActiveDate?: string | null;
}

// 마일스톤 정의 (Duolingo 스타일)
const MILESTONES = [
  { days: 7, label: '일주일', emoji: '🔥', color: 'orange' },
  { days: 14, label: '2주', emoji: '💪', color: 'red' },
  { days: 30, label: '한 달', emoji: '⭐', color: 'yellow' },
  { days: 50, label: '50일', emoji: '🏅', color: 'purple' },
  { days: 100, label: '백 일', emoji: '👑', color: 'gold' },
  { days: 365, label: '1년', emoji: '🏆', color: 'diamond' },
];

export default function StreakWidget({
  currentStreak,
  longestStreak,
  streakFreezeCount = 0,
  lastActiveDate,
}: StreakWidgetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMilestonePopup, setShowMilestonePopup] = useState(false);

  // 현재 스트릭의 마일스톤 찾기
  const currentMilestone = MILESTONES.filter((m) => currentStreak >= m.days).pop();
  const nextMilestone = MILESTONES.find((m) => currentStreak < m.days);

  // 스트릭 손실 위험 체크 (마지막 활동이 오늘이 아닌 경우)
  const isAtRisk = () => {
    if (!lastActiveDate) return false;
    const lastActive = new Date(lastActiveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
  };

  const atRisk = isAtRisk();

  // 불꽃 애니메이션 트리거
  useEffect(() => {
    if (currentStreak > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStreak]);

  // 마일스톤 도달 시 축하 팝업
  useEffect(() => {
    if (currentMilestone && currentStreak === currentMilestone.days) {
      setShowMilestonePopup(true);
      const timer = setTimeout(() => setShowMilestonePopup(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStreak, currentMilestone]);

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
      </div>

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold mb-1">🔥 스트릭</h3>
            <p className="text-orange-100 text-sm">연속 학습 일수</p>
          </div>

          {/* 스트릭 프리즈 아이템 */}
          {streakFreezeCount > 0 && (
            <div className="bg-white/20 rounded-lg px-3 py-1 flex items-center gap-1">
              <span className="text-sm">🧊</span>
              <span className="text-sm font-semibold">{streakFreezeCount}</span>
            </div>
          )}
        </div>

        {/* 메인 스트릭 디스플레이 */}
        <div className="flex items-center gap-4 mb-4">
          {/* 불꽃 애니메이션 */}
          <motion.div
            animate={
              isAnimating
                ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, -10, 10, -10, 0],
                  }
                : {}
            }
            transition={{ duration: 0.5 }}
            className="text-6xl"
          >
            🔥
          </motion.div>

          {/* 스트릭 숫자 */}
          <div>
            <motion.div
              key={currentStreak}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-black"
            >
              {currentStreak}
            </motion.div>
            <div className="text-orange-100 text-sm">일 연속</div>
          </div>
        </div>

        {/* 스트릭 위험 경고 */}
        <AnimatePresence>
          {atRisk && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-yellow-500 text-yellow-900 rounded-lg p-3 mb-4 flex items-center gap-2"
            >
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <div className="font-bold text-sm">스트릭 위험!</div>
                <div className="text-xs">오늘 학습하지 않으면 스트릭이 초기화됩니다</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 다음 마일스톤 진행도 */}
        {nextMilestone && (
          <div className="bg-white/20 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                다음 마일스톤: {nextMilestone.label} {nextMilestone.emoji}
              </span>
              <span className="text-sm font-bold">
                {currentStreak}/{nextMilestone.days}
              </span>
            </div>
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentStreak / nextMilestone.days) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="bg-white h-full rounded-full"
              />
            </div>
          </div>
        )}

        {/* 획득한 마일스톤 배지 */}
        {currentMilestone && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-orange-100 mb-2">획득한 배지</div>
            <div className="flex flex-wrap gap-2">
              {MILESTONES.filter((m) => currentStreak >= m.days).map((milestone) => (
                <motion.div
                  key={milestone.days}
                  whileHover={{ scale: 1.1 }}
                  className="bg-white/20 rounded-full px-3 py-1 flex items-center gap-1 cursor-pointer"
                  title={`${milestone.label} 달성!`}
                >
                  <span>{milestone.emoji}</span>
                  <span className="text-xs font-semibold">{milestone.days}일</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 최장 스트릭 (작게 표시) */}
        <div className="mt-3 text-center">
          <div className="text-xs text-orange-200">최장 기록: {longestStreak}일 🏆</div>
        </div>

        {/* 마일스톤 달성 축하 팝업 */}
        <AnimatePresence>
          {showMilestonePopup && currentMilestone && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl"
            >
              <div className="bg-white text-gray-900 rounded-xl p-6 text-center max-w-xs">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl mb-3"
                >
                  {currentMilestone.emoji}
                </motion.div>
                <h4 className="text-2xl font-bold mb-2">축하합니다!</h4>
                <p className="text-gray-600">
                  {currentMilestone.label} 마일스톤 달성!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
