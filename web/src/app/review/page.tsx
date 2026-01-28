'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import { progressAPI } from '@/lib/api';
import { canAccessExam, canAccessLevel } from '@/lib/subscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

// ============================================
// DashboardItem 컴포넌트 (은행 앱 스타일)
// ============================================
function DashboardItem({ value, label, color }: { value: string | number, label: string, color: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <span
        className="text-[22px] font-bold"
        style={{ color }}
      >
        {value}
      </span>
      <span className="text-[12px] text-gray-500">{label}</span>
    </div>
  );
}

// ============================================
// ChevronRight 아이콘
// ============================================
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface ReviewStats {
  dueToday: number;
  weak: number;
  bookmarked: number;
  totalReviewed: number;
  accuracy?: number;
  todayCorrect?: number;
  lastReviewDate?: string;
  tomorrowDue?: number;
  thisWeekDue?: number;
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

// Dashboard와 동일한 시험/레벨 정보 (수능, TEPS만)
const examInfo: Record<string, { name: string; icon: string }> = {
  CSAT: { name: '수능', icon: '📝' },
  TEPS: { name: 'TEPS', icon: '🎓' },
};

// 시험별 레벨 정보 가져오기 함수 (TEPS는 L1/L2만)
const getLevelInfo = (exam: string): Record<string, { name: string; description: string }> => {
  if (exam === 'TEPS') {
    return {
      L1: { name: '기본', description: 'TEPS 기본 어휘' },
      L2: { name: '필수', description: 'TEPS 필수 어휘' },
    };
  }
  return {
    L1: { name: '초급', description: '기초 필수 단어' },
    L2: { name: '중급', description: '핵심 심화 단어' },
    L3: { name: '고급', description: '고난도 단어' },
  };
};

// 데모 모드용 샘플 데이터
const DEMO_STATS: ReviewStats = {
  dueToday: 15,
  weak: 8,
  bookmarked: 5,
  totalReviewed: 120,
  accuracy: 78,
  todayCorrect: 10,
  lastReviewDate: new Date().toISOString(),
  tomorrowDue: 12,
  thisWeekDue: 25,
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
    todayCorrect: 0,
    lastReviewDate: undefined,
    tomorrowDue: 0,
    thisWeekDue: 0,
  });
  const [currentStreak, setCurrentStreak] = useState(0);
  const [dueWords, setDueWords] = useState<ReviewWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [wordListPage, setWordListPage] = useState(1);
  const WORDS_PER_PAGE = 10;

  // 필터 상태 (store 연동)
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);
  const setActiveLevel = useExamCourseStore((state) => state.setActiveLevel);

  // store 연동 (기본값: CSAT, L1)
  const selectedExam = activeExam || 'CSAT';
  const selectedLevel = activeLevel || 'L1';

  // 초기 로드 시 localStorage에서 마지막 선택한 레벨 복원
  useEffect(() => {
    if (typeof window !== 'undefined' && activeExam) {
      const lastLevel = localStorage.getItem(`review_${activeExam}_level`);
      if (lastLevel && lastLevel !== activeLevel) {
        setActiveLevel(lastLevel as 'L1' | 'L2' | 'L3');
      }
    }
  }, [activeExam]);

  // 필터 변경 시 store 업데이트 + localStorage 저장
  const handleExamChange = (exam: string) => {
    setActiveExam(exam as ExamType);
    // localStorage에서 마지막 선택한 레벨 가져오기
    const lastLevel = localStorage.getItem(`review_${exam}_level`);
    // TEPS는 L1/L2만 유효
    const validLevels = exam === 'TEPS' ? ['L1', 'L2'] : ['L1', 'L2', 'L3'];
    const level = lastLevel && validLevels.includes(lastLevel) ? lastLevel : 'L1';
    setActiveLevel(level as 'L1' | 'L2' | 'L3');
  };

  const handleLevelChange = (level: string) => {
    setActiveLevel(level as 'L1' | 'L2' | 'L3');
    // localStorage에 마지막 선택한 레벨 저장
    localStorage.setItem(`review_${selectedExam}_level`, level);
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

  // 페이지 포커스 시 데이터 새로고침 (퀴즈 완료 후 돌아올 때)
  useEffect(() => {
    const handleFocus = () => {
      if (user && !isDemo) {
        loadReviewData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, isDemo, selectedExam, selectedLevel]);

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
        todayCorrect: data.todayCorrect || 0,
        lastReviewDate: data.lastReviewDate,
        tomorrowDue: data.tomorrowDue || 0,
        thisWeekDue: data.thisWeekDue || 0,
      });
      setCurrentStreak(progressData.stats?.currentStreak || 0);

      // Get all due words for pagination
      if (data.reviews) {
        setDueWords(data.reviews.map((r: any) => ({
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
        <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
          <SkeletonCard className="h-40" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="h-9 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
          <SkeletonCard className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  // 예상 복습 시간 계산 (단어당 0.3분)
  const estimatedMinutes = Math.ceil(stats.dueToday * 0.3);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
        {/* 데모 모드 배너 */}
        {isDemo && !user && (
          <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#F59E0B] text-white rounded font-bold text-xs">체험</span>
                <span className="text-[#92400E] text-sm">샘플 데이터로 복습 기능을 미리 체험해보세요</span>
              </div>
              <Link
                href="/auth/register"
                className="bg-[#F59E0B] text-white px-4 py-2 rounded-[10px] text-sm font-bold hover:bg-[#D97706] transition whitespace-nowrap"
              >
                무료 회원가입
              </Link>
            </div>
          </div>
        )}

        {/* 복습 대기 Hero (은행 앱 스타일 - 보라색) */}
        <section className="relative w-full bg-[#F3E8FF] rounded-2xl overflow-hidden p-6 shadow-sm">
          <div className="relative z-10">
            <span className="text-purple-500 text-[13px] font-semibold block mb-2">
              복습 대기
            </span>

            {stats.dueToday > 0 ? (
              <>
                <h2 className="text-[22px] font-bold text-[#1c1c1e] leading-[1.35] mb-2">
                  <span className="text-purple-500">{stats.dueToday}개</span> 단어가<br />
                  복습을 기다려요
                </h2>
                <p className="text-[14px] text-gray-500 mb-4">
                  지금 시작하면 <span className="font-semibold text-[#1c1c1e]">{estimatedMinutes}분</span>이면 끝나요
                </p>
                <Link
                  href={`/review/quiz?exam=${selectedExam}&level=${selectedLevel}`}
                  className="block w-full bg-white rounded-xl py-4 text-purple-500 font-bold text-[15px] text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  복습 시작
                </Link>
              </>
            ) : (stats.todayCorrect || 0) > 0 ? (
              <>
                <h2 className="text-[22px] font-bold text-[#1c1c1e] leading-[1.35] mb-2">
                  오늘 복습 완료! 🎉
                </h2>
                <p className="text-[14px] text-gray-500 mb-4">
                  오늘 {stats.todayCorrect}개 복습을 완료했어요! 잘 하셨습니다.
                </p>
              </>
            ) : stats.totalReviewed === 0 ? (
              <>
                <h2 className="text-[22px] font-bold text-[#1c1c1e] leading-[1.35] mb-2">
                  아직 복습할 단어가 없어요 📚
                </h2>
                <p className="text-[14px] text-gray-500 mb-4">
                  학습한 단어는 간격 반복 알고리즘에 따라 복습 일정에 추가됩니다
                </p>
              </>
            ) : (
              <>
                <h2 className="text-[22px] font-bold text-[#1c1c1e] leading-[1.35] mb-2">
                  오늘은 복습 쉬는 날! ✅
                </h2>
                <p className="text-[14px] text-gray-500 mb-4">
                  내일 복습할 단어가 준비될 때까지 쉬세요
                </p>
              </>
            )}
          </div>

          {/* 장식 요소 */}
          <div className="absolute top-4 right-4 opacity-60 select-none pointer-events-none">
            <div className="flex gap-1">
              <span className="text-[36px] transform -rotate-12">🔄</span>
              <span className="text-[32px] transform rotate-6">🧠</span>
            </div>
          </div>
        </section>

        {/* 시험 선택 (은행 앱 스타일) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <h3 className="text-[15px] font-bold text-[#1c1c1e] mb-4">시험 선택</h3>

          <div className="flex gap-3">
            {Object.entries(examInfo).map(([key, info]) => {
              const isLocked = !canAccessExam(user, key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (isLocked) {
                      router.push('/pricing');
                    } else {
                      handleExamChange(key);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl transition-all ${
                    isLocked
                      ? 'bg-gray-100 text-[#999999] cursor-not-allowed'
                      : selectedExam === key
                      ? key === 'CSAT'
                        ? 'bg-[#14B8A6] text-white shadow-sm'
                        : 'bg-[#A855F7] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">{info.icon}</span>
                  <span className="font-semibold">{info.name}</span>
                  {isLocked && <span className="text-sm">🔒</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* 레벨 선택 (은행 앱 스타일) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <h3 className="text-[15px] font-bold text-[#1c1c1e] mb-4">레벨 선택</h3>

          <div className="flex gap-3">
            {Object.entries(getLevelInfo(selectedExam)).map(([key, info]) => {
              const isLocked = !canAccessLevel(user, key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (isLocked) {
                      router.push('/pricing');
                    } else {
                      handleLevelChange(key);
                    }
                  }}
                  className={`flex-1 flex flex-col items-center py-4 rounded-xl transition-all ${
                    isLocked
                      ? 'bg-gray-100 text-[#999999] cursor-not-allowed'
                      : selectedLevel === key
                      ? 'bg-[#3B82F6] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[16px]">{key}</span>
                    {isLocked && <span className="text-sm">🔒</span>}
                  </div>
                  <span className={`text-[12px] mt-1 ${
                    isLocked
                      ? 'text-[#999999]'
                      : selectedLevel === key
                      ? 'text-blue-100'
                      : 'text-[#999999]'
                  }`}>
                    {info.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 복습 현황 카드 (은행 앱 스타일) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-[#1c1c1e]">복습 현황</h3>
            <span className="text-[13px] text-[#14B8A6] font-semibold flex items-center gap-1">
              🔥 {currentStreak}일 연속
            </span>
          </div>

          <div className="flex justify-between items-center">
            <DashboardItem value={stats.dueToday} label="복습 대기" color="#A855F7" />
            <div className="w-[1px] h-10 bg-[#f0f0f0]" />
            <DashboardItem value={stats.todayCorrect || 0} label="오늘 맞춤" color="#F59E0B" />
            <div className="w-[1px] h-10 bg-[#f0f0f0]" />
            <DashboardItem value={`${stats.accuracy || 0}%`} label="복습 정답률" color="#10B981" />
          </div>
        </section>

        {/* 바로 복습 이어가기 카드 (은행 앱 스타일) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-[#1c1c1e]">바로 복습 이어가기</h3>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-[48px] h-[48px] rounded-full bg-[#F3E8FF] flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
            <div>
              <p className="text-[16px] font-bold text-[#1c1c1e]">
                {examInfo[selectedExam]?.name || selectedExam} {selectedLevel}
              </p>
              <p className="text-[13px] text-gray-500">복습 대기 단어 • 기억 강화</p>
            </div>
          </div>

          <p className="text-[13px] text-gray-500 mb-4">
            마지막 복습: {stats.lastReviewDate ? new Date(stats.lastReviewDate).toLocaleDateString('ko-KR') : '기록 없음'}
          </p>

          <div className="grid grid-cols-3 gap-3">
            <Link
              href={`/review/quiz?exam=${selectedExam}&level=${selectedLevel}`}
              className="block bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white py-3 rounded-xl font-bold text-center shadow-sm hover:shadow-md transition-shadow"
            >
              🎯 퀴즈
            </Link>
            <Link
              href={`/learn?mode=review&exam=${selectedExam}&level=${selectedLevel}`}
              className="block bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-center transition-colors"
            >
              📚 플래시카드
            </Link>
            <Link
              href="/learn?mode=bookmarks"
              className="block bg-amber-100 hover:bg-amber-200 text-amber-700 py-3 rounded-xl font-semibold text-center transition-colors"
            >
              ⭐ 북마크
            </Link>
          </div>
        </section>

        {/* 오늘 복습 완료 메시지 */}
        {stats.dueToday === 0 && (stats.todayCorrect || 0) > 0 && (
          <section className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-[#047857] mb-2">오늘 복습 완료!</h3>
            <p className="text-[#059669]">모든 복습을 마쳤습니다. 잘하셨어요!</p>
          </section>
        )}

        {/* Due Words List with Pagination */}
        {dueWords.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-[#f0f0f0]">
              <h3 className="text-[15px] font-bold text-[#1c1c1e]">복습 대기 중</h3>
            </div>
            <div className="divide-y divide-[#f0f0f0]">
              {dueWords
                .slice((wordListPage - 1) * WORDS_PER_PAGE, wordListPage * WORDS_PER_PAGE)
                .map((word) => (
                  <Link
                    key={word.id}
                    href={`/words/${word.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="text-[15px] font-bold text-[#1c1c1e]">{word.word}</p>
                      <p className="text-[13px] text-gray-500">{word.definitionKo}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[13px]">
                      <span className="text-[#10B981] font-semibold">✓ {word.correctCount}</span>
                      <span className="text-[#EF4444] font-semibold">✗ {word.incorrectCount}</span>
                    </div>
                  </Link>
                ))}
            </div>

            {/* Pagination */}
            {dueWords.length > WORDS_PER_PAGE && (
              <div className="p-4 border-t border-[#f0f0f0] flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  전체 {dueWords.length}개 중 {(wordListPage - 1) * WORDS_PER_PAGE + 1}-
                  {Math.min(wordListPage * WORDS_PER_PAGE, dueWords.length)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWordListPage(p => Math.max(1, p - 1))}
                    disabled={wordListPage <= 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(5, Math.ceil(dueWords.length / WORDS_PER_PAGE)) }, (_, i) => {
                    const totalPages = Math.ceil(dueWords.length / WORDS_PER_PAGE);
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (wordListPage <= 3) {
                      pageNum = i + 1;
                    } else if (wordListPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = wordListPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setWordListPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                          wordListPage === pageNum
                            ? 'bg-purple-500 text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setWordListPage(p => Math.min(Math.ceil(dueWords.length / WORDS_PER_PAGE), p + 1))}
                    disabled={wordListPage >= Math.ceil(dueWords.length / WORDS_PER_PAGE)}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 복습 일정 (은행 앱 스타일) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <h3 className="text-[15px] font-bold text-[#1c1c1e] mb-4">복습 일정</h3>

          <div className="space-y-3">
            {/* 오늘 */}
            <div className="flex items-center justify-between p-4 bg-[#F3E8FF] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#1c1c1e]">오늘</p>
                  <p className="text-[12px] text-gray-500">{new Date().toLocaleDateString('ko-KR')}</p>
                </div>
              </div>
              <span className="text-purple-500 font-bold">{stats.dueToday}개</span>
            </div>

            {/* 내일 */}
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">📆</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#1c1c1e]">내일</p>
                  <p className="text-[12px] text-gray-500">내일 복습 예정</p>
                </div>
              </div>
              <span className={`font-bold ${(stats.tomorrowDue || 0) > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                {stats.tomorrowDue || 0}개
              </span>
            </div>

            {/* 이번 주 */}
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">🗓️</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#1c1c1e]">이번 주</p>
                  <p className="text-[12px] text-gray-500">2~7일 이내</p>
                </div>
              </div>
              <span className={`font-bold ${(stats.thisWeekDue || 0) > 0 ? 'text-teal-500' : 'text-gray-400'}`}>
                {stats.thisWeekDue || 0}개
              </span>
            </div>
          </div>
        </section>

        {/* 간격 반복 학습 안내 (은행 앱 스타일) */}
        <section className="bg-[#EFF6FF] rounded-2xl p-5 border border-[#BFDBFE]">
          <h4 className="text-[15px] font-bold text-[#1E40AF] mb-2">💡 간격 반복 학습이란?</h4>
          <p className="text-[14px] text-[#1E3A8A]">
            기억이 사라지기 직전에 복습하면 장기 기억으로 전환됩니다.
            VocaVision AI는 학습 데이터를 기반으로 최적의 복습 시점을 계산합니다.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}

// Loading component for Suspense
function ReviewPageLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
        <SkeletonCard className="h-40" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="h-9 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
        <SkeletonCard className="h-64" />
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
