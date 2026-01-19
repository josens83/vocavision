/**
 * Quiz Page
 * 다양한 퀴즈 모드로 단어 학습
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckSquare, RefreshCw, PenTool } from 'lucide-react';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  MultipleChoiceQuiz,
  QuizResultCard,
  type QuizMode,
  type QuizResultData,
} from '@/components/quiz';

type QuizStep = 'mode-select' | 'quiz' | 'result';

// Exam info (Dashboard와 동일)
const examInfo: Record<string, { name: string; icon: string }> = {
  CSAT: { name: '수능', icon: '📝' },
  TOEIC: { name: 'TOEIC', icon: '💼' },
  TOEFL: { name: 'TOEFL', icon: '🌍' },
  TEPS: { name: 'TEPS', icon: '🎓' },
};

const levelInfo: Record<string, { name: string; description: string }> = {
  L1: { name: '초급', description: '기초 필수 단어' },
  L2: { name: '중급', description: '핵심 심화 단어' },
  L3: { name: '고급', description: '고난도 단어' },
};

const QUIZ_MODES = [
  {
    id: 'eng-to-kor' as QuizMode,
    icon: CheckSquare,
    title: '4지선다 (영→한)',
    description: '영어 보고 뜻 선택',
    color: 'pink',
    available: true,
  },
  {
    id: 'kor-to-eng' as QuizMode,
    icon: RefreshCw,
    title: '4지선다 (한→영)',
    description: '뜻 보고 영어 선택',
    color: 'purple',
    available: true,
  },
  {
    id: 'spelling' as QuizMode,
    icon: PenTool,
    title: '스펠링',
    description: '직접 입력하기',
    color: 'gray',
    available: false,
  },
];

function QuizPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // 시험/레벨 상태 (store에서 가져오기)
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);
  const setActiveLevel = useExamCourseStore((state) => state.setActiveLevel);

  const selectedExam = activeExam || 'CSAT';
  const selectedLevel = activeLevel || 'L1';

  const modeParam = searchParams.get('mode') as QuizMode | null;

  const [step, setStep] = useState<QuizStep>(modeParam ? 'quiz' : 'mode-select');
  const [mode, setMode] = useState<QuizMode>(modeParam || 'eng-to-kor');
  const [result, setResult] = useState<QuizResultData | null>(null);

  const handleModeSelect = (selectedMode: QuizMode) => {
    if (selectedMode === 'spelling') {
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

  // 퀴즈 진행 중이거나 결과 화면은 전체 화면으로
  if (step === 'quiz' && (mode === 'eng-to-kor' || mode === 'kor-to-eng')) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Demo Mode Banner for Guests */}
        {!user && (
          <div className="bg-amber-50 border-b border-amber-200 sticky top-0 z-20">
            <div className="container mx-auto px-4 py-2">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-bold text-xs">체험</span>
                  <span className="text-amber-800">퀴즈 결과가 저장되지 않습니다.</span>
                </div>
                <a href="/auth/login" className="text-amber-900 font-medium underline hover:text-amber-700">
                  로그인하고 기록 저장하기
                </a>
              </div>
            </div>
          </div>
        )}
        <MultipleChoiceQuiz
          exam={selectedExam}
          level={selectedLevel}
          mode={mode}
          onComplete={handleQuizComplete}
          onBack={handleBack}
        />
      </div>
    );
  }

  if (step === 'result' && result) {
    return (
      <QuizResultCard
        result={result}
        mode={mode}
        onRetry={handleRetry}
        onChangeMode={handleChangeMode}
        onHome={handleHome}
      />
    );
  }

  // 모드 선택 화면은 DashboardLayout 적용
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        {/* 데모 모드 배너 */}
        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-bold text-xs">체험</span>
                <span className="text-amber-800 text-sm">퀴즈 결과가 저장되지 않습니다</span>
              </div>
              <Link
                href="/auth/register"
                className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition whitespace-nowrap"
              >
                무료 회원가입
              </Link>
            </div>
          </div>
        )}

        {/* 페이지 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">퀴즈</h1>
          <p className="text-gray-500 text-sm mt-1">다양한 퀴즈로 실력을 테스트하세요</p>
        </div>

        {/* 시험/레벨 선택 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">시험 및 레벨 선택</h2>

          {/* 시험 선택 */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">시험 선택</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(examInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setActiveExam(key as ExamType)}
                  className={`p-3 rounded-xl border-2 text-center transition ${
                    selectedExam === key
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-lg mr-1">{info.icon}</span>
                  <span className="font-medium text-sm">{info.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 레벨 선택 */}
          <div>
            <p className="text-sm text-gray-600 mb-2">레벨 선택</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(levelInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setActiveLevel(key as 'L1' | 'L2' | 'L3')}
                  className={`p-3 rounded-xl border-2 text-center transition ${
                    selectedLevel === key
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="font-bold text-sm">{key}</span>
                  <span className="text-xs text-gray-500 ml-1">{info.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 퀴즈 모드 선택 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">퀴즈 모드 선택</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUIZ_MODES.map((quizMode) => {
              const Icon = quizMode.icon;
              const colorClasses = {
                pink: 'bg-pink-100 text-pink-600 hover:border-pink-500 hover:bg-pink-50',
                purple: 'bg-purple-100 text-purple-600 hover:border-purple-500 hover:bg-purple-50',
                gray: 'bg-gray-100 text-gray-400',
              }[quizMode.color];

              return (
                <button
                  key={quizMode.id}
                  onClick={() => quizMode.available && handleModeSelect(quizMode.id)}
                  disabled={!quizMode.available}
                  className={`
                    p-5 rounded-xl border-2 text-left transition-all
                    ${
                      quizMode.available
                        ? `bg-white border-gray-200 ${colorClasses}`
                        : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      quizMode.color === 'pink' ? 'bg-pink-100' :
                      quizMode.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${
                      quizMode.color === 'pink' ? 'text-pink-600' :
                      quizMode.color === 'purple' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{quizMode.title}</h3>
                  <p className="text-sm text-gray-500">{quizMode.description}</p>
                  {!quizMode.available && (
                    <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
                      준비 중
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 추천 팁 */}
          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-sm text-amber-700">
              💡 <strong>추천:</strong> 영→한으로 시작하고, 익숙해지면 한→영으로 도전해보세요!
            </p>
          </div>
        </div>

        {/* 현재 선택 정보 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          선택: {examInfo[selectedExam]?.name || selectedExam} • {levelInfo[selectedLevel]?.name || selectedLevel}
        </div>
      </div>
    </DashboardLayout>
  );
}

// 로딩 컴포넌트
function QuizPageLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <SkeletonCard className="mb-6 h-48" />
        <SkeletonCard className="h-64" />
      </div>
    </DashboardLayout>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<QuizPageLoading />}>
      <QuizPageContent />
    </Suspense>
  );
}
