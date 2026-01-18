'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Benchmarking: GitHub-style activity heatmap
// Phase 2-2: 학습 활동 시각화 - 히트맵

interface DayData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0=none, 1=low, 2=medium, 3=high, 4=very high
}

interface LearningHeatmapProps {
  data?: DayData[];
  weeks?: number;
  currentStreakOverride?: number;
  longestStreakOverride?: number;
}

export default function LearningHeatmap({
  data,
  weeks = 52,
  currentStreakOverride,
  longestStreakOverride
}: LearningHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<DayData[]>([]);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (data) {
      setHeatmapData(data);
    } else {
      // Generate mock data for demonstration
      const mockData: DayData[] = [];
      const today = new Date();
      const daysToShow = weeks * 7;

      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Random activity with some patterns
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let count = 0;
        let level: 0 | 1 | 2 | 3 | 4 = 0;

        // More activity on weekdays
        const rand = Math.random();
        if (isWeekend) {
          if (rand > 0.7) {
            count = Math.floor(Math.random() * 20);
          }
        } else {
          if (rand > 0.3) {
            count = Math.floor(Math.random() * 50);
          }
        }

        // Determine level based on count
        if (count === 0) level = 0;
        else if (count < 10) level = 1;
        else if (count < 20) level = 2;
        else if (count < 30) level = 3;
        else level = 4;

        mockData.push({
          date: date.toISOString().split('T')[0],
          count,
          level,
        });
      }

      setHeatmapData(mockData);
    }
  }, [data, weeks]);

  // Group data by week
  const groupByWeek = (): DayData[][] => {
    const weeksArray: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Fill in the first partial week if needed
    if (heatmapData.length > 0) {
      const firstDate = new Date(heatmapData[0].date);
      const firstDayOfWeek = firstDate.getDay(); // 0=Sunday

      // Add empty days at the start of the first week
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push({
          date: '',
          count: 0,
          level: 0,
        });
      }
    }

    heatmapData.forEach((day, index) => {
      currentWeek.push(day);

      // Start a new week on Saturday or when we have 7 days
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days
    if (currentWeek.length > 0) {
      // Fill the rest with empty days
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          count: 0,
          level: 0,
        });
      }
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  };

  const weeksData = groupByWeek();

  // Color scheme based on level
  const getColor = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0:
        return 'bg-gray-100';
      case 1:
        return 'bg-green-200';
      case 2:
        return 'bg-green-400';
      case 3:
        return 'bg-green-600';
      case 4:
        return 'bg-green-800';
      default:
        return 'bg-gray-100';
    }
  };

  const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
    if (day.date) {
      setHoveredDay(day);
      setHoveredPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  // Calculate total stats
  const totalDays = heatmapData.filter((d) => d.count > 0).length;
  const totalWords = heatmapData.reduce((sum, d) => sum + d.count, 0);
  // Use override values from API if provided, otherwise calculate from heatmap data
  const currentStreak = currentStreakOverride ?? calculateCurrentStreak();
  const longestStreak = longestStreakOverride ?? calculateLongestStreak();

  function calculateCurrentStreak(): number {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = heatmapData.length - 1; i >= 0; i--) {
      const dayData = heatmapData[i];
      const dayDate = new Date(dayData.date);
      dayDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === streak && dayData.count > 0) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  }

  function calculateLongestStreak(): number {
    let longest = 0;
    let current = 0;

    for (const day of heatmapData) {
      if (day.count > 0) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    return longest;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">학습 활동</h3>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{totalDays}</div>
          <div className="text-xs text-gray-600">활동한 날</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalWords}</div>
          <div className="text-xs text-gray-600">총 학습 단어</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
          <div className="text-xs text-gray-600">현재 스트릭</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{longestStreak}</div>
          <div className="text-xs text-gray-600">최장 스트릭</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2 ml-8">
            {Array.from({ length: Math.ceil(weeks / 4) }).map((_, i) => (
              <div key={i} className="text-xs text-gray-500" style={{ width: `${4 * 16}px` }}>
                {new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() - Math.ceil(weeks / 4) + i + 1,
                  1
                ).toLocaleDateString('ko-KR', { month: 'short' })}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col justify-between text-xs text-gray-500 pr-2">
              <div>일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div>토</div>
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-1">
              {weeksData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <motion.div
                      key={`${weekIndex}-${dayIndex}`}
                      whileHover={{ scale: day.date ? 1.3 : 1 }}
                      onMouseEnter={(e) => handleMouseEnter(day, e)}
                      onMouseLeave={handleMouseLeave}
                      className={`w-3 h-3 rounded-sm ${
                        day.date ? getColor(day.level) : 'bg-transparent'
                      } ${day.date ? 'cursor-pointer' : ''}`}
                      title={day.date ? `${day.date}: ${day.count} words` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-end text-xs text-gray-600">
            <span>적음</span>
            <div className="flex gap-1">
              {([0, 1, 2, 3, 4] as const).map((level) => (
                <div key={level} className={`w-3 h-3 rounded-sm ${getColor(level)}`} />
              ))}
            </div>
            <span>많음</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
          style={{
            left: hoveredPosition.x + 10,
            top: hoveredPosition.y - 40,
          }}
        >
          <div className="font-semibold">
            {new Date(hoveredDay.date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div className="text-green-400">
            {hoveredDay.count} {hoveredDay.count === 1 ? 'word' : 'words'} studied
          </div>
        </motion.div>
      )}

      {/* Encouragement Message */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
        <p className="text-sm text-gray-700">
          💡 <strong>꾸준함이 핵심입니다!</strong>{' '}
          {currentStreak > 0
            ? `현재 ${currentStreak}일 연속 학습 중입니다. 계속 유지하세요!`
            : '오늘 학습을 시작해서 스트릭을 쌓아보세요!'}
        </p>
      </div>
    </div>
  );
}
