'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserStats } from '@/types/stats';

export function useUserStats(exam: string = 'CSAT') {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // API에서 통계 가져오기 시도
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/stats?exam=${exam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Stats fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      // 개발용 더미 데이터
      setStats(getDummyStats());
    } finally {
      setIsLoading(false);
    }
  }, [exam]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = () => {
    fetchStats();
  };

  return { stats, isLoading, error, refetch };
}

// 개발용 더미 데이터
function getDummyStats(): UserStats {
  // 오늘 날짜 기준으로 이번 주 계산
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
  const weeklyActivity = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const isPast = date <= today;

    weeklyActivity.push({
      date: dateStr,
      dayOfWeek: dayNames[i],
      wordsStudied: isPast && i < 3 ? Math.floor(Math.random() * 40) + 10 : 0,
      questionsAnswered: isPast && i < 3 ? Math.floor(Math.random() * 50) + 20 : 0,
      accuracy: isPast && i < 3 ? Math.floor(Math.random() * 30) + 60 : 0,
    });
  }

  return {
    overall: {
      totalQuestions: 1234,
      correctAnswers: 840,
      accuracy: 68,
    },
    byLevel: {
      L1: {
        totalQuestions: 500,
        correctAnswers: 425,
        accuracy: 85,
        wordsCount: 1000,
      },
      L2: {
        totalQuestions: 450,
        correctAnswers: 279,
        accuracy: 62,
        wordsCount: 1200,
      },
      L3: {
        totalQuestions: 284,
        correctAnswers: 136,
        accuracy: 48,
        wordsCount: 900,
      },
    },
    byMode: {
      flashcard: { totalQuestions: 600, correctAnswers: 468, accuracy: 78 },
      engToKor: { totalQuestions: 400, correctAnswers: 260, accuracy: 65 },
      korToEng: { totalQuestions: 234, correctAnswers: 112, accuracy: 48 },
    },
    weeklyActivity,
    streak: {
      current: 3,
      longest: 12,
    },
    wordsLearned: {
      total: 3100,
      mastered: 450,
      learning: 280,
      new: 2370,
    },
  };
}

export default useUserStats;
