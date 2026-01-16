'use client';

import { useExamCourseStore, ExamType, LevelType } from '@/lib/store';

// 시험 정보
const examOptions: { key: ExamType; name: string; icon: string }[] = [
  { key: 'CSAT', name: '수능', icon: '📝' },
  { key: 'TEPS', name: 'TEPS', icon: '🎓' },
];

// 레벨 정보 - 시험별 다른 표시
const getLevelOptions = (exam: ExamType) => {
  if (exam === 'TEPS') {
    return [
      { key: 'L1' as LevelType, name: '고급어휘 L1', description: 'TEPS 고급 어휘' },
      { key: 'L2' as LevelType, name: '고급어휘 L2', description: 'TEPS 심화 어휘' },
      { key: 'L3' as LevelType, name: '고급어휘 L3', description: 'TEPS 최고급 어휘' },
    ];
  }
  return [
    { key: 'L1' as LevelType, name: '초급', description: '기초 필수 단어' },
    { key: 'L2' as LevelType, name: '중급', description: '핵심 심화 단어' },
    { key: 'L3' as LevelType, name: '고급', description: '고난도 단어' },
  ];
};

export default function ExamLevelSelector() {
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);
  const setActiveLevel = useExamCourseStore((state) => state.setActiveLevel);

  const selectedExam = activeExam || 'CSAT';
  const levelOptions = getLevelOptions(selectedExam);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
      {/* 시험 선택 */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">시험 선택</p>
        <div className="flex gap-2">
          {examOptions.map((exam) => (
            <button
              key={exam.key}
              onClick={() => setActiveExam(exam.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                activeExam === exam.key
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{exam.icon}</span>
              <span>{exam.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 레벨 선택 */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">레벨 선택</p>
        <div className="flex gap-2">
          {levelOptions.map((level) => (
            <button
              key={level.key}
              onClick={() => setActiveLevel(level.key)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                activeLevel === level.key
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="block">{level.key}</span>
              <span className="block text-xs opacity-80">{level.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
