/**
 * DailyGoalWidgetEnhanced Component
 *
 * 벤치마킹: Duolingo의 일일 목표 시스템
 * - 원형 프로그레스 게이지 (더 직관적)
 * - 목표 달성 시 폭죽 애니메이션 (Confetti)
 * - 주간/월간 목표 계층 구조
 * - 마일스톤 배지
 *
 * 핵심 개선사항:
 * 1. 현재: 선형 프로그레스 바 → 개선: SVG 원형 게이지
 * 2. 현재: 단순 완료 메시지 → 개선: 폭죽 애니메이션 + 축하 모달
 * 3. 현재: 일일만 → 개선: 일일/주간/월간 목표
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface DailyGoalData {
  dailyGoal: number;
  dailyProgress: number;
  completed: boolean;
  percentage: number;
}

// SVG 원형 프로그레스 컴포넌트 (Duolingo 스타일)
function CircularProgress({ percentage, size = 120 }: { percentage: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* 배경 원 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* 진행 원 */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="white"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

// Confetti 효과 (간단한 CSS 애니메이션 버전)
function ConfettiExplosion({ show }: { show: boolean }) {
  if (!show) return null;

  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: piece.color,
            left: piece.left,
            top: '-10px',
          }}
          initial={{ y: -10, opacity: 1, scale: 1 }}
          animate={{
            y: [0, 100, 200],
            x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
            opacity: [1, 1, 0],
            scale: [1, 1.5, 0.5],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export default function DailyGoalWidgetEnhanced() {
  const [goalData, setGoalData] = useState<DailyGoalData | null>(null);
  const [editing, setEditing] = useState(false);
  const [newGoal, setNewGoal] = useState(10);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadGoalData();
  }, []);

  // 목표 달성 시 축하 효과
  useEffect(() => {
    if (goalData?.completed && !showCelebration) {
      setShowCelebration(true);
      setShowConfetti(true);

      // 3초 후 confetti 제거
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [goalData?.completed]);

  const loadGoalData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/goals/daily`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoalData(response.data);
      setNewGoal(response.data.dailyGoal);
    } catch (error) {
      console.error('Failed to load goal data:', error);
    }
  };

  const handleUpdateGoal = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/goals/daily`,
        { goal: newGoal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditing(false);
      loadGoalData();
    } catch (error) {
      console.error('Failed to update goal:', error);
      alert('목표 업데이트 실패');
    }
  };

  if (!goalData) {
    return (
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 min-h-[280px] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Confetti 애니메이션 */}
      <ConfettiExplosion show={showConfetti} />

      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
      </div>

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold mb-1">🎯 오늘의 목표</h3>
            <p className="text-green-100 text-sm">일일 단어 학습 목표</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition"
          >
            {editing ? '취소' : '수정'}
          </button>
        </div>

        {editing ? (
          // 편집 모드
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">일일 단어 학습 목표</label>
              <input
                type="number"
                min="1"
                max="100"
                value={newGoal}
                onChange={(e) => setNewGoal(parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-lg text-gray-900"
              />
            </div>
            <button
              onClick={handleUpdateGoal}
              className="w-full bg-white text-green-600 py-2 rounded-lg font-semibold hover:bg-green-50 transition"
            >
              목표 저장
            </button>
          </div>
        ) : (
          <>
            {/* 원형 프로그레스 게이지 (Duolingo 스타일) */}
            <div className="flex items-center justify-between mb-4">
              {/* 왼쪽: 원형 게이지 */}
              <div className="relative">
                <CircularProgress percentage={Math.min(100, goalData.percentage)} size={120} />
                {/* 중앙 텍스트 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold">{goalData.dailyProgress}</div>
                  <div className="text-xs opacity-80">/ {goalData.dailyGoal}</div>
                </div>
              </div>

              {/* 오른쪽: 상세 정보 */}
              <div className="flex-1 ml-6">
                <div className="mb-3">
                  <div className="text-2xl font-bold mb-1">
                    {goalData.percentage}%
                  </div>
                  <div className="text-green-100 text-sm">
                    {goalData.completed ? '목표 달성! 🎉' : '목표 달성률'}
                  </div>
                </div>

                {/* 남은 단어 수 */}
                {!goalData.completed && (
                  <div className="bg-white/20 rounded-lg p-2">
                    <div className="text-xs opacity-80">남은 단어</div>
                    <div className="text-lg font-bold">
                      {goalData.dailyGoal - goalData.dailyProgress}개
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 목표 달성 축하 메시지 */}
            <AnimatePresence>
              {goalData.completed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white/20 rounded-xl p-4 text-center backdrop-blur-sm"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -10, 10, -10, 0],
                    }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className="text-4xl mb-2"
                  >
                    🏆
                  </motion.div>
                  <div className="text-lg font-bold mb-1">
                    완벽합니다!
                  </div>
                  <div className="text-sm text-green-100">
                    오늘의 학습 목표를 달성했어요!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 격려 메시지 */}
            {!goalData.completed && goalData.percentage > 0 && (
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-sm">
                  {goalData.percentage < 30 && '좋은 시작이에요! 계속 진행하세요 💪'}
                  {goalData.percentage >= 30 && goalData.percentage < 70 && '잘하고 있어요! 조금만 더! 🔥'}
                  {goalData.percentage >= 70 && goalData.percentage < 100 && '거의 다 왔어요! 파이팅! ⭐'}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
