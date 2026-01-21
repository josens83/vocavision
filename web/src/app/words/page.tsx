'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { wordsAPI } from '@/lib/api';
import { EmptySearchResults } from '@/components/ui/EmptyState';
import { SkeletonWordCard } from '@/components/ui/Skeleton';
import DashboardLayout from '@/components/layout/DashboardLayout';

// 사용자 플랜에 따른 접근 가능 레벨 정의
function getAccessibleLevels(user: any) {
  // 비로그인: 접근 불가 (로그인 유도)
  if (!user) return { CSAT: [], TEPS: [] };

  const status = user.subscriptionStatus;
  const plan = user.subscriptionPlan;

  // 무료 회원: CSAT L1만
  if (status === 'FREE' || !status) {
    return { CSAT: ['L1'], TEPS: [] };
  }

  // 프리미엄 회원 체크 (YEARLY, FAMILY, PREMIUM 플랜 또는 PREMIUM 상태)
  const isPremium = status === 'PREMIUM' ||
    plan === 'YEARLY' || plan === 'FAMILY' || plan === 'PREMIUM';

  if (isPremium) {
    return { CSAT: ['L1', 'L2', 'L3'], TEPS: ['L1', 'L2', 'L3'] };
  }

  // 베이직 회원 (ACTIVE 상태 + MONTHLY 플랜, 또는 그 외 유료)
  if (status === 'ACTIVE' || status === 'BASIC') {
    return { CSAT: ['L1', 'L2', 'L3'], TEPS: [] };
  }

  // 기본값: CSAT L1만 (CANCELLED, EXPIRED 등)
  return { CSAT: ['L1'], TEPS: [] };
}

// 잠금 체크 함수
function isLevelLocked(accessibleLevels: any, exam: string, level: string) {
  if (!exam || !level) return false; // 전체 선택 시 잠금 없음
  if (!accessibleLevels[exam]) return true;
  return !accessibleLevels[exam].includes(level);
}

// 시험이 완전히 잠겨있는지 체크
function isExamLocked(accessibleLevels: any, exam: string) {
  if (!exam) return false;
  if (!accessibleLevels[exam]) return true;
  return accessibleLevels[exam].length === 0;
}

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
          <div className="h-14 bg-[#F8F9FA] rounded-[14px] mb-6" />
          <div className="bg-white rounded-[20px] p-5 h-40 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-[20px] p-5 h-32" />
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
  const user = useAuthStore((state) => state.user);

  // 비로그인 시 로그인 유도 화면
  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-[#FFF0F5] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#FF6B9D]" />
            </div>
            <h2 className="text-[22px] font-bold text-[#1c1c1e] mb-3">
              로그인이 필요합니다
            </h2>
            <p className="text-[14px] text-[#767676] mb-6">
              단어 탐색 기능은 회원만 이용할 수 있습니다.<br />
              무료 회원가입 후 수능 L1 단어를 학습해보세요!
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/auth/login"
                className="px-6 py-3 bg-[#FF6B9D] text-white font-bold rounded-[14px] hover:bg-[#e85a8a] transition"
              >
                로그인
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-3 bg-[#F8F9FA] text-[#767676] font-medium rounded-[14px] hover:bg-[#f0f0f0] transition"
              >
                무료 회원가입
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 접근 가능 레벨 계산
  const accessibleLevels = getAccessibleLevels(user);

  // Get initial search from URL parameter
  const initialSearch = searchParams.get('search') || '';

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [examCategory, setExamCategory] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Initial load with URL search param
  useEffect(() => {
    loadWords();
    setInitialLoadDone(true);
  }, []);

  // Reload when filters change (after initial load)
  useEffect(() => {
    if (initialLoadDone) {
      loadWords();
    }
  }, [page, examCategory, level]);

  const loadWords = async () => {
    setLoading(true);
    try {
      const data = await wordsAPI.getWords({
        page,
        limit: 20,
        examCategory: examCategory || undefined,
        level: level || undefined,
        search: search || undefined,
      });
      setWords(data.words);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total || data.words.length);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadWords();
  };

  // Exam + Level 배지 라벨
  const examLevelLabels: Record<string, Record<string, string>> = {
    CSAT: {
      L1: '수능 L1',
      L2: '수능 L2',
      L3: '수능 L3',
    },
    TEPS: {
      L1: 'TEPS L1',
      L2: 'TEPS L2',
      L3: 'TEPS L3',
    },
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
        {/* 페이지 헤더 */}
        <header className="mb-2">
          <h1 className="text-[22px] font-bold text-[#1c1c1e] mb-4">단어 찾기</h1>

          {/* 검색바 */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#999999]" />
              <input
                type="text"
                placeholder="단어 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#F8F9FA] border-none rounded-[14px] py-4 pl-12 pr-4 text-[15px] text-[#1c1c1e] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/20"
              />
            </div>
          </form>
        </header>

        {/* 필터 섹션 */}
        <section className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]">
          {/* 시험 필터 */}
          <div className="mb-4">
            <h4 className="text-[13px] text-[#767676] font-medium mb-2">시험</h4>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setExamCategory('');
                  setLevel('');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all ${
                  examCategory === ''
                    ? 'bg-[#1c1c1e] text-white'
                    : 'bg-[#F8F9FA] text-[#767676] hover:bg-[#f0f0f0]'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  const locked = isExamLocked(accessibleLevels, 'CSAT');
                  if (locked) {
                    router.push('/pricing');
                    return;
                  }
                  setExamCategory('CSAT');
                  setLevel('');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all flex items-center gap-1 ${
                  isExamLocked(accessibleLevels, 'CSAT')
                    ? 'bg-[#F8F9FA] text-[#999999] cursor-pointer'
                    : examCategory === 'CSAT'
                      ? 'bg-[#FF6B9D] text-white'
                      : 'bg-[#F8F9FA] text-[#767676] hover:bg-[#f0f0f0]'
                }`}
              >
                {isExamLocked(accessibleLevels, 'CSAT') && <Lock className="w-3 h-3" />}
                수능
              </button>
              <button
                onClick={() => {
                  const locked = isExamLocked(accessibleLevels, 'TEPS');
                  if (locked) {
                    router.push('/pricing');
                    return;
                  }
                  setExamCategory('TEPS');
                  setLevel('');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all flex items-center gap-1 ${
                  isExamLocked(accessibleLevels, 'TEPS')
                    ? 'bg-[#F8F9FA] text-[#999999] cursor-pointer'
                    : examCategory === 'TEPS'
                      ? 'bg-[#A855F7] text-white'
                      : 'bg-[#F8F9FA] text-[#767676] hover:bg-[#f0f0f0]'
                }`}
              >
                {isExamLocked(accessibleLevels, 'TEPS') && <Lock className="w-3 h-3" />}
                TEPS
              </button>
            </div>
          </div>

          {/* 레벨 필터 */}
          <div>
            <h4 className="text-[13px] text-[#767676] font-medium mb-2">레벨</h4>
            <div className="flex gap-2 flex-wrap">
              {['', 'L1', 'L2', 'L3'].map((lvl) => {
                const locked = lvl !== '' && examCategory && isLevelLocked(accessibleLevels, examCategory, lvl);
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      if (locked) {
                        router.push('/pricing');
                        return;
                      }
                      setLevel(lvl);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all flex items-center gap-1 ${
                      locked
                        ? 'bg-[#F8F9FA] text-[#999999] cursor-pointer'
                        : level === lvl
                          ? 'bg-[#3B82F6] text-white'
                          : 'bg-[#F8F9FA] text-[#767676] hover:bg-[#f0f0f0]'
                    }`}
                  >
                    {locked && <Lock className="w-3 h-3" />}
                    {lvl === '' ? '전체' : lvl}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 결과 카운트 */}
        <div className="flex items-center justify-between">
          <p className="text-[14px] text-[#767676]">
            총 <span className="font-semibold text-[#1c1c1e]">{totalCount}</span>개 단어
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
              setExamCategory('');
              setLevel('');
              setPage(1);
              loadWords();
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
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2.5 bg-[#F8F9FA] text-[#767676] font-semibold rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f0f0f0] transition"
                >
                  이전
                </button>
                <div className="px-4 py-2.5 text-[14px] text-[#1c1c1e] font-medium">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2.5 bg-[#F8F9FA] text-[#767676] font-semibold rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f0f0f0] transition"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// 서비스 중인 시험만 표시 (CSAT, TEPS - 나머지는 준비중)
const ACTIVE_EXAM_CATEGORIES = ['CSAT', 'TEPS'];

function WordCard({
  word,
  examLevelLabels,
}: {
  word: Word;
  examLevelLabels: Record<string, Record<string, string>>;
}) {
  // 서비스 중인 시험(CSAT, TEPS)만 배지로 표시
  const isActiveExam = word.examCategory && ACTIVE_EXAM_CATEGORIES.includes(word.examCategory);
  const badgeLabel = isActiveExam && word.level
    ? examLevelLabels[word.examCategory!]?.[word.level] || `${word.examCategory} ${word.level}`
    : null;

  return (
    <Link
      href={`/words/${word.id}`}
      className="block bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5] hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-[18px] font-bold text-[#1c1c1e]">{word.word}</h3>
          {word.pronunciation && (
            <p className="text-[13px] text-[#767676]">{word.pronunciation}</p>
          )}
        </div>

        {/* 배지 */}
        <div className="flex gap-1.5">
          {isActiveExam && badgeLabel && (
            <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${
              word.examCategory === 'CSAT'
                ? 'bg-[#FFF0F5] text-[#FF6B9D]'
                : 'bg-[#F3E8FF] text-[#A855F7]'
            }`}>
              {badgeLabel}
            </span>
          )}
        </div>
      </div>

      <p className="text-[15px] text-[#1c1c1e]">{word.definitionKo || word.definition}</p>

      {/* 품사 */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[12px] text-[#999999]">{word.partOfSpeech}</span>
        <span className="text-[13px] text-[#FF6B9D] font-medium">자세히 보기 →</span>
      </div>
    </Link>
  );
}
