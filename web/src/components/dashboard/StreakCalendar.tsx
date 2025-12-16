"use client";

import { useMemo, useState } from "react";

interface StreakCalendarProps {
  /** Days that have been studied (YYYY-MM-DD format) */
  studiedDays?: string[];
  /** Current streak count */
  currentStreak?: number;
  /** Best streak record */
  bestStreak?: number;
  /** Callback when a day is clicked */
  onDayClick?: (date: string) => void;
  className?: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function StreakCalendar({
  studiedDays = [],
  currentStreak = 0,
  bestStreak = 0,
  onDayClick,
  className = "",
}: StreakCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const studiedDaysSet = useMemo(() => new Set(studiedDays), [studiedDays]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const goToPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const isToday = (day: number): boolean => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const isStudied = (day: number): boolean => {
    const dateStr = formatDate(year, month, day);
    return studiedDaysSet.has(dateStr);
  };

  const isFuture = (day: number): boolean => {
    const date = new Date(year, month, day);
    return date > today;
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [firstDay, daysInMonth]);

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${className}`}>
      {/* Header with streak info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">연속 학습일</h3>
          <p className="text-sm text-slate-500 mt-0.5">매일 학습해서 스트릭을 유지하세요!</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-3xl">
            <span className="animate-pulse">🔥</span>
            <span className="font-bold text-slate-900">{currentStreak}일</span>
          </div>
          <p className="text-xs text-slate-400">현재 연속 학습일</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xl">🔥</span>
            <span className="text-2xl font-bold text-orange-600">{currentStreak}</span>
          </div>
          <p className="text-xs text-orange-600/70 mt-1">현재 스트릭</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xl">🏆</span>
            <span className="text-2xl font-bold text-yellow-600">{bestStreak}</span>
          </div>
          <p className="text-xs text-yellow-600/70 mt-1">최장 기록</p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="이전 달"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold text-slate-900">
          {year}년 {MONTHS[month]}
        </span>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="다음 달"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`
              text-center text-xs font-medium py-2
              ${index === 0 ? "text-red-400" : index === 6 ? "text-blue-400" : "text-slate-400"}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = formatDate(year, month, day);
          const studied = isStudied(day);
          const todayDate = isToday(day);
          const future = isFuture(day);
          const dayOfWeek = (firstDay + day - 1) % 7;
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;

          return (
            <button
              key={day}
              onClick={() => !future && onDayClick?.(dateStr)}
              disabled={future}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                transition-all duration-200
                ${future
                  ? "text-slate-300 cursor-not-allowed"
                  : studied
                    ? "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-sm hover:shadow-md"
                    : todayDate
                      ? "bg-brand-primary text-white ring-2 ring-brand-primary/30"
                      : isSunday
                        ? "text-red-400 hover:bg-red-50"
                        : isSaturday
                          ? "text-blue-400 hover:bg-blue-50"
                          : "text-slate-600 hover:bg-slate-100"
                }
              `}
            >
              {studied ? (
                <span className="flex flex-col items-center">
                  <span className="text-xs leading-none">🔥</span>
                </span>
              ) : (
                day
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-4 h-4 rounded bg-gradient-to-br from-orange-400 to-red-500" />
          학습 완료
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-4 h-4 rounded bg-brand-primary" />
          오늘
        </div>
      </div>
    </div>
  );
}

export default StreakCalendar;
