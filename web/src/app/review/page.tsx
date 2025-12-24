'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { progressAPI } from '@/lib/api';
import TabLayout from '@/components/layout/TabLayout';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface ReviewStats {
  dueToday: number;
  weak: number;
  bookmarked: number;
  totalReviewed: number;
}

interface ReviewWord {
  id: string;
  word: string;
  definitionKo: string;
  lastReviewed: string;
  nextReview: string;
  correctCount: number;
  incorrectCount: number;
}

export default function ReviewPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const [stats, setStats] = useState<ReviewStats>({
    dueToday: 0,
    weak: 0,
    bookmarked: 0,
    totalReviewed: 0,
  });
  const [dueWords, setDueWords] = useState<ReviewWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadReviewData();
  }, [user, hasHydrated, router]);

  const loadReviewData = async () => {
    try {
      const data = await progressAPI.getDueReviews();
      setStats({
        dueToday: data.count || 0,
        weak: data.weakCount || 0,
        bookmarked: data.bookmarkedCount || 0,
        totalReviewed: data.totalReviewed || 0,
      });

      // Get sample of due words
      if (data.reviews) {
        setDueWords(data.reviews.slice(0, 5).map((r: any) => ({
          id: r.word.id,
          word: r.word.word,
          definitionKo: r.word.definitionKo || r.word.definition,
          lastReviewed: r.lastReviewed,
          nextReview: r.nextReview,
          correctCount: r.correctCount || 0,
          incorrectCount: r.incorrectCount || 0,
        })));
      }
    } catch (error) {
      console.error('Failed to load review data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated || loading) {
    return (
      <TabLayout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-6">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-56 bg-gray-200 rounded animate-pulse" />
          </div>
          <SkeletonCard className="mb-6 h-40" />
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="h-9 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
          <SkeletonCard className="mb-6 h-64" />
        </div>
      </TabLayout>
    );
  }

  return (
    <TabLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">복습</h1>
          <p className="text-gray-500">스페이스드 반복으로 기억을 강화하세요</p>
        </div>

        {/* Main Review Card */}
        {stats.dueToday > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center text-3xl">
                  📚
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">오늘의 복습</h2>
                  <p className="text-gray-500 text-sm">복습할 단어가 있어요</p>
                </div>
              </div>
              <span className="text-3xl font-bold text-pink-600">{stats.dueToday}개</span>
            </div>
            <Link
              href="/learn?mode=review"
              className="block w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-xl font-bold text-center transition shadow-lg shadow-pink-500/25"
            >
              복습 시작하기
            </Link>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-green-700 mb-2">오늘 복습 완료!</h3>
            <p className="text-green-600">모든 복습을 마쳤습니다. 잘하셨어요!</p>
          </div>
        )}

        {/* Review Categories */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link
            href="/learn?mode=review"
            className="bg-white rounded-2xl p-4 border border-gray-200 text-center hover:border-pink-200 hover:shadow-md transition"
          >
            <p className="text-3xl font-bold text-blue-600">{stats.dueToday}</p>
            <p className="text-xs text-gray-500 mt-1">오늘 복습</p>
          </Link>
          <Link
            href="/learn?mode=weak"
            className="bg-white rounded-2xl p-4 border border-gray-200 text-center hover:border-pink-200 hover:shadow-md transition"
          >
            <p className="text-3xl font-bold text-red-500">{stats.weak}</p>
            <p className="text-xs text-gray-500 mt-1">취약 단어</p>
          </Link>
          <Link
            href="/bookmarks"
            className="bg-white rounded-2xl p-4 border border-gray-200 text-center hover:border-pink-200 hover:shadow-md transition"
          >
            <p className="text-3xl font-bold text-yellow-500">{stats.bookmarked}</p>
            <p className="text-xs text-gray-500 mt-1">북마크</p>
          </Link>
        </div>

        {/* Due Words Preview */}
        {dueWords.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">복습 대기 중</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {dueWords.map((word) => (
                <Link
                  key={word.id}
                  href={`/words/${word.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-bold text-gray-900">{word.word}</p>
                    <p className="text-sm text-gray-500">{word.definitionKo}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-600 font-medium">✓ {word.correctCount}</span>
                    <span className="text-red-500 font-medium">✗ {word.incorrectCount}</span>
                  </div>
                </Link>
              ))}
            </div>
            {stats.dueToday > 5 && (
              <div className="p-4 text-center border-t border-gray-100">
                <Link href="/learn?mode=review" className="text-pink-600 text-sm font-bold">
                  전체 {stats.dueToday}개 보기 →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Review Schedule */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">복습 일정</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 font-bold text-sm">
                  오늘
                </span>
                <span className="font-medium text-gray-700">오늘 복습</span>
              </div>
              <span className="font-bold text-pink-600">{stats.dueToday}개</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold text-sm">
                  내일
                </span>
                <span className="text-gray-500">내일 복습 예정</span>
              </div>
              <span className="text-gray-400">-</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold text-sm">
                  +3일
                </span>
                <span className="text-gray-500">3일 후 복습 예정</span>
              </div>
              <span className="text-gray-400">-</span>
            </div>
          </div>
        </div>

        {/* Spaced Repetition Info */}
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <h4 className="font-bold text-blue-800 mb-2">💡 간격 반복 학습이란?</h4>
          <p className="text-sm text-blue-700">
            기억이 사라지기 직전에 복습하면 장기 기억으로 전환됩니다.
            VocaVision AI는 학습 데이터를 기반으로 최적의 복습 시점을 계산합니다.
          </p>
        </div>
      </div>
    </TabLayout>
  );
}
