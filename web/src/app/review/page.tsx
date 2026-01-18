'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { progressAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface ReviewStats {
  dueToday: number;
  weak: number;
  bookmarked: number;
  totalReviewed: number;
  accuracy?: number;
  completedToday?: number;
  lastReviewDate?: string;
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

const EXAM_OPTIONS = [
  { value: 'all', label: '전체 시험' },
  { value: 'CSAT', label: '수능' },
  { value: 'TEPS', label: 'TEPS' },
  { value: 'TOEFL', label: 'TOEFL' },
  { value: 'TOEIC', label: 'TOEIC' },
];

const LEVEL_OPTIONS = [
  { value: 'all', label: '전체 레벨' },
  { value: 'L1', label: 'L1 (초급)' },
  { value: 'L2', label: 'L2 (중급)' },
  { value: 'L3', label: 'L3 (고급)' },
];

export default function ReviewPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const [stats, setStats] = useState<ReviewStats>({
    dueToday: 0,
    weak: 0,
    bookmarked: 0,
    totalReviewed: 0,
    accuracy: 0,
    completedToday: 0,
    lastReviewDate: undefined,
  });
  const [currentStreak, setCurrentStreak] = useState(0);
  const [dueWords, setDueWords] = useState<ReviewWord[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadReviewData();
  }, [user, hasHydrated, router, selectedExam, selectedLevel]);

  const loadReviewData = async () => {
    setLoading(true);
    try {
      const params: { examCategory?: string; level?: string } = {};
      if (selectedExam !== 'all') params.examCategory = selectedExam;
      if (selectedLevel !== 'all') params.level = selectedLevel;

      const [data, progressData] = await Promise.all([
        progressAPI.getDueReviews(params),
        progressAPI.getUserProgress(),
      ]);

      setStats({
        dueToday: data.count || 0,
        weak: data.weakCount || 0,
        bookmarked: data.bookmarkedCount || 0,
        totalReviewed: data.totalReviewed || 0,
        accuracy: data.accuracy || 0,
        completedToday: data.completedToday || 0,
        lastReviewDate: data.lastReviewDate,
      });
      setCurrentStreak(progressData.stats?.currentStreak || 0);

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
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
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
      </DashboardLayout>
    );
  }

  // 예상 복습 시간 계산 (단어당 0.3분)
  const estimatedMinutes = Math.ceil(stats.dueToday * 0.3);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        {/* 상단 히어로 배너 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-purple-500/25">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-purple-100 text-sm mb-1">오늘의 복습</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {stats.dueToday > 0 ? (
                  <>복습할 단어 <span className="text-yellow-300">{stats.dueToday}개</span></>
                ) : (
                  <>오늘 복습 완료! 🎉</>
                )}
              </h2>
              {stats.dueToday > 0 ? (
                <p className="text-purple-100">
                  지금 시작하면 <strong className="text-white">{estimatedMinutes}분</strong>이면 끝나요
                </p>
              ) : (
                <p className="text-purple-100">
                  내일 복습할 단어가 준비될 때까지 쉬세요
                </p>
              )}
            </div>
            {stats.dueToday > 0 && (
              <Link
                href={`/review/quiz${selectedExam !== 'all' ? `?exam=${selectedExam}` : ''}${selectedLevel !== 'all' ? `${selectedExam !== 'all' ? '&' : '?'}level=${selectedLevel}` : ''}`}
                className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-center hover:bg-purple-50 transition shadow-lg whitespace-nowrap"
              >
                복습 시작
              </Link>
            )}
          </div>
        </div>

        {/* 필터 */}
        <div className="flex gap-3 mb-6">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          >
            {EXAM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          >
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 바로 복습 이어가기 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">바로 복습 이어가기</h3>
            <span className="text-orange-500 text-sm font-medium">🔥 {currentStreak}일 연속</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
              🔄
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {selectedExam === 'all' ? '전체' : selectedExam === 'CSAT' ? '수능' : selectedExam} {selectedLevel === 'all' ? '' : selectedLevel}
              </p>
              <p className="text-sm text-gray-500">복습 대기 단어 • 기억 강화</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-500">{stats.dueToday}</p>
              <p className="text-xs text-gray-500">복습 대기</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{stats.completedToday || 0}</p>
              <p className="text-xs text-gray-500">오늘 완료</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{stats.accuracy || 0}%</p>
              <p className="text-xs text-gray-500">정답률</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            마지막 복습: {stats.lastReviewDate ? new Date(stats.lastReviewDate).toLocaleDateString('ko-KR') : '기록 없음'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/learn?mode=review${selectedExam !== 'all' ? `&exam=${selectedExam}` : ''}${selectedLevel !== 'all' ? `&level=${selectedLevel}` : ''}`}
              className="block bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-center transition"
            >
              📚 플래시카드
            </Link>
            <Link
              href={`/review/quiz${selectedExam !== 'all' ? `?exam=${selectedExam}` : ''}${selectedLevel !== 'all' ? `${selectedExam !== 'all' ? '&' : '?'}level=${selectedLevel}` : ''}`}
              className="block bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-bold text-center transition shadow-lg shadow-pink-500/25"
            >
              🎯 4지선다 퀴즈
            </Link>
          </div>
        </div>

        {/* 오늘 복습 완료 메시지 */}
        {stats.dueToday === 0 && (
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
                <Link href="/learn?mode=review" className="text-pink-600 text-sm font-bold inline-flex items-center gap-1">
                  전체 {stats.dueToday}개 보기 <ArrowRight className="w-3.5 h-3.5" />
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
    </DashboardLayout>
  );
}
