'use client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { wordsAPI, progressAPI } from '@/lib/api';
import CommunityMnemonics from '@/components/learning/CommunityMnemonics';

// Benchmarking: Enhanced word detail page with community mnemonics
// Phase 2-3: Memrise-style community engagement

interface WordVisual {
  type: 'CONCEPT' | 'MNEMONIC' | 'RHYME';
  imageUrl?: string | null;
  captionEn?: string;
  captionKo?: string;
  labelKo?: string;
}

interface Word {
  id: string;
  word: string;
  definition: string;
  definitionKo?: string;
  pronunciation?: string;
  phonetic?: string;
  ipaUs?: string;
  ipaUk?: string;
  partOfSpeech: string;
  difficulty: string;
  level?: string;
  examCategory?: string;
  // Morphology
  prefix?: string;
  root?: string;
  suffix?: string;
  morphologyNote?: string;
  // Related words
  synonymList?: string[];
  antonymList?: string[];
  rhymingWords?: string[];
  relatedWords?: string[];
  // Related data
  examples?: any[];
  images?: any[];
  videos?: any[];
  rhymes?: any[];
  mnemonics?: any[];
  etymology?: any;
  synonyms?: any[];
  antonyms?: any[];
  collocations?: any[];
  // New visuals system
  visuals?: WordVisual[];
}

export default function WordDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'examples' | 'mnemonics' | 'etymology'>('overview');

  useEffect(() => {
    // Allow guest access - no login required for viewing words
    loadWord();
  }, [params.id]);

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
              <Link
                href={`/words/${word.id}/learn`}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold flex items-center gap-2"
              >
                🎓 Interactive Learning
              </Link>
              <button
                onClick={handleAddToLearning}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                학습 목록에 추가
              </button>
            </div>
          </div>

          <div className="text-2xl text-gray-800 mb-4">
            {word.definition}
          </div>
          {word.definitionKo && (
            <div className="text-lg text-gray-600 mb-6">
              {word.definitionKo}
            </div>
          )}

          {/* Pronunciation Section */}
          {(word.ipaUs || word.ipaUk) && (
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">📢 발음</h3>
              <div className="flex gap-6">
                {word.ipaUs && (
                  <div>
                    <span className="text-xs text-blue-600">🇺🇸 US</span>
                    <p className="text-lg font-mono text-blue-900">{word.ipaUs}</p>
                  </div>
                )}
                {word.ipaUk && (
                  <div>
                    <span className="text-xs text-blue-600">🇬🇧 UK</span>
                    <p className="text-lg font-mono text-blue-900">{word.ipaUk}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Morphology Section */}
          {(word.prefix || word.root || word.suffix) && (
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-purple-800 mb-3">🔍 형태 분석</h3>
              <div className="flex flex-wrap gap-2 items-center">
                {word.prefix && (
                  <span className="bg-purple-200 text-purple-900 px-3 py-1 rounded-lg text-sm font-medium">
                    {word.prefix}- <span className="text-purple-600 text-xs">(접두사)</span>
                  </span>
                )}
                {word.root && (
                  <span className="bg-purple-300 text-purple-900 px-3 py-1 rounded-lg text-sm font-bold">
                    {word.root} <span className="text-purple-600 text-xs">(어근)</span>
                  </span>
                )}
                {word.suffix && (
                  <span className="bg-purple-200 text-purple-900 px-3 py-1 rounded-lg text-sm font-medium">
                    -{word.suffix} <span className="text-purple-600 text-xs">(접미사)</span>
                  </span>
                )}
              </div>
              {word.morphologyNote && (
                <p className="text-sm text-purple-700 mt-3">{word.morphologyNote}</p>
              )}
            </div>
          )}
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
                {/* Visuals (3-이미지 시각화) */}
                {word.visuals && word.visuals.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4">🎨 시각화 학습</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {word.visuals.map((visual, i) => (
                        visual.imageUrl && (
                          <div key={i} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                            <div className="relative">
                              <img
                                src={visual.imageUrl}
                                alt={`${word.word} - ${visual.type}`}
                                className="w-full h-48 object-cover"
                              />
                              <span className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold ${
                                visual.type === 'CONCEPT' ? 'bg-blue-500 text-white' :
                                visual.type === 'MNEMONIC' ? 'bg-purple-500 text-white' :
                                'bg-pink-500 text-white'
                              }`}>
                                {visual.type === 'CONCEPT' ? '💡 개념' :
                                 visual.type === 'MNEMONIC' ? '🧠 연상' : '🎵 라임'}
                              </span>
                            </div>
                            <div className="p-3">
                              {visual.labelKo && (
                                <p className="font-semibold text-gray-900 mb-1">{visual.labelKo}</p>
                              )}
                              {visual.captionKo && (
                                <p className="text-sm text-gray-600">{visual.captionKo}</p>
                              )}
                              {visual.captionEn && !visual.captionKo && (
                                <p className="text-sm text-gray-600">{visual.captionEn}</p>
                              )}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy Images */}
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

                {/* Collocations */}
                {word.collocations && word.collocations.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4">🔗 연어 (Collocations)</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {word.collocations.map((col: any, i: number) => (
                        <div key={i} className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                          <div className="font-semibold text-amber-900 mb-1">{col.collocation}</div>
                          {col.example && (
                            <p className="text-sm text-amber-700 italic">"{col.example}"</p>
                          )}
                          {col.translation && (
                            <p className="text-xs text-amber-600 mt-1">{col.translation}</p>
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

                {/* Related Word Lists */}
                {(word.synonymList?.length || word.antonymList?.length || word.rhymingWords?.length || word.relatedWords?.length) && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4">📚 관련 단어</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {word.synonymList && word.synonymList.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">유의어</h4>
                          <div className="flex flex-wrap gap-2">
                            {word.synonymList.map((s: string, i: number) => (
                              <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {word.antonymList && word.antonymList.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">반의어</h4>
                          <div className="flex flex-wrap gap-2">
                            {word.antonymList.map((a: string, i: number) => (
                              <span key={i} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">{a}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {word.rhymingWords && word.rhymingWords.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">라이밍</h4>
                          <div className="flex flex-wrap gap-2">
                            {word.rhymingWords.map((r: string, i: number) => (
                              <span key={i} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">{r}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {word.relatedWords && word.relatedWords.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">관련어</h4>
                          <div className="flex flex-wrap gap-2">
                            {word.relatedWords.map((r: string, i: number) => (
                              <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{r}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
