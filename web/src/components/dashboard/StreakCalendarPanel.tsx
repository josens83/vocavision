'use client';

interface StreakCalendarPanelProps {
  currentStreak: number;
  bestStreak: number;
}

export default function StreakCalendarPanel({
  currentStreak,
  bestStreak,
}: StreakCalendarPanelProps) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">연속 학습일</h2>
        <span className="text-sm text-gray-500">{currentYear}년 {currentMonth + 1}월</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* 요약 카드 */}
        <div className="flex lg:flex-col gap-3 lg:w-32">
          <div className="flex-1 bg-orange-50 rounded-xl p-4 text-center">
            <span className="text-2xl block mb-1">🔥</span>
            <p className="text-2xl font-bold text-orange-600">{currentStreak}일</p>
            <p className="text-xs text-gray-500">현재 연속</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-xl p-4 text-center">
            <span className="text-2xl block mb-1">🏆</span>
            <p className="text-2xl font-bold text-red-600">{bestStreak}일</p>
            <p className="text-xs text-gray-500">최장 기록</p>
          </div>
        </div>

        {/* 미니 캘린더 */}
        <div className="flex-1">
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div key={day} className="py-1 text-gray-400 font-medium">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate();
              const hasActivity = day <= today.getDate() && day > today.getDate() - currentStreak;

              return (
                <div
                  key={day}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    isToday
                      ? 'bg-pink-500 text-white'
                      : hasActivity
                      ? 'bg-pink-100 text-pink-600'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
