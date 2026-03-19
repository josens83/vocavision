'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { progressAPI, learningAPI, wordsAPI } from '@/lib/api';
import { useInvalidateReviews } from '@/hooks/useQueries';
import { useLocale } from '@/hooks/useLocale';

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  wordId: string;
  word: {
    id: string;
    word: string;
    partOfSpeech?: string;
    pronunciation?: string;
    phonetic?: string;
    ipaUs?: string;
    ipaUk?: string;
    audioUrlUs?: string;
    audioUrlUk?: string;
    pronunciationKo?: string;
    examCategory?: string;
    level?: string;
  };
  visuals: {
    concept: string | null;
    mnemonic: string | null;
    rhyme: string | null;
  };
  options: QuizOption[];
  correctAnswer: string;
  progressId: string;
  correctCount: number;
  incorrectCount: number;
}

// 품사 매핑 (locale별)
const POS_LABELS_KO: Record<string, string> = {
  NOUN: '명사', VERB: '동사', ADJECTIVE: '형용사', ADVERB: '부사',
  PRONOUN: '대명사', PREPOSITION: '전치사', CONJUNCTION: '접속사', INTERJECTION: '감탄사',
};
const POS_LABELS_EN: Record<string, string> = {
  NOUN: 'NOUN', VERB: 'VERB', ADJECTIVE: 'ADJ', ADVERB: 'ADV',
  PRONOUN: 'PRON', PREPOSITION: 'PREP', CONJUNCTION: 'CONJ', INTERJECTION: 'INTERJ',
};

// 시험 카테고리 매핑 (locale별)
const EXAM_LABELS_KO: Record<string, string> = {
  CSAT: '수능', TEPS: 'TEPS', TOEFL: 'TOEFL', TOEIC: 'TOEIC', SAT: 'SAT',
};
const EXAM_LABELS_EN: Record<string, string> = {
  CSAT: 'CSAT', TEPS: 'TEPS', TOEFL: 'TOEFL', TOEIC: 'TOEIC', SAT: 'SAT',
};

function QuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isEn = locale === 'en';
  const POS_LABELS = isEn ? POS_LABELS_EN : POS_LABELS_KO;
  const EXAM_LABELS = isEn ? EXAM_LABELS_EN : EXAM_LABELS_KO;
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const examParam = searchParams.get('exam');
  const levelParam = searchParams.get('level');
  const isDemo = searchParams.get('demo') === 'true';

  // 캐시 무효화 훅
  const invalidateReviews = useInvalidateReviews();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  // 결과 통계
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  const currentQuestion = questions[currentIndex];

  // Pull-to-Refresh 비활성화 (맨 위에서 아래로 당길 때만 방지)
  useEffect(() => {
    let startY = 0;
    let isAtTop = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY;
      isAtTop = window.scrollY === 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].pageY;
      const isPullingDown = y > startY;

      // 맨 위에서 아래로 당기는 경우만 방지
      if (isAtTop && isPullingDown) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // 퀴즈 로드
  useEffect(() => {
    if (!hasHydrated) return;

    // 데모 모드: 비로그인도 접근 가능
    if (isDemo) {
      loadDemoQuiz();
      return;
    }

    // 일반 모드: 로그인 필요
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadQuiz();
  }, [hasHydrated, user, router, examParam, levelParam, isDemo]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      // 퀴즈 파라미터 준비
      const params: { examCategory?: string; level?: string; limit?: number } = {
        limit: 10,
      };
      if (examParam) params.examCategory = examParam;
      if (levelParam) params.level = levelParam;

      // 🚀 세션 시작 + 퀴즈 로드 병렬 실행 (30~40% 시간 단축)
      const [session, data] = await Promise.all([
        progressAPI.startSession(),
        progressAPI.getReviewQuiz(params),
      ]);

      setSessionId(session.session?.id);
      setQuestions(data.questions || []);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  // 데모 퀴즈 로드
  const loadDemoQuiz = async () => {
    setLoading(true);
    try {
      // API에서 샘플 단어 15개 로드 (10문제 + 오답 선택지용)
      const data = await wordsAPI.getWords({
        examCategory: isEn ? 'SAT' : 'CSAT',
        limit: 15,
      });

      const words = data.words || [];

      // 10문제만 사용 (나머지는 오답 선택지용)
      const quizWords = words.slice(0, 10);

      // 단어를 퀴즈 형식으로 변환 (10문제만)
      const quizQuestions: QuizQuestion[] = quizWords.map((word: any) => {
        // 오답 선택지 생성 (전체 단어에서 랜덤 선택)
        const otherWords = words.filter((w: any) => w.id !== word.id);
        const shuffledOthers = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);

        const correctAnswer = isEn
          ? (word.definition || word.definitionKo || 'No definition')
          : (word.definitionKo || word.definition || '뜻 없음');
        const wrongAnswers = shuffledOthers.map((w: any) =>
          isEn ? (w.definition || w.definitionKo || 'No definition') : (w.definitionKo || w.definition || '뜻 없음')
        );

        // 선택지 섞기
        const allOptions: QuizOption[] = [
          { text: correctAnswer, isCorrect: true },
          ...wrongAnswers.map((text: string) => ({ text, isCorrect: false }))
        ].sort(() => Math.random() - 0.5);

        // 비주얼 이미지 추출
        const visuals = {
          concept: word.visuals?.find((v: any) => v.type === 'CONCEPT')?.imageUrl || null,
          mnemonic: word.visuals?.find((v: any) => v.type === 'MNEMONIC')?.imageUrl || null,
          rhyme: word.visuals?.find((v: any) => v.type === 'RHYME')?.imageUrl || null,
        };

        return {
          wordId: word.id,
          word: {
            id: word.id,
            word: word.word,
            partOfSpeech: word.partOfSpeech,
            pronunciation: word.pronunciation,
            ipaUs: word.ipaUs,
            ipaUk: word.ipaUk,
            audioUrlUs: word.audioUrlUs,
            audioUrlUk: word.audioUrlUk,
            pronunciationKo: word.pronunciationKo,
            examCategory: isEn ? 'SAT' : 'CSAT',
            level: 'L1',
          },
          visuals,
          options: allOptions,
          correctAnswer,
          progressId: 'demo',
          correctCount: 0,
          incorrectCount: 0,
        };
      });

      setQuestions(quizQuestions);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Failed to load demo quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  // 발음 재생
  const playAudio = useCallback((audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  }, []);

  // 답변 선택
  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  // 정답 확인
  const handleSubmit = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const responseTime = Date.now() - startTime;

    setShowResult(true);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      // 현재 문제의 correctCount도 업데이트 (UI 즉시 반영)
      setQuestions((prev) =>
        prev.map((q, idx) =>
          idx === currentIndex ? { ...q, correctCount: q.correctCount + 1 } : q
        )
      );
    } else {
      setIncorrectCount((prev) => prev + 1);
      // 현재 문제의 incorrectCount도 업데이트 (UI 즉시 반영)
      setQuestions((prev) =>
        prev.map((q, idx) =>
          idx === currentIndex ? { ...q, incorrectCount: q.incorrectCount + 1 } : q
        )
      );
    }

    // 데모 모드에서는 학습 기록 저장 스킵
    if (isDemo) return;

    // 🚀 학습 기록 저장 (백그라운드에서 병렬 처리 - 응답 기다리지 않음)
    Promise.all([
      learningAPI.recordLearning({
        wordId: currentQuestion.wordId,
        quizType: 'ENG_TO_KOR',
        isCorrect,
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        responseTime,
        sessionId: sessionId || undefined,
      }),
      progressAPI.submitReview({
        wordId: currentQuestion.wordId,
        rating: isCorrect ? 4 : 2, // 4: Easy, 2: Hard
        responseTime,
        learningMethod: 'QUIZ',
        sessionId: sessionId || undefined,
        examCategory: examParam?.toUpperCase() || currentQuestion.word?.examCategory || undefined,
        level: levelParam || currentQuestion.word?.level || undefined,
      }),
    ]).catch((error) => {
      console.error('Failed to record answer:', error);
    });
  };

  // 다음 문제
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setStartTime(Date.now());
    } else {
      // 퀴즈 완료
      handleComplete();
    }
  };

  // 퀴즈 완료
  const handleComplete = () => {
    // 복습 캐시 무효화 (퀴즈 완료 후 데이터 갱신)
    invalidateReviews(examParam?.toUpperCase() || undefined, levelParam || undefined);

    // 🚀 낙관적 UI: 먼저 결과 페이지로 이동
    router.push(`/review/quiz/result?correct=${correctCount}&total=${questions.length}${examParam ? `&exam=${examParam}` : ''}${levelParam ? `&level=${levelParam}` : ''}${isDemo ? '&demo=true' : ''}`);

    // 백그라운드에서 세션 종료 (데모 모드 제외)
    if (!isDemo && sessionId) {
      progressAPI.endSession({
        sessionId,
        wordsStudied: questions.length,
        wordsCorrect: correctCount,
      }).catch((error) => {
        console.error('Failed to end session:', error);
      });
    }
  };

  // 로딩 상태
  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">퀴즈를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 복습할 단어 없음
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">복습 완료!</h2>
          <p className="text-gray-500 mb-6">오늘 복습할 단어가 없습니다.</p>
          <Link
            href="/review"
            className="inline-block px-6 py-3 bg-teal-500 text-white font-bold rounded-xl"
          >
            복습 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="no-pull-refresh min-h-screen bg-gray-50">
      {/* 데모 모드 배너 */}
      {isDemo && !user && (
        <div className="bg-amber-50 border-b border-amber-200 sticky top-0 z-20">
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-bold text-xs shrink-0">체험</span>
                <span className="text-amber-800 whitespace-nowrap">학습 기록이 저장되지 않습니다.</span>
              </div>
              <Link href="/auth/login" className="text-amber-900 font-medium underline hover:text-amber-700 whitespace-nowrap">
                로그인하고 기록 저장하기
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className={`bg-white border-b border-gray-200 sticky ${isDemo && !user ? 'top-10' : 'top-0'} z-10`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push(isDemo ? '/' : '/review')} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {questions.length}
          </span>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* 진행 바 */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* 단어 정보 */}
        <div className="text-center mb-6 py-6 bg-gradient-to-b from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm">
          {/* 시험/레벨 표시 */}
          <p className="text-sm text-gray-500 mb-2">
            {EXAM_LABELS[currentQuestion.word.examCategory || ''] || currentQuestion.word.examCategory} • {currentQuestion.word.level || 'L1'}
          </p>

          {/* 품사 뱃지 */}
          {currentQuestion.word.partOfSpeech && (
            <span className="inline-block px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-full mb-3">
              {POS_LABELS[currentQuestion.word.partOfSpeech] ||
                currentQuestion.word.partOfSpeech}
            </span>
          )}

          {/* 단어 + 발음 버튼 */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">
              {currentQuestion.word.word}
            </h1>
            {currentQuestion.word.audioUrlUs && (
              <button
                onClick={() => playAudio(currentQuestion.word.audioUrlUs)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Volume2 className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* IPA 발음 기호 */}
          {(currentQuestion.word.ipaUs || currentQuestion.word.pronunciation) && (
            <p className="text-gray-500 text-sm">
              {currentQuestion.word.ipaUs || currentQuestion.word.pronunciation}
            </p>
          )}

          {/* 한국어 발음 */}
          {currentQuestion.word.pronunciationKo && (
            <p className="text-sm text-teal-500 mt-1">
              {currentQuestion.word.pronunciationKo}
            </p>
          )}
        </div>

        {/* 이미지 3개 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Concept Image */}
          <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
            {currentQuestion.visuals.concept ? (
              <Image
                src={currentQuestion.visuals.concept}
                alt="concept"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-2xl">🖼️</span>
                <span className="text-xs mt-1">의미</span>
              </div>
            )}
          </div>

          {/* Mnemonic Image */}
          <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
            {currentQuestion.visuals.mnemonic ? (
              <Image
                src={currentQuestion.visuals.mnemonic}
                alt="mnemonic"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-2xl">💡</span>
                <span className="text-xs mt-1">연상</span>
              </div>
            )}
          </div>

          {/* Rhyme Image */}
          <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
            {currentQuestion.visuals.rhyme ? (
              <Image
                src={currentQuestion.visuals.rhyme}
                alt="rhyme"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-2xl">🎵</span>
                <span className="text-xs mt-1">라임</span>
              </div>
            )}
          </div>
        </div>

        {/* 4지선다 */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(option.text)}
              disabled={showResult}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                showResult
                  ? option.isCorrect
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : selectedAnswer === option.text
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-400'
                  : selectedAnswer === option.text
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50/50'
              }`}
            >
              <span className="font-medium text-gray-500 mr-2">{idx + 1}.</span>
              {option.text}
            </button>
          ))}
        </div>

        {/* 정답/오답 피드백 */}
        {showResult && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              selectedAnswer === currentQuestion.correctAnswer
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {selectedAnswer === currentQuestion.correctAnswer ? (
              <p className="text-center text-green-600 font-bold text-lg">
                ✅ 정답!
              </p>
            ) : (
              <div className="text-center">
                <p className="text-red-600 font-bold text-lg mb-1">❌ 오답</p>
                <p className="text-sm text-gray-700">
                  정답: <strong>{currentQuestion.correctAnswer}</strong>
                </p>
                <p className="text-xs text-orange-500 mt-2">
                  ⏰ 내일 다시 복습합니다
                </p>
              </div>
            )}
          </div>
        )}

        {/* 버튼 */}
        <div className="pb-6">
          {!showResult ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-pink-500/25"
            >
              정답 확인
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-pink-500/25"
            >
              {currentIndex < questions.length - 1 ? (isEn ? 'Next →' : '다음 단어 →') : (isEn ? 'Done 🎉' : '완료 🎉')}
            </button>
          )}
        </div>

        {/* 현재 단어 학습 기록 */}
        <div className="text-center text-sm text-gray-500">
          <span className="text-green-600 font-medium">✓ {currentQuestion?.correctCount ?? 0}</span>
          <span className="mx-2">|</span>
          <span className="text-red-500 font-medium">✗ {currentQuestion?.incorrectCount ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReviewQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <QuizPageContent />
    </Suspense>
  );
}
