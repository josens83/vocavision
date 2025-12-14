'use client';

import { useState, useCallback, useEffect } from 'react';

export interface QuizQuestion {
  id: string;
  word: string;
  correctAnswer: string;
  options: string[];
  level: 'L1' | 'L2' | 'L3';
}

export interface LevelTestResult {
  correct: number;
  wrong: number;
  total: number;
  accuracy: number;
  recommendedLevel: 'L1' | 'L2' | 'L3';
  answers: {
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }[];
}

type TestStep = 'intro' | 'quiz' | 'result';

interface UseLevelTestOptions {
  onComplete?: (result: LevelTestResult) => void;
  saveToStorage?: boolean;
}

const STORAGE_KEY = 'levelTestCompleted';
const LEVEL_STORAGE_KEY = 'selectedLevel';

export function useLevelTest(options: UseLevelTestOptions = {}) {
  const { onComplete, saveToStorage = true } = options;

  // 상태
  const [step, setStep] = useState<TestStep>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<LevelTestResult['answers']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LevelTestResult | null>(null);

  // 이미 완료했는지 확인
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(STORAGE_KEY);
      setHasCompleted(completed === 'true');
    }
  }, []);

  // 현재 문제
  const currentQuestion = questions[currentIndex] || null;
  const progress = questions.length > 0 ? currentIndex + 1 : 0;
  const total = questions.length;
  const isLastQuestion = currentIndex === questions.length - 1;

  // 레벨 추천 계산
  const calculateRecommendedLevel = useCallback((accuracy: number): 'L1' | 'L2' | 'L3' => {
    if (accuracy >= 70) return 'L3'; // 고급
    if (accuracy >= 40) return 'L2'; // 중급
    return 'L1'; // 초급
  }, []);

  // 테스트 시작
  const startTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // API에서 문제 가져오기
      const { wordsAPI } = await import('@/lib/api');
      const data = await wordsAPI.getLevelTestQuestions();

      // API 응답을 QuizQuestion 형식으로 변환
      const formattedQuestions: QuizQuestion[] = data.questions.map((q: {
        word: string;
        correctAnswer: string;
        options: string[];
        level: string;
      }, idx: number) => ({
        id: String(idx + 1),
        word: q.word,
        correctAnswer: q.correctAnswer,
        options: q.options,
        level: q.level as 'L1' | 'L2' | 'L3',
      }));

      setQuestions(formattedQuestions);
      setCurrentIndex(0);
      setAnswers([]);
      setStep('quiz');
    } catch (err) {
      console.error('Failed to start test:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      // 폴백: 샘플 문제 사용
      setQuestions(getSampleQuestions());
      setCurrentIndex(0);
      setAnswers([]);
      setStep('quiz');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 답변 제출
  const submitAnswer = useCallback((selectedAnswer: string) => {
    if (!currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const newAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
    };

    setAnswers((prev) => [...prev, newAnswer]);

    // 마지막 문제인지 확인
    if (isLastQuestion) {
      // 결과 계산
      const allAnswers = [...answers, newAnswer];
      const correctCount = allAnswers.filter((a) => a.isCorrect).length;
      const accuracy = Math.round((correctCount / allAnswers.length) * 100);
      const recommendedLevel = calculateRecommendedLevel(accuracy);

      const testResult: LevelTestResult = {
        correct: correctCount,
        wrong: allAnswers.length - correctCount,
        total: allAnswers.length,
        accuracy,
        recommendedLevel,
        answers: allAnswers,
      };

      setResult(testResult);

      // localStorage에 저장
      if (saveToStorage && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, 'true');
        localStorage.setItem(LEVEL_STORAGE_KEY, recommendedLevel);
      }

      // 콜백 호출
      onComplete?.(testResult);

      setStep('result');
    } else {
      // 다음 문제로
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentQuestion, isLastQuestion, answers, calculateRecommendedLevel, saveToStorage, onComplete]);

  // 테스트 건너뛰기
  const skipTest = useCallback(() => {
    if (saveToStorage && typeof window !== 'undefined') {
      localStorage.setItem(LEVEL_STORAGE_KEY, 'L1'); // 기본값
    }
  }, [saveToStorage]);

  // 테스트 재시작
  const restartTest = useCallback(() => {
    setStep('intro');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setResult(null);
    setError(null);
  }, []);

  // 완료 상태 초기화 (재측정용)
  const resetCompletion = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEVEL_STORAGE_KEY);
      setHasCompleted(false);
    }
  }, []);

  return {
    // 상태
    step,
    setStep,
    questions,
    currentQuestion,
    currentIndex,
    progress,
    total,
    isLastQuestion,
    answers,
    result,
    isLoading,
    error,
    hasCompleted,

    // 액션
    startTest,
    submitAnswer,
    skipTest,
    restartTest,
    resetCompletion,
  };
}

// 샘플 문제 (API 실패 시 폴백)
function getSampleQuestions(): QuizQuestion[] {
  return [
    // L1 (쉬움) - 3문제
    {
      id: '1',
      word: 'apple',
      correctAnswer: '사과',
      options: ['사과', '바나나', '오렌지', '포도'],
      level: 'L1',
    },
    {
      id: '2',
      word: 'book',
      correctAnswer: '책',
      options: ['연필', '책', '가방', '의자'],
      level: 'L1',
    },
    {
      id: '3',
      word: 'water',
      correctAnswer: '물',
      options: ['불', '물', '바람', '흙'],
      level: 'L1',
    },
    // L2 (중간) - 4문제
    {
      id: '4',
      word: 'regarding',
      correctAnswer: '~과 관련하여',
      options: ['녹음된 것', '~과 관련하여', '썩다', '담요'],
      level: 'L2',
    },
    {
      id: '5',
      word: 'sufficient',
      correctAnswer: '충분한',
      options: ['부족한', '충분한', '과도한', '적절한'],
      level: 'L2',
    },
    {
      id: '6',
      word: 'implement',
      correctAnswer: '실행하다',
      options: ['포기하다', '실행하다', '지연하다', '취소하다'],
      level: 'L2',
    },
    {
      id: '7',
      word: 'consequence',
      correctAnswer: '결과',
      options: ['원인', '결과', '과정', '시작'],
      level: 'L2',
    },
    // L3 (어려움) - 3문제
    {
      id: '8',
      word: 'ubiquitous',
      correctAnswer: '어디에나 있는',
      options: ['희귀한', '어디에나 있는', '독특한', '일시적인'],
      level: 'L3',
    },
    {
      id: '9',
      word: 'ephemeral',
      correctAnswer: '일시적인',
      options: ['영원한', '일시적인', '중요한', '평범한'],
      level: 'L3',
    },
    {
      id: '10',
      word: 'juxtapose',
      correctAnswer: '나란히 놓다',
      options: ['분리하다', '나란히 놓다', '숨기다', '파괴하다'],
      level: 'L3',
    },
  ];
}
