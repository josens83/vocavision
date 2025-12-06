'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';

export interface QuizQuestion {
  word: string;
  correctAnswer: string;
  options: string[];
  level: string;
}

interface LevelTestQuizProps {
  questions: QuizQuestion[];
  onComplete: (correct: number, total: number) => void;
  onClose: () => void;
}

export default function LevelTestQuiz({
  questions,
  onComplete,
  onClose,
}: LevelTestQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // 테스트 완료
      const finalCorrect =
        selectedAnswer === currentQuestion.correctAnswer
          ? correctCount + 1
          : correctCount;
      onComplete(finalCorrect, questions.length);
    }
  }, [currentIndex, questions.length, selectedAnswer, currentQuestion, correctCount, onComplete]);

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    if (answer === currentQuestion.correctAnswer) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  // 정답 확인 후 자동 진행
  useEffect(() => {
    if (isAnswered) {
      const timer = setTimeout(() => {
        handleNextQuestion();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAnswered, handleNextQuestion]);

  const getOptionStyle = (option: string) => {
    if (!isAnswered) {
      return 'bg-white border-gray-200 hover:border-pink-300 hover:bg-pink-50';
    }

    if (option === currentQuestion.correctAnswer) {
      return 'bg-green-50 border-green-500 text-green-700';
    }

    if (option === selectedAnswer && !isCorrect) {
      return 'bg-red-50 border-red-500 text-red-700';
    }

    return 'bg-gray-50 border-gray-200 text-gray-400';
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'L1':
        return '초급';
      case 'L2':
        return '중급';
      case 'L3':
        return '고급';
      default:
        return level;
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-gray-500">
          {currentIndex + 1} / {questions.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 진행률 바 */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-pink-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 문제 카드 */}
      <div className="flex-1 flex flex-col">
        {/* 단어 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
          <span className="text-xs text-pink-500 font-medium mb-2 block">
            {getLevelLabel(currentQuestion.level)}
          </span>
          <h2 className="text-3xl font-bold text-gray-900">
            {currentQuestion.word}
          </h2>
        </div>

        {/* 선택지 */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectAnswer(option)}
              disabled={isAnswered}
              className={`
                w-full p-4 rounded-xl border-2 text-left transition-all
                flex items-center justify-between
                disabled:cursor-default
                ${getOptionStyle(option)}
              `}
            >
              <span className="font-medium">{option}</span>
              {isAnswered && option === currentQuestion.correctAnswer && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
              {isAnswered &&
                option === selectedAnswer &&
                !isCorrect &&
                option !== currentQuestion.correctAnswer && (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
            </button>
          ))}
        </div>

        {/* 현재 점수 (하단) */}
        <div className="mt-auto pt-6 flex justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            정답: {correctCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            오답: {currentIndex - correctCount + (isAnswered && !isCorrect ? 1 : 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
