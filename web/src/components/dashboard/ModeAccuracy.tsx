'use client';

import { ModeStats } from '@/types/stats';
import { BookOpen, CheckSquare, RefreshCw } from 'lucide-react';

interface ModeAccuracyProps {
  modes: {
    flashcard: ModeStats;
    engToKor: ModeStats;
    korToEng: ModeStats;
  };
}

const MODE_CONFIG = {
  flashcard: {
    name: '플래시카드',
    icon: BookOpen,
    color: 'bg-blue-500',
  },
  engToKor: {
    name: '영→한 퀴즈',
    icon: CheckSquare,
    color: 'bg-teal-500',
  },
  korToEng: {
    name: '한→영 퀴즈',
    icon: RefreshCw,
    color: 'bg-purple-500',
  },
};

export default function ModeAccuracy({ modes }: ModeAccuracyProps) {
  return (
    <div className="mb-8">
      <p className="text-sm text-gray-500 mb-4">모드별 정답률</p>

      <div className="space-y-3">
        {(
          Object.entries(modes) as [keyof typeof MODE_CONFIG, ModeStats][]
        ).map(([mode, stats]) => {
          const config = MODE_CONFIG[mode];
          const Icon = config.icon;

          return (
            <div key={mode} className="flex items-center gap-3">
              {/* 아이콘 */}
              <div
                className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>

              {/* 모드명 + 프로그레스 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {config.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats.accuracy}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.color} transition-all duration-500`}
                    style={{ width: `${stats.accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
