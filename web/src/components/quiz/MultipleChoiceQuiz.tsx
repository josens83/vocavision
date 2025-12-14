'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Clock } from 'lucide-react';
import QuizProgress from './QuizProgress';
import QuizOptions from './QuizOptions';
import QuizFeedbackCard from './QuizFeedbackCard';
import { tts } from '@/lib/speech/textToSpeech';
import { wordsAPI } from '@/lib/api';

export type MultipleChoiceMode = 'eng-to-kor' | 'kor-to-eng';

interface Word {
  id: string;
  word: string;
  definitionKo: string;
  pronunciation?: string;
  mnemonics?: { content: string }[];
}

interface QuizQuestion {
  word: Word;
  options: string[];
  correctAnswer: string;
}

export interface QuizResultData {
  correct: number;
  wrong: number;
  total: number;
  timeSpent: number;
  wrongWords: Word[];
}

interface MultipleChoiceQuizProps {
  exam: string;
  level: string;
  mode: MultipleChoiceMode;
  onComplete: (result: QuizResultData) => void;
  onBack: () => void;
}

export default function MultipleChoiceQuiz({
  exam,
  level,
  mode,
  onComplete,
  onBack,
}: MultipleChoiceQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [startTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const currentQuestion = questions[currentIndex];
  const progress =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // 타이머
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // 문제 로드
  useEffect(() => {
    loadQuestions();
  }, [exam, level, mode]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      // API에서 단어 가져오기
      const data = await wordsAPI.getWords({
        examCategory: exam.toUpperCase(),
        level,
        limit: 20,
      });
      const words: Word[] = data.words || [];

      if (words.length < 4) {
        console.error('Not enough words for quiz');
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      // 문제 생성
      const generatedQuestions = words.map((word) => {
        // 오답 선택지 생성 (다른 단어들에서)
        const otherWords = words.filter((w) => w.id !== word.id);
        const wrongOptions = otherWords
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);

        if (mode === 'eng-to-kor') {
          // 영어 → 한글: 정답은 한글 뜻
          const correctAnswer = word.definitionKo;
          const options = [
            correctAnswer,
            ...wrongOptions.map((w) => w.definitionKo),
          ].sort(() => 0.5 - Math.random());

          return { word, options, correctAnswer };
        } else {
          // 한글 → 영어: 정답은 영어 단어
          const correctAnswer = word.word;
          const options = [
            correctAnswer,
            ...wrongOptions.map((w) => w.word),
          ].sort(() => 0.5 - Math.random());

          return { word, options, correctAnswer };
        }
      });

      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongWords((prev) => [...prev, currentQuestion.word]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      // 퀴즈 완료
      onComplete({
        correct: correctCount,
        wrong: wrongWords.length,
        total: questions.length,
        timeSpent: timer,
        wrongWords,
      });
    }
  };

  const handlePlayPronunciation = () => {
    if (currentQuestion?.word.word) {
      tts.speakWord(currentQuestion.word.word);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">퀴즈를 위한 단어가 부족합니다.</p>
          <button onClick={onBack} className="text-pink-500 font-medium">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-600">
              {currentIndex + 1} / {questions.length}
            </span>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(timer)}</span>
            </div>
          </div>
          <QuizProgress progress={progress} />
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* 모드 뱃지 */}
        <div className="text-center mb-4">
          <span className="inline-block bg-pink-100 text-pink-600 text-xs font-medium px-3 py-1 rounded-full">
            {mode === 'eng-to-kor' ? '📖 영→한 퀴즈' : '🔄 한→영 퀴즈'}
          </span>
        </div>

        {/* 문제 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
          {mode === 'eng-to-kor' ? (
            // 영어 → 한글: 영어 단어 표시
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {currentQuestion.word.word}
              </h2>
              {currentQuestion.word.pronunciation && (
                <p className="text-gray-500 mb-3">
                  {currentQuestion.word.pronunciation}
                </p>
              )}
              <button
                onClick={handlePlayPronunciation}
                className="p-2 bg-pink-100 hover:bg-pink-200 rounded-full transition-colors"
              >
                <Volume2 className="w-5 h-5 text-pink-600" />
              </button>
            </>
          ) : (
            // 한글 → 영어: 한글 뜻 표시
            <h2 className="text-2xl font-bold text-gray-900">
              {currentQuestion.word.definitionKo}
            </h2>
          )}
        </div>

        {/* 선택지 또는 피드백 */}
        {!isAnswered ? (
          <QuizOptions
            options={currentQuestion.options}
            onSelect={handleSelectAnswer}
          />
        ) : (
          <QuizFeedbackCard
            isCorrect={isCorrect}
            correctAnswer={currentQuestion.correctAnswer}
            selectedAnswer={selectedAnswer!}
            word={currentQuestion.word}
            mode={mode}
            onNext={handleNext}
            isLast={currentIndex === questions.length - 1}
          />
        )}
      </div>
    </div>
  );
}
