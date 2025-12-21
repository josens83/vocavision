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
import { motion, AnimatePresence } from "framer-motion";

interface Word {
  id: string;
  word: string;
  definition: string;
  level: string;
  pronunciation?: string;
  imageUrl?: string;
  viewCount?: number;
  createdAt?: string;
}

type TabType = "best" | "new";

interface PopularWordsSectionProps {
  bestWords?: Word[];
  newWords?: Word[];
  isLoading?: boolean;
  /** 비로그인 사용자용 샘플 데이터 표시 여부 */
  isSampleData?: boolean;
}

// 레벨별 스타일
const levelStyles: Record<string, { bg: string; text: string; label: string }> = {
  L1: { bg: "bg-green-100", text: "text-green-700", label: "기초" },
  L2: { bg: "bg-blue-100", text: "text-blue-700", label: "중급" },
  L3: { bg: "bg-purple-100", text: "text-purple-700", label: "고급" },
};

export default function PopularWordsSection({
  bestWords = [],
  newWords = [],
  isLoading = false,
  isSampleData = false,
}: PopularWordsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("best");

  const displayWords = activeTab === "best" ? bestWords : newWords;

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-display-sm font-display font-bold text-slate-900">
                오늘의 <span className="text-gradient">추천 단어</span>
              </h2>
              {isSampleData && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  예시
                </span>
              )}
            </div>
            <p className="text-slate-600">
              {isSampleData
                ? "로그인하면 나만의 추천 단어를 확인할 수 있어요!"
                : "학습자들이 많이 찾는 단어와 새로 추가된 단어를 확인해보세요."}
            </p>
          </div>

          {/* 탭 버튼 */}
          <div className="flex bg-slate-100 rounded-xl p-1">
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
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <span className="text-4xl mb-4 block">
                  {activeTab === "best" ? "📊" : "🆕"}
                </span>
                <p>표시할 단어가 없습니다</p>
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
            전체 단어 보기
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
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
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
}: {
  word: Word;
  rank?: number;
  isNew?: boolean;
  delay: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const levelStyle = levelStyles[word.level] || levelStyles.L1;

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
              <img
                src={word.imageUrl}
                alt={word.word}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                    <p className="text-sm mb-2">뜻</p>
                    <p className="font-medium">{word.definition}</p>
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
                {word.pronunciation && (
                  <p className="text-xs text-slate-400 truncate">
                    {word.pronunciation}
                  </p>
                )}
              </div>
              <span
                className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${levelStyle.bg} ${levelStyle.text}`}
              >
                {levelStyle.label}
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

// 샘플 데이터 (API 연동 전 사용) - 실제 학습 데이터와 동일한 형식
// 실제 데이터는 DB의 Word.conceptImage 또는 Word.mnemonicImage 사용
export const sampleBestWords: Word[] = [
  { id: "1", word: "ubiquitous", definition: "어디에나 있는", level: "L2", pronunciation: "/juːˈbɪk.wɪ.təs/" },
  { id: "2", word: "ephemeral", definition: "일시적인", level: "L3", pronunciation: "/ɪˈfem.ər.əl/" },
  { id: "3", word: "pragmatic", definition: "실용적인", level: "L2", pronunciation: "/præɡˈmæt.ɪk/" },
  { id: "4", word: "meticulous", definition: "꼼꼼한", level: "L2", pronunciation: "/məˈtɪk.jə.ləs/" },
  { id: "5", word: "resilient", definition: "회복력 있는", level: "L2", pronunciation: "/rɪˈzɪl.i.ənt/" },
  { id: "6", word: "ambiguous", definition: "모호한", level: "L2", pronunciation: "/æmˈbɪɡ.ju.əs/" },
  { id: "7", word: "paradigm", definition: "패러다임, 전형", level: "L3", pronunciation: "/ˈpær.ə.daɪm/" },
  { id: "8", word: "eloquent", definition: "웅변적인", level: "L3", pronunciation: "/ˈel.ə.kwənt/" },
  { id: "9", word: "profound", definition: "심오한", level: "L2", pronunciation: "/prəˈfaʊnd/" },
  { id: "10", word: "inevitable", definition: "불가피한", level: "L1", pronunciation: "/ɪnˈev.ɪ.tə.bəl/" },
];

export const sampleNewWords: Word[] = [
  { id: "11", word: "serendipity", definition: "뜻밖의 행운", level: "L3", pronunciation: "/ˌser.ənˈdɪp.ə.ti/" },
  { id: "12", word: "quintessential", definition: "전형적인", level: "L3", pronunciation: "/ˌkwɪn.tɪˈsen.ʃəl/" },
  { id: "13", word: "clandestine", definition: "비밀의", level: "L3", pronunciation: "/klænˈdes.tɪn/" },
  { id: "14", word: "juxtapose", definition: "병치하다", level: "L3", pronunciation: "/ˈdʒʌk.stə.pəʊz/" },
  { id: "15", word: "vicarious", definition: "대리의", level: "L3", pronunciation: "/vɪˈkeə.ri.əs/" },
];
