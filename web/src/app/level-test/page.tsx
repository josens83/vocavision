'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLevelTest, type LevelTestResult as LevelTestResultType } from '@/hooks/useLevelTest';
import {
  LevelTestIntro,
  LevelTestQuiz,
  LevelTestResult,
} from '@/components/onboarding';

export default function LevelTestPage() {
  const router = useRouter();

  // Quiz 완료 시 결과 저장을 위한 로컬 상태
  const [quizResult, setQuizResult] = useState<LevelTestResultType | null>(null);

  const {
    step,
    setStep,
    questions,
    isLoading,
    hasCompleted,
    startTest,
    skipTest,
    restartTest,
  } = useLevelTest({
    onComplete: (result) => {
      console.log('Level test completed:', result);
    },
  });

  // 이미 테스트를 완료한 사용자는 쿼리 파라미터 확인
  useEffect(() => {
    if (hasCompleted) {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('retry')) {
        // 재시도가 아니면 대시보드로 리다이렉트 가능
        // router.push('/dashboard');
      }
    }
  }, [hasCompleted, router]);

  const handleStartTest = () => {
    setQuizResult(null);
    startTest();
  };

  const handleSkip = () => {
    skipTest();
    router.push('/dashboard');
  };

  const handleQuizComplete = (correct: number, total: number) => {
    // 점수 기반 레벨 추천 계산
    const percentage = (correct / total) * 100;
    let recommendedLevel: 'L1' | 'L2' | 'L3';
    if (percentage >= 70) {
      recommendedLevel = 'L3';
    } else if (percentage >= 40) {
      recommendedLevel = 'L2';
    } else {
      recommendedLevel = 'L1';
    }

    // 결과 객체 생성
    const result: LevelTestResultType = {
      correct,
      wrong: total - correct,
      total,
      accuracy: Math.round(percentage),
      recommendedLevel,
      answers: [],
    };

    // localStorage에 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('levelTestCompleted', 'true');
      localStorage.setItem('selectedLevel', recommendedLevel);
      localStorage.setItem('recommendedLevel', recommendedLevel);
    }

    setQuizResult(result);
    setStep('result');
  };

  const handleRetry = () => {
    setQuizResult(null);
    restartTest();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mb-4"></div>
          <p className="text-gray-500">문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {step === 'intro' && (
          <LevelTestIntro
            onStart={handleStartTest}
            onSkip={handleSkip}
          />
        )}

        {step === 'quiz' && questions.length > 0 && (
          <LevelTestQuiz
            questions={questions.map((q) => ({
              word: q.word,
              correctAnswer: q.correctAnswer,
              options: q.options,
              level: q.level,
            }))}
            onComplete={handleQuizComplete}
            onClose={handleSkip}
          />
        )}

        {step === 'result' && quizResult && (
          <LevelTestResult
            correct={quizResult.correct}
            total={quizResult.total}
            recommendedLevel={quizResult.recommendedLevel}
            onRetry={handleRetry}
          />
        )}
      </div>
    </div>
  );
}
