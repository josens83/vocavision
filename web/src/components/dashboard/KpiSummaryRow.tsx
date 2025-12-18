'use client';

interface KpiSummaryRowProps {
  learnedWords: number;
  currentStreak: number;
  dueCount: number;
}

export default function KpiSummaryRow({
  learnedWords,
  currentStreak,
  dueCount,
}: KpiSummaryRowProps) {
  const kpis = [
    {
      value: learnedWords,
      label: '학습한 단어',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      value: `${currentStreak}일`,
      label: '연속 학습',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      value: dueCount,
      label: '복습 대기',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`${kpi.bgColor} rounded-xl p-4 text-center border border-gray-100 shadow-sm`}
        >
          <p className={`text-2xl sm:text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
}
