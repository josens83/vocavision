'use client';

import { LevelStats } from '@/types/stats';

interface LevelAccuracyProps {
  levels: {
    L1: LevelStats;
    L2: LevelStats;
    L3: LevelStats;
  };
}

const LEVEL_CONFIG = {
  L1: {
    name: '초급',
    color: 'bg-green-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
  },
  L2: {
    name: '중급',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
  },
  L3: {
    name: '고급',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
  },
};

export default function LevelAccuracy({ levels }: LevelAccuracyProps) {
  return (
    <div className="mb-8">
      <p className="text-sm text-gray-500 mb-4">레벨별 정답률</p>

      <div className="grid grid-cols-3 gap-3">
        {(
          Object.entries(levels) as [keyof typeof LEVEL_CONFIG, LevelStats][]
        ).map(([level, stats]) => {
          const config = LEVEL_CONFIG[level];

          return (
            <div key={level} className="bg-gray-50 rounded-xl p-4 text-center">
              {/* 레벨 뱃지 */}
              <span
                className={`inline-block ${config.bgColor} ${config.textColor} text-xs font-medium px-2 py-1 rounded-full mb-2`}
              >
                {level}
              </span>

              {/* 정답률 */}
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {stats.accuracy}%
              </p>

              {/* 프로그레스 바 */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${config.color} transition-all duration-500`}
                  style={{ width: `${stats.accuracy}%` }}
                />
              </div>

              {/* 레벨명 */}
              <p className="text-xs text-gray-500">{config.name}</p>

              {/* 문제 수 */}
              <p className="text-xs text-gray-400 mt-1">
                {stats.correctAnswers}/{stats.totalQuestions}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
