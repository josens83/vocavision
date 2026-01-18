'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const sampleQuestions = [
  {
    word: 'CONJECTURE',
    meaning: '추측, 가설',
    options: ['추측, 가설', '마법처럼 불러내다', '감식가', '신성하게 하다'],
    correctIndex: 0
  },
  {
    word: 'CONSECRATE',
    meaning: '신성하게 하다, 봉헌하다',
    options: ['추측하다', '소환하다', '신성하게 하다', '전문가'],
    correctIndex: 2
  }
];

export default function QuizDemoPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = sampleQuestions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctIndex;

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === currentQuestion.correctIndex) {
      setCorrectCount(correctCount + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < sampleQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setIsComplete(false);
  };

  if (isComplete) {
    const allCorrect = correctCount === sampleQuestions.length;
    return (
      <div className="text-center py-12 pb-24">
        <div className="text-6xl mb-4">{allCorrect ? '🎉' : '👏'}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {correctCount} / {sampleQuestions.length} 정답!
        </h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          VocaVision의 퀴즈는 <strong className="text-blue-600">틀린 단어를 더 자주</strong> 출제하고,<br />
          <strong className="text-blue-600">아는 단어는 간격을 늘려</strong> 효율적으로 복습합니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            다시 체험하기
          </button>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 transition"
          >
            실제 퀴즈 시작하기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">적응형 퀴즈</h1>
        <p className="text-gray-600">정답을 선택하세요</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {sampleQuestions.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                index < currentIndex
                  ? 'bg-blue-500'
                  : index === currentIndex
                  ? 'bg-blue-300 scale-125'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 문제 카드 */}
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-2">
            {currentQuestion.word}
          </h2>
          <p className="text-center text-gray-500">의 뜻은?</p>
        </div>

        {/* 선택지 */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            let bgColor = 'bg-white hover:bg-gray-50';
            let borderColor = 'border-gray-200';
            let textColor = 'text-gray-700';

            if (showResult) {
              if (index === currentQuestion.correctIndex) {
                bgColor = 'bg-green-50';
                borderColor = 'border-green-500';
                textColor = 'text-green-700';
              } else if (index === selectedAnswer && !isCorrect) {
                bgColor = 'bg-red-50';
                borderColor = 'border-red-500';
                textColor = 'text-red-700';
              }
            } else if (selectedAnswer === index) {
              borderColor = 'border-blue-500';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl border-2 ${bgColor} ${borderColor} ${textColor}
                           text-left transition-all flex items-center justify-between
                           ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span>{option}</span>
                {showResult && index === currentQuestion.correctIndex && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {showResult && index === selectedAnswer && !isCorrect && index !== currentQuestion.correctIndex && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* 피드백 + 다음 버튼 */}
        {showResult && (
          <div className="mt-6 text-center">
            <p className={`text-lg font-medium mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? '✅ 정답입니다!' : `❌ 오답! 정답: ${currentQuestion.meaning}`}
            </p>

            {!isCorrect && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
                💡 VocaVision은 이 단어를 더 자주 출제하여 기억을 강화합니다.
              </div>
            )}

            <button
              onClick={handleNext}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              {currentIndex < sampleQuestions.length - 1 ? '다음 문제' : '결과 보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
