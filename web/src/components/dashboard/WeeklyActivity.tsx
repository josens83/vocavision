'use client';

import { Flame } from 'lucide-react';
import { DailyActivity } from '@/types/stats';

interface WeeklyActivityProps {
  activity: DailyActivity[];
  streak: {
    current: number;
    longest: number;
  };
}

export default function WeeklyActivity({
  activity,
  streak,
}: WeeklyActivityProps) {
  const today = new Date().toISOString().split('T')[0];

  const getActivityLevel = (wordsStudied: number) => {
    if (wordsStudied === 0) return 'bg-gray-200';
    if (wordsStudied < 20) return 'bg-green-200';
    if (wordsStudied < 40) return 'bg-green-400';
    return 'bg-green-600';
  };

  const getTextColor = (wordsStudied: number) => {
    if (wordsStudied === 0) return '';
    if (wordsStudied < 20) return 'text-green-800';
    return 'text-white';
  };

  return (
    <div>
      {/* 스트릭 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">이번 주 학습</p>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-orange-600">
            {streak.current}일 연속
          </span>
        </div>
      </div>

      {/* 주간 캘린더 */}
      <div className="grid grid-cols-7 gap-2">
        {activity.map((day, index) => {
          const isToday = day.date === today;

          return (
            <div key={index} className="flex flex-col items-center">
              {/* 요일 */}
              <span
                className={`text-xs mb-2 ${isToday ? 'font-semibold text-pink-600' : 'text-gray-500'}`}
              >
                {day.dayOfWeek}
              </span>

              {/* 활동 표시 */}
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${getActivityLevel(day.wordsStudied)}
                  ${isToday ? 'ring-2 ring-pink-500 ring-offset-2' : ''}
                `}
                title={`${day.wordsStudied}개 학습`}
              >
                {day.wordsStudied > 0 && (
                  <span
                    className={`text-xs font-medium ${getTextColor(day.wordsStudied)}`}
                  >
                    {day.wordsStudied}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <span>0개</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-200 rounded"></div>
          <span>1-19</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-400 rounded"></div>
          <span>20-39</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span>40+</span>
        </div>
      </div>
    </div>
  );
}
