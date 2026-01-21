'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Benchmarking: Data-driven predictive learning analytics
// Phase 2-2: SM-2 알고리즘 기반 예측 분석 (은행 앱 스타일)

interface ReviewPrediction {
  timeframe: string;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface MasteryPrediction {
  totalWords: number;
  mastered: number;
  learning: number;
  new: number;
  estimatedDays: number;
}

interface LearningPattern {
  bestTime: string;
  avgSessionLength: number;
  avgWordsPerSession: number;
  avgAccuracy: number;
  recommendedDailyGoal: number;
}

interface PredictiveAnalyticsProps {
  data?: {
    reviews?: ReviewPrediction[];
    mastery?: MasteryPrediction;
    pattern?: LearningPattern;
  };
}

export default function PredictiveAnalytics({ data }: PredictiveAnalyticsProps) {
  const [reviews, setReviews] = useState<ReviewPrediction[]>([]);
  const [mastery, setMastery] = useState<MasteryPrediction | null>(null);
  const [pattern, setPattern] = useState<LearningPattern | null>(null);

  useEffect(() => {
    if (data) {
      setReviews(data.reviews || []);
      setMastery(data.mastery || null);
      setPattern(data.pattern || null);
    } else {
      // Mock data for demonstration
      const mockReviews: ReviewPrediction[] = [
        { timeframe: '오늘', count: 23, difficulty: 'hard' },
        { timeframe: '내일', count: 15, difficulty: 'medium' },
        { timeframe: '이번 주', count: 47, difficulty: 'medium' },
        { timeframe: '다음 주', count: 31, difficulty: 'easy' },
        { timeframe: '이번 달', count: 125, difficulty: 'easy' },
      ];

      const mockMastery: MasteryPrediction = {
        totalWords: 500,
        mastered: 280,
        learning: 150,
        new: 70,
        estimatedDays: 45,
      };

      const mockPattern: LearningPattern = {
        bestTime: '오후 7-9시',
        avgSessionLength: 18, // minutes
        avgWordsPerSession: 25,
        avgAccuracy: 82, // percentage
        recommendedDailyGoal: 30,
      };

      setReviews(mockReviews);
      setMastery(mockMastery);
      setPattern(mockPattern);
    }
  }, [data]);

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'text-[#10B981]';
      case 'medium':
        return 'text-[#F59E0B]';
      case 'hard':
        return 'text-[#EF4444]';
    }
  };

  const getDifficultyBg = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'bg-[#ECFDF5]';
      case 'medium':
        return 'bg-[#FFF7ED]';
      case 'hard':
        return 'bg-[#FEF2F2]';
    }
  };

  return (
    <div className="space-y-4">
      {/* AI 학습 예측 카드 (은행 앱 스타일) */}
      <section className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🤖</span>
          <h3 className="text-[15px] font-bold text-[#1c1c1e]">AI 학습 예측</h3>
          <span className="text-[10px] bg-[#A855F7] text-white px-2 py-0.5 rounded-full font-medium">AI</span>
        </div>

        {mastery && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-[#F3E8FF] rounded-[14px]">
              <div>
                <p className="text-[14px] font-semibold text-[#1c1c1e]">예상 완료일</p>
                <p className="text-[12px] text-[#767676]">현재 학습 속도 기준</p>
              </div>
              <p className="text-[18px] font-bold text-[#A855F7]">{mastery.estimatedDays}일 후</p>
            </div>

            {pattern && (
              <div className="flex items-center justify-between p-4 bg-[#EFF6FF] rounded-[14px]">
                <div>
                  <p className="text-[14px] font-semibold text-[#1c1c1e]">일일 권장 학습량</p>
                  <p className="text-[12px] text-[#767676]">목표 달성을 위해</p>
                </div>
                <p className="text-[18px] font-bold text-[#3B82F6]">{pattern.recommendedDailyGoal}개</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 다가오는 복습 카드 (은행 앱 스타일) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">📅</span>
          <h3 className="text-[15px] font-bold text-[#1c1c1e]">다가오는 복습</h3>
        </div>
        <p className="text-[13px] text-[#767676] mb-4">
          학습 데이터 기반으로 예측된 복습 일정입니다
        </p>

        <div className="space-y-2">
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-[14px] hover:bg-[#f0f0f0] transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${getDifficultyBg(review.difficulty)} flex items-center justify-center`}>
                  <span className={`text-[16px] font-bold ${getDifficultyColor(review.difficulty)}`}>
                    {review.count}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-[14px] text-[#1c1c1e]">{review.timeframe}</h4>
                  <p className="text-[12px] text-[#767676]">복습 예정</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getDifficultyBg(review.difficulty)} ${getDifficultyColor(review.difficulty)}`}
              >
                {review.difficulty === 'easy'
                  ? '쉬움'
                  : review.difficulty === 'medium'
                  ? '보통'
                  : '어려움'}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-[#EFF6FF] rounded-[14px]">
          <p className="text-[13px] text-[#1E40AF]">
            💡 <strong>팁:</strong> 오늘 복습할 단어가 많다면, 여러 세션으로 나눠서 학습하면 효과적입니다.
          </p>
        </div>
      </motion.section>

      {/* 학습 진도 예측 (은행 앱 스타일) */}
      {mastery && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎯</span>
            <h3 className="text-[15px] font-bold text-[#1c1c1e]">학습 진도 예측</h3>
          </div>
          <p className="text-[13px] text-[#767676] mb-4">
            현재 학습 속도로 모든 단어를 마스터하기까지{' '}
            <strong className="text-[#A855F7]">약 {mastery.estimatedDays}일</strong> 소요될
            것으로 예상됩니다
          </p>

          {/* Progress Breakdown */}
          <div className="space-y-4 mb-6">
            {/* Mastered */}
            <div>
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="font-semibold text-[#10B981]">마스터 완료</span>
                <span className="text-[#767676]">
                  {mastery.mastered} / {mastery.totalWords} ({Math.round((mastery.mastered / mastery.totalWords) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(mastery.mastered / mastery.totalWords) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-[#10B981] rounded-full"
                />
              </div>
            </div>

            {/* Learning */}
            <div>
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="font-semibold text-[#3B82F6]">학습 중</span>
                <span className="text-[#767676]">
                  {mastery.learning} / {mastery.totalWords} ({Math.round((mastery.learning / mastery.totalWords) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(mastery.learning / mastery.totalWords) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full bg-[#3B82F6] rounded-full"
                />
              </div>
            </div>

            {/* New */}
            <div>
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="font-semibold text-[#F59E0B]">새로운 단어</span>
                <span className="text-[#767676]">
                  {mastery.new} / {mastery.totalWords} ({Math.round((mastery.new / mastery.totalWords) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(mastery.new / mastery.totalWords) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="h-full bg-[#F59E0B] rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 200 200" className="transform -rotate-90">
                {/* Background circle */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="#f0f0f0" strokeWidth="20" />

                {/* Mastered arc */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="20"
                  strokeDasharray={`${(mastery.mastered / mastery.totalWords) * 502.4} 502.4`}
                  strokeDashoffset="0"
                />

                {/* Learning arc */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="20"
                  strokeDasharray={`${(mastery.learning / mastery.totalWords) * 502.4} 502.4`}
                  strokeDashoffset={`-${(mastery.mastered / mastery.totalWords) * 502.4}`}
                />

                {/* New arc */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="20"
                  strokeDasharray={`${(mastery.new / mastery.totalWords) * 502.4} 502.4`}
                  strokeDashoffset={`-${((mastery.mastered + mastery.learning) / mastery.totalWords) * 502.4}`}
                />
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[28px] font-bold text-[#1c1c1e]">
                  {Math.round((mastery.mastered / mastery.totalWords) * 100)}%
                </div>
                <div className="text-[12px] text-[#767676]">완료</div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* 학습 패턴 분석 (은행 앱 스타일) */}
      {pattern && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📊</span>
            <h3 className="text-[15px] font-bold text-[#1c1c1e]">학습 패턴 분석</h3>
          </div>
          <p className="text-[13px] text-[#767676] mb-4">
            AI가 분석한 당신의 학습 패턴과 최적화 제안입니다
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Best Learning Time */}
            <div className="p-4 bg-[#F3E8FF] rounded-[14px]">
              <div className="text-2xl mb-2">⏰</div>
              <h4 className="font-semibold text-[13px] text-[#1c1c1e] mb-1">최적 학습 시간</h4>
              <p className="text-[16px] font-bold text-[#A855F7]">{pattern.bestTime}</p>
            </div>

            {/* Average Session */}
            <div className="p-4 bg-[#EFF6FF] rounded-[14px]">
              <div className="text-2xl mb-2">⏱️</div>
              <h4 className="font-semibold text-[13px] text-[#1c1c1e] mb-1">평균 학습 시간</h4>
              <p className="text-[16px] font-bold text-[#3B82F6]">{pattern.avgSessionLength}분</p>
            </div>

            {/* Words Per Session */}
            <div className="p-4 bg-[#ECFDF5] rounded-[14px]">
              <div className="text-2xl mb-2">📚</div>
              <h4 className="font-semibold text-[13px] text-[#1c1c1e] mb-1">세션당 단어 수</h4>
              <p className="text-[16px] font-bold text-[#10B981]">{pattern.avgWordsPerSession}개</p>
            </div>

            {/* Average Accuracy */}
            <div className="p-4 bg-[#FFF7ED] rounded-[14px]">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-semibold text-[13px] text-[#1c1c1e] mb-1">평균 정확도</h4>
              <p className="text-[16px] font-bold text-[#F59E0B]">{pattern.avgAccuracy}%</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="mt-4 p-4 bg-[#FFF0F5] rounded-[14px] border border-[#FFE4EC]">
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">🤖</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#FF6B9D] mb-1 text-[13px]">AI 추천 학습 목표</h4>
                <p className="text-[#1c1c1e] mb-2 text-[13px]">
                  하루{' '}
                  <strong className="text-[#FF6B9D]">{pattern.recommendedDailyGoal}개</strong> 단어 학습을
                  추천합니다.
                </p>
                <ul className="text-[12px] text-[#767676] space-y-1">
                  <li>• {pattern.bestTime}에 집중 학습하세요</li>
                  <li>• 15-20분 세션으로 나누면 효과적입니다</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
