/**
 * True/False Game Page
 *
 * 벤치마킹: Quizlet의 True/False 모드
 * - 단어와 정의를 보고 맞는지 틀린지 판단
 * - 10개 문제
 * - 즉시 피드백 (정답/오답)
 * - 점수 및 정확도 표시
 *
 * Quizlet True/False 분석:
 * - 50% 확률로 정답/오답 섞기
 * - 틀린 정의는 다른 단어의 정의 사용
 * - 큰 버튼 (True/False)
 * - 시각적 피드백 (초록/빨강)
 * - 연속 정답 스트릭
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useLocale } from '@/hooks/useLocale';
import { wordsAPI } from '@/lib/api';
import Link from 'next/link';

interface Word {
  id: string;
  word: string;
  definition: string;
}

interface Question {
  word: Word;
  definition: string;
  isCorrect: boolean;
}

export default function TrueFalsePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isEn = useLocale() === 'en';

  const [words, setWords] = useState<Word[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<boolean | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadWords();
  }, [user, router]);

  const loadWords = async () => {
    try {
      const response = await wordsAPI.getRandomWords(15);
      const loadedWords: Word[] = response.words;
      setWords(loadedWords);

      // Generate 10 questions
      const newQuestions: Question[] = [];
      for (let i = 0; i < 10; i++) {
        const word = loadedWords[i];
        const isCorrect = Math.random() > 0.5;

        newQuestions.push({
          word,
          definition: isCorrect
            ? word.definition
            : loadedWords[Math.floor(Math.random() * loadedWords.length)]
                .definition,
          isCorrect,
        });
      }

      setQuestions(newQuestions);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (userAnswer: boolean) => {
    const question = questions[currentQuestion];
    const correct = userAnswer === question.isCorrect;

    setLastAnswer(correct);
    setShowFeedback(true);

    if (correct) {
      setScore(score + 1);
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setShowFeedback(false);
      setLastAnswer(null);

      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setIsComplete(true);
      }
    }, 1500);
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setShowFeedback(false);
    setLastAnswer(null);
    setIsComplete(false);
    setLoading(true);
    loadWords();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
        <div className="text-white text-2xl">{isEn ? 'Preparing game...' : '게임 준비 중...'}</div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-cyan-500 py-8 px-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <Link
            href="/dashboard"
            className="text-white hover:text-blue-200 transition inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> {isEn ? 'Dashboard' : '대시보드로'}
          </Link>
          <div className="flex gap-4 text-white">
            <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
              <div className="text-sm opacity-80">{isEn ? 'Score' : '점수'}</div>
              <div className="text-2xl font-bold">{score}/10</div>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
              <div className="text-sm opacity-80">{isEn ? 'Streak' : '연속'}</div>
              <div className="text-2xl font-bold">🔥 {streak}</div>
            </div>
          </div>
        </div>

        <div className="text-center text-white mb-4">
          <h1 className="text-4xl font-bold mb-2">✅ True or False</h1>
          <p className="text-blue-100">
            {isEn ? 'Judge if the word and definition match!' : '단어와 정의가 맞는지 판단하세요!'}
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-white h-full"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="text-white text-center mt-2">
          {isEn ? `Question ${currentQuestion + 1} / ${questions.length}` : `문제 ${currentQuestion + 1} / ${questions.length}`}
        </div>
      </div>

      {/* Question Card */}
      {!isComplete && question && (
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 mb-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-5xl font-bold text-gray-900 mb-6">
                  {question.word.word}
                </h2>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-2xl text-gray-700 leading-relaxed">
                    {question.definition}
                  </p>
                </div>
              </div>

              <div className="text-center text-gray-600 mb-6">
                {isEn ? 'Does this definition match the word above?' : '이 정의가 위 단어와 맞나요?'}
              </div>

              {/* True/False Buttons */}
              {!showFeedback && (
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(false)}
                    className="bg-red-500 hover:bg-red-600 text-white py-6 rounded-xl text-2xl font-bold transition shadow-lg"
                  >
                    ✗ False
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(true)}
                    className="bg-green-500 hover:bg-green-600 text-white py-6 rounded-xl text-2xl font-bold transition shadow-lg"
                  >
                    ✓ True
                  </motion.button>
                </div>
              )}

              {/* Feedback */}
              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`text-center py-8 rounded-xl ${
                      lastAnswer
                        ? 'bg-green-100 text-green-900'
                        : 'bg-red-100 text-red-900'
                    }`}
                  >
                    <motion.div
                      animate={{ rotate: lastAnswer ? [0, -10, 10, 0] : [0] }}
                      className="text-6xl mb-3"
                    >
                      {lastAnswer ? '🎉' : '😔'}
                    </motion.div>
                    <div className="text-3xl font-bold mb-2">
                      {lastAnswer ? (isEn ? 'Correct!' : '정답입니다!') : (isEn ? 'Wrong!' : '틀렸습니다!')}
                    </div>
                    <div className="text-lg">
                      {lastAnswer
                        ? (isEn ? 'Keep going!' : '계속 진행하세요!')
                        : (isEn ? `Answer: ${question.isCorrect ? 'True' : 'False'}` : `정답: ${question.isCorrect ? 'True' : 'False'}`)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Completion Modal */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-6xl mb-4"
              >
                {score >= 8 ? '🏆' : score >= 6 ? '🎉' : '💪'}
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {isEn ? 'Game Complete!' : '게임 완료!'}
              </h2>
              <div className="space-y-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">{isEn ? 'Final Score' : '최종 점수'}</div>
                  <div className="text-4xl font-bold text-blue-900">
                    {score}/10
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-1">{isEn ? 'Accuracy' : '정확도'}</div>
                  <div className="text-3xl font-bold text-green-900">
                    {(score / 10) * 100}%
                  </div>
                </div>
                <div className="text-gray-600">
                  {score >= 8 && (isEn ? 'Perfect! 🌟' : '완벽합니다! 🌟')}
                  {score >= 6 && score < 8 && (isEn ? 'Great job! 👍' : '잘하셨어요! 👍')}
                  {score < 6 && (isEn ? 'Keep practicing! 💪' : '조금 더 연습이 필요해요! 💪')}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  {isEn ? 'Play Again' : '다시 하기'}
                </button>
                <Link
                  href="/dashboard"
                  className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
                >
                  {isEn ? 'Dashboard' : '대시보드'}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
