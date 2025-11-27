'use client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { decksAPI, wordsAPI } from '@/lib/api';

// Benchmarking: Anki-style deck management
// Phase 2-1: 덱 상세 및 단어 관리 페이지

interface Word {
  id: string;
  word: string;
  definition: string;
  pronunciation?: string;
  difficulty: string;
  partOfSpeech: string;
}

interface Deck {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

export default function DeckDetailPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;
  const user = useAuthStore((state) => state.user);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddWord, setShowAddWord] = useState(false);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editIsPublic, setEditIsPublic] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadDeck();
  }, [user, deckId]);

  const loadDeck = async () => {
    setLoading(true);
    try {
      const deckData = await decksAPI.getDeckById(deckId);
      setDeck(deckData);
      setEditName(deckData.name);
      setEditDescription(deckData.description || '');
      setEditTags(deckData.tags || []);
      setEditIsPublic(deckData.isPublic);

      const wordsData = await decksAPI.getDeckWords(deckId);
      setWords(wordsData.words || []);
    } catch (error) {
      console.error('Failed to load deck:', error);
      // Mock data for development
      const mockDeck: Deck = {
        id: deckId,
        name: 'TOEFL 필수 단어',
        description: 'TOEFL 시험 대비 필수 어휘 500개',
        userId: user?.id || '',
        isPublic: false,
        tags: ['TOEFL', '시험', '고급'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: 2,
      };
      setDeck(mockDeck);
      setEditName(mockDeck.name);
      setEditDescription(mockDeck.description || '');
      setEditTags(mockDeck.tags);
      setEditIsPublic(mockDeck.isPublic);

      const mockWords: Word[] = [
        {
          id: '1',
          word: 'ephemeral',
          definition: '일시적인, 덧없는',
          pronunciation: 'ɪˈfem(ə)rəl',
          difficulty: 'ADVANCED',
          partOfSpeech: 'adjective',
        },
        {
          id: '2',
          word: 'ubiquitous',
          definition: '어디에나 있는, 편재하는',
          pronunciation: 'juːˈbɪkwɪtəs',
          difficulty: 'ADVANCED',
          partOfSpeech: 'adjective',
        },
      ];
      setWords(mockWords);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableWords = async () => {
    try {
      const data = await wordsAPI.getWords({ limit: 50 });
      // Filter out words already in deck
      const wordIds = new Set(words.map((w) => w.id));
      setAvailableWords((data.words || []).filter((w: Word) => !wordIds.has(w.id)));
    } catch (error) {
      console.error('Failed to load words:', error);
      // Mock data
      setAvailableWords([
        {
          id: '3',
          word: 'ameliorate',
          definition: '개선하다',
          difficulty: 'ADVANCED',
          partOfSpeech: 'verb',
        },
        {
          id: '4',
          word: 'clandestine',
          definition: '비밀의, 은밀한',
          difficulty: 'EXPERT',
          partOfSpeech: 'adjective',
        },
      ]);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      alert('덱 이름을 입력해주세요.');
      return;
    }

    try {
      await decksAPI.updateDeck(deckId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        tags: editTags,
        isPublic: editIsPublic,
      });

      setIsEditing(false);
      loadDeck();
    } catch (error) {
      console.error('Failed to update deck:', error);
      alert('덱 업데이트에 실패했습니다.');
    }
  };

  const handleAddWord = async (wordId: string) => {
    try {
      await decksAPI.addWordToDeck(deckId, wordId);
      loadDeck();
      setShowAddWord(false);
    } catch (error) {
      console.error('Failed to add word:', error);
      alert('단어 추가에 실패했습니다.');
    }
  };

  const handleRemoveWord = async (wordId: string) => {
    if (!confirm('이 단어를 덱에서 제거하시겠습니까?')) return;

    try {
      await decksAPI.removeWordFromDeck(deckId, wordId);
      loadDeck();
    } catch (error) {
      console.error('Failed to remove word:', error);
      alert('단어 제거에 실패했습니다.');
    }
  };

  const filteredAvailableWords = availableWords.filter((word) =>
    searchQuery
      ? word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-700',
    INTERMEDIATE: 'bg-blue-100 text-blue-700',
    ADVANCED: 'bg-orange-100 text-orange-700',
    EXPERT: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600 text-lg">덱 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-600 text-lg mb-4">덱을 찾을 수 없습니다.</p>
          <Link href="/decks" className="text-indigo-600 hover:underline">
            덱 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

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
              <Link href="/decks" className="text-indigo-600 font-semibold">
                덱
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Link href="/decks" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6">
          ← 덱 목록으로 돌아가기
        </Link>

        {/* Deck Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          {!isEditing ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-3xl font-bold text-gray-900">{deck.name}</h2>
                    {deck.isPublic && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        공개
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{deck.description || '설명이 없습니다.'}</p>

                  {/* Tags */}
                  {deck.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {deck.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-6 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold text-2xl text-indigo-600">{words.length}</span> 단어
                    </div>
                    <div>생성일: {new Date(deck.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    ✏️ 편집
                  </button>
                  <Link
                    href={`/decks/${deckId}/study`}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
                  >
                    🎯 학습 시작
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">덱 이름</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700">공개 덱</label>
                  <button
                    onClick={() => setEditIsPublic(!editIsPublic)}
                    className={`relative w-12 h-6 rounded-full transition ${
                      editIsPublic ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      animate={{ x: editIsPublic ? 24 : 0 }}
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                    />
                  </button>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                  >
                    저장
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Words Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">단어 목록</h3>
            <button
              onClick={() => {
                setShowAddWord(true);
                loadAvailableWords();
              }}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-semibold"
            >
              + 단어 추가
            </button>
          </div>

          {/* Word List */}
          {words.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-gray-600 text-lg mb-4">아직 단어가 없습니다.</p>
              <button
                onClick={() => {
                  setShowAddWord(true);
                  loadAvailableWords();
                }}
                className="inline-block bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition"
              >
                첫 단어 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {words.map((word) => (
                <motion.div
                  key={word.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                >
                  <Link href={`/words/${word.id}`} className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900">{word.word}</h4>
                        <p className="text-sm text-gray-600">{word.definition}</p>
                        {word.pronunciation && (
                          <p className="text-xs text-gray-500 mt-1">/{word.pronunciation}/</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          difficultyColors[word.difficulty as keyof typeof difficultyColors]
                        }`}
                      >
                        {word.difficulty}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveWord(word.id)}
                    className="ml-4 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                  >
                    제거
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Word Modal */}
      <AnimatePresence>
        {showAddWord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddWord(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">단어 추가</h3>

              {/* Search */}
              <input
                type="text"
                placeholder="단어 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              />

              {/* Available Words */}
              <div className="space-y-2 mb-6">
                {filteredAvailableWords.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{word.word}</h4>
                      <p className="text-sm text-gray-600">{word.definition}</p>
                    </div>
                    <button
                      onClick={() => handleAddWord(word.id)}
                      className="ml-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm font-semibold"
                    >
                      추가
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAddWord(false)}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
