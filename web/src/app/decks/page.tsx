'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { decksAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { SkeletonDeckCard } from '@/components/ui/Skeleton';

// Benchmarking: Anki-style custom deck system
// Phase 2-1: 커스텀 덱 시스템 - 사용자 정의 덱 생성 및 관리

interface Deck {
  id: string;
  name: string;
  description?: string;
  userId: string;
  userName?: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

export default function DecksPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const toast = useToast();
  const confirm = useConfirm();

  const [myDecks, setMyDecks] = useState<Deck[]>([]);
  const [publicDecks, setPublicDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadDecks();
  }, [user]);

  const loadDecks = async () => {
    setLoading(true);
    try {
      // Load user's own decks
      const myDecksData = await decksAPI.getDecks({ isPublic: false });
      setMyDecks(myDecksData.decks || []);

      // Load public/community decks
      const publicDecksData = await decksAPI.getPublicDecks({ limit: 20 });
      setPublicDecks(publicDecksData.decks || []);
    } catch (error) {
      console.error('Failed to load decks:', error);
      // Mock data for development
      setMyDecks([
        {
          id: '1',
          name: 'TOEFL 필수 단어',
          description: 'TOEFL 시험 대비 필수 어휘 500개',
          userId: user?.id || '',
          isPublic: false,
          tags: ['TOEFL', '시험', '고급'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: 500,
        },
        {
          id: '2',
          name: '비즈니스 영어',
          description: '업무에 필요한 비즈니스 영어 표현',
          userId: user?.id || '',
          isPublic: true,
          tags: ['비즈니스', '중급'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: 200,
        },
      ]);

      setPublicDecks([
        {
          id: '3',
          name: 'GRE Vocabulary',
          description: 'GRE 시험 고득점을 위한 어휘',
          userId: 'other-user',
          userName: '영어마스터',
          isPublic: true,
          tags: ['GRE', '시험', '전문가'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: 1000,
        },
        {
          id: '4',
          name: '일상 회화 표현',
          description: '매일 사용하는 영어 회화 표현 모음',
          userId: 'other-user-2',
          userName: '회화킹',
          isPublic: true,
          tags: ['회화', '초급'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: 150,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneDeck = async (deckId: string) => {
    try {
      await decksAPI.cloneDeck(deckId);
      loadDecks(); // Reload to show cloned deck
      toast.success('덱 복사 완료', '덱이 내 덱 목록에 추가되었습니다!');
    } catch (error) {
      console.error('Failed to clone deck:', error);
      toast.error('덱 복사 실패', '다시 시도해주세요');
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    const confirmed = await confirm({
      title: '덱 삭제',
      message: '정말 이 덱을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await decksAPI.deleteDeck(deckId);
      toast.success('덱 삭제 완료', '덱이 삭제되었습니다');
      loadDecks();
    } catch (error) {
      console.error('Failed to delete deck:', error);
      toast.error('덱 삭제 실패', '다시 시도해주세요');
    }
  };

  const filteredDecks = (decks: Deck[]) => {
    if (!search) return decks;
    const searchLower = search.toLowerCase();
    return decks.filter(
      (deck) =>
        deck.name.toLowerCase().includes(searchLower) ||
        deck.description?.toLowerCase().includes(searchLower) ||
        deck.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">VocaVision</h1>
            <nav className="flex gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                대시보드
              </Link>
              <Link href="/learn" className="text-gray-600 hover:text-gray-900">
                학습
              </Link>
              <Link href="/decks" className="text-indigo-600 font-semibold">
                덱
              </Link>
              <Link href="/words" className="text-gray-600 hover:text-gray-900">
                단어 탐색
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">나만의 학습 덱</h2>
              <p className="text-gray-600">Anki 스타일 커스텀 덱으로 효율적인 학습</p>
            </div>
            <Link
              href="/decks/create"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
            >
              + 새 덱 만들기
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="덱 검색 (이름, 설명, 태그)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-3 font-semibold transition relative ${
              activeTab === 'my'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            내 덱 ({myDecks.length})
            {activeTab === 'my' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`px-6 py-3 font-semibold transition relative ${
              activeTab === 'public'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            커뮤니티 덱 ({publicDecks.length})
            {activeTab === 'public' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonDeckCard key={i} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* My Decks */}
            {activeTab === 'my' && (
              <motion.div
                key="my-decks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredDecks(myDecks).length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-gray-600 text-lg mb-4">
                      {search ? '검색 결과가 없습니다.' : '아직 생성한 덱이 없습니다.'}
                    </p>
                    {!search && (
                      <Link
                        href="/decks/create"
                        className="inline-block bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition"
                      >
                        첫 덱 만들기
                      </Link>
                    )}
                  </div>
                ) : (
                  filteredDecks(myDecks).map((deck) => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      onDelete={() => handleDeleteDeck(deck.id)}
                      isMine={true}
                    />
                  ))
                )}
              </motion.div>
            )}

            {/* Public/Community Decks */}
            {activeTab === 'public' && (
              <motion.div
                key="public-decks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredDecks(publicDecks).length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <div className="text-6xl mb-4">🌍</div>
                    <p className="text-gray-600 text-lg">
                      {search ? '검색 결과가 없습니다.' : '공개된 덱이 없습니다.'}
                    </p>
                  </div>
                ) : (
                  filteredDecks(publicDecks).map((deck) => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      onClone={() => handleCloneDeck(deck.id)}
                      isMine={false}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

// Deck Card Component
function DeckCard({
  deck,
  onDelete,
  onClone,
  isMine,
}: {
  deck: Deck;
  onDelete?: () => void;
  onClone?: () => void;
  isMine: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, shadow: '0 10px 30px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition"
    >
      <Link href={`/decks/${deck.id}`}>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{deck.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {deck.description || '설명이 없습니다.'}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="text-2xl font-bold text-indigo-600">{deck.wordCount}</div>
          <div className="text-sm text-gray-500">단어</div>
        </div>

        {/* Tags */}
        {deck.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {deck.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Author (for public decks) */}
        {!isMine && deck.userName && (
          <p className="text-xs text-gray-500 mb-3">by {deck.userName}</p>
        )}
      </Link>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <Link
          href={`/decks/${deck.id}/study`}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-center py-2 rounded-lg font-semibold hover:shadow-md transition"
        >
          학습 시작
        </Link>

        {isMine ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete?.();
            }}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
          >
            🗑️
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              onClone?.();
            }}
            className="px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
            title="내 덱으로 복사"
          >
            📥
          </button>
        )}
      </div>

      {/* Public Badge */}
      {deck.isPublic && isMine && (
        <div className="absolute top-4 right-4">
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            공개
          </span>
        </div>
      )}
    </motion.div>
  );
}
