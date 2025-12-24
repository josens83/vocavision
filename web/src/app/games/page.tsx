/**
 * Games Selection Page
 *
 * 벤치마킹: Quizlet의 학습 모드 선택
 * - 다양한 학습 게임 모드 제공
 * - 각 모드의 설명과 아이콘
 * - 매력적인 UI/UX
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';

interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  href: string;
  difficulty: string;
}

const gameModes: GameMode[] = [
  {
    id: 'match',
    title: 'Match Game',
    description: '단어와 정의를 매칭하세요! 빠르게 모든 쌍을 맞추는 게임입니다.',
    icon: '🎯',
    color: 'from-purple-500 to-pink-500',
    href: '/games/match',
    difficulty: '쉬움',
  },
  {
    id: 'true-false',
    title: 'True or False',
    description: '단어와 정의가 맞는지 판단하세요! 빠른 판단력을 키워보세요.',
    icon: '✅',
    color: 'from-blue-500 to-cyan-500',
    href: '/games/true-false',
    difficulty: '보통',
  },
  {
    id: 'write',
    title: 'Write Mode',
    description: '정의를 보고 단어를 입력하세요! 스펠링 실력을 향상시켜보세요.',
    icon: '✏️',
    color: 'from-indigo-500 to-purple-500',
    href: '/games/write',
    difficulty: '어려움',
  },
];

export default function GamesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-blue-600 transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>대시보드로 돌아가기</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Title */}
        <div className="text-center mb-8 md:mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            🎮 학습 게임
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600"
          >
            재미있는 게임으로 단어를 학습하세요!
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 mt-2 text-sm md:text-base"
          >
            Quizlet 스타일의 다양한 학습 모드를 제공합니다
          </motion.p>
        </div>

        {/* Game Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {gameModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={mode.href}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative overflow-hidden rounded-2xl shadow-xl cursor-pointer h-full`}
                >
                  {/* Gradient Background */}
                  <div className={`bg-gradient-to-br ${mode.color} p-8 h-full flex flex-col`}>
                    {/* Icon */}
                    <div className="text-6xl mb-4">{mode.icon}</div>

                    {/* Title */}
                    <h3 className="text-3xl font-bold text-white mb-3">
                      {mode.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/90 mb-4 flex-1">
                      {mode.description}
                    </p>

                    {/* Difficulty Badge */}
                    <div className="flex items-center justify-between">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-white text-sm font-semibold">
                        {mode.difficulty}
                      </div>
                      <ArrowRight className="text-white w-6 h-6" />
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mt-8 md:mt-12 bg-white rounded-2xl shadow-lg p-6 md:p-8"
        >
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
            🏆 게임 통계
          </h2>
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">-</div>
              <div className="text-gray-600 text-xs md:text-base">Match 최고 기록</div>
              <div className="text-xs text-gray-400 mt-1 hidden md:block">곧 제공</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-blue-600 mb-1 md:mb-2">-</div>
              <div className="text-gray-600 text-xs md:text-base">True/False 정답률</div>
              <div className="text-xs text-gray-400 mt-1 hidden md:block">곧 제공</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-indigo-600 mb-1 md:mb-2">-</div>
              <div className="text-gray-600 text-xs md:text-base">Write 완료 횟수</div>
              <div className="text-xs text-gray-400 mt-1 hidden md:block">곧 제공</div>
            </div>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto mt-8 bg-blue-50 rounded-2xl p-6"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-bold text-blue-900 mb-2">학습 팁</h3>
              <ul className="space-y-1 text-blue-800 text-sm">
                <li>• Match Game: 빠르게 패턴을 찾아 매칭하세요!</li>
                <li>• True/False: 정의를 꼼꼼히 읽고 판단하세요!</li>
                <li>• Write Mode: 스펠링을 정확히 기억하세요!</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
