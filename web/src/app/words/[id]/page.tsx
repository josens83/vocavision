'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { wordsAPI, progressAPI } from '@/lib/api';
import CommunityMnemonics from '@/components/learning/CommunityMnemonics';

// Benchmarking: Enhanced word detail page with community mnemonics
// Phase 2-3: Memrise-style community engagement

interface Word {
  id: string;
  word: string;
  definition: string;
  pronunciation?: string;
  phonetic?: string;
  partOfSpeech: string;
  difficulty: string;
  examples?: any[];
  images?: any[];
  videos?: any[];
  rhymes?: any[];
  mnemonics?: any[];
  etymology?: any;
  synonyms?: any[];
  antonyms?: any[];
}

export default function WordDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'examples' | 'mnemonics' | 'etymology'>('overview');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadWord();
  }, [user, params.id]);

  const loadWord = async () => {
    try {
      const data = await wordsAPI.getWordById(params.id);
      setWord(data.word);
    } catch (error) {
      console.error('Failed to load word:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLearning = async () => {
    if (!word) return;

    try {
      await progressAPI.submitReview({
        wordId: word.id,
        rating: 1, // Start as "new"
        learningMethod: 'FLASHCARD',
      });

      alert('단어가 학습 목록에 추가되었습니다!');
    } catch (error) {
      console.error('Failed to add word:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl mb-4">단어를 찾을 수 없습니다</div>
          <Link href="/words" className="text-blue-600 hover:underline">
            단어 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-4">
            <Link href="/words" className="text-gray-600 hover:text-gray-900">
              ← 뒤로
            </Link>
            <h1 className="text-2xl font-bold text-blue-600">단어 상세</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Word Header */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-3">{word.word}</h2>
              {word.pronunciation && (
                <p className="text-2xl text-gray-500 mb-2">{word.pronunciation}</p>
              )}
              <div className="flex gap-3 items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${difficultyColors[word.difficulty as keyof typeof difficultyColors]}`}>
                  {difficultyLabels[word.difficulty as keyof typeof difficultyLabels]}
                </span>
                <span className="text-gray-600">{word.partOfSpeech}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`p-3 rounded-lg transition ${
                  bookmarked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {bookmarked ? '⭐' : '☆'}
              </button>
              <button
                onClick={handleAddToLearning}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                학습 목록에 추가
              </button>
            </div>
          </div>

          <div className="text-2xl text-gray-800 mb-6">
            {word.definition}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              label="개요"
            />
            {word.examples && word.examples.length > 0 && (
              <TabButton
                active={activeTab === 'examples'}
                onClick={() => setActiveTab('examples')}
                label={`예문 (${word.examples.length})`}
              />
            )}
            {word.mnemonics && word.mnemonics.length > 0 && (
              <TabButton
                active={activeTab === 'mnemonics'}
                onClick={() => setActiveTab('mnemonics')}
                label={`연상법 (${word.mnemonics.length})`}
              />
            )}
            {word.etymology && (
              <TabButton
                active={activeTab === 'etymology'}
                onClick={() => setActiveTab('etymology')}
                label="어원"
              />
            )}
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Images */}
                {word.images && word.images.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4">📸 이미지 학습</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {word.images.map((img: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded-lg overflow-hidden">
                          <img src={img.imageUrl} alt={word.word} className="w-full h-64 object-cover" />
                          {img.description && (
                            <p className="p-4 text-sm text-gray-600">{img.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rhymes */}
                {word.rhymes && word.rhymes.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4">🎵 라이밍</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {word.rhymes.map((rhyme: any, i: number) => (
                        <div key={i} className="bg-purple-50 p-4 rounded-lg">
                          <div className="font-semibold text-purple-900">{rhyme.rhymingWord}</div>
                          {rhyme.example && (
                            <div className="text-sm text-purple-700 mt-1">{rhyme.example}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synonyms & Antonyms */}
                <div className="grid md:grid-cols-2 gap-6">
                  {word.synonyms && word.synonyms.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">동의어</h3>
                      <div className="space-y-2">
                        {word.synonyms.map((syn: any, i: number) => (
                          <div key={i} className="bg-green-50 p-3 rounded-lg">
                            <div className="font-semibold text-green-900">{syn.synonym}</div>
                            {syn.nuance && (
                              <div className="text-sm text-green-700">{syn.nuance}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {word.antonyms && word.antonyms.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">반의어</h3>
                      <div className="space-y-2">
                        {word.antonyms.map((ant: any, i: number) => (
                          <div key={i} className="bg-red-50 p-3 rounded-lg">
                            <div className="font-semibold text-red-900">{ant.antonym}</div>
                            {ant.explanation && (
                              <div className="text-sm text-red-700">{ant.explanation}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'examples' && word.examples && (
              <div className="space-y-4">
                {word.examples.map((example: any, i: number) => (
                  <div key={i} className="bg-gray-50 p-6 rounded-xl">
                    <p className="text-lg italic text-gray-800 mb-2">"{example.sentence}"</p>
                    {example.translation && (
                      <p className="text-gray-600">{example.translation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'mnemonics' && (
              <div className="space-y-6">
                {/* Official Mnemonics */}
                {word.mnemonics && word.mnemonics.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">📘 공식 암기법</h3>
                    {word.mnemonics.map((mnemonic: any, i: number) => (
                      <div key={i} className="border-l-4 border-yellow-400 bg-yellow-50 p-6 rounded-r-xl">
                        <h4 className="text-xl font-bold mb-3">{mnemonic.title}</h4>
                        <p className="text-lg text-gray-800 mb-4 whitespace-pre-wrap">{mnemonic.content}</p>
                        {mnemonic.koreanHint && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-blue-900">💡 {mnemonic.koreanHint}</p>
                          </div>
                        )}
                        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                          <span>⭐ {mnemonic.rating.toFixed(1)} ({mnemonic.ratingCount}명 평가)</span>
                          <span className="capitalize">{mnemonic.source.replace('_', ' ').toLowerCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Community Mnemonics - Phase 2-3 */}
                <div className="mt-8">
                  <CommunityMnemonics wordId={word.id} wordText={word.word} />
                </div>
              </div>
            )}

            {activeTab === 'etymology' && word.etymology && (
              <div className="space-y-6">
                <div className="bg-indigo-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-indigo-900 mb-2">기원</h4>
                  <p className="text-lg text-indigo-800">{word.etymology.origin}</p>
                </div>

                {word.etymology.rootWords && word.etymology.rootWords.length > 0 && (
                  <div className="bg-purple-50 p-6 rounded-xl">
                    <h4 className="font-semibold text-purple-900 mb-3">어근</h4>
                    <ul className="space-y-2">
                      {word.etymology.rootWords.map((root: string, i: number) => (
                        <li key={i} className="text-purple-800">• {root}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {word.etymology.evolution && (
                  <div className="bg-blue-50 p-6 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-2">발전 과정</h4>
                    <p className="text-blue-800">{word.etymology.evolution}</p>
                  </div>
                )}

                {word.etymology.relatedWords && word.etymology.relatedWords.length > 0 && (
                  <div className="bg-green-50 p-6 rounded-xl">
                    <h4 className="font-semibold text-green-900 mb-3">관련 단어</h4>
                    <div className="flex flex-wrap gap-2">
                      {word.etymology.relatedWords.map((related: string, i: number) => (
                        <span key={i} className="bg-green-200 text-green-900 px-3 py-1 rounded-full text-sm font-medium">
                          {related}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 px-6 font-medium transition ${
        active
          ? 'bg-white border-b-2 border-blue-600 text-blue-600'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}
