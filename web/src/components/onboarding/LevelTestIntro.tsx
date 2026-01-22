'use client';

import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';

interface LevelTestIntroProps {
  onStart: () => void;
  onSkip: () => void;
}

export default function LevelTestIntro({ onStart, onSkip }: LevelTestIntroProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      {/* 아이콘 */}
      <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mb-8">
        <BookOpen className="w-12 h-12 text-teal-500" />
      </div>

      {/* 타이틀 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        나의 영단어 수준은?
      </h1>

      <p className="text-gray-600 mb-8 max-w-sm">
        맞춤 학습을 위해 간단한 테스트를 진행합니다.
        <br />
        10문제, 약 2분 소요됩니다.
      </p>

      {/* 혜택 리스트 */}
      <div className="bg-white rounded-2xl p-6 mb-8 w-full max-w-sm shadow-sm border border-gray-100">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="font-medium text-gray-900">맞춤 레벨 추천</p>
            <p className="text-sm text-gray-500">당신에게 딱 맞는 난이도로 시작</p>
          </div>
        </div>
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="font-medium text-gray-900">효율적인 학습</p>
            <p className="text-sm text-gray-500">너무 쉽거나 어렵지 않게</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="font-medium text-gray-900">목표 설정 가이드</p>
            <p className="text-sm text-gray-500">수능 등급별 학습 방향 제시</p>
          </div>
        </div>
      </div>

      {/* CTA 버튼 */}
      <button
        onClick={onStart}
        className="w-full max-w-sm bg-teal-500 hover:bg-teal-600 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-pink-500/25"
      >
        테스트 시작하기
        <ArrowRight className="w-5 h-5" />
      </button>

      <button
        onClick={onSkip}
        className="mt-4 text-gray-500 hover:text-gray-700 text-sm transition-colors"
      >
        건너뛰고 L1부터 시작하기
      </button>
    </div>
  );
}
