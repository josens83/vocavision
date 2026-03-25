'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useLocale } from '@/hooks/useLocale';
import { EmptySearchResults } from '@/components/ui/EmptyState';
import { SkeletonWordCard } from '@/components/ui/Skeleton';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAccessibleLevels, isLevelLocked, isExamLocked, getSubscriptionTier } from '@/lib/subscription';
import { usePackageAccess, useWordsSearch, usePrefetchWordsSearch } from '@/hooks/useQueries';

interface Word {
  id: string;
  word: string;
  definition: string;
  definitionKo?: string;
  pronunciation?: string;
  difficulty: string;
  partOfSpeech: string;
  examCategory?: string;
  level?: string;
  examLevels?: Array<{ examCategory: string; level: string }>;
}

// Wrap with Suspense for useSearchParams
export default function WordsPage() {
  return (
    <Suspense fallback={<WordsPageLoading />}>
      <WordsPageContent />
    </Suspense>
  );
}

function WordsPageLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-14 bg-gray-100 rounded-xl mb-6" />
          <div className="bg-white rounded-2xl p-5 h-40 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 h-32" />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function WordsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isEn = locale === 'en';
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // 비로그인 시 로그인 유도 화면
  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#14B8A6]" />
            </div>
            <h2 className="text-[22px] font-bold text-[#1c1c1e] mb-3">
              {isEn ? 'Sign in required' : '로그인이 필요합니다'}
            </h2>
            <p className="text-[14px] text-gray-500 mb-6">
              {isEn ? (
                <>Word search is available for members only.<br />Sign up free and start learning!</>
              ) : (
                <>단어 탐색 기능은 회원만 이용할 수 있습니다.<br />무료 회원가입 후 수능 L1 단어를 학습해보세요!</>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/auth/login"
                className="px-6 py-3 bg-[#14B8A6] text-white font-bold rounded-xl hover:bg-[#e85a8a] transition"
              >
                {isEn ? 'Sign In' : '로그인'}
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-3 bg-gray-100 text-gray-500 font-medium rounded-xl hover:bg-gray-200 transition"
              >
                {isEn ? 'Sign Up Free' : '무료 회원가입'}
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 접근 가능 레벨 계산 (디버깅/표시용)
  const accessibleLevels = getAccessibleLevels(user);

  // 2026 기출 접근 권한 체크
  const { data: accessData } = usePackageAccess('2026-csat-analysis', !!user && hasHydrated);
  const hasCsat2026Access = accessData?.hasAccess || false;
  // EBS 접근 권한 체크
  const { data: ebsAccessData } = usePackageAccess('ebs-vocab', !!user && hasHydrated);
  const hasEbsAccess = ebsAccessData?.hasAccess || false;
  const isPremium = getSubscriptionTier(user) === 'PREMIUM';

  // 잠금 체크 헬퍼 함수 (공통 유틸 사용)
  const checkExamLocked = (exam: string) => isExamLocked(user, exam);
  const checkLevelLocked = (exam: string, level: string) => isLevelLocked(user, exam, level);

  // Get initial values from URL parameters
  const initialSearch = searchParams.get('search') || '';
  const initialExam = searchParams.get('exam') || (isEn ? 'SAT' : 'CSAT');
  const initialLevel = searchParams.get('level') || '';

  // 필터 상태
  const [search, setSearch] = useState(initialSearch);
  const [examCategory, setExamCategory] = useState(initialExam);
  const [level, setLevel] = useState(initialLevel);
  const [page, setPage] = useState(1);
  // 검색 트리거용 상태 (Enter 누를 때만 검색 실행)
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // URL 동기화 헬퍼
  const syncURL = (exam: string, lvl: string) => {
    const params = new URLSearchParams();
    if (exam) params.set('exam', exam);
    if (lvl) params.set('level', lvl);
    if (search) params.set('search', search);
    const qs = params.toString();
    router.replace(`/words${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  // React Query 훅
  const { data, isLoading } = useWordsSearch({
    page,
    limit: 20,
    examCategory: examCategory || undefined,
    level: level || undefined,
    search: searchQuery || undefined,
  }, !!user && hasHydrated);

  const prefetchWords = usePrefetchWordsSearch();

  // 데이터 추출
  const words: Word[] = data?.words || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalCount = data?.pagination?.total || 0;
  const loading = isLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(search); // 검색 쿼리 업데이트로 React Query가 자동 refetch
  };

  // Exam + Level 배지 라벨
  const examLevelLabels: Record<string, Record<string, string>> = isEn ? {
    SAT: { L1: 'SAT Starter', L2: 'SAT Advanced' },
    ACT: { L1: 'ACT Core', L2: 'ACT Plus' },
    GRE: { L1: 'GRE Verbal', L2: 'GRE Elite' },
    TOEFL: { L1: 'TOEFL Essential', L2: 'TOEFL Mastery' },
    TOEIC: { L1: 'TOEIC Primer', L2: 'TOEIC Booster' },
    IELTS: { L1: 'IELTS Foundation', L2: 'IELTS Academic' },
  } : {
    CSAT: { L1: '수능 L1', L2: '수능 L2', L3: '수능 L3' },
    TEPS: { L1: 'TEPS L1', L2: 'TEPS L2' },
    CSAT_2026: { LISTENING: '듣기영역', READING_2: '독해영역 2점', READING_3: '독해영역 3점' },
    EBS: { LISTENING: 'EBS 듣기', READING_BASIC: 'EBS 독해기본', READING_ADV: 'EBS 독해실력' },
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
        {/* 페이지 헤더 */}
        <header className="mb-2">
          <h1 className="text-[22px] font-bold text-[#1c1c1e] mb-4">{isEn ? 'Search Words' : '단어 찾기'}</h1>

          {/* 검색바 */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#999999]" />
              <input
                type="text"
                placeholder={isEn ? 'Search words...' : '단어 검색...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-xl py-4 pl-12 pr-4 text-[15px] text-[#1c1c1e] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
              />
            </div>
          </form>
        </header>

        {/* 필터 섹션 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          {/* 시험 필터 */}
          <div className="mb-4">
            <h4 className="text-[13px] text-gray-500 font-medium mb-2">{isEn ? 'Exam' : '시험'}</h4>
            <div className="flex gap-2 flex-wrap">
              <button
                onMouseEnter={() => prefetchWords({ examCategory: '' })}
                onClick={() => {
                  setExamCategory('');
                  setLevel('');
                  setPage(1);
                  syncURL('', '');
                }}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all ${
                  examCategory === ''
                    ? 'bg-[#1c1c1e] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {isEn ? 'All' : '전체'}
              </button>
              {(isEn ? EN_EXAM_CATEGORIES : KR_EXAM_CATEGORIES).map((exam) => {
                const locked = isPremium ? false : checkExamLocked(exam);
                // KR 전용 시험: 2026 기출, EBS 는 접근권한 필요
                if (exam === 'CSAT_2026' && !(hasCsat2026Access || isPremium)) return null;
                if (exam === 'EBS' && !(hasEbsAccess || isPremium)) return null;
                return (
                  <button
                    key={exam}
                    onMouseEnter={() => prefetchWords({ examCategory: exam })}
                    onClick={() => {
                      if (locked) { router.push('/pricing'); return; }
                      setExamCategory(exam);
                      setLevel('');
                      setPage(1);
                      syncURL(exam, '');
                    }}
                    className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all flex items-center gap-1 ${
                      locked
                        ? 'bg-gray-100 text-[#999999] cursor-pointer'
                        : examCategory === exam
                          ? 'bg-[#14B8A6] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {locked && <Lock className="w-3 h-3" />}
                    {isEn ? exam.replace('_', ' ') : (exam === 'CSAT' ? '수능' : exam === 'CSAT_2026' ? '2026 수능 기출' : exam === 'EBS' ? 'EBS 연계' : exam)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 레벨 필터 */}
          <div>
            <h4 className="text-[13px] text-gray-500 font-medium mb-2">
              {isEn ? 'Level' : ((examCategory === 'CSAT_2026' || examCategory === 'EBS') ? '유형 선택' : '레벨')}
            </h4>
            <div className="flex gap-2 flex-wrap">
              {/* 시험 "전체" 선택 시 레벨도 "전체"만 표시 */}
              {examCategory === '' ? (
                <button
                  className="px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all bg-[#1c1c1e] text-white"
                >
                  {isEn ? 'All' : '전체'}
                </button>
              ) : examCategory === 'CSAT_2026' ? (
                <>
                  {['', 'LISTENING', 'READING_2', 'READING_3'].map((lvl) => (
                    <button
                      key={lvl}
                      onMouseEnter={() => prefetchWords({ examCategory, level: lvl })}
                      onClick={() => {
                        setLevel(lvl);
                        setPage(1);
                        syncURL(examCategory, lvl);
                      }}
                      className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all ${
                        level === lvl
                          ? 'bg-[#10B981] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {lvl === '' ? (isEn ? 'All' : '전체') :
                       lvl === 'LISTENING' ? (isEn ? 'Listening' : '듣기영역') :
                       lvl === 'READING_2' ? (isEn ? 'Reading 2pt' : '독해영역 2점') : (isEn ? 'Reading 3pt' : '독해영역 3점')}
                    </button>
                  ))}
                </>
              ) : examCategory === 'EBS' ? (
                <>
                  {['', 'LISTENING', 'READING_BASIC', 'READING_ADV'].map((lvl) => (
                    <button
                      key={lvl}
                      onMouseEnter={() => prefetchWords({ examCategory, level: lvl })}
                      onClick={() => {
                        setLevel(lvl);
                        setPage(1);
                        syncURL(examCategory, lvl);
                      }}
                      className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all ${
                        level === lvl
                          ? 'bg-[#10B981] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {lvl === '' ? (isEn ? 'All' : '전체') :
                       lvl === 'LISTENING' ? (isEn ? 'Listening' : '듣기영역') :
                       lvl === 'READING_BASIC' ? (isEn ? 'Reading Basic' : '독해기본') : (isEn ? 'Reading Adv' : '독해실력')}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {/* 기존 L1/L2/L3 - TEPS일 때 L3 숨김 */}
                  {['', 'L1', 'L2', 'L3']
                    .filter((lvl) => !(examCategory === 'TEPS' && lvl === 'L3'))
                    .filter((lvl) => !(isEn && lvl === 'L3'))
                    .map((lvl) => {
                      const locked = lvl !== '' && examCategory && !isPremium && checkLevelLocked(examCategory, lvl);
                      return (
                        <button
                          key={lvl}
                          onMouseEnter={() => prefetchWords({ examCategory, level: lvl })}
                          onClick={() => {
                            if (locked) {
                              router.push('/pricing');
                              return;
                            }
                            setLevel(lvl);
                            setPage(1);
                            syncURL(examCategory, lvl);
                          }}
                          className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all flex items-center gap-1 ${
                            locked
                              ? 'bg-gray-100 text-[#999999] cursor-pointer'
                              : level === lvl
                                ? 'bg-[#3B82F6] text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {locked && <Lock className="w-3 h-3" />}
                          {lvl === '' ? (isEn ? 'All' : '전체') :
                           isEn ? (
                             examCategory === 'SAT' ? (lvl === 'L1' ? 'Starter' : 'Advanced') :
                             examCategory === 'ACT' ? (lvl === 'L1' ? 'Core' : 'Plus') :
                             examCategory === 'GRE' ? (lvl === 'L1' ? 'Verbal' : 'Elite') :
                             examCategory === 'TOEFL' ? (lvl === 'L1' ? 'Essential' : 'Mastery') :
                             examCategory === 'TOEIC' ? (lvl === 'L1' ? 'Primer' : 'Booster') :
                             examCategory === 'IELTS' ? (lvl === 'L1' ? 'Foundation' : 'Academic') :
                             (lvl === 'L1' ? 'L1 (Core)' : 'L2 (Advanced)')
                           ) :
                           examCategory === 'TEPS' ?
                             (lvl === 'L1' ? 'L1(기본)' : 'L2(필수)') :
                             (lvl === 'L1' ? 'L1(기초)' : lvl === 'L2' ? 'L2(중급)' : 'L3(고급)')}
                        </button>
                      );
                    })}
                </>
              )}
            </div>
          </div>
        </section>

        {/* 결과 카운트 */}
        <div className="flex items-center justify-between">
          <p className="text-[14px] text-gray-500">
            {isEn ? '' : '총 '}<span className="font-semibold text-[#1c1c1e]">{totalCount}</span>{isEn ? ' words' : '개 단어'}
          </p>
        </div>

        {/* 단어 목록 */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonWordCard key={i} />
            ))}
          </div>
        ) : words.length === 0 ? (
          <EmptySearchResults
            query={search || examCategory || level}
            onClear={() => {
              setSearch('');
              setSearchQuery(''); // 검색 쿼리도 초기화
              setExamCategory('');
              setLevel('');
              setPage(1);
              // React Query가 자동으로 refetch
            }}
          />
        ) : (
          <>
            <div className="space-y-3">
              {words.map((word) => (
                <WordCard
                  key={word.id}
                  word={word}
                  examLevelLabels={examLevelLabels}
                  examFilter={examCategory}
                  levelFilter={level}
                  isEn={isEn}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  {isEn ? 'Prev' : '이전'}
                </button>
                <div className="px-4 py-2.5 text-[14px] text-[#1c1c1e] font-medium">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  {isEn ? 'Next' : '다음'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// 서비스 중인 시험 (KR/EN 분리)
const KR_EXAM_CATEGORIES = ['CSAT', 'TEPS', 'CSAT_2026', 'EBS'];
const EN_EXAM_CATEGORIES = ['SAT', 'ACT', 'GRE', 'TOEFL', 'TOEIC', 'IELTS'];

// 배지 색상 매핑
const BADGE_COLORS: Record<string, string> = {
  CSAT: 'bg-[#ECFDF5] text-[#14B8A6]',
  TEPS: 'bg-[#F3E8FF] text-purple-500',
  CSAT_2026: 'bg-[#D1FAE5] text-[#059669]',
  EBS: 'bg-[#DBEAFE] text-[#2563EB]',
  SAT: 'bg-blue-100 text-blue-700',
  ACT: 'bg-rose-100 text-rose-700',
  GRE: 'bg-violet-100 text-violet-700',
  TOEFL: 'bg-amber-100 text-amber-700',
  TOEIC: 'bg-orange-100 text-orange-700',
  IELTS: 'bg-cyan-100 text-cyan-700',
};

function WordCard({
  word,
  examLevelLabels,
  examFilter,
  levelFilter,
  isEn,
}: {
  word: Word;
  examLevelLabels: Record<string, Record<string, string>>;
  examFilter: string;
  levelFilter: string;
  isEn: boolean;
}) {
  // examLevels 기반 배지 (여러 시험에 속할 수 있음)
  const badges: Array<{ label: string; colorClass: string }> = [];

  if (word.examLevels && word.examLevels.length > 0) {
    for (const el of word.examLevels) {
      const activeExams = isEn ? EN_EXAM_CATEGORIES : KR_EXAM_CATEGORIES;
      if (!activeExams.includes(el.examCategory)) continue;
      if (!['L1', 'L2', 'L3', 'LISTENING', 'READING_2', 'READING_3', 'READING_BASIC', 'READING_ADV'].includes(el.level)) continue;
      const label = examLevelLabels[el.examCategory]?.[el.level] || `${el.examCategory} ${el.level}`;
      const colorClass = BADGE_COLORS[el.examCategory] || 'bg-gray-100 text-gray-600';
      badges.push({ label, colorClass });
    }
  } else if (word.examCategory && (isEn ? EN_EXAM_CATEGORIES : KR_EXAM_CATEGORIES).includes(word.examCategory) && word.level) {
    // fallback: legacy 필드
    const label = examLevelLabels[word.examCategory]?.[word.level] || `${word.examCategory} ${word.level}`;
    const colorClass = BADGE_COLORS[word.examCategory] || 'bg-gray-100 text-gray-600';
    badges.push({ label, colorClass });
  }

  // 링크에 현재 필터 파라미터 전달
  const linkParams = new URLSearchParams();
  if (examFilter) linkParams.set('exam', examFilter);
  if (levelFilter) linkParams.set('level', levelFilter);
  const linkQuery = linkParams.toString();
  const href = `/words/${word.id}${linkQuery ? `?${linkQuery}` : ''}`;

  return (
    <Link
      href={href}
      className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-[18px] font-bold text-[#1c1c1e]">{word.word}</h3>
          {word.pronunciation && !isEn && (
            <p className="text-[13px] text-gray-500">{word.pronunciation.replace(/\*\*/g, '')}</p>
          )}
        </div>

        {/* 배지 */}
        <div className="flex gap-1.5 flex-wrap justify-end">
          {badges.map((badge, i) => (
            <span
              key={i}
              className={`text-[11px] px-2 py-1 rounded-full font-medium ${badge.colorClass}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>

      <p className="text-[15px] text-[#1c1c1e]">{isEn ? word.definition : (word.definitionKo || word.definition)}</p>

      {/* 품사 */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[12px] text-[#999999]">{word.partOfSpeech}</span>
        <span className="text-[13px] text-[#14B8A6] font-medium">{isEn ? 'Details →' : '자세히 보기 →'}</span>
      </div>
    </Link>
  );
}
