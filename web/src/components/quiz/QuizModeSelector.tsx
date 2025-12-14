'use client';

import { ArrowLeft, BookOpen, CheckSquare, RefreshCw, PenTool } from 'lucide-react';

export type QuizMode = 'flashcard' | 'eng-to-kor' | 'kor-to-eng' | 'spelling';

interface QuizModeSelectorProps {
  exam: string;
  level: string;
  onSelect: (mode: QuizMode) => void;
  onBack: () => void;
}

const MODES = [
  {
    id: 'flashcard' as QuizMode,
    icon: BookOpen,
    title: '플래시카드',
    description: '카드를 넘기며 학습',
    color: 'bg-blue-100 text-blue-600',
    available: true,
  },
  {
    id: 'eng-to-kor' as QuizMode,
    icon: CheckSquare,
    title: '4지선다 (영→한)',
    description: '영어 보고 뜻 선택',
    color: 'bg-pink-100 text-pink-600',
    available: true,
  },
  {
    id: 'kor-to-eng' as QuizMode,
    icon: RefreshCw,
    title: '4지선다 (한→영)',
    description: '뜻 보고 영어 선택',
    color: 'bg-purple-100 text-purple-600',
    available: true,
  },
  {
    id: 'spelling' as QuizMode,
    icon: PenTool,
    title: '스펠링',
    description: '직접 입력하기',
    color: 'bg-gray-100 text-gray-400',
    available: false, // 향후 구현
  },
];

const EXAM_NAMES: Record<string, string> = {
  csat: '수능',
  CSAT: '수능',
  toeic: 'TOEIC',
  TOEIC: 'TOEIC',
  toefl: 'TOEFL',
  TOEFL: 'TOEFL',
  teps: 'TEPS',
  TEPS: 'TEPS',
};

export default function QuizModeSelector({
  exam,
  level,
  onSelect,
  onBack,
}: QuizModeSelectorProps) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">학습 모드 선택</h1>
          <p className="text-sm text-gray-500">
            {EXAM_NAMES[exam] || exam} • {level}
          </p>
        </div>
      </div>

      {/* 모드 선택 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        {MODES.map((mode) => {
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              onClick={() => mode.available && onSelect(mode.id)}
              disabled={!mode.available}
              className={`
                p-6 rounded-2xl border-2 text-left transition-all
                ${
                  mode.available
                    ? 'bg-white border-gray-200 hover:border-pink-300 hover:shadow-md'
                    : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'
                }
              `}
            >
              <div
                className={`w-12 h-12 ${mode.color} rounded-xl flex items-center justify-center mb-4`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{mode.title}</h3>
              <p className="text-sm text-gray-500">{mode.description}</p>
              {!mode.available && (
                <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
                  준비 중
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 추천 배지 */}
      <div className="mt-6 p-4 bg-pink-50 rounded-xl border border-pink-100">
        <p className="text-sm text-pink-700">
          💡 <strong>추천:</strong> 처음이라면 플래시카드로 단어를 익히고, 4지선다로
          테스트해보세요!
        </p>
      </div>
    </div>
  );
}
