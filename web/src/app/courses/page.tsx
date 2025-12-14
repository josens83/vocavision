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
  color: string;
  bgColor: string;
}> = {
  CSAT: {
    name: '수능',
    fullName: '대학수학능력시험',
    icon: '📝',
    color: 'blue',
    bgColor: 'bg-blue-50',
  },
  SAT: {
    name: 'SAT',
    fullName: '미국대학입학시험',
    icon: '🇺🇸',
    color: 'red',
    bgColor: 'bg-red-50',
  },
  TOEFL: {
    name: 'TOEFL',
    fullName: '학술영어능력시험',
    icon: '🌍',
    color: 'orange',
    bgColor: 'bg-orange-50',
  },
  TOEIC: {
    name: 'TOEIC',
    fullName: '국제의사소통영어',
    icon: '💼',
    color: 'green',
    bgColor: 'bg-green-50',
  },
  TEPS: {
    name: 'TEPS',
    fullName: '서울대영어능력시험',
    icon: '🎓',
    color: 'purple',
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
          <div className="text-xl text-gray-500">로딩 중...</div>
        </div>
      </TabLayout>
    );
  }

  const completedDays = Object.values(dayProgress).filter(p => p === 100).length;
  const progressPercent = Math.round((completedDays / 30) * 100);

  return (
    <TabLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">코스</h1>
          <p className="text-gray-500">시험별 맞춤 학습 코스를 선택하세요</p>
        </div>

        {/* Exam Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {Object.entries(examInfo).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setActiveExam(key as ExamType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap font-medium transition ${
                selectedExam === key
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.name}</span>
            </button>
          ))}
        </div>

        {/* Course Progress Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">
                {exam.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{exam.name} 30일 완성</h2>
                <p className="text-gray-500 text-sm">{exam.fullName}</p>
              </div>
            </div>
            <span className="bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full">
              {completedDays}/30일
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">전체 진도</span>
              <span className="font-medium text-pink-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <Link
            href={`/learn?exam=${selectedExam.toLowerCase()}&level=L1`}
            className="block w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-xl font-bold text-center transition shadow-lg shadow-pink-500/25"
          >
            Day {currentDay} 이어하기
          </Link>
        </div>

        {/* Day Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Day별 학습</h3>
          <div className="grid grid-cols-6 gap-2">
            {days.map(({ day, level }) => {
              const progress = dayProgress[day] || 0;
              const isCompleted = progress === 100;
              const isCurrent = day === parseInt(currentDay);
              const isLocked = day > parseInt(currentDay) + 2;

              return (
                <Link
                  key={day}
                  href={isLocked ? '#' : `/learn?exam=${selectedExam.toLowerCase()}&level=${level}`}
                  onClick={(e) => isLocked && e.preventDefault()}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl transition ${
                    isCompleted
                      ? 'bg-green-50 border-2 border-green-200'
                      : isCurrent
                      ? 'bg-pink-500 text-white shadow-lg'
                      : isLocked
                      ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className={`text-lg font-bold ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-white' : 'text-gray-700'
                  }`}>
                    {day}
                  </span>
                  <span className={`text-[10px] ${
                    isCompleted ? 'text-green-500' : isCurrent ? 'text-white/80' : 'text-gray-400'
                  }`}>
                    {level}
                  </span>

                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {isLocked && (
                    <svg className="w-4 h-4 text-gray-300 absolute" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
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
            className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-pink-200 hover:shadow-md transition"
          >
            <span className="text-3xl mb-3 block">🎯</span>
            <p className="font-bold text-gray-900">실력 테스트</p>
            <p className="text-sm text-gray-500">퀴즈로 복습하기</p>
          </Link>
          <Link
            href="/games"
            className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-pink-200 hover:shadow-md transition"
          >
            <span className="text-3xl mb-3 block">🎮</span>
            <p className="font-bold text-gray-900">게임 모드</p>
            <p className="text-sm text-gray-500">재미있게 학습하기</p>
          </Link>
        </div>
      </div>
    </TabLayout>
  );
}
