'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Collection {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: string;
  wordCount: number;
  progressCount: number;
  masteredCount: number;
  progressPercentage: number;
}

export default function CollectionsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, [user]);

  const loadCollections = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/collections`, { headers });
      setCollections(response.data.collections);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors: Record<string, string> = {
    BEGINNER: 'from-green-500 to-green-600',
    INTERMEDIATE: 'from-blue-500 to-blue-600',
    ADVANCED: 'from-orange-500 to-orange-600',
    EXPERT: 'from-red-500 to-red-600',
  };

  const difficultyLabels: Record<string, string> = {
    BEGINNER: '초급',
    INTERMEDIATE: '중급',
    ADVANCED: '고급',
    EXPERT: '전문가',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> 대시보드
            </Link>
            <h1 className="text-2xl font-bold text-blue-600">단어 컬렉션</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4">엄선된 단어 모음집</h2>
          <p className="text-blue-100 text-lg mb-6">
            주제와 난이도별로 구성된 단어 컬렉션으로 효과적으로 학습하세요.
            각 컬렉션은 특정 목표를 달성하도록 설계되었습니다.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <div className="text-2xl font-bold">{collections.length}</div>
              <div className="text-sm text-blue-100">컬렉션</div>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <div className="text-2xl font-bold">
                {collections.reduce((sum, c) => sum + c.wordCount, 0)}
              </div>
              <div className="text-sm text-blue-100">총 단어</div>
            </div>
            {user && (
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <div className="text-2xl font-bold">
                  {collections.reduce((sum, c) => sum + c.masteredCount, 0)}
                </div>
                <div className="text-sm text-blue-100">마스터한 단어</div>
              </div>
            )}
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="block bg-white rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden group"
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${difficultyColors[collection.difficulty]} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-5xl">{collection.icon}</div>
                  <div className="bg-white/30 px-3 py-1 rounded-full text-sm font-semibold">
                    {difficultyLabels[collection.difficulty]}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:scale-105 transition">
                  {collection.name}
                </h3>
                <p className="text-white/90 text-sm">{collection.description}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Stats */}
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {collection.wordCount}
                    </div>
                    <div className="text-xs text-gray-600">단어 수</div>
                  </div>
                  {user && (
                    <>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-600">
                          {collection.masteredCount}
                        </div>
                        <div className="text-xs text-gray-600">마스터</div>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-purple-600">
                          {collection.progressPercentage}%
                        </div>
                        <div className="text-xs text-gray-600">진행률</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {user && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">학습 진행 상황</span>
                      <span className="font-semibold">
                        {collection.masteredCount} / {collection.wordCount}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${difficultyColors[collection.difficulty]} rounded-full h-2 transition-all duration-500`}
                        style={{ width: `${collection.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {!user && (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">
                      로그인하여 학습 진행 상황을 확인하세요
                    </p>
                    <Link
                      href="/auth/login"
                      className="text-blue-600 font-semibold hover:text-blue-700"
                    >
                      <span className="inline-flex items-center gap-1">로그인 <ArrowRight className="w-3.5 h-3.5" /></span>
                    </Link>
                  </div>
                )}

                {/* CTA Button */}
                <div className="mt-4">
                  <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-center font-semibold group-hover:bg-blue-600 group-hover:text-white transition inline-flex items-center justify-center gap-1">
                    컬렉션 보기 <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-white rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">컬렉션 학습 방법</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📚</span>
              </div>
              <h4 className="font-bold mb-2">1. 컬렉션 선택</h4>
              <p className="text-gray-600 text-sm">
                목표와 수준에 맞는 컬렉션을 선택하세요
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✍️</span>
              </div>
              <h4 className="font-bold mb-2">2. 체계적 학습</h4>
              <p className="text-gray-600 text-sm">
                플래시카드와 퀴즈로 단어를 마스터하세요
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h4 className="font-bold mb-2">3. 목표 달성</h4>
              <p className="text-gray-600 text-sm">
                컬렉션을 완성하고 다음 단계로 이동하세요
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!user && (
          <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">지금 바로 시작하세요!</h3>
            <p className="text-white/90 mb-6">
              무료 회원가입하고 모든 컬렉션에 접근하세요
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              무료로 시작하기
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
