'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Benchmarking: Data-driven predictive learning analytics
// Phase 2-2: SM-2 알고리즘 기반 예측 분석

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
        return 'text-green-600';
      case 'medium':
        return 'text-orange-600';
      case 'hard':
        return 'text-red-600';
    }
  };

  const getDifficultyBg = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100';
      case 'medium':
        return 'bg-orange-100';
      case 'hard':
        return 'bg-red-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Next Reviews Prediction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg overflow-hidden"
      >
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">📅 다가오는 복습</h3>
        <p className="text-gray-600 text-sm mb-4 sm:mb-6">
          학습 데이터 기반으로 예측된 복습 일정입니다
        </p>

        <div className="space-y-2 sm:space-y-3">
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${getDifficultyBg(review.difficulty)} flex items-center justify-center shrink-0`}>
                  <span className={`text-lg sm:text-xl font-bold ${getDifficultyColor(review.difficulty)}`}>
                    {review.count}
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base">{review.timeframe}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">복습 예정</p>
                </div>
              </div>

              <div className="flex items-center shrink-0 ml-2">
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyBg(
                    review.difficulty
                  )} ${getDifficultyColor(review.difficulty)}`}
                >
                  {review.difficulty === 'easy'
                    ? '쉬움'
                    : review.difficulty === 'medium'
                    ? '보통'
                    : '어려움'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-900">
            💡 <strong>팁:</strong> 오늘 복습할 단어가 많다면, 여러 세션으로 나눠서 학습하면
            효과적입니다.
          </p>
        </div>
      </motion.div>

      {/* Mastery Prediction */}
      {mastery && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg overflow-hidden"
        >
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">🎯 학습 진도 예측</h3>
          <p className="text-gray-600 text-sm mb-4 sm:mb-6">
            현재 학습 속도로 모든 단어를 마스터하기까지{' '}
            <strong className="text-indigo-600">약 {mastery.estimatedDays}일</strong> 소요될
            것으로 예상됩니다
          </p>

          {/* Progress Breakdown */}
          <div className="space-y-4 mb-6">
            {/* Mastered */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-green-700">마스터 완료</span>
                <span className="text-gray-600">
                  {mastery.mastered} / {mastery.totalWords} ({Math.round((mastery.mastered / mastery.totalWords) * 100)}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(mastery.mastered / mastery.totalWords) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-green-400 to-green-600"
                />
              </div>
            </div>

            {/* Learning */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-blue-700">학습 중</span>
                <span className="text-gray-600">
                  {mastery.learning} / {mastery.totalWords} ({Math.round((mastery.learning / mastery.totalWords) * 100)}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(mastery.learning / mastery.totalWords) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                />
              </div>
            </div>

            {/* New */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-orange-700">새로운 단어</span>
                <span className="text-gray-600">
                  {mastery.new} / {mastery.totalWords} ({Math.round((mastery.new / mastery.totalWords) * 100)}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(mastery.new / mastery.totalWords) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                />
              </div>
            </div>
          </div>

          {/* Donut Chart Visualization */}
          <div className="flex items-center justify-center">
            <div className="relative w-36 h-36 sm:w-48 sm:h-48">
              <svg viewBox="0 0 200 200" className="transform -rotate-90">
                {/* Background circle */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="20" />

                {/* Mastered arc */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#10b981"
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
                  stroke="#3b82f6"
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
                  stroke="#f97316"
                  strokeWidth="20"
                  strokeDasharray={`${(mastery.new / mastery.totalWords) * 502.4} 502.4`}
                  strokeDashoffset={`-${
                    ((mastery.mastered + mastery.learning) / mastery.totalWords) * 502.4
                  }`}
                />
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl sm:text-4xl font-bold text-gray-900">
                  {Math.round((mastery.mastered / mastery.totalWords) * 100)}%
                </div>
                <div className="text-xs sm:text-sm text-gray-600">완료</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Learning Pattern Analysis */}
      {pattern && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg overflow-hidden"
        >
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">📊 학습 패턴 분석</h3>
          <p className="text-gray-600 text-sm mb-4 sm:mb-6">
            AI가 분석한 당신의 학습 패턴과 최적화 제안입니다
          </p>

          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            {/* Best Learning Time */}
            <div className="p-3 sm:p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">⏰</div>
              <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">최적 학습 시간</h4>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{pattern.bestTime}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">가장 높은 집중도를 보이는 시간대</p>
            </div>

            {/* Average Session */}
            <div className="p-3 sm:p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">⏱️</div>
              <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">평균 학습 시간</h4>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{pattern.avgSessionLength}분</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">세션당 평균 소요 시간</p>
            </div>

            {/* Words Per Session */}
            <div className="p-3 sm:p-4 bg-green-50 rounded-xl">
              <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">📚</div>
              <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">세션당 단어 수</h4>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{pattern.avgWordsPerSession}개</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">평균 학습 단어 수</p>
            </div>

            {/* Average Accuracy */}
            <div className="p-3 sm:p-4 bg-orange-50 rounded-xl">
              <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">🎯</div>
              <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">평균 정확도</h4>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">{pattern.avgAccuracy}%</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">전체 학습 정확도</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-2xl sm:text-4xl shrink-0">🤖</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-indigo-900 mb-2 text-sm sm:text-base">AI 추천 학습 목표</h4>
                <p className="text-indigo-800 mb-2 sm:mb-3 text-sm">
                  하루{' '}
                  <strong className="text-indigo-600">{pattern.recommendedDailyGoal}개</strong> 단어 학습을
                  추천합니다.
                </p>
                <ul className="text-xs sm:text-sm text-indigo-700 space-y-1">
                  <li>• {pattern.bestTime}에 집중 학습하세요</li>
                  <li>• 15-20분 세션으로 나누면 효과적입니다</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
