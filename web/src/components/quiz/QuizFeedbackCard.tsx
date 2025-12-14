'use client';

import { CheckCircle, XCircle, ArrowRight, Lightbulb } from 'lucide-react';

interface Word {
  word: string;
  definitionKo: string;
  mnemonics?: { content: string }[];
}

interface QuizFeedbackCardProps {
  isCorrect: boolean;
  correctAnswer: string;
  selectedAnswer: string;
  word: Word;
  mode: 'eng-to-kor' | 'kor-to-eng';
  onNext: () => void;
  isLast: boolean;
}

export default function QuizFeedbackCard({
  isCorrect,
  correctAnswer,
  selectedAnswer,
  word,
  onNext,
  isLast,
}: QuizFeedbackCardProps) {
  const mnemonic = word.mnemonics?.[0]?.content;

  return (
    <div className="space-y-4">
      {/* 정답/오답 표시 */}
      <div
        className={`
        p-4 rounded-xl flex items-center gap-3
        ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
      `}
      >
        {isCorrect ? (
          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        )}
        <div>
          <p
            className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}
          >
            {isCorrect ? '정답!' : '오답'}
          </p>
          {!isCorrect && (
            <p className="text-sm text-red-600">
              정답: <strong>{correctAnswer}</strong>
            </p>
          )}
        </div>
      </div>

      {/* 단어 정보 카드 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">{word.word}</h3>
          <p className="text-gray-600 mt-1">{word.definitionKo}</p>
        </div>

        {/* 연상법 표시 */}
        {mnemonic && (
          <div className="bg-yellow-50 rounded-lg p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">연상법</p>
              <p className="text-sm text-yellow-700">{mnemonic}</p>
            </div>
          </div>
        )}
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={onNext}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold
                   py-4 px-6 rounded-xl flex items-center justify-center gap-2
                   transition-colors"
      >
        {isLast ? '결과 보기' : '다음 문제'}
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
