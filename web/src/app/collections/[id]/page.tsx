'use client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Word {
  id: string;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  difficulty: string;
  definition: string;
  exampleSentence: string | null;
  userProgress?: {
    masteryLevel: string;
    correctCount: number;
    incorrectCount: number;
  } | null;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: string;
  words: Word[];
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollection();
  }, [params.id]);

  const loadCollection = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/collections/${params.id}`, {
        headers,
      });

      setCollection(response.data);
    } catch (error) {
      console.error('Failed to load collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-800 border-green-300',
    INTERMEDIATE: 'bg-blue-100 text-blue-800 border-blue-300',
    ADVANCED: 'bg-orange-100 text-orange-800 border-orange-300',
    EXPERT: 'bg-red-100 text-red-800 border-red-300',
  };

  const difficultyLabels = {
    BEGINNER: '초급',
    INTERMEDIATE: '중급',
    ADVANCED: '고급',
    EXPERT: '전문가',
  };

  const masteryColors = {
    NEW: 'bg-gray-500',
    LEARNING: 'bg-yellow-500',
    FAMILIAR: 'bg-blue-500',
    MASTERED: 'bg-green-500',
  };

  const masteryLabels = {
    NEW: '새로운',
    LEARNING: '학습 중',
    FAMILIAR: '익숙함',
    MASTERED: '마스터',
  };

  const getMasteredCount = () => {
    return collection?.words.filter(
      (w) => w.userProgress?.masteryLevel === 'MASTERED'
    ).length || 0;
  };

  const getProgressPercentage = () => {
    if (!collection || collection.words.length === 0) return 0;
    return Math.round((getMasteredCount() / collection.words.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">컬렉션을 찾을 수 없습니다</h2>
          <Link
            href="/collections"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            컬렉션 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/collections" className="text-gray-600 hover:text-gray-900">
              ← 컬렉션
            </Link>
            <h1 className="text-2xl font-bold text-blue-600">
              {collection.icon} {collection.name}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Collection Info */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-6xl">{collection.icon}</span>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {collection.name}
                  </h2>
                  <p className="text-gray-600">{collection.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-4 py-2 rounded-lg border-2 font-semibold ${
                    difficultyColors[
                      collection.difficulty as keyof typeof difficultyColors
                    ]
                  }`}
                >
                  {difficultyLabels[collection.difficulty as keyof typeof difficultyLabels]}
                </span>
                <span className="text-gray-600">
                  총 {collection.words.length}개 단어
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar (for authenticated users) */}
          {user && (
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">학습 진행도</span>
                <span className="text-gray-600">
                  {getMasteredCount()} / {collection.words.length} 마스터
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="text-right mt-2 text-sm text-gray-600">
                {getProgressPercentage()}%
              </div>
            </div>
          )}

          {/* CTA for non-authenticated users */}
          {!user && (
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <p className="text-gray-700 mb-4">
                로그인하여 학습 진행도를 추적하고 모든 기능을 이용하세요!
              </p>
              <div className="flex gap-3">
                <Link
                  href="/auth/login"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  무료 시작
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Words List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-2xl font-bold mb-6">단어 목록</h3>

          <div className="grid gap-4">
            {collection.words.map((word) => (
              <Link
                key={word.id}
                href={user ? `/words/${word.id}` : '/auth/login'}
                className="block bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-2xl font-bold text-gray-900">
                        {word.word}
                      </h4>
                      <span className="text-gray-500">{word.pronunciation}</span>
                      <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-600 border border-gray-300">
                        {word.partOfSpeech}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-2">{word.definition}</p>

                    {word.exampleSentence && (
                      <p className="text-gray-600 italic">
                        &ldquo;{word.exampleSentence}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg border-2 text-sm font-semibold ${
                        difficultyColors[
                          word.difficulty as keyof typeof difficultyColors
                        ]
                      }`}
                    >
                      {difficultyLabels[word.difficulty as keyof typeof difficultyLabels]}
                    </span>

                    {word.userProgress && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                          masteryColors[
                            word.userProgress.masteryLevel as keyof typeof masteryColors
                          ]
                        }`}
                      >
                        {
                          masteryLabels[
                            word.userProgress.masteryLevel as keyof typeof masteryLabels
                          ]
                        }
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Actions */}
        {user && (
          <div className="mt-8 text-center">
            <Link
              href="/learn"
              className="inline-block px-10 py-4 bg-blue-600 text-white text-lg rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              이 컬렉션 학습 시작하기
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
