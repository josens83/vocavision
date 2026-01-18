'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { wordsAPI } from '@/lib/api';
import { EmptySearchResults } from '@/components/ui/EmptyState';
import { SkeletonWordCard } from '@/components/ui/Skeleton';
import DashboardLayout from '@/components/layout/DashboardLayout';

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
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-gray-200 rounded mb-6" />
          <div className="bg-white rounded-xl p-6 mb-6 h-40" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonWordCard key={i} />
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

  // Get initial search from URL parameter
  const initialSearch = searchParams.get('search') || '';

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [examCategory, setExamCategory] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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

  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-700',
    INTERMEDIATE: 'bg-blue-100 text-blue-700',
    ADVANCED: 'bg-orange-100 text-orange-700',
    EXPERT: 'bg-red-100 text-red-700',
  };

  const difficultyLabels = {
    BEGINNER: '초급',
    INTERMEDIATE: '중급',
    ADVANCED: '고급',
    EXPERT: '전문가',
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">단어 탐색</h1>
          <p className="text-gray-500 text-sm mt-1">학습하고 싶은 단어를 찾아보세요</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-4 md:p-6 mb-6 shadow-sm">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="단어 검색..."
                className="flex-1 min-w-0 px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 md:px-8 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shrink-0"
              >
                <span className="hidden sm:inline">검색</span>
                <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* 시험 필터 */}
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 mr-3">시험</span>
              <div className="inline-flex gap-2 flex-wrap">
                {[
                  { value: '', label: '전체' },
                  { value: 'CSAT', label: '수능' },
                  { value: 'TEPS', label: 'TEPS' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setExamCategory(value);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      examCategory === value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 레벨 필터 */}
            <div>
              <span className="text-sm text-gray-500 mr-3">레벨</span>
              <div className="inline-flex gap-2 flex-wrap">
                {[
                  { value: '', label: '전체' },
                  { value: 'L1', label: '초급' },
                  { value: 'L2', label: '중급' },
                  { value: 'L3', label: '고급' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setLevel(value);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      level === value
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Words Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {words.map((word) => (
                <WordCard key={word.id} word={word} difficultyColors={difficultyColors} difficultyLabels={difficultyLabels} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  이전
                </button>
                <div className="flex items-center px-4 py-2">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

// Exam display names
const examDisplayNames: Record<string, string> = {
  CSAT: '수능',
  SAT: 'SAT',
  TOEFL: 'TOEFL',
  TOEIC: 'TOEIC',
  TEPS: 'TEPS',
};

// Level display names
const levelDisplayNames: Record<string, string> = {
  L1: '초급',
  L2: '중급',
  L3: '고급',
};

// Exam colors for badges
const examBadgeColors: Record<string, string> = {
  CSAT: 'bg-blue-100 text-blue-600',
  SAT: 'bg-emerald-100 text-emerald-600',
  TOEFL: 'bg-orange-100 text-orange-600',
  TOEIC: 'bg-green-100 text-green-600',
  TEPS: 'bg-purple-100 text-purple-600',
};

function WordCard({
  word,
  difficultyColors,
  difficultyLabels,
}: {
  word: Word;
  difficultyColors: any;
  difficultyLabels: any;
}) {
  const examName = word.examCategory ? examDisplayNames[word.examCategory] || word.examCategory : null;
  const levelName = word.level ? levelDisplayNames[word.level] || word.level : null;
  const badgeColor = word.examCategory ? examBadgeColors[word.examCategory] || 'bg-gray-100 text-gray-600' : '';

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{word.word}</h3>
          {word.pronunciation && (
            <p className="text-sm text-gray-500">{word.pronunciation}</p>
          )}
        </div>
        {/* Exam + Level Badge */}
        <div className="flex flex-col gap-1 items-end">
          {examName && levelName ? (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
              {examName} {levelName}
            </span>
          ) : (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                difficultyColors[word.difficulty]
              }`}
            >
              {difficultyLabels[word.difficulty]}
            </span>
          )}
        </div>
      </div>
      <p className="text-gray-700 mb-3">{word.definitionKo || word.definition}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{word.partOfSpeech}</span>
        <Link
          href={`/words/${word.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
        >
          자세히 보기 <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
