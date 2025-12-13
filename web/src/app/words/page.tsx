'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { wordsAPI } from '@/lib/api';
import { EmptySearchResults } from '@/components/ui/EmptyState';
import { SkeletonWordCard } from '@/components/ui/Skeleton';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonWordCard key={i} />
          ))}
        </div>
      </main>
    </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">VocaVision</h1>
            <nav className="flex gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                대시보드
              </Link>
              <Link href="/learn" className="text-gray-600 hover:text-gray-900">
                학습
              </Link>
              <Link href="/words" className="text-blue-600 font-semibold">
                단어 탐색
              </Link>
              <Link href="/statistics" className="text-gray-600 hover:text-gray-900">
                통계
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">단어 탐색</h2>
          <p className="text-gray-600">학습하고 싶은 단어를 찾아보세요</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="단어 검색..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                검색
              </button>
            </div>
          </form>

          {/* 시험 필터 */}
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 mr-3">시험</span>
              <div className="inline-flex gap-2 flex-wrap">
                {[
                  { value: '', label: '전체', color: 'gray' },
                  { value: 'CSAT', label: '수능', color: 'blue' },
                  { value: 'TEPS', label: 'TEPS', color: 'purple' },
                  { value: 'TOEFL', label: 'TOEFL', color: 'orange' },
                  { value: 'TOEIC', label: 'TOEIC', color: 'green' },
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setExamCategory(value);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      examCategory === value
                        ? `bg-${color}-600 text-white`
                        : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
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
      </main>
    </div>
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
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          자세히 보기 →
        </Link>
      </div>
    </div>
  );
}
