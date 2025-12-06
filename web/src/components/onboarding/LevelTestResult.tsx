'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Target, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface LevelTestResultProps {
  correct: number;
  total: number;
  recommendedLevel: string;
}

const LEVEL_INFO = {
  L1: {
    name: '초급',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: '수능 3등급 목표',
    detail: '기초 어휘부터 탄탄하게 시작합니다.',
  },
  L2: {
    name: '중급',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: '수능 2등급 목표',
    detail: '핵심 어휘를 집중적으로 학습합니다.',
  },
  L3: {
    name: '고급',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: '수능 1등급 목표',
    detail: '고난도 어휘로 실력을 완성합니다.',
  },
};

export default function LevelTestResult({
  correct,
  total,
  recommendedLevel,
}: LevelTestResultProps) {
  const router = useRouter();
  const percentage = Math.round((correct / total) * 100);
  const levelInfo = LEVEL_INFO[recommendedLevel as keyof typeof LEVEL_INFO];

  const handleStartLearning = () => {
    // 레벨 테스트 완료 상태 저장
    localStorage.setItem('levelTestCompleted', 'true');
    localStorage.setItem('recommendedLevel', recommendedLevel);
    localStorage.setItem('selectedLevel', recommendedLevel);
    // 추천 레벨로 학습 시작
    router.push(`/learn?exam=CSAT&level=${recommendedLevel}`);
  };

  const handleChooseLevel = () => {
    // 레벨 테스트 완료 상태 저장
    localStorage.setItem('levelTestCompleted', 'true');
    // 대시보드로 이동해서 레벨 선택
    router.push('/dashboard');
  };

  const handleRetry = () => {
    // 테스트 다시 시작
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      {/* 완료 아이콘 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mb-6"
      >
        <Trophy className="w-10 h-10 text-pink-500" />
      </motion.div>

      {/* 타이틀 */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-gray-900 mb-2"
      >
        테스트 완료! 🎉
      </motion.h1>

      {/* 점수 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-6 my-6"
      >
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          <span className="text-2xl font-bold text-green-600">{correct}</span>
        </div>
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
          <span className="text-2xl font-bold text-red-500">{total - correct}</span>
        </div>
      </motion.div>

      {/* 진행률 바 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm mb-8"
      >
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-pink-500 to-pink-400"
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{percentage}% 정답</p>
      </motion.div>

      {/* 추천 레벨 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 mb-8 w-full max-w-sm shadow-sm border border-gray-100"
      >
        <p className="text-gray-500 text-sm mb-2">당신의 추천 레벨은</p>

        <div className="flex items-center justify-center gap-3 mb-3">
          <span
            className={`${levelInfo.bgColor} ${levelInfo.color} px-3 py-1 rounded-full text-sm font-medium`}
          >
            {recommendedLevel}
          </span>
          <span className="text-2xl font-bold text-gray-900">{levelInfo.name}</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
          <Target className="w-4 h-4" />
          <span>{levelInfo.description}</span>
        </div>

        <p className="text-sm text-gray-500">{levelInfo.detail}</p>
      </motion.div>

      {/* CTA 버튼들 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-sm space-y-3"
      >
        <button
          onClick={handleStartLearning}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-pink-500/25"
        >
          {recommendedLevel}부터 학습 시작하기
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={handleChooseLevel}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
        >
          다른 레벨 선택하기
        </button>

        <button
          onClick={handleRetry}
          className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-sm mx-auto mt-4 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          테스트 다시 하기
        </button>
      </motion.div>
    </div>
  );
}
