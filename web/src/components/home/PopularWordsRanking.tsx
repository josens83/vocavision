"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { wordsAPI } from "@/lib/api";

interface RankedWord {
  id: string;
  word: string;
  definition: string;
  definitionKo?: string;
}

export default function PopularWordsRanking() {
  const [words, setWords] = useState<RankedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadPopularWords();
  }, []);

  const loadPopularWords = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await wordsAPI.getRandomWords(10);
      const wordsList = data.words || data.data || [];
      setWords(wordsList.slice(0, 10));
    } catch (err) {
      console.error("Failed to load popular words:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 순위에 따른 색상
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-amber-400 text-white";
      case 2:
        return "bg-slate-400 text-white";
      case 3:
        return "bg-amber-600 text-white";
      default:
        return "bg-slate-200 text-slate-600";
    }
  };

  // 순위 아이콘 (메달)
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mx-auto mb-2" />
            <div className="h-5 w-64 bg-slate-200 rounded animate-pulse mx-auto" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-white rounded-lg animate-pulse"
              >
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 w-24 bg-slate-200 rounded mb-1" />
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || words.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 섹션 헤더 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            인기 단어 <span className="text-gradient">TOP 10</span>
          </h2>
          <p className="text-slate-600">
            지금 가장 많이 학습하는 단어들을 확인하세요
          </p>
        </div>

        {/* 랭킹 리스트 */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {words.map((word, index) => {
              const rank = index + 1;
              const rankIcon = getRankIcon(rank);

              return (
                <Link
                  key={word.id}
                  href={`/learn?word=${word.id}`}
                  className={`flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors ${
                    index < words.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  {/* 순위 */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(
                      rank
                    )}`}
                  >
                    {rankIcon || rank}
                  </div>

                  {/* 단어 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {word.word}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {word.definitionKo || word.definition}
                    </p>
                  </div>

                  {/* 화살표 */}
                  <svg
                    className="w-4 h-4 text-slate-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              );
            })}
          </div>

          {/* 전체 보기 버튼 */}
          <div className="mt-4 text-center">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              <span>전체 단어 학습하기</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
