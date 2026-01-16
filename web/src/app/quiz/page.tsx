/**
 * Quiz Page
 * 다양한 퀴즈 모드로 단어 학습
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import {
  QuizModeSelector,
  MultipleChoiceQuiz,
  QuizResultCard,
  type QuizMode,
  type QuizResultData,
} from '@/components/quiz';

type QuizStep = 'mode-select' | 'quiz' | 'result';

function QuizPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const exam = searchParams.get('exam') || 'CSAT';
  const level = searchParams.get('level') || 'L1';
  const modeParam = searchParams.get('mode') as QuizMode | null;

  const [step, setStep] = useState<QuizStep>(modeParam ? 'quiz' : 'mode-select');
  const [mode, setMode] = useState<QuizMode>(modeParam || 'eng-to-kor');
  const [result, setResult] = useState<QuizResultData | null>(null);

  const handleModeSelect = (selectedMode: QuizMode) => {
    if (selectedMode === 'spelling') {
      // 스펠링 모드는 아직 미구현
      return;
    }

    setMode(selectedMode);
    setStep('quiz');
  };

  const handleQuizComplete = (quizResult: QuizResultData) => {
    setResult(quizResult);
    setStep('result');
  };

  const handleRetry = () => {
    setResult(null);
    setStep('quiz');
  };

  const handleChangeMode = () => {
    setResult(null);
    setStep('mode-select');
  };

  const handleBack = () => {
    if (step === 'quiz') {
      setStep('mode-select');
    } else {
      router.push(user ? '/dashboard' : '/');
    }
  };

  const handleHome = () => {
    router.push(user ? '/dashboard' : '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner for Guests */}
      {!user && (
        <div className="bg-amber-50 border-b border-amber-200 sticky top-0 z-20">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-bold text-xs">체험</span>
              <span className="text-amber-800">퀴즈 결과가 저장되지 않습니다.</span>
              <a href="/auth/login" className="text-amber-900 font-medium underline hover:text-amber-700">
                로그인하고 기록 저장하기
              </a>
            </div>
          </div>
        </div>
      )}

      {step === 'mode-select' && (
        <QuizModeSelector
          exam={exam}
          level={level}
          onSelect={handleModeSelect}
          onBack={handleHome}
        />
      )}

      {step === 'quiz' && (mode === 'eng-to-kor' || mode === 'kor-to-eng') && (
        <MultipleChoiceQuiz
          exam={exam}
          level={level}
          mode={mode}
          onComplete={handleQuizComplete}
          onBack={handleBack}
        />
      )}

      {step === 'result' && result && (
        <QuizResultCard
          result={result}
          mode={mode}
          onRetry={handleRetry}
          onChangeMode={handleChangeMode}
          onHome={handleHome}
        />
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
        </div>
      }
    >
      <QuizPageContent />
    </Suspense>
  );
}
