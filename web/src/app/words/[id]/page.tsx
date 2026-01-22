'use client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { wordsAPI, progressAPI, pronunciationAPI } from '@/lib/api';
import { LEVEL_INFO } from '@/constants/stats';

// Types
interface WordVisual {
  type: 'CONCEPT' | 'MNEMONIC' | 'RHYME';
  imageUrl?: string | null;
  captionEn?: string;
  captionKo?: string;
  labelKo?: string;
}

interface ExamLevel {
  examCategory: string;
  level: string | null;
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
  examLevels?: ExamLevel[];  // 시험/레벨 매핑
  prefix?: string;
  root?: string;
  suffix?: string;
  morphologyNote?: string;
  synonymList?: string[];
  antonymList?: string[];
  rhymingWords?: string[];
  relatedWords?: string[];
  examples?: Array<{
    id: string;
    sentence: string;
    translation?: string;
    isFunny?: boolean;
  }>;
  images?: Array<{ imageUrl: string; description?: string }>;
  rhymes?: Array<{ rhymingWord: string; example?: string }>;
  mnemonics?: Array<{
    id: string;
    title?: string;
    content: string;
    koreanHint?: string;
    rating?: number;
    ratingCount?: number;
    source?: string;
  }>;
  etymology?: {
    origin?: string;
    rootWords?: string[];
    evolution?: string;
    relatedWords?: string[];
  };
  collocations?: Array<{
    collocation: string;
    example?: string;
    translation?: string;
  }>;
  visuals?: WordVisual[];
  // Extended content fields
  mnemonic?: string;
  mnemonicKorean?: string;
}

// Icons
const Icons = {
  Speaker: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  ),
  Star: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  StarFilled: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Book: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Play: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Level badge styles
const levelStyles: Record<string, { bg: string; text: string; label: string }> = {
  L1: { bg: 'bg-green-100', text: 'text-green-700', label: '기초' },
  L2: { bg: 'bg-blue-100', text: 'text-blue-700', label: '중급' },
  L3: { bg: 'bg-purple-100', text: 'text-purple-700', label: '고급' },
  BEGINNER: { bg: 'bg-green-100', text: 'text-green-700', label: '기초' },
  INTERMEDIATE: { bg: 'bg-blue-100', text: 'text-blue-700', label: '중급' },
  ADVANCED: { bg: 'bg-purple-100', text: 'text-purple-700', label: '고급' },
  EXPERT: { bg: 'bg-red-100', text: 'text-red-700', label: '전문가' },
};

// Exam category colors and labels
const examStyles: Record<string, { bg: string; text: string; label: string }> = {
  CSAT: { bg: 'bg-teal-100', text: 'text-teal-700', label: '수능' },
  CSAT_BASIC: { bg: 'bg-rose-100', text: 'text-rose-700', label: '기초수능' },
  EBS: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'EBS' },
  TEPS: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'TEPS' },
  TOEIC: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'TOEIC' },
  TOEFL: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'TOEFL' },
  SAT: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'SAT' },
};

// Format exam level label
const getExamLevelLabel = (examCategory: string, level: string | null): string => {
  const examLabel = examStyles[examCategory]?.label || examCategory;
  if (!level) return examLabel;
  return `${examLabel}-${level}`;
};

export default function WordDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; caption?: string } | null>(null);

  useEffect(() => {
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

  const handlePlayPronunciation = useCallback(async () => {
    if (!word || playingAudio) return;
    setPlayingAudio(true);
    try {
      await pronunciationAPI.playPronunciation(word.word);
    } catch (error) {
      console.error('Failed to play pronunciation:', error);
    } finally {
      setTimeout(() => setPlayingAudio(false), 1000);
    }
  }, [word, playingAudio]);

  const handleAddToLearning = async () => {
    if (!word) return;
    try {
      await progressAPI.submitReview({
        wordId: word.id,
        rating: 1,
        learningMethod: 'FLASHCARD',
      });
      alert('단어가 학습 목록에 추가되었습니다!');
    } catch (error) {
      console.error('Failed to add word:', error);
    }
  };

  // Get visual by type
  const getVisual = (type: 'CONCEPT' | 'MNEMONIC' | 'RHYME'): WordVisual | undefined => {
    return word?.visuals?.find(v => v.type === type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">단어 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">단어를 찾을 수 없습니다</h2>
          <p className="text-slate-600 mb-6">요청하신 단어가 존재하지 않습니다.</p>
          <Link href="/words" className="btn btn-primary">
            단어 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const level = word.level || word.difficulty;
  const levelStyle = levelStyles[level] || levelStyles.L1;
  const conceptVisual = getVisual('CONCEPT');
  const mnemonicVisual = getVisual('MNEMONIC');
  const rhymeVisual = getVisual('RHYME');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <Icons.ArrowLeft />
              <span className="hidden sm:inline">뒤로</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`p-2 rounded-lg transition-all ${bookmarked ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              >
                {bookmarked ? <Icons.StarFilled /> : <Icons.Star />}
              </button>
              <button onClick={handleAddToLearning} className="btn btn-primary text-sm">
                <Icons.Plus />
                <span className="hidden sm:inline">학습 추가</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ========== 섹션 1: 단어 & 이미지 ========== */}
        <section className="card overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Word Info */}
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Exam Level badges - 시험/레벨 표시 */}
                {word.examLevels && word.examLevels.length > 0 ? (
                  word.examLevels.map((el, idx) => {
                    const style = examStyles[el.examCategory] || examStyles.CSAT;
                    return (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}
                      >
                        {getExamLevelLabel(el.examCategory, el.level)}
                      </span>
                    );
                  })
                ) : (
                  // Fallback: 기존 level/difficulty 표시
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${levelStyle.bg} ${levelStyle.text}`}>
                    {word.examCategory ? `${examStyles[word.examCategory]?.label || word.examCategory}${word.level ? `-${word.level}` : ''}` : levelStyle.label}
                  </span>
                )}
                {word.partOfSpeech && (
                  <span className="text-sm text-slate-500">{word.partOfSpeech}</span>
                )}
              </div>

              <h1 className="text-4xl sm:text-5xl font-display font-bold text-slate-900 mb-3">
                {word.word}
              </h1>

              {word.pronunciation && (
                <p className="text-xl text-slate-500 mb-4">{word.pronunciation}</p>
              )}

              <p className="text-lg text-slate-700 mb-2">{word.definition}</p>
              {word.definitionKo && (
                <p className="text-lg text-slate-600">{word.definitionKo}</p>
              )}

              {/* TODO: 인터랙티브 학습 기능 완성 후 활성화
              <Link
                href={`/words/${word.id}/learn`}
                className="mt-6 inline-flex items-center gap-2 text-brand-primary font-medium hover:underline"
              >
                <Icons.Play />
                인터랙티브 학습 시작
              </Link>
              */}
            </div>

            {/* Concept Image */}
            <div className="relative h-64 md:h-auto bg-gradient-to-br from-blue-50 to-blue-100">
              {conceptVisual?.imageUrl ? (
                <div
                  className="relative h-full cursor-pointer"
                  onClick={() => setFullscreenImage({ url: conceptVisual.imageUrl!, caption: conceptVisual.captionKo })}
                >
                  <img
                    src={conceptVisual.imageUrl}
                    alt={`${word.word} concept`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded mb-2">
                      💡 개념
                    </span>
                    {conceptVisual.captionKo && (
                      <p className="text-white text-sm">{conceptVisual.captionKo}</p>
                    )}
                  </div>
                  {/* Tap to expand hint on mobile */}
                  <div className="absolute top-3 right-3 md:hidden">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      탭하여 확대
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <Icons.Book />
                    <p className="mt-2 text-sm">이미지 준비 중</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========== 섹션 2: 이미지 2개 (연상, 라이밍) ========== */}
        {(mnemonicVisual?.imageUrl || rhymeVisual?.imageUrl) && (
          <section className="grid sm:grid-cols-2 gap-4">
            {mnemonicVisual?.imageUrl && (
              <div className="card overflow-hidden group">
                <div
                  className="relative aspect-[4/3] bg-slate-100 cursor-pointer"
                  onClick={() => setFullscreenImage({ url: mnemonicVisual.imageUrl!, caption: mnemonicVisual.captionKo })}
                >
                  <img
                    src={mnemonicVisual.imageUrl}
                    alt={`${word.word} mnemonic`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                      🧠 연상
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  {mnemonicVisual.captionEn && (
                    <p className="font-medium text-slate-900 mb-1">{mnemonicVisual.captionEn}</p>
                  )}
                  {mnemonicVisual.captionKo && (
                    <p className="text-sm text-slate-600">{mnemonicVisual.captionKo}</p>
                  )}
                </div>
              </div>
            )}

            {rhymeVisual?.imageUrl && (
              <div className="card overflow-hidden group">
                <div
                  className="relative aspect-[4/3] bg-slate-100 cursor-pointer"
                  onClick={() => setFullscreenImage({ url: rhymeVisual.imageUrl!, caption: rhymeVisual.captionKo })}
                >
                  <img
                    src={rhymeVisual.imageUrl}
                    alt={`${word.word} rhyme`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded">
                      🎵 라이밍
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  {rhymeVisual.captionEn && (
                    <p className="font-medium text-slate-900 mb-1">{rhymeVisual.captionEn}</p>
                  )}
                  {rhymeVisual.captionKo && (
                    <p className="text-sm text-slate-600">{rhymeVisual.captionKo}</p>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========== 섹션 3: 발음 ========== */}
        <section className="card p-6">
          <h2 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg">📢</span>
            발음
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            {word.ipaUs && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">🇺🇸 US</span>
                <span className="text-xl font-mono text-blue-800">{word.ipaUs}</span>
              </div>
            )}
            {word.ipaUk && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">🇬🇧 UK</span>
                <span className="text-xl font-mono text-blue-800">{word.ipaUk}</span>
              </div>
            )}
            <button
              onClick={handlePlayPronunciation}
              disabled={playingAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                playingAudio
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              <Icons.Speaker />
              <span>{playingAudio ? '재생 중...' : '발음 듣기'}</span>
            </button>
          </div>
        </section>

        {/* ========== 섹션 4: 어원 분석 ========== */}
        {(word.etymology || word.prefix || word.root || word.suffix) && (
          <section className="card p-6">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg">🔍</span>
              어원 분석
            </h2>

            {/* Morphology */}
            {(word.prefix || word.root || word.suffix) && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 items-center">
                  {word.prefix && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                      <span className="font-bold">{word.prefix}-</span>
                      <span className="text-purple-600 text-xs ml-1">(접두사)</span>
                    </span>
                  )}
                  {word.root && (
                    <span className="bg-purple-200 text-purple-900 px-3 py-1.5 rounded-lg text-sm font-bold">
                      {word.root}
                      <span className="text-purple-600 text-xs font-normal ml-1">(어근)</span>
                    </span>
                  )}
                  {word.suffix && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                      <span className="font-bold">-{word.suffix}</span>
                      <span className="text-purple-600 text-xs ml-1">(접미사)</span>
                    </span>
                  )}
                </div>
                {word.morphologyNote && (
                  <p className="text-sm text-purple-700 mt-3">{word.morphologyNote}</p>
                )}
              </div>
            )}

            {/* Etymology */}
            {word.etymology && (
              <div className="space-y-4">
                {word.etymology.origin && (
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-1">기원</h4>
                    <p className="text-indigo-800">{word.etymology.origin}</p>
                  </div>
                )}

                {word.etymology.rootWords && word.etymology.rootWords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {word.etymology.rootWords.map((root, i) => (
                      <span key={i} className="bg-purple-50 text-purple-800 px-3 py-1 rounded-full text-sm border border-purple-200">
                        {root}
                      </span>
                    ))}
                  </div>
                )}

                {word.etymology.evolution && (
                  <p className="text-slate-600 text-sm">{word.etymology.evolution}</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* ========== 섹션 5: 창의적 암기법 ========== */}
        {(word.mnemonic || word.mnemonicKorean || (word.mnemonics && word.mnemonics.length > 0)) && (
          <section className="card p-6">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center text-lg">💡</span>
              창의적 암기법
            </h2>

            <div className="space-y-4">
              {/* Main mnemonic from word data */}
              {(word.mnemonic || word.mnemonicKorean) && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 border-l-4 border-yellow-400">
                  {word.mnemonic && (
                    <p className="text-lg text-slate-800 mb-2">{word.mnemonic}</p>
                  )}
                  {word.mnemonicKorean && (
                    <p className="text-yellow-800 font-medium">💡 {word.mnemonicKorean}</p>
                  )}
                </div>
              )}

              {/* Community mnemonics */}
              {word.mnemonics && word.mnemonics.map((mnemonic, i) => (
                <div key={mnemonic.id || i} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  {mnemonic.title && (
                    <h4 className="font-semibold text-slate-900 mb-2">{mnemonic.title}</h4>
                  )}
                  <p className="text-slate-700 whitespace-pre-wrap">{mnemonic.content}</p>
                  {mnemonic.koreanHint && (
                    <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-800 text-sm">💡 {mnemonic.koreanHint}</p>
                    </div>
                  )}
                  {mnemonic.rating !== undefined && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                      <Icons.Star />
                      <span>{mnemonic.rating.toFixed(1)} ({mnemonic.ratingCount}명 평가)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========== 섹션 6: Rhyme ========== */}
        {((word.rhymingWords && word.rhymingWords.length > 0) || (word.rhymes && word.rhymes.length > 0)) && (
          <section className="card p-6">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center text-lg">🎵</span>
              라이밍 (Rhyme)
            </h2>

            {/* Rhyming word chips */}
            {word.rhymingWords && word.rhymingWords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {word.rhymingWords.map((rhyme, i) => (
                  <span key={i} className="bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-teal-200 transition-colors cursor-default">
                    {rhyme}
                  </span>
                ))}
              </div>
            )}

            {/* Rhyme examples */}
            {word.rhymes && word.rhymes.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {word.rhymes.map((rhyme, i) => (
                  <div key={i} className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                    <div className="font-semibold text-teal-800">{rhyme.rhymingWord}</div>
                    {rhyme.example && (
                      <p className="text-sm text-teal-600 mt-1">{rhyme.example}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ========== 섹션 7: Collocation ========== */}
        {word.collocations && word.collocations.length > 0 && (
          <section className="card p-6">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-lg">🔗</span>
              연어 (Collocation)
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              {word.collocations.map((col, i) => (
                <div key={i} className="bg-amber-50 p-4 rounded-lg border border-amber-200 hover:border-amber-300 transition-colors">
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
          </section>
        )}

        {/* ========== 섹션 8: 재미있는 예문 ========== */}
        {word.examples && word.examples.length > 0 && (
          <section className="card p-6">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-lg">📝</span>
              예문
            </h2>

            <div className="space-y-4">
              {word.examples.map((example, i) => (
                <div key={example.id || i} className={`p-5 rounded-xl ${example.isFunny ? 'bg-gradient-to-r from-green-50 to-teal-50 border border-green-200' : 'bg-slate-50'}`}>
                  {example.isFunny && (
                    <span className="inline-block text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full mb-2">
                      😄 재미있는 예문
                    </span>
                  )}
                  <p className="text-lg text-slate-800 italic mb-2">"{example.sentence}"</p>
                  {example.translation && (
                    <p className="text-slate-600">{example.translation}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========== 추가 정보: 관련 단어 ========== */}
        {((word.synonymList && word.synonymList.length > 0) ||
          (word.antonymList && word.antonymList.length > 0) ||
          (word.relatedWords && word.relatedWords.length > 0)) && (
          <section className="card p-6">
            <h2 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-lg">📚</span>
              관련 단어
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {word.synonymList && word.synonymList.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">동의어</h4>
                  <div className="flex flex-wrap gap-2">
                    {word.synonymList.map((s, i) => (
                      <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm hover:bg-green-200 transition-colors cursor-default">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {word.antonymList && word.antonymList.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">반의어</h4>
                  <div className="flex flex-wrap gap-2">
                    {word.antonymList.map((a, i) => (
                      <span key={i} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm hover:bg-red-200 transition-colors cursor-default">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {word.relatedWords && word.relatedWords.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">관련어</h4>
                  <div className="flex flex-wrap gap-2">
                    {word.relatedWords.map((r, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm hover:bg-blue-200 transition-colors cursor-default">{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* CTA - Hidden on mobile, shown on desktop */}
        <section className="card p-6 bg-gradient-to-r from-brand-primary to-brand-primary/80 text-white hidden md:block">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-display font-bold mb-1">이 단어를 완벽히 외우셨나요?</h3>
              <p className="text-white/80">플래시카드와 퀴즈로 더 깊이 학습해보세요.</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/words/${word.id}/learn`} className="btn bg-white text-brand-primary hover:bg-white/90">
                플래시카드 학습
              </Link>
              <Link href={`/quiz?wordId=${word.id}`} className="btn border border-white/30 text-white hover:bg-white/10">
                퀴즈 풀기
              </Link>
            </div>
          </div>
        </section>

        {/* Mobile bottom spacer for fixed action bar */}
        <div className="h-24 md:hidden" />
      </main>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden z-40 safe-area-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={handlePlayPronunciation}
            disabled={playingAudio}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[48px] active:bg-gray-200 transition-colors"
          >
            <Icons.Speaker />
            <span>{playingAudio ? '재생 중...' : '발음'}</span>
          </button>
          <Link
            href={`/words/${word.id}/learn`}
            className="flex-1 bg-teal-500 text-white py-3 rounded-xl font-medium text-center flex items-center justify-center gap-2 min-h-[48px] active:bg-teal-600 transition-colors"
          >
            <Icons.Play />
            <span>학습하기</span>
          </Link>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={fullscreenImage.url}
              alt="Fullscreen view"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {fullscreenImage.caption && (
              <div className="absolute bottom-8 left-4 right-4 text-center">
                <p className="text-white text-lg bg-black/50 py-2 px-4 rounded-lg inline-block">
                  {fullscreenImage.caption}
                </p>
              </div>
            )}
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 text-white p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
