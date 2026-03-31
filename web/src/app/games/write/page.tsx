/**
 * Write Mode Page
 *
 * 벤치마킹: Quizlet의 Write 모드
 * - 정의를 보고 단어를 타이핑
 * - 스펠링 정확도 체크
 * - 힌트 시스템 (첫 글자, 글자 수)
 * - 즉시 피드백
 *
 * Quizlet Write 분석:
 * - 정의 표시
 * - 텍스트 입력 필드
 * - Enter로 제출
 * - 힌트 버튼 (페널티 있음)
 * - 오답 시 다시 시도
 * - 완료 후 틀린 단어 복습
 */

'use client';

import { useEffect, useState, useRef } from 'react';
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

interface Answer {
  word: Word;
  userAnswer: string;
  correct: boolean;
  hintsUsed: number;
}

export default function WriteModePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isEn = useLocale() === 'en';
  const inputRef = useRef<HTMLInputElement>(null);

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadWords();
  }, [user, router]);

  useEffect(() => {
    // Focus input when question changes
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  const loadWords = async () => {
    try {
      const response = await wordsAPI.getRandomWords(10);
      setWords(response.words);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const currentWord = words[currentIndex];
    const correct =
      userInput.trim().toLowerCase() === currentWord.word.toLowerCase();

    setLastCorrect(correct);
    setShowFeedback(true);

    setAnswers([
      ...answers,
      {
        word: currentWord,
        userAnswer: userInput,
        correct,
        hintsUsed,
      },
    ]);

    setTimeout(() => {
      setShowFeedback(false);

      if (correct) {
        // Move to next word
        if (currentIndex + 1 < words.length) {
          setCurrentIndex(currentIndex + 1);
          setUserInput('');
          setShowHint(false);
          setHintsUsed(0);
        } else {
          setIsComplete(true);
        }
      } else {
        // Try again
        setUserInput('');
      }
    }, 1500);
  };

  const handleHint = () => {
    setShowHint(true);
    setHintsUsed(hintsUsed + 1);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setUserInput('');
    setAnswers([]);
    setShowHint(false);
    setHintsUsed(0);
    setShowFeedback(false);
    setLastCorrect(false);
    setIsComplete(false);
    setLoading(true);
    loadWords();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500">
        <div className="text-white text-2xl">{isEn ? 'Preparing game...' : '게임 준비 중...'}</div>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const correctAnswers = answers.filter((a) => a.correct).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-500 py-8 px-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <Link
            href="/dashboard"
            className="text-white hover:text-indigo-200 transition inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> {isEn ? 'Dashboard' : '대시보드로'}
          </Link>
          <div className="flex gap-4 text-white">
            <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
              <div className="text-sm opacity-80">{isEn ? 'Progress' : '진행'}</div>
              <div className="text-2xl font-bold">
                {currentIndex + 1}/{words.length}
              </div>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
              <div className="text-sm opacity-80">{isEn ? 'Correct' : '정답'}</div>
              <div className="text-2xl font-bold">✓ {correctAnswers}</div>
            </div>
          </div>
        </div>

        <div className="text-center text-white mb-4">
          <h1 className="text-4xl font-bold mb-2">✏️ Write Mode</h1>
          <p className="text-indigo-100">{isEn ? 'See the definition and type the word!' : '정의를 보고 단어를 입력하세요!'}</p>
        </div>

        {/* Progress */}
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-white h-full"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentIndex + 1) / words.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      {!isComplete && currentWord && (
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-2xl p-8"
            >
              {/* Definition */}
              <div className="mb-8">
                <div className="text-sm text-gray-500 mb-2">{isEn ? 'Definition' : '정의'}</div>
                <div className="bg-indigo-50 rounded-xl p-6">
                  <p className="text-2xl text-gray-900 leading-relaxed">
                    {currentWord.definition}
                  </p>
                </div>
              </div>

              {/* Hint */}
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span>💡</span>
                    <span className="font-semibold text-yellow-900">{isEn ? 'Hint' : '힌트'}</span>
                  </div>
                  <div className="text-gray-700">
                    <span className="font-mono text-lg">
                      {currentWord.word[0]}
                      {'_'.repeat(currentWord.word.length - 1)}
                    </span>
                    <span className="ml-3 text-sm">
                      ({isEn ? `${currentWord.word.length} letters` : `${currentWord.word.length}글자`})
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Input Form */}
              {!showFeedback && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label className="block text-sm text-gray-600 mb-2">
                      {isEn ? 'Type the word' : '단어를 입력하세요'}
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="w-full px-6 py-4 text-2xl border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                      placeholder={isEn ? 'Type here...' : '타이핑...'}
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={!userInput.trim()}
                      className="flex-1 bg-indigo-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      {isEn ? 'Submit' : '제출'}
                    </button>
                    {!showHint && (
                      <button
                        type="button"
                        onClick={handleHint}
                        className="px-6 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition"
                      >
                        {isEn ? '💡 Hint' : '💡 힌트'}
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Feedback */}
              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`text-center py-8 rounded-xl ${
                      lastCorrect
                        ? 'bg-green-100 text-green-900'
                        : 'bg-red-100 text-red-900'
                    }`}
                  >
                    <motion.div
                      animate={{ rotate: lastCorrect ? [0, -10, 10, 0] : [0] }}
                      className="text-6xl mb-3"
                    >
                      {lastCorrect ? '🎉' : '😔'}
                    </motion.div>
                    <div className="text-3xl font-bold mb-2">
                      {lastCorrect ? (isEn ? 'Correct!' : '정답입니다!') : (isEn ? 'Wrong!' : '틀렸습니다!')}
                    </div>
                    {!lastCorrect && (
                      <div className="space-y-2">
                        <div className="text-lg">
                          {isEn ? 'Answer: ' : '정답: '}<span className="font-bold">{currentWord.word}</span>
                        </div>
                        <div className="text-sm opacity-80">
                          {isEn ? 'Try again!' : '다시 시도하세요!'}
                        </div>
                      </div>
                    )}
                    {lastCorrect && hintsUsed > 0 && (
                      <div className="text-sm mt-2 opacity-80">
                        {isEn ? `Used ${hintsUsed} hint(s)` : `힌트 ${hintsUsed}번 사용`}
                      </div>
                    )}
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center max-h-[90vh] overflow-y-auto"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-6xl mb-4"
              >
                🏆
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {isEn ? 'Complete!' : '완료!'}
              </h2>

              {/* Stats */}
              <div className="space-y-3 mb-6">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-sm text-indigo-600 mb-1">{isEn ? 'Correct' : '정답'}</div>
                  <div className="text-3xl font-bold text-indigo-900">
                    {correctAnswers}/{words.length}
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 mb-1">
                    {isEn ? 'Total Hints Used' : '총 힌트 사용'}
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {isEn ? answers.reduce((sum, a) => sum + a.hintsUsed, 0) : `${answers.reduce((sum, a) => sum + a.hintsUsed, 0)}번`}
                  </div>
                </div>
              </div>

              {/* Wrong Answers */}
              {answers.some((a) => !a.correct) && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-gray-600 mb-3">
                    {isEn ? 'Review Wrong Words' : '틀린 단어 복습'}
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {answers
                      .filter((a) => !a.correct)
                      .map((answer, i) => (
                        <div
                          key={i}
                          className="bg-red-50 rounded-lg p-3 text-left text-sm"
                        >
                          <div className="font-bold text-red-900">
                            {answer.word.word}
                          </div>
                          <div className="text-gray-600">
                            {answer.word.definition}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
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
