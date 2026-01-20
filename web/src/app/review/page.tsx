'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
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

// Dashboard와 동일한 시험/레벨 정보 (수능, TEPS만 - 향후 단품 구매 시 자동 추가)
const examInfo: Record<string, { name: string; icon: string }> = {
  CSAT: { name: '수능', icon: '📝' },
  TEPS: { name: 'TEPS', icon: '🎓' },
};

const levelInfo: Record<string, { name: string; description: string }> = {
  L1: { name: '초급', description: '기초 필수 단어' },
  L2: { name: '중급', description: '핵심 심화 단어' },
  L3: { name: '고급', description: '고난도 단어' },
};

// 데모 모드용 샘플 데이터
const DEMO_STATS: ReviewStats = {
  dueToday: 15,
  weak: 8,
  bookmarked: 5,
  totalReviewed: 120,
  accuracy: 78,
  completedToday: 10,
  lastReviewDate: new Date().toISOString(),
};

const DEMO_WORDS: ReviewWord[] = [
  { id: 'demo1', word: 'abundant', definitionKo: '풍부한', lastReviewed: new Date().toISOString(), nextReview: new Date().toISOString(), correctCount: 3, incorrectCount: 1 },
  { id: 'demo2', word: 'benevolent', definitionKo: '자비로운', lastReviewed: new Date().toISOString(), nextReview: new Date().toISOString(), correctCount: 2, incorrectCount: 2 },
  { id: 'demo3', word: 'comprehensive', definitionKo: '포괄적인', lastReviewed: new Date().toISOString(), nextReview: new Date().toISOString(), correctCount: 4, incorrectCount: 0 },
  { id: 'demo4', word: 'diligent', definitionKo: '부지런한', lastReviewed: new Date().toISOString(), nextReview: new Date().toISOString(), correctCount: 1, incorrectCount: 1 },
  { id: 'demo5', word: 'eloquent', definitionKo: '웅변의', lastReviewed: new Date().toISOString(), nextReview: new Date().toISOString(), correctCount: 2, incorrectCount: 1 },
];

function ReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
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

  // 필터 상태 (store 연동)
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);
  const setActiveLevel = useExamCourseStore((state) => state.setActiveLevel);

  // store 연동 (기본값: CSAT, L1)
  const selectedExam = activeExam || 'CSAT';
  const selectedLevel = activeLevel || 'L1';

  // 필터 변경 시 store 업데이트
  const handleExamChange = (exam: string) => {
    setActiveExam(exam as ExamType);
  };

  const handleLevelChange = (level: string) => {
    setActiveLevel(level as 'L1' | 'L2' | 'L3');
  };

  useEffect(() => {
    if (!hasHydrated) return;

    // 데모 모드일 경우 샘플 데이터 사용
    if (isDemo && !user) {
      setStats(DEMO_STATS);
      setDueWords(DEMO_WORDS);
      setCurrentStreak(7);
      setLoading(false);
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadReviewData();
  }, [user, hasHydrated, router, selectedExam, selectedLevel, isDemo]);

  const loadReviewData = async () => {
    setLoading(true);
    try {
      const params = {
        examCategory: selectedExam,
        level: selectedLevel,
      };

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
        {/* 데모 모드 배너 */}
        {isDemo && !user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-bold text-xs">체험</span>
                <span className="text-amber-800 text-sm">샘플 데이터로 복습 기능을 미리 체험해보세요</span>
              </div>
              <Link
                href="/auth/register"
                className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition whitespace-nowrap"
              >
                무료 회원가입
              </Link>
            </div>
          </div>
        )}

        {/* 상단 히어로 배너 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-purple-500/25">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-purple-100 text-sm mb-1">오늘의 복습</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {stats.dueToday > 0 ? (
                  <>복습할 단어 <span className="text-yellow-300">{stats.dueToday}개</span></>
                ) : (stats.completedToday || 0) > 0 ? (
                  <>오늘 복습 완료! 🎉</>
                ) : stats.totalReviewed === 0 ? (
                  <>아직 복습할 단어가 없어요 📚</>
                ) : (
                  <>오늘은 복습 쉬는 날! ✅</>
                )}
              </h2>
              {stats.dueToday > 0 ? (
                <p className="text-purple-100">
                  지금 시작하면 <strong className="text-white">{estimatedMinutes}분</strong>이면 끝나요
                </p>
              ) : (stats.completedToday || 0) > 0 ? (
                <p className="text-purple-100">
                  오늘 {stats.completedToday}개 복습을 완료했어요! 잘 하셨습니다.
                </p>
              ) : stats.totalReviewed === 0 ? (
                <p className="text-purple-100">
                  학습한 단어는 간격 반복 알고리즘에 따라 복습 일정에 추가됩니다
                </p>
              ) : (
                <p className="text-purple-100">
                  내일 복습할 단어가 준비될 때까지 쉬세요
                </p>
              )}
            </div>
            {stats.dueToday > 0 && (
              <Link
                href={`/review/quiz?exam=${selectedExam}&level=${selectedLevel}`}
                className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-center hover:bg-purple-50 transition shadow-lg whitespace-nowrap"
              >
                복습 시작
              </Link>
            )}
          </div>
        </div>

        {/* 시험/레벨 선택 - Dashboard 스타일 버튼 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          {/* 시험 선택 */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">시험 선택</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(examInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleExamChange(key)}
                  className={`p-4 rounded-xl border-2 text-center transition ${
                    selectedExam === key
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-2xl mr-2">{info.icon}</span>
                  <span className="font-bold">{info.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 레벨 선택 */}
          <div>
            <p className="text-sm text-gray-600 mb-2">레벨 선택</p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(levelInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleLevelChange(key)}
                  className={`p-4 rounded-xl border-2 text-center transition ${
                    selectedLevel === key
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="font-bold">{key}</span>
                  <span className="text-xs text-gray-500 block mt-1">{info.name}</span>
                </button>
              ))}
            </div>
          </div>
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
                {examInfo[selectedExam]?.name || selectedExam} {selectedLevel}
              </p>
              <p className="text-sm text-gray-500">복습 대기 단어 • 기억 강화</p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 rounded-xl overflow-hidden mb-4">
            <div className="text-center py-4">
              <p className="text-2xl font-bold text-pink-500">{stats.dueToday}</p>
              <p className="text-xs text-gray-500 mt-1">복습 대기</p>
            </div>
            <div className="text-center py-4">
              <p className="text-2xl font-bold text-gray-800">{stats.completedToday || 0}</p>
              <p className="text-xs text-gray-500 mt-1">오늘 완료</p>
            </div>
            <div className="text-center py-4">
              <p className="text-2xl font-bold text-emerald-500">{stats.accuracy || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">정답률</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            마지막 복습: {stats.lastReviewDate ? new Date(stats.lastReviewDate).toLocaleDateString('ko-KR') : '기록 없음'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/learn?mode=review&exam=${selectedExam}&level=${selectedLevel}`}
              className="block bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-center transition"
            >
              📚 플래시카드
            </Link>
            <Link
              href={`/review/quiz?exam=${selectedExam}&level=${selectedLevel}`}
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

// Loading component for Suspense
function ReviewPageLoading() {
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

// Suspense boundary로 감싸서 export
export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewPageLoading />}>
      <ReviewPageContent />
    </Suspense>
  );
}
