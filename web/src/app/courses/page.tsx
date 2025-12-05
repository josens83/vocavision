'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import { progressAPI } from '@/lib/api';
import TabLayout from '@/components/layout/TabLayout';

// 시험별 정보
const examInfo: Record<string, {
  name: string;
  fullName: string;
  icon: string;
  gradient: string;
  bgColor: string;
}> = {
  CSAT: {
    name: '수능',
    fullName: '대학수학능력시험',
    icon: '📝',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
  },
  SAT: {
    name: 'SAT',
    fullName: '미국대학입학시험',
    icon: '🇺🇸',
    gradient: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
  },
  TOEFL: {
    name: 'TOEFL',
    fullName: '학술영어능력시험',
    icon: '🌍',
    gradient: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
  },
  TOEIC: {
    name: 'TOEIC',
    fullName: '국제의사소통영어',
    icon: '💼',
    gradient: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
  },
  TEPS: {
    name: 'TEPS',
    fullName: '서울대영어능력시험',
    icon: '🎓',
    gradient: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
  },
};

// Day별 학습 데이터 (30일 완성)
const generateDays = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    wordCount: 50,
    level: i < 10 ? 'L1' : i < 20 ? 'L2' : 'L3',
  }));
};

export default function CoursesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);

  const [dayProgress, setDayProgress] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  const selectedExam = activeExam || 'CSAT';
  const exam = examInfo[selectedExam];
  const days = generateDays();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadProgress();
  }, [user, hasHydrated, router, selectedExam]);

  const loadProgress = async () => {
    try {
      const data = await progressAPI.getUserProgress();
      // Calculate day progress based on total words learned
      const totalWords = data.stats?.totalWordsLearned || 0;
      const progress: Record<number, number> = {};

      // Distribute progress across days (50 words per day)
      let remaining = totalWords;
      for (let day = 1; day <= 30; day++) {
        if (remaining >= 50) {
          progress[day] = 100;
          remaining -= 50;
        } else if (remaining > 0) {
          progress[day] = Math.round((remaining / 50) * 100);
          remaining = 0;
        } else {
          progress[day] = 0;
        }
      }
      setDayProgress(progress);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate current day (first incomplete day)
  const currentDay = Object.entries(dayProgress).find(([_, progress]) => progress < 100)?.[0] || '1';

  if (!hasHydrated || loading) {
    return (
      <TabLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">로딩 중...</div>
        </div>
      </TabLayout>
    );
  }

  return (
    <TabLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Exam Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {Object.entries(examInfo).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setActiveExam(key as ExamType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedExam === key
                  ? `bg-gradient-to-r ${info.gradient} text-white`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{info.icon}</span>
              <span className="font-medium">{info.name}</span>
            </button>
          ))}
        </div>

        {/* Course Header */}
        <div className={`bg-gradient-to-r ${exam.gradient} rounded-2xl p-6 text-white mb-6`}>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{exam.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{exam.name} 30일 완성</h1>
              <p className="text-white/80">{exam.fullName}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">전체 진도</p>
              <p className="text-xl font-bold">
                {Object.values(dayProgress).filter(p => p === 100).length}/30일 완료
              </p>
            </div>
            <Link
              href={`/learn?exam=${selectedExam.toLowerCase()}&day=${currentDay}`}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition"
            >
              Day {currentDay} 이어하기
            </Link>
          </div>
        </div>

        {/* Day Grid - 30일 완성 구조 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Day별 학습</h2>
          <div className="grid grid-cols-5 gap-3">
            {days.map(({ day, level }) => {
              const progress = dayProgress[day] || 0;
              const isCompleted = progress === 100;
              const isCurrent = day === parseInt(currentDay);
              const isLocked = day > parseInt(currentDay) + 2; // Allow 2 days ahead

              return (
                <Link
                  key={day}
                  href={isLocked ? '#' : `/learn?exam=${selectedExam.toLowerCase()}&day=${day}`}
                  onClick={(e) => isLocked && e.preventDefault()}
                  className={`relative rounded-xl p-3 text-center transition ${
                    isCompleted
                      ? 'bg-green-100 border-2 border-green-300'
                      : isCurrent
                      ? `bg-gradient-to-br ${exam.gradient} text-white shadow-lg scale-105`
                      : isLocked
                      ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                      : `${exam.bgColor} hover:shadow-md`
                  }`}
                >
                  {/* Level Badge */}
                  <span className={`absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded ${
                    isCurrent ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {level}
                  </span>

                  {/* Day Number */}
                  <p className={`text-lg font-bold ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-white' : 'text-gray-700'
                  }`}>
                    {day}
                  </p>
                  <p className={`text-xs ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    Day
                  </p>

                  {/* Progress Bar */}
                  {!isCompleted && !isLocked && progress > 0 && (
                    <div className="mt-2 bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${isCurrent ? 'bg-white' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Completed Check */}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}

                  {/* Lock Icon */}
                  {isLocked && (
                    <span className="text-gray-400">🔒</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/quiz?exam=${selectedExam.toLowerCase()}`}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <span className="text-2xl mb-2 block">🎯</span>
            <p className="font-medium text-gray-900">실력 테스트</p>
            <p className="text-xs text-gray-500">퀴즈로 복습하기</p>
          </Link>
          <Link
            href="/games"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <span className="text-2xl mb-2 block">🎮</span>
            <p className="font-medium text-gray-900">게임 모드</p>
            <p className="text-xs text-gray-500">재미있게 학습하기</p>
          </Link>
        </div>
      </div>
    </TabLayout>
  );
}
