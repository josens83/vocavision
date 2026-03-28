// Force redeploy - 2026-01-31 v3 (fix exam order + level labels)
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import { canAccessExam, canAccessLevel } from '@/lib/subscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { useDueReviews, useDashboardSummary, usePrefetchReviews, usePackageAccessBulk } from '@/hooks/useQueries';
import { EXAM_LIST, EXAM_MAP, getValidLevelsForExam, getValidLevelForExam, getVisibleExams } from '@/constants/exams';
import { useLocale } from '@/hooks/useLocale';

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

// examInfo / getLevelInfo → @/constants/exams 에서 import
// getLevelInfoForReview: 복습 페이지 전용 레벨 정보 (label 기반)
const getLevelInfoForReview = (exam: string): Record<string, { name: string; description: string }> => {
  const examCfg = EXAM_MAP[exam];
  if (!examCfg) return { L1: { name: 'L1', description: '' } };
  return Object.fromEntries(
    examCfg.levels.map(l => [l.key, { name: l.label, description: '' }])
  );
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
  const locale = useLocale();
  const isEn = locale === 'en';
  const visibleExams = getVisibleExams(isEn);

  const [wordListPage, setWordListPage] = useState(1);
  const WORDS_PER_PAGE = 10;

  // 필터 상태 (store 연동)
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);
  const setActiveLevel = useExamCourseStore((state) => state.setActiveLevel);
  const examHasHydrated = useExamCourseStore((state) => state._hasHydrated);

  // store 연동 (기본값: CSAT, L1)
  const selectedExam = activeExam || 'CSAT';
  const selectedLevel = activeLevel || 'L1';

  // stableQuery: localStorage 복원 + fallback 완료 후에만 query 시작
  // → exam/level이 안정된 후 1회만 호출 (dashboard 패턴과 동일)
  const [stableQuery, setStableQuery] = useState<{exam: string, level: string} | null>(null);

  // React Query: 복습 데이터 + 대시보드 요약 (streak 등)
  // stableQuery 기반으로 queryKey 고정 → effects 체인 완료 전 중복 호출 방지
  const { data: reviewData, isLoading: reviewLoading, isFetching: reviewFetching } = useDueReviews(
    stableQuery?.exam || 'CSAT',
    stableQuery?.level || 'L1',
    !!stableQuery && !!user && hasHydrated && examHasHydrated && !isDemo
  );

  const { data: summaryData } = useDashboardSummary(
    stableQuery?.exam || 'CSAT',
    stableQuery?.level || 'L1',
    !!stableQuery && !!user && hasHydrated && examHasHydrated && !isDemo
  );

  // 프리패치 훅
  const prefetchReviews = usePrefetchReviews();

  // 접근 권한 일괄 확인 (4회 개별 → 1회 bulk)
  const { data: bulkAccessData } = usePackageAccessBulk(
    ['2026-csat-analysis', 'ebs-vocab', 'toefl-complete', 'toeic-complete', 'sat-complete', 'gre-complete', 'ielts-complete'],
    !!user
  );
  const hasCsat2026Access = bulkAccessData?.['2026-csat-analysis']?.hasAccess || false;
  const hasEbsAccess = bulkAccessData?.['ebs-vocab']?.hasAccess || false;
  const hasToeflAccess = bulkAccessData?.['toefl-complete']?.hasAccess || false;
  const hasToeicAccess = bulkAccessData?.['toeic-complete']?.hasAccess || false;
  const hasSatAccess = bulkAccessData?.['sat-complete']?.hasAccess || false;
  const hasGreAccess = bulkAccessData?.['gre-complete']?.hasAccess || false;
  const hasIeltsAccess = bulkAccessData?.['ielts-complete']?.hasAccess || false;

  // 구독 상태 확인 (프리미엄 회원은 모든 단품 접근 가능)
  const isPremium = (user?.subscriptionPlan === 'YEARLY' || user?.subscriptionPlan === 'FAMILY');

  // React Query 데이터에서 추출
  const stats: ReviewStats = isDemo ? DEMO_STATS : {
    dueToday: reviewData?.count || 0,
    weak: reviewData?.weakCount || 0,
    bookmarked: reviewData?.bookmarkedCount || 0,
    totalReviewed: reviewData?.totalReviewed || 0,
    accuracy: reviewData?.accuracy || 0,
    todayCorrect: reviewData?.todayCorrect || 0,
    lastReviewDate: reviewData?.lastReviewDate,
    tomorrowDue: reviewData?.tomorrowDue || 0,
    thisWeekDue: reviewData?.thisWeekDue || 0,
  };

  const currentStreak = isDemo ? 7 : (summaryData?.stats?.currentStreak || 0);

  const dueWords: ReviewWord[] = isDemo ? DEMO_WORDS : (reviewData?.reviews?.map((r: any) => ({
    id: r.word.id,
    word: r.word.word,
    definitionKo: r.word.definitionKo || r.word.definition,
    lastReviewed: r.lastReviewed,
    nextReview: r.nextReview,
    correctCount: r.correctCount || 0,
    incorrectCount: r.incorrectCount || 0,
  })) || []);

  const loading = reviewLoading && !isDemo;

  // 초기 로드 시 localStorage에서 마지막 선택한 레벨 복원 + stableQuery 설정
  // localStorage 복원과 stableQuery 설정을 하나의 effect에서 처리
  // → query가 복원 전 값으로 먼저 호출되는 것을 방지
  useEffect(() => {
    if (!examHasHydrated || !activeExam) return;

    let finalLevel = activeLevel || 'L1';
    if (typeof window !== 'undefined') {
      const lastLevel = localStorage.getItem(`review_${activeExam}_level`);
      if (lastLevel && lastLevel !== activeLevel) {
        finalLevel = lastLevel as 'L1' | 'L2' | 'L3';
        setActiveLevel(lastLevel as 'L1' | 'L2' | 'L3');
      }
    }

    // stableQuery: 최초 1회만 설정 (prev ?? ...)
    // 사용자가 UI에서 시험/레벨 변경 시는 handleExamChange/handleLevelChange에서 직접 설정
    setStableQuery(prev => prev ?? { exam: activeExam, level: finalLevel });
  }, [examHasHydrated, activeExam]);

  // 필터 변경 시 store 업데이트 + localStorage 저장 + stableQuery 업데이트
  const handleExamChange = (exam: string) => {
    setActiveExam(exam as ExamType);
    const lastLevel = localStorage.getItem(`review_${exam}_level`);
    const level = getValidLevelForExam(exam, lastLevel || '');
    setActiveLevel(level as 'L1' | 'L2' | 'L3');
    setStableQuery({ exam, level });
  };

  const handleLevelChange = (level: string) => {
    setActiveLevel(level as 'L1' | 'L2' | 'L3');
    // localStorage에 마지막 선택한 레벨 저장
    localStorage.setItem(`review_${selectedExam}_level`, level);
    setStableQuery(prev => prev ? { ...prev, level } : null);
  };

  // 로그인 체크
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user && !isDemo) {
      router.push('/auth/login');
    }
  }, [user, hasHydrated, router, isDemo]);

  // 단품 시험 접근 권한 없으면 CSAT으로 폴백
  useEffect(() => {
    if (activeExam === 'EBS' && !(hasEbsAccess || isPremium)) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      setStableQuery({ exam: 'CSAT', level: 'L1' });
    }
    if (activeExam === 'TOEFL' && !(hasToeflAccess || isPremium)) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      setStableQuery({ exam: 'CSAT', level: 'L1' });
    }
    if (activeExam === 'TOEIC' && !(hasToeicAccess || isPremium)) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      setStableQuery({ exam: 'CSAT', level: 'L1' });
    }
    if (activeExam === 'SAT' && !(hasSatAccess || isPremium)) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      setStableQuery({ exam: 'CSAT', level: 'L1' });
    }
    if (activeExam === 'GRE' && !(hasGreAccess || isPremium)) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      setStableQuery({ exam: 'CSAT', level: 'L1' });
    }
    if (activeExam === 'IELTS' && !(hasIeltsAccess || isPremium)) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      setStableQuery({ exam: 'CSAT', level: 'L1' });
    }
  }, [activeExam, hasEbsAccess, hasToeflAccess, hasToeicAccess, hasSatAccess, hasGreAccess, hasIeltsAccess, isPremium]);

  if (!hasHydrated || loading) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4 lg:space-y-6">
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
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4 lg:space-y-6">
        {/* 데모 모드 배너 */}
        {isDemo && !user && (
          <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#F59E0B] text-white rounded font-bold text-xs">{isEn ? 'Demo' : '체험'}</span>
                <span className="text-[#92400E] text-sm">{isEn ? 'Try the review feature with sample data' : '샘플 데이터로 복습 기능을 미리 체험해보세요'}</span>
              </div>
              <Link
                href="/auth/register"
                className="bg-[#F59E0B] text-white px-4 py-2 rounded-[10px] text-sm font-bold hover:bg-[#D97706] transition whitespace-nowrap"
              >
                {isEn ? 'Sign Up Free' : '무료 회원가입'}
              </Link>
            </div>
          </div>
        )}

        {/* 복습 대기 Hero (은행 앱 스타일 - 보라색) */}
        <section className="relative w-full bg-[#F3E8FF] rounded-2xl overflow-hidden p-6 shadow-sm">
          <div className="relative z-10">
            <span className="text-purple-500 text-[13px] font-semibold block mb-2">
              {isEn ? 'Due for Review' : '복습 대기'}
            </span>

            {stats.dueToday > 0 ? (
              <>
                <h2 className="text-[22px] font-bold text-[#1c1c1e] leading-[1.35] mb-2">
                  <span className="text-purple-500">{stats.dueToday}</span>{' '}
                  {isEn ? 'words due for review' : <>개 단어가<br />복습을 기다려요</>}
                </h2>
                <p className="text-[14px] text-gray-500 mb-4">
                  {isEn
                    ? <>Takes about <span className="font-semibold text-[#1c1c1e]">{estimatedMinutes} min</span></>
                    : <>지금 시작하면 <span className="font-semibold text-[#1c1c1e]">{estimatedMinutes}분</span>이면 끝나요</>}
                </p>
                <Link
                  href={`/review/quiz?exam=${selectedExam}&level=${selectedLevel}`}
                  className="block w-full bg-white rounded-xl py-4 text-purple-500 font-bold text-[15px] text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  {isEn ? 'Start Review' : '복습 시작'}
                </Link>
              </>
            ) : (stats.todayCorrect || 0) > 0 ? (
              <>
                <h2 className="text-[22px] font-bold text-[#1c1c1e] leading-[1.35] mb-2">
                  {isEn ? 'All Done! 🎉' : '오늘 복습 완료! 🎉'}
                </h2>
                <p className="text-[14px] text-gray-500 mb-4">
                  {isEn ? `Great job! You reviewed ${stats.todayCorrect} words today.` : `오늘 ${stats.todayCorrect}개 복습을 완료했어요! 잘 하셨습니다.`}
                </p>
              </>
            ) : stats.totalReviewed === 0 ? (
              <>
                <h2 className="text-[22px] font-bold text-[#1c1c1e] leading-[1.35] mb-2">
                  {isEn ? 'No words to review yet 📚' : '아직 복습할 단어가 없어요 📚'}
                </h2>
                <p className="text-[14px] text-gray-500 mb-4">
                  {isEn ? 'Words you learn will be scheduled for review using spaced repetition.' : '학습한 단어는 간격 반복 알고리즘에 따라 복습 일정에 추가됩니다'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-[22px] font-bold text-[#1c1c1e] leading-[1.35] mb-2">
                  {isEn ? 'Rest day! ✅' : '오늘은 복습 쉬는 날! ✅'}
                </h2>
                <p className="text-[14px] text-gray-500 mb-4">
                  {isEn ? 'Come back tomorrow for your next review session.' : '내일 복습할 단어가 준비될 때까지 쉬세요'}
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

        {/* ===== Empty Review Mode ===== */}
        {stats.dueToday === 0 && stats.totalReviewed === 0 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">📚</div>
              <h2 className="text-xl font-bold mb-2">
                {isEn ? 'No words to review today' : '오늘 복습할 단어가 없어요'}
              </h2>
              <p className="text-gray-500 mb-6">
                {isEn
                  ? "Learn new words first — they'll automatically appear here for review using spaced repetition."
                  : '새 단어를 먼저 학습하세요. 간격 반복 알고리즘으로 자동 복습 일정이 만들어집니다.'}
              </p>
              <div className="flex gap-3 justify-center">
                <a href="/dashboard"
                  className="px-6 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition">
                  {isEn ? 'Go to Learn' : '학습하러 가기'}
                </a>
                <a href="/words"
                  className="px-6 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition">
                  {isEn ? 'Browse Words' : '단어 탐색'}
                </a>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                💡 {isEn
                  ? 'Spaced repetition reviews words right before you forget — building lasting memory.'
                  : '간격 반복은 잊기 직전에 복습하여 장기 기억을 형성합니다.'}
              </p>
            </div>
          </div>
        )}

        {/* ===== Active Review Mode ===== */}
        {(stats.dueToday > 0 || stats.totalReviewed > 0) && (<>

        {/* 시험 선택 (은행 앱 스타일) */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{isEn ? 'Select Exam' : '시험 선택'}</h3>

          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {visibleExams
              .filter((e) => {
                if (e.key === 'CSAT_2026') return hasCsat2026Access || isPremium;
                if (e.key === 'EBS') return hasEbsAccess || isPremium;
                if (e.key === 'TOEFL') return hasToeflAccess || isPremium;
                if (e.key === 'TOEIC') return hasToeicAccess || isPremium;
                if (e.key === 'SAT') return hasSatAccess || isPremium;
                if (e.key === 'GRE') return hasGreAccess || isPremium;
                if (e.key === 'IELTS') return hasIeltsAccess || isPremium;
                return true;
              })
              .map((e) => {
              const key = e.key;
              const info = { name: e.label, icon: e.icon };
              // 단품 시험: 프리미엄 또는 단품 구매, 나머지는 구독 권한으로 체크
              const isLocked = (key === 'CSAT_2026') ? !(hasCsat2026Access || isPremium)
                : (key === 'EBS') ? !(hasEbsAccess || isPremium)
                : (key === 'TOEFL') ? !(hasToeflAccess || isPremium)
                : (key === 'TOEIC') ? !(hasToeicAccess || isPremium)
                : (key === 'SAT') ? !(hasSatAccess || isPremium)
                : (key === 'GRE') ? !(hasGreAccess || isPremium)
                : (key === 'IELTS') ? !(hasIeltsAccess || isPremium)
                : !canAccessExam(user, key);
              return (
                <button
                  key={key}
                  onMouseEnter={() => {
                    if (!isLocked) {
                      const lastLevel = localStorage.getItem(`review_${key}_level`) || 'L1';
                      prefetchReviews(key, getValidLevelForExam(key, lastLevel));
                    }
                  }}
                  onClick={() => {
                    if (isLocked) {
                      router.push('/pricing');
                    } else {
                      handleExamChange(key);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${
                    isLocked
                      ? 'bg-gray-100 text-[#999999] cursor-not-allowed'
                      : selectedExam === key
                      ? key === 'CSAT'
                        ? 'bg-[#14B8A6] text-white shadow-sm'
                        : key === 'CSAT_2026'
                        ? 'bg-[#F59E0B] text-white shadow-sm'
                        : key === 'EBS'
                        ? 'bg-[#10B981] text-white shadow-sm'
                        : key === 'TOEFL'
                        ? 'bg-[#3B82F6] text-white shadow-sm'
                        : key === 'TOEIC'
                        ? 'bg-[#10B981] text-white shadow-sm'
                        : key === 'GRE'
                        ? 'bg-[#6366F1] text-white shadow-sm'
                        : 'bg-[#A855F7] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-2xl">{info.icon}</span>
                  <span className="font-semibold text-xs">{info.name}</span>
                  {isLocked && <span className="text-xs">🔒</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* 레벨/유형 선택 (은행 앱 스타일) */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {(selectedExam === 'CSAT_2026' || selectedExam === 'EBS')
              ? (isEn ? 'Select Type' : '유형 선택')
              : (isEn ? 'Select Level' : '레벨 선택')}
          </h3>

          <div className="flex gap-3">
            {Object.entries(getLevelInfoForReview(selectedExam)).map(([key, info]) => {
              const isLocked = !EXAM_MAP[selectedExam]?.packageSlug && !canAccessLevel(user, key);
              return (
                <button
                  key={key}
                  onMouseEnter={() => {
                    if (!isLocked) {
                      prefetchReviews(selectedExam, key);
                    }
                  }}
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
                      ? selectedExam === 'EBS' ? 'bg-[#10B981] text-white shadow-sm' : 'bg-[#3B82F6] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {(selectedExam === 'CSAT_2026' || selectedExam === 'EBS') ? (
                    // CSAT_2026/EBS: 한 줄로 표시
                    <span className="font-semibold text-sm">{info.name}</span>
                  ) : (
                    // 기존 CSAT/TEPS: 두 줄 유지
                    <>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[16px]">
                          {isEn ? (
                            selectedExam === 'SAT' ? (key === 'L1' ? 'Starter' : 'Advanced') :
                            selectedExam === 'GRE' ? (key === 'L1' ? 'Verbal' : 'Elite') :
                            selectedExam === 'TOEFL' ? (key === 'L1' ? 'Essential' : 'Mastery') :
                            selectedExam === 'TOEIC' ? (key === 'L1' ? 'Primer' : 'Booster') :
                            selectedExam === 'IELTS' ? (key === 'L1' ? 'Foundation' : 'Academic') :
                            selectedExam === 'CSAT' ? (key === 'L1' ? 'L1 (Basic)' : key === 'L2' ? 'L2 (Intermediate)' : 'L3 (Advanced)') :
                            selectedExam === 'TEPS' ? (key === 'L1' ? 'L1 (Basic)' : 'L2 (Essential)') :
                            key
                          ) : key}
                        </span>
                        {isLocked && <span className="text-sm">🔒</span>}
                      </div>
                      {!isEn && (selectedExam === 'CSAT' || selectedExam === 'TEPS') && (
                        <span className={`text-[12px] mt-1 ${
                          isLocked ? 'text-[#999999]' : selectedLevel === key ? 'text-blue-100' : 'text-[#999999]'
                        }`}>
                          {info.name}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 복습 현황 카드 (은행 앱 스타일) */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">{isEn ? 'Review Stats' : '복습 현황'}</h3>
            <span className="text-[13px] text-[#14B8A6] font-semibold flex items-center gap-1">
              🔥 {isEn ? `${currentStreak} day streak` : `${currentStreak}일 연속`}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <DashboardItem value={stats.dueToday} label={isEn ? 'Due' : '복습 대기'} color="#A855F7" />
            <div className="w-[1px] h-10 bg-[#f0f0f0]" />
            <DashboardItem value={(stats.todayCorrect || 0) === 0 ? '—' : (stats.todayCorrect || 0)} label={(stats.todayCorrect || 0) === 0 ? '' : (isEn ? 'Reviewed' : '오늘 복습')} color="#F59E0B" />
            <div className="w-[1px] h-10 bg-[#f0f0f0]" />
            <DashboardItem value={(stats.accuracy || 0) === 0 && (stats.todayCorrect || 0) === 0 ? '—' : `${stats.accuracy || 0}%`} label={(stats.accuracy || 0) === 0 && (stats.todayCorrect || 0) === 0 ? '' : (isEn ? 'Accuracy' : '복습 정답률')} color="#10B981" />
          </div>
        </section>

        {/* 바로 복습 이어가기 카드 (은행 앱 스타일) */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-teal-300 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">{isEn ? 'Start Reviewing' : '바로 복습 이어가기'}</h3>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-[48px] h-[48px] rounded-full bg-[#F3E8FF] flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
            <div>
              <p className="text-[16px] font-bold text-[#1c1c1e]">
                {EXAM_MAP[selectedExam]?.label || selectedExam} {selectedLevel}
              </p>
              <p className="text-[13px] text-gray-500">{isEn ? 'Due words • Memory boost' : '복습 대기 단어 • 기억 강화'}</p>
            </div>
          </div>

          <p className="text-[13px] text-gray-500 mb-4">
            {isEn ? 'Last reviewed: ' : '마지막 복습: '}{stats.lastReviewDate ? new Date(stats.lastReviewDate).toLocaleDateString(isEn ? 'en-US' : 'ko-KR') : (isEn ? 'Never' : '기록 없음')}
          </p>

          <div className="flex gap-2">
            <Link
              href={`/review/quiz?exam=${selectedExam}&level=${selectedLevel}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-shadow"
            >
              <span>🎯</span>
              <span>{isEn ? 'Quiz' : '퀴즈'}</span>
            </Link>
            <Link
              href={`/learn?mode=review&exam=${selectedExam}&level=${selectedLevel}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              <span>📚</span>
              <span>{isEn ? 'Flashcards' : '플래시카드'}</span>
            </Link>
            <Link
              href="/learn?mode=bookmarks"
              className="flex-1 flex items-center justify-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              <span>⭐</span>
              <span>{isEn ? 'Bookmarks' : '북마크'}</span>
            </Link>
          </div>
        </section>

        {/* 오늘 복습 완료 메시지 */}
        {stats.dueToday === 0 && (stats.todayCorrect || 0) > 0 && (
          <section className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-[#047857] mb-2">{isEn ? 'All Reviewed!' : '오늘 복습 완료!'}</h3>
            <p className="text-[#059669]">{isEn ? 'You completed all reviews. Great work!' : '모든 복습을 마쳤습니다. 잘하셨어요!'}</p>
          </section>
        )}

        {/* Due Words List with Pagination */}
        {dueWords.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-[#f0f0f0]">
              <h3 className="text-sm font-semibold text-gray-900">{isEn ? 'Due for Review' : '복습 대기 중'}</h3>
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
                  {isEn
                    ? `${(wordListPage - 1) * WORDS_PER_PAGE + 1}-${Math.min(wordListPage * WORDS_PER_PAGE, dueWords.length)} of ${dueWords.length}`
                    : `전체 ${dueWords.length}개 중 ${(wordListPage - 1) * WORDS_PER_PAGE + 1}-${Math.min(wordListPage * WORDS_PER_PAGE, dueWords.length)}`}
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
        <section className="bg-white rounded-2xl p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{isEn ? 'Review Schedule' : '복습 일정'}</h3>

          <div className="space-y-3">
            {/* 오늘 */}
            <div className="flex items-center justify-between p-4 bg-[#F3E8FF] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#1c1c1e]">{isEn ? 'Today' : '오늘'}</p>
                  <p className="text-[12px] text-gray-500">{new Date().toLocaleDateString(isEn ? 'en-US' : 'ko-KR')}</p>
                </div>
              </div>
              <span className="text-purple-500 font-bold">{stats.dueToday}{isEn ? '' : '개'}</span>
            </div>

            {/* 내일 */}
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">📆</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#1c1c1e]">{isEn ? 'Tomorrow' : '내일'}</p>
                  <p className="text-[12px] text-gray-500">{isEn ? 'Scheduled for tomorrow' : '내일 복습 예정'}</p>
                </div>
              </div>
              <span className={`font-bold ${(stats.tomorrowDue || 0) > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                {stats.tomorrowDue || 0}{isEn ? '' : '개'}
              </span>
            </div>

            {/* 이번 주 */}
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">🗓️</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#1c1c1e]">{isEn ? 'This Week' : '이번 주'}</p>
                  <p className="text-[12px] text-gray-500">{isEn ? 'Within 2-7 days' : '2~7일 이내'}</p>
                </div>
              </div>
              <span className={`font-bold ${(stats.thisWeekDue || 0) > 0 ? 'text-teal-500' : 'text-gray-400'}`}>
                {stats.thisWeekDue || 0}{isEn ? '' : '개'}
              </span>
            </div>
          </div>
        </section>

        {/* 간격 반복 학습 안내 (은행 앱 스타일) */}
        <section className="bg-[#EFF6FF] rounded-2xl p-5 border border-[#BFDBFE]">
          <h4 className="text-sm font-semibold text-[#1E40AF] mb-2">{isEn ? '💡 What is Spaced Repetition?' : '💡 간격 반복 학습이란?'}</h4>
          <p className="text-[14px] text-[#1E3A8A]">
            {isEn
              ? 'Reviewing right before you forget converts short-term memory into long-term memory. VocaVision AI calculates the optimal review timing based on your learning data.'
              : '기억이 사라지기 직전에 복습하면 장기 기억으로 전환됩니다. VocaVision AI는 학습 데이터를 기반으로 최적의 복습 시점을 계산합니다.'}
          </p>
        </section>

        </>)}
      </div>
    </DashboardLayout>
  );
}

// Loading component for Suspense
function ReviewPageLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4 lg:space-y-6">
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
