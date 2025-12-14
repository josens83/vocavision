'use client';

import { useEffect, useState } from 'react';

interface OverallAccuracyProps {
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
}

export default function OverallAccuracy({
  accuracy,
  totalQuestions,
  correctAnswers,
}: OverallAccuracyProps) {
  const [animatedAccuracy, setAnimatedAccuracy] = useState(0);

  // 애니메이션 효과
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedAccuracy(accuracy);
    }, 100);
    return () => clearTimeout(timer);
  }, [accuracy]);

  // SVG 원형 프로그레스
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (animatedAccuracy / 100) * circumference;

  const getAccuracyColor = () => {
    if (accuracy >= 80) return 'text-green-500';
    if (accuracy >= 60) return 'text-blue-500';
    if (accuracy >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStrokeColor = () => {
    if (accuracy >= 80) return '#22c55e'; // green-500
    if (accuracy >= 60) return '#3b82f6'; // blue-500
    if (accuracy >= 40) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="flex flex-col items-center mb-8">
      <p className="text-sm text-gray-500 mb-4">전체 정답률</p>

      {/* 원형 프로그레스 */}
      <div className="relative w-44 h-44">
        <svg className="w-full h-full transform -rotate-90">
          {/* 배경 원 */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />
          {/* 프로그레스 원 */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${getAccuracyColor()}`}>
            {animatedAccuracy}%
          </span>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="flex items-center gap-4 mt-4 text-sm">
        <div className="text-center">
          <p className="font-semibold text-gray-900">
            {totalQuestions.toLocaleString()}
          </p>
          <p className="text-gray-500">총 문제</p>
        </div>
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="text-center">
          <p className="font-semibold text-green-600">
            {correctAnswers.toLocaleString()}
          </p>
          <p className="text-gray-500">정답</p>
        </div>
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="text-center">
          <p className="font-semibold text-red-500">
            {(totalQuestions - correctAnswers).toLocaleString()}
          </p>
          <p className="text-gray-500">오답</p>
        </div>
      </div>
    </div>
  );
}
