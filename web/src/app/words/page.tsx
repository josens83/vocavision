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
import { getAccessibleLevels, isLevelLocked, isExamLocked } from '@/lib/subscription';

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
  const user = useAuthStore((state) => state.user);

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
              로그인이 필요합니다
            </h2>
            <p className="text-[14px] text-gray-500 mb-6">
              단어 탐색 기능은 회원만 이용할 수 있습니다.<br />
              무료 회원가입 후 수능 L1 단어를 학습해보세요!
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/auth/login"
                className="px-6 py-3 bg-[#14B8A6] text-white font-bold rounded-xl hover:bg-[#e85a8a] transition"
              >
                로그인
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-3 bg-gray-100 text-gray-500 font-medium rounded-xl hover:bg-gray-200 transition"
              >
                무료 회원가입
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 접근 가능 레벨 계산 (디버깅/표시용)
  const accessibleLevels = getAccessibleLevels(user);

  // 잠금 체크 헬퍼 함수 (공통 유틸 사용)
  const checkExamLocked = (exam: string) => isExamLocked(user, exam);
  const checkLevelLocked = (exam: string, level: string) => isLevelLocked(user, exam, level);

  // Get initial search from URL parameter
  const initialSearch = searchParams.get('search') || '';

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [examCategory, setExamCategory] = useState('CSAT');
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
                className="w-full bg-gray-100 border-none rounded-xl py-4 pl-12 pr-4 text-[15px] text-[#1c1c1e] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
              />
            </div>
          </form>
        </header>

        {/* 필터 섹션 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          {/* 시험 필터 */}
          <div className="mb-4">
            <h4 className="text-[13px] text-gray-500 font-medium mb-2">시험</h4>
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
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  const locked = checkExamLocked('CSAT');
                  if (locked) {
                    router.push('/pricing');
                    return;
                  }
                  setExamCategory('CSAT');
                  setLevel('');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all flex items-center gap-1 ${
                  checkExamLocked('CSAT')
                    ? 'bg-gray-100 text-[#999999] cursor-pointer'
                    : examCategory === 'CSAT'
                      ? 'bg-[#14B8A6] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {checkExamLocked('CSAT') && <Lock className="w-3 h-3" />}
                수능
              </button>
              <button
                onClick={() => {
                  const locked = checkExamLocked('TEPS');
                  if (locked) {
                    router.push('/pricing');
                    return;
                  }
                  setExamCategory('TEPS');
                  setLevel('');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all flex items-center gap-1 ${
                  checkExamLocked('TEPS')
                    ? 'bg-gray-100 text-[#999999] cursor-pointer'
                    : examCategory === 'TEPS'
                      ? 'bg-[#A855F7] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {checkExamLocked('TEPS') && <Lock className="w-3 h-3" />}
                TEPS
              </button>
            </div>
          </div>

          {/* 레벨 필터 */}
          <div>
            <h4 className="text-[13px] text-gray-500 font-medium mb-2">레벨</h4>
            <div className="flex gap-2 flex-wrap">
              {['', 'L1', 'L2', 'L3'].map((lvl) => {
                const locked = lvl !== '' && examCategory && checkLevelLocked(examCategory, lvl);
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
                        ? 'bg-gray-100 text-[#999999] cursor-pointer'
                        : level === lvl
                          ? 'bg-[#3B82F6] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
          <p className="text-[14px] text-gray-500">
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
                  className="px-4 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  이전
                </button>
                <div className="px-4 py-2.5 text-[14px] text-[#1c1c1e] font-medium">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
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
      className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-[18px] font-bold text-[#1c1c1e]">{word.word}</h3>
          {word.pronunciation && (
            <p className="text-[13px] text-gray-500">{word.pronunciation}</p>
          )}
        </div>

        {/* 배지 */}
        <div className="flex gap-1.5">
          {isActiveExam && badgeLabel && (
            <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${
              word.examCategory === 'CSAT'
                ? 'bg-[#ECFDF5] text-[#14B8A6]'
                : 'bg-[#F3E8FF] text-purple-500'
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
        <span className="text-[13px] text-[#14B8A6] font-medium">자세히 보기 →</span>
      </div>
    </Link>
  );
}
