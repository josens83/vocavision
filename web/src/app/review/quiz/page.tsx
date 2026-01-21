'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { progressAPI, learningAPI, wordsAPI } from '@/lib/api';

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

// 품사 한글 매핑
const POS_LABELS: Record<string, string> = {
  NOUN: '명사',
  VERB: '동사',
  ADJECTIVE: '형용사',
  ADVERB: '부사',
  PRONOUN: '대명사',
  PREPOSITION: '전치사',
  CONJUNCTION: '접속사',
  INTERJECTION: '감탄사',
};

// 시험 카테고리 한글 매핑
const EXAM_LABELS: Record<string, string> = {
  CSAT: '수능',
  TEPS: 'TEPS',
  TOEFL: 'TOEFL',
  TOEIC: 'TOEIC',
  SAT: 'SAT',
};

function QuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const examParam = searchParams.get('exam');
  const levelParam = searchParams.get('level');
  const isDemo = searchParams.get('demo') === 'true';

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
      // 세션 시작
      const session = await progressAPI.startSession();
      setSessionId(session.session?.id);

      // 퀴즈 문제 로드
      const params: { examCategory?: string; level?: string; limit?: number } = {
        limit: 10,
      };
      if (examParam) params.examCategory = examParam;
      if (levelParam) params.level = levelParam;

      const data = await progressAPI.getReviewQuiz(params);
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
      // API에서 샘플 단어 20개 로드
      const data = await wordsAPI.getWords({
        examCategory: 'CSAT',
        limit: 20,
      });

      const words = data.words || [];

      // 단어를 퀴즈 형식으로 변환
      const quizQuestions: QuizQuestion[] = words.map((word: any) => {
        // 오답 선택지 생성 (다른 단어들의 뜻에서 랜덤 선택)
        const otherWords = words.filter((w: any) => w.id !== word.id);
        const shuffledOthers = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);

        const correctAnswer = word.definitionKo || word.definition || '뜻 없음';
        const wrongAnswers = shuffledOthers.map((w: any) => w.definitionKo || w.definition || '뜻 없음');

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
            examCategory: 'CSAT',
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
    } else {
      setIncorrectCount((prev) => prev + 1);
    }

    // 데모 모드에서는 학습 기록 저장 스킵
    if (isDemo) return;

    // 학습 기록 저장
    try {
      await learningAPI.recordLearning({
        wordId: currentQuestion.wordId,
        quizType: 'ENG_TO_KOR',
        isCorrect,
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        responseTime,
        sessionId: sessionId || undefined,
      });

      // 복습 결과 제출 (SM-2 알고리즘 업데이트)
      await progressAPI.submitReview({
        wordId: currentQuestion.wordId,
        rating: isCorrect ? 4 : 2, // 4: Easy, 2: Hard
        responseTime,
        learningMethod: 'QUIZ',
        sessionId: sessionId || undefined,
      });
    } catch (error) {
      console.error('Failed to record answer:', error);
    }
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
  const handleComplete = async () => {
    // 데모 모드에서는 세션 종료 스킵
    if (!isDemo && sessionId) {
      try {
        await progressAPI.endSession({
          sessionId,
          wordsStudied: questions.length,
          wordsCorrect: correctCount,
        });
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    }
    router.push(`/review/quiz/result?correct=${correctCount}&total=${questions.length}${examParam ? `&exam=${examParam}` : ''}${levelParam ? `&level=${levelParam}` : ''}${isDemo ? '&demo=true' : ''}`);
  };

  // 로딩 상태
  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
            className="inline-block px-6 py-3 bg-pink-500 text-white font-bold rounded-xl"
          >
            복습 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <p className="text-sm text-pink-500 mt-1">
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
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
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
              {currentIndex < questions.length - 1 ? '다음 단어 →' : '완료 🎉'}
            </button>
          )}
        </div>

        {/* 현재 진행 상황 */}
        <div className="text-center text-sm text-gray-500">
          <span className="text-green-600 font-medium">✓ {correctCount}</span>
          <span className="mx-2">|</span>
          <span className="text-red-500 font-medium">✗ {incorrectCount}</span>
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
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <QuizPageContent />
    </Suspense>
  );
}
