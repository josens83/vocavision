"use client";

/**
 * PopularWordsSection - BEST/NEW 탭을 가진 인기 단어 섹션
 *
 * Fast Campus 벤치마킹:
 * - 탭 형태로 인기/신규 콘텐츠 구분
 * - 단어 카드 그리드 레이아웃
 * - 호버 시 미니 정보 표시
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from '@/hooks/useLocale';

interface Word {
  id: string;
  word: string;
  definition: string;
  definitionKo?: string;
  level: string;
  pronunciation?: string;
  imageUrl?: string;
  viewCount?: number;
  createdAt?: string;
}

type TabType = "best" | "new";

// 레벨별 스타일 (NEW 탭용)
function getLevelStyles(isEn: boolean): Record<string, { bg: string; text: string; label: string }> {
  return {
    L1: { bg: "bg-green-100", text: "text-green-700", label: isEn ? "Basic" : "기초" },
    L2: { bg: "bg-blue-100", text: "text-blue-700", label: isEn ? "Inter" : "중급" },
    L3: { bg: "bg-purple-100", text: "text-purple-700", label: isEn ? "Adv" : "고급" },
  };
}

// BEST 탭 단어별 난이도 매핑
function getBestWordDifficulty(isEn: boolean): Record<string, string> {
  const adv = isEn ? 'Adv' : '고급';
  const inter = isEn ? 'Inter' : '중급';
  return {
    'sycophant': adv,
    'ephemeral': adv,
    'ubiquitous': inter,
    'scrutinize': inter,
    'eloquent': inter,
    'synthesis': inter,
    'paradigm': inter,
    'anthropology': inter,
    'methodology': inter,
    'subsidiary': inter,
  };
}

// 난이도별 스타일 (BEST 탭용)
function getDifficultyStyles(isEn: boolean): Record<string, { bg: string; text: string }> {
  return {
    [isEn ? 'Basic' : '기초']: { bg: "bg-green-100", text: "text-green-700" },
    [isEn ? 'Inter' : '중급']: { bg: "bg-orange-100", text: "text-orange-700" },
    [isEn ? 'Adv' : '고급']: { bg: "bg-purple-100", text: "text-purple-700" },
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function PopularWordsSection() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const [activeTab, setActiveTab] = useState<TabType>("best");
  const [bestWords, setBestWords] = useState<Word[]>([]);
  const [newWords, setNewWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSampleData, setIsSampleData] = useState(false);

  useEffect(() => {
    fetchFeaturedWords();
  }, []);

  const fetchFeaturedWords = async () => {
    setIsLoading(true);
    try {
      // Fetch both best and new words in parallel
      const [bestResponse, newResponse] = await Promise.all([
        fetch(`${API_URL}/words/featured?type=best&limit=10`),
        fetch(`${API_URL}/words/featured?type=new&limit=10`),
      ]);

      if (bestResponse.ok && newResponse.ok) {
        const bestData = await bestResponse.json();
        const newData = await newResponse.json();

        // Only use API data if we got words with images
        if (bestData.words?.length > 0 && bestData.words.some((w: Word) => w.imageUrl)) {
          setBestWords(bestData.words);
          setNewWords(newData.words?.length > 0 ? newData.words : bestData.words.slice(0, 5));
          setIsSampleData(false);
        } else {
          // Fall back to sample data
          setBestWords(sampleBestWords);
          setNewWords(sampleNewWords);
          setIsSampleData(true);
        }
      } else {
        // Fall back to sample data
        setBestWords(sampleBestWords);
        setNewWords(sampleNewWords);
        setIsSampleData(true);
      }
    } catch (error) {
      console.error("Failed to fetch featured words:", error);
      // Fall back to sample data
      setBestWords(sampleBestWords);
      setNewWords(sampleNewWords);
      setIsSampleData(true);
    } finally {
      setIsLoading(false);
    }
  };

  const displayWords = activeTab === "best" ? bestWords : newWords;

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-display-sm font-display font-bold text-slate-900">
                {isEn ? <>Today&apos;s <span className="text-gradient">Featured Words</span></> : <>오늘의 <span className="text-gradient">추천 단어</span></>}
              </h2>
              {isSampleData && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  {isEn ? 'Sample' : '예시'}
                </span>
              )}
            </div>
            <p className="text-slate-600">
              {isSampleData
                ? (isEn ? "Sign in to see your personalized word recommendations!" : "로그인하면 나만의 추천 단어를 확인할 수 있어요!")
                : (isEn ? "Check out popular and newly added words." : "학습자들이 많이 찾는 단어와 새로 추가된 단어를 확인해보세요.")}
            </p>
          </div>

          {/* 탭 버튼 */}
          <div className="inline-flex bg-slate-100 rounded-lg p-1 w-fit">
            <TabButton
              active={activeTab === "best"}
              onClick={() => setActiveTab("best")}
              icon="🔥"
              label="BEST"
            />
            <TabButton
              active={activeTab === "new"}
              onClick={() => setActiveTab("new")}
              icon="✨"
              label="NEW"
            />
          </div>
        </div>

        {/* 콘텐츠 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <WordCardSkeleton key={i} />
                ))}
              </div>
            ) : displayWords.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayWords.map((word, index) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    rank={activeTab === "best" ? index + 1 : undefined}
                    isNew={activeTab === "new"}
                    delay={index * 0.05}
                    isEn={isEn}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <span className="text-4xl mb-4 block">
                  {activeTab === "best" ? "📊" : "🆕"}
                </span>
                <p>{isEn ? 'No words to display' : '표시할 단어가 없습니다'}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 더보기 링크 */}
        <div className="text-center mt-8">
          <Link
            href="/words"
            className="inline-flex items-center gap-2 text-brand-primary font-medium hover:underline"
          >
            {isEn ? 'View All Words' : '전체 단어 보기'}
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// 탭 버튼
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 md:gap-2 md:px-4 md:py-2 rounded-lg text-sm font-semibold transition-all
        ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}
      `}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// 단어 카드
function WordCard({
  word,
  rank,
  isNew,
  delay,
  isEn,
}: {
  word: Word;
  rank?: number;
  isNew?: boolean;
  delay: number;
  isEn: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const levelStyles = getLevelStyles(isEn);
  const bestWordDifficulty = getBestWordDifficulty(isEn);
  const difficultyStyles = getDifficultyStyles(isEn);

  // BEST 탭(rank가 있을 때)은 하드코딩된 난이도 사용, NEW 탭은 기존 레벨 스타일 사용
  const isBest = rank !== undefined;
  const difficulty = isBest ? bestWordDifficulty[word.word.toLowerCase()] : null;
  const diffStyle = difficulty ? difficultyStyles[difficulty] : null;
  const levelStyle = levelStyles[word.level] || levelStyles.L1;

  // 배지에 표시할 텍스트와 스타일
  const badgeLabel = isBest && difficulty ? difficulty : levelStyle.label;
  const badgeBg = isBest && diffStyle ? diffStyle.bg : levelStyle.bg;
  const badgeText = isBest && diffStyle ? diffStyle.text : levelStyle.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link
        href={`/words/${word.id}`}
        className="group block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all">
          {/* 랭킹 또는 NEW 배지 */}
          {rank && (
            <div
              className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                rank <= 3
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {rank}
            </div>
          )}
          {isNew && (
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
              NEW
            </div>
          )}

          {/* 이미지 영역 */}
          <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
            {word.imageUrl ? (
              <Image
                src={word.imageUrl}
                alt={word.word}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl font-bold text-slate-200 uppercase">
                  {word.word[0]}
                </span>
              </div>
            )}

            {/* 호버 오버레이 */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/70 flex items-center justify-center p-4"
                >
                  <div className="text-center text-white">
                    <p className="text-sm mb-2">{isEn ? 'Meaning' : '뜻'}</p>
                    <p className="font-medium">{isEn ? word.definition : (word.definitionKo || word.definition)}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 정보 영역 */}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 truncate group-hover:text-brand-primary transition-colors">
                  {word.word}
                </h3>
                {word.pronunciation && !isEn && (
                  <p className="text-xs text-slate-400 truncate">
                    {word.pronunciation}
                  </p>
                )}
              </div>
              <span
                className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${badgeBg} ${badgeText}`}
              >
                {badgeLabel}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// 스켈레톤 로딩
function WordCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="h-5 bg-slate-100 rounded w-3/4 mb-1" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
          <div className="h-5 bg-slate-100 rounded-full w-10" />
        </div>
      </div>
    </div>
  );
}

// 샘플 데이터 (API에서 이미지가 없을 때 fallback) - BEST 탭 고정 10개 단어
const sampleBestWords: Word[] = [
  { id: "1", word: "sycophant", definition: "a person who flatters to gain advantage", level: "L3", pronunciation: "/ˈsɪk.ə.fænt/" },
  { id: "2", word: "ephemeral", definition: "lasting for a very short time", level: "L3", pronunciation: "/ɪˈfem.ər.əl/" },
  { id: "3", word: "ubiquitous", definition: "present everywhere at once", level: "L2", pronunciation: "/juːˈbɪk.wɪ.təs/" },
  { id: "4", word: "scrutinize", definition: "to examine closely and critically", level: "L2", pronunciation: "/ˈskruː.tɪ.naɪz/" },
  { id: "5", word: "eloquent", definition: "fluent and persuasive in speech", level: "L3", pronunciation: "/ˈel.ə.kwənt/" },
  { id: "6", word: "synthesis", definition: "combining parts into a whole", level: "L2", pronunciation: "/ˈsɪn.θə.sɪs/" },
  { id: "7", word: "paradigm", definition: "a model or pattern of something", level: "L3", pronunciation: "/ˈpær.ə.daɪm/" },
  { id: "8", word: "anthropology", definition: "the study of human societies", level: "L2", pronunciation: "/ˌæn.θrəˈpɒl.ə.dʒi/" },
  { id: "9", word: "methodology", definition: "a system of methods in a field", level: "L2", pronunciation: "/ˌmeθ.əˈdɒl.ə.dʒi/" },
  { id: "10", word: "subsidiary", definition: "a company controlled by another", level: "L2", pronunciation: "/səbˈsɪd.i.er.i/" },
];

const sampleNewWords: Word[] = [
  { id: "11", word: "serendipity", definition: "a happy or fortunate accident", level: "L3", pronunciation: "/ˌser.ənˈdɪp.ə.ti/" },
  { id: "12", word: "quintessential", definition: "the most perfect example of something", level: "L3", pronunciation: "/ˌkwɪn.tɪˈsen.ʃəl/" },
  { id: "13", word: "clandestine", definition: "kept secret or done in hiding", level: "L3", pronunciation: "/klænˈdes.tɪn/" },
  { id: "14", word: "juxtapose", definition: "to place side by side for comparison", level: "L3", pronunciation: "/ˈdʒʌk.stə.pəʊz/" },
  { id: "15", word: "vicarious", definition: "experienced through another person", level: "L3", pronunciation: "/vɪˈkeə.ri.əs/" },
];
