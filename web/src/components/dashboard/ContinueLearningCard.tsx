'use client';

import Link from 'next/link';

interface CourseInfo {
  examName: string;
  examIcon: string;
  examGradient: string;
  levelName: string;
  levelDescription: string;
  target: string;
}

interface ProgressInfo {
  done: number;
  total: number;
  remaining: number;
  progressPercent: number;
  lastStudiedAt?: string;
  todayTarget: number;
}

interface ContinueLearningCardProps {
  course: CourseInfo;
  progress: ProgressInfo;
  currentStreak: number;
  learnUrl: string;
}

export default function ContinueLearningCard({
  course,
  progress,
  currentStreak,
  learnUrl,
}: ContinueLearningCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">바로 학습 이어가기</h2>
        <span className="text-sm text-teal-500 font-medium flex items-center gap-1">
          <span>🔥</span> {currentStreak}일 연속
        </span>
      </div>

      {/* Course Info */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${course.examGradient} flex items-center justify-center text-2xl flex-shrink-0`}>
          {course.examIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900">{course.examName} {course.levelName}</p>
          <p className="text-sm text-gray-500">{course.levelDescription} • {course.target}</p>
        </div>
      </div>

      {/* Progress Info - 정보 밀도 높이기 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center mb-3">
          <div>
            <p className="text-2xl font-bold text-blue-600">{progress.done}</p>
            <p className="text-xs text-gray-500">학습 완료</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-400">{progress.remaining}</p>
            <p className="text-xs text-gray-500">남은 단어</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">{progress.progressPercent}%</p>
            <p className="text-xs text-gray-500">진행률</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>
          마지막 학습: {progress.lastStudiedAt
            ? new Date(progress.lastStudiedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
            : '오늘'}
        </span>
        <span>오늘 목표: {progress.todayTarget}개</span>
      </div>

      {/* CTA Button */}
      <Link
        href={learnUrl}
        className="block w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-bold text-center transition shadow-sm"
      >
        이어서 학습
      </Link>
    </div>
  );
}
