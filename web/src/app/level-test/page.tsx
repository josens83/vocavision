'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LevelTestIntro,
  LevelTestQuiz,
  LevelTestResult,
  QuizQuestion,
} from '@/components/onboarding';
import { wordsAPI } from '@/lib/api';

type TestStep = 'intro' | 'quiz' | 'result';

// 기본 테스트 문제 (API 실패 시 폴백)
const DEFAULT_QUESTIONS: QuizQuestion[] = [
  // L1 (쉬움) - 3문제
  {
    word: 'abundant',
    correctAnswer: '풍부한, 많은',
    options: ['풍부한, 많은', '부족한', '평범한', '특별한'],
    level: 'L1',
  },
  {
    word: 'comprehend',
    correctAnswer: '이해하다, 파악하다',
    options: ['거절하다', '이해하다, 파악하다', '설명하다', '망각하다'],
    level: 'L1',
  },
  {
    word: 'diminish',
    correctAnswer: '줄이다, 감소하다',
    options: ['늘리다', '유지하다', '줄이다, 감소하다', '변형하다'],
    level: 'L1',
  },
  // L2 (중간) - 4문제
  {
    word: 'feasible',
    correctAnswer: '실현 가능한',
    options: ['불가능한', '실현 가능한', '이상적인', '복잡한'],
    level: 'L2',
  },
  {
    word: 'implement',
    correctAnswer: '실행하다, 이행하다',
    options: ['포기하다', '실행하다, 이행하다', '지연하다', '취소하다'],
    level: 'L2',
  },
  {
    word: 'inherent',
    correctAnswer: '본래의, 고유한',
    options: ['외부의', '본래의, 고유한', '임시의', '인공적인'],
    level: 'L2',
  },
  {
    word: 'consequence',
    correctAnswer: '결과, 결말',
    options: ['원인', '결과, 결말', '과정', '시작'],
    level: 'L2',
  },
  // L3 (어려움) - 3문제
  {
    word: 'ubiquitous',
    correctAnswer: '어디에나 있는',
    options: ['희귀한', '어디에나 있는', '독특한', '일시적인'],
    level: 'L3',
  },
  {
    word: 'ephemeral',
    correctAnswer: '일시적인, 덧없는',
    options: ['영원한', '일시적인, 덧없는', '중요한', '평범한'],
    level: 'L3',
  },
  {
    word: 'juxtapose',
    correctAnswer: '나란히 놓다, 병치하다',
    options: ['분리하다', '나란히 놓다, 병치하다', '숨기다', '파괴하다'],
    level: 'L3',
  },
];

export default function LevelTestPage() {
  const router = useRouter();
  const [step, setStep] = useState<TestStep>('intro');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [recommendedLevel, setRecommendedLevel] = useState<string>('L1');
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEFAULT_QUESTIONS);
  const [loading, setLoading] = useState(false);

  // 이미 테스트를 완료한 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    const completed = localStorage.getItem('levelTestCompleted');
    if (completed === 'true') {
      // 테스트를 이미 했지만 다시 하러 온 경우 진행 허용
      // 쿼리 파라미터로 확인
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('retry')) {
        // 처음 방문이면 대시보드로
        // router.push('/dashboard');
      }
    }
  }, [router]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // API에서 레벨 테스트 문제 가져오기 시도
      const data = await wordsAPI.getLevelTestQuestions();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.log('Using default questions');
      // 기본 문제 사용 (이미 설정됨)
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    await loadQuestions();
    setStep('quiz');
  };

  const handleQuizComplete = (correct: number, total: number) => {
    setScore({ correct, total });

    // 점수에 따른 레벨 추천
    const percentage = (correct / total) * 100;
    let level: string;
    if (percentage >= 70) {
      level = 'L3'; // 고급
    } else if (percentage >= 40) {
      level = 'L2'; // 중급
    } else {
      level = 'L1'; // 초급
    }

    setRecommendedLevel(level);
    setStep('result');
  };

  const handleSkip = () => {
    // 건너뛰면 L1부터 시작
    localStorage.setItem('levelTestCompleted', 'true');
    localStorage.setItem('selectedLevel', 'L1');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {step === 'intro' && (
          <LevelTestIntro onStart={handleStartTest} onSkip={handleSkip} />
        )}

        {step === 'quiz' && !loading && (
          <LevelTestQuiz
            questions={questions}
            onComplete={handleQuizComplete}
            onClose={handleSkip}
          />
        )}

        {step === 'quiz' && loading && (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">문제를 불러오는 중...</p>
          </div>
        )}

        {step === 'result' && (
          <LevelTestResult
            correct={score.correct}
            total={score.total}
            recommendedLevel={recommendedLevel}
          />
        )}
      </div>
    </div>
  );
}
