"use client";

/**
 * WordModeCard - 9가지 학습 모드를 지원하는 단어 카드
 *
 * 학습 모드:
 * 1. Flashcard (기본 암기) - 앞면: 단어, 뒷면: 뜻
 * 2. Eng→Kor Quiz (영한 퀴즈) - 영어 보고 한국어 맞추기
 * 3. Kor→Eng Quiz (한영 퀴즈) - 한국어 보고 영어 맞추기
 * 4. CONCEPT (의미 이미지) - 단어 의미를 보여주는 시각 자료
 * 5. MNEMONIC (연상 이미지) - 한국어식 연상법 이미지
 * 6. RHYME (라이밍 이미지) - 발음 기반 연상 이미지
 * 7. Examples (예문) - 문맥 속 단어 활용
 * 8. Etymology (어원) - 단어의 기원과 구성
 * 9. Pronunciation (발음) - 발음 기호 및 음성
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getOptimizedImageUrl } from "@/lib/utils";

// 학습 모드 타입
export type LearningMode =
  | "flashcard"
  | "eng-to-kor"
  | "kor-to-eng"
  | "concept"
  | "mnemonic"
  | "rhyme"
  | "examples"
  | "etymology"
  | "pronunciation";

// 학습 모드 설정
export const LEARNING_MODES: Record<
  LearningMode,
  {
    label: string;
    labelEn: string;
    icon: string;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  flashcard: {
    label: "플래시카드",
    labelEn: "Flashcard",
    icon: "🎴",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "카드를 뒤집어 암기",
  },
  "eng-to-kor": {
    label: "영→한",
    labelEn: "Eng→Kor",
    icon: "🇺🇸",
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "영어 보고 한국어 맞추기",
  },
  "kor-to-eng": {
    label: "한→영",
    labelEn: "Kor→Eng",
    icon: "🇰🇷",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    description: "한국어 보고 영어 맞추기",
  },
  concept: {
    label: "의미",
    labelEn: "Concept",
    icon: "🖼️",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    description: "의미를 시각화한 이미지",
  },
  mnemonic: {
    label: "연상",
    labelEn: "Mnemonic",
    icon: "🧠",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "한국어 연상법 이미지",
  },
  rhyme: {
    label: "라이밍",
    labelEn: "Rhyme",
    icon: "🎵",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    description: "발음 기반 연상 이미지",
  },
  examples: {
    label: "예문",
    labelEn: "Examples",
    icon: "📝",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    description: "실제 문장에서의 활용",
  },
  etymology: {
    label: "어원",
    labelEn: "Etymology",
    icon: "📚",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    description: "단어의 기원과 역사",
  },
  pronunciation: {
    label: "발음",
    labelEn: "Pronunciation",
    icon: "🔊",
    color: "text-red-600",
    bgColor: "bg-red-50",
    description: "정확한 발음 학습",
  },
};

// 단어 인터페이스
interface WordVisual {
  type: "CONCEPT" | "MNEMONIC" | "RHYME";
  imageUrl?: string | null;
  captionKo?: string;
  captionEn?: string;
  labelKo?: string;
}

interface Example {
  sentence: string;
  translation?: string;
}

interface Etymology {
  origin?: string;
  rootWords?: string[];
  evolution?: string;
}

interface Word {
  id: string;
  word: string;
  definition: string;
  pronunciation?: string;
  level?: string;
  visuals?: WordVisual[];
  examples?: Example[];
  etymology?: Etymology;
  mnemonicText?: string;
}

interface WordModeCardProps {
  word: Word;
  initialMode?: LearningMode;
  onModeChange?: (mode: LearningMode) => void;
  showModeSelector?: boolean;
  compact?: boolean;
}

export default function WordModeCard({
  word,
  initialMode = "flashcard",
  onModeChange,
  showModeSelector = true,
  compact = false,
}: WordModeCardProps) {
  const [activeMode, setActiveMode] = useState<LearningMode>(initialMode);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleModeChange = (mode: LearningMode) => {
    setActiveMode(mode);
    setIsFlipped(false);
    onModeChange?.(mode);
  };

  // 사용 가능한 모드 필터링
  const getAvailableModes = (): LearningMode[] => {
    const modes: LearningMode[] = ["flashcard", "eng-to-kor", "kor-to-eng"];

    const hasVisual = (type: string) =>
      word.visuals?.some((v) => v.type === type && v.imageUrl);

    if (hasVisual("CONCEPT")) modes.push("concept");
    if (hasVisual("MNEMONIC")) modes.push("mnemonic");
    if (hasVisual("RHYME")) modes.push("rhyme");
    if (word.examples && word.examples.length > 0) modes.push("examples");
    if (word.etymology) modes.push("etymology");
    if (word.pronunciation) modes.push("pronunciation");

    return modes;
  };

  const availableModes = getAvailableModes();

  // 비주얼 데이터 가져오기
  const getVisual = (type: "CONCEPT" | "MNEMONIC" | "RHYME") =>
    word.visuals?.find((v) => v.type === type);

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg overflow-hidden ${compact ? "" : "max-w-2xl mx-auto"}`}
    >
      {/* 모드 선택기 */}
      {showModeSelector && (
        <div className="border-b border-slate-100 overflow-x-auto">
          <div className="flex p-2 gap-1 min-w-max">
            {availableModes.map((mode) => {
              const config = LEARNING_MODES[mode];
              const isActive = activeMode === mode;

              return (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${isActive ? `${config.bgColor} ${config.color}` : "text-slate-500 hover:bg-slate-50"}
                  `}
                >
                  <span>{config.icon}</span>
                  <span className="hidden sm:inline">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={compact ? "p-4" : "p-6"}
        >
          {/* 플래시카드 모드 */}
          {activeMode === "flashcard" && (
            <FlashcardMode
              word={word}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
              compact={compact}
            />
          )}

          {/* 영→한 퀴즈 모드 */}
          {activeMode === "eng-to-kor" && (
            <QuizMode word={word} direction="eng-to-kor" compact={compact} />
          )}

          {/* 한→영 퀴즈 모드 */}
          {activeMode === "kor-to-eng" && (
            <QuizMode word={word} direction="kor-to-eng" compact={compact} />
          )}

          {/* 이미지 모드들 */}
          {(activeMode === "concept" ||
            activeMode === "mnemonic" ||
            activeMode === "rhyme") && (
            <ImageMode
              word={word}
              type={activeMode.toUpperCase() as "CONCEPT" | "MNEMONIC" | "RHYME"}
              visual={getVisual(
                activeMode.toUpperCase() as "CONCEPT" | "MNEMONIC" | "RHYME"
              )}
              compact={compact}
            />
          )}

          {/* 예문 모드 */}
          {activeMode === "examples" && (
            <ExamplesMode word={word} compact={compact} />
          )}

          {/* 어원 모드 */}
          {activeMode === "etymology" && (
            <EtymologyMode word={word} compact={compact} />
          )}

          {/* 발음 모드 */}
          {activeMode === "pronunciation" && (
            <PronunciationMode word={word} compact={compact} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// 플래시카드 모드
function FlashcardMode({
  word,
  isFlipped,
  onFlip,
  compact,
}: {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
  compact: boolean;
}) {
  return (
    <div
      className={`${compact ? "min-h-[200px]" : "min-h-[300px]"} flex flex-col items-center justify-center cursor-pointer`}
      onClick={onFlip}
    >
      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.div
            key="front"
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -90 }}
            className="text-center"
          >
            <h2
              className={`${compact ? "text-3xl" : "text-5xl"} font-bold text-slate-900 mb-3`}
            >
              {word.word}
            </h2>
            {word.pronunciation && (
              <p className="text-slate-500">{word.pronunciation}</p>
            )}
            <p className="text-sm text-slate-400 mt-4">탭하여 뜻 확인</p>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -90 }}
            className="text-center"
          >
            <p
              className={`${compact ? "text-xl" : "text-3xl"} font-semibold text-slate-900`}
            >
              {word.definition}
            </p>
            <p className="text-sm text-slate-400 mt-4">탭하여 단어 확인</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 퀴즈 모드
function QuizMode({
  word,
  direction,
  compact,
}: {
  word: Word;
  direction: "eng-to-kor" | "kor-to-eng";
  compact: boolean;
}) {
  const [showAnswer, setShowAnswer] = useState(false);

  const question = direction === "eng-to-kor" ? word.word : word.definition;
  const answer = direction === "eng-to-kor" ? word.definition : word.word;
  const questionLabel = direction === "eng-to-kor" ? "영어 단어" : "한국어 뜻";
  const answerLabel = direction === "eng-to-kor" ? "한국어 뜻" : "영어 단어";

  return (
    <div
      className={`${compact ? "min-h-[200px]" : "min-h-[300px]"} flex flex-col items-center justify-center`}
    >
      <div className="text-center">
        <span
          className={`inline-block px-3 py-1 ${LEARNING_MODES[direction].bgColor} ${LEARNING_MODES[direction].color} rounded-full text-xs font-medium mb-4`}
        >
          {questionLabel}
        </span>
        <h2
          className={`${compact ? "text-2xl" : "text-4xl"} font-bold text-slate-900 mb-6`}
        >
          {question}
        </h2>

        {showAnswer ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="inline-block px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium mb-2">
              {answerLabel}
            </span>
            <p
              className={`${compact ? "text-xl" : "text-2xl"} font-semibold text-green-600`}
            >
              {answer}
            </p>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowAnswer(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            정답 확인
          </button>
        )}
      </div>
    </div>
  );
}

// 이미지 모드
function ImageMode({
  word,
  type,
  visual,
  compact,
}: {
  word: Word;
  type: "CONCEPT" | "MNEMONIC" | "RHYME";
  visual?: WordVisual;
  compact: boolean;
}) {
  const config =
    LEARNING_MODES[type.toLowerCase() as "concept" | "mnemonic" | "rhyme"];

  if (!visual?.imageUrl) {
    return (
      <div className="text-center py-12 text-slate-400">
        <span className="text-4xl mb-4 block">🖼️</span>
        <p>이미지가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 단어 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{word.word}</h3>
          <p className="text-slate-500">{word.definition}</p>
        </div>
        <span
          className={`px-3 py-1 ${config.bgColor} ${config.color} rounded-full text-sm font-medium`}
        >
          {config.icon} {config.label}
        </span>
      </div>

      {/* 이미지 */}
      <div
        className={`relative ${compact ? "aspect-video" : "aspect-square"} rounded-xl overflow-hidden bg-slate-100`}
      >
        <img
          src={getOptimizedImageUrl(visual.imageUrl)}
          alt={`${word.word} - ${config.label}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 캡션 */}
      {(visual.captionKo || visual.captionEn) && (
        <div className={`p-4 ${config.bgColor} rounded-xl`}>
          {visual.captionKo && (
            <p className="text-slate-700">{visual.captionKo}</p>
          )}
          {visual.captionEn && (
            <p className="text-slate-500 text-sm mt-1">{visual.captionEn}</p>
          )}
        </div>
      )}
    </div>
  );
}

// 예문 모드
function ExamplesMode({ word, compact }: { word: Word; compact: boolean }) {
  if (!word.examples || word.examples.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <span className="text-4xl mb-4 block">📝</span>
        <p>예문이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-900">{word.word}</h3>
        <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-sm font-medium">
          📝 예문 {word.examples.length}개
        </span>
      </div>

      <div className="space-y-3">
        {word.examples.map((example, i) => (
          <div
            key={i}
            className="p-4 bg-slate-50 rounded-xl border border-slate-100"
          >
            <p className="text-slate-900 leading-relaxed">
              {highlightWord(example.sentence, word.word)}
            </p>
            {example.translation && (
              <p className="text-slate-500 text-sm mt-2">
                {example.translation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 어원 모드
function EtymologyMode({ word, compact }: { word: Word; compact: boolean }) {
  if (!word.etymology) {
    return (
      <div className="text-center py-12 text-slate-400">
        <span className="text-4xl mb-4 block">📚</span>
        <p>어원 정보가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-900">{word.word}</h3>
        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-sm font-medium">
          📚 어원
        </span>
      </div>

      <div className="space-y-3">
        {word.etymology.origin && (
          <div className="p-4 bg-amber-50 rounded-xl">
            <span className="text-xs font-medium text-amber-600 mb-1 block">
              기원
            </span>
            <p className="text-slate-900 font-medium">{word.etymology.origin}</p>
          </div>
        )}

        {word.etymology.rootWords && word.etymology.rootWords.length > 0 && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-xs font-medium text-slate-600 mb-2 block">
              어근
            </span>
            <div className="flex flex-wrap gap-2">
              {word.etymology.rootWords.map((root, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white rounded-full text-sm border border-slate-200"
                >
                  {root}
                </span>
              ))}
            </div>
          </div>
        )}

        {word.etymology.evolution && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-xs font-medium text-slate-600 mb-1 block">
              발전 과정
            </span>
            <p className="text-slate-700">{word.etymology.evolution}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 발음 모드
function PronunciationMode({ word, compact }: { word: Word; compact: boolean }) {
  const handlePlayAudio = () => {
    // Web Speech API 사용
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`${compact ? "min-h-[200px]" : "min-h-[300px]"} flex flex-col items-center justify-center`}
    >
      <div className="text-center">
        <h2
          className={`${compact ? "text-3xl" : "text-5xl"} font-bold text-slate-900 mb-3`}
        >
          {word.word}
        </h2>

        {word.pronunciation && (
          <p className="text-xl text-slate-500 mb-6">{word.pronunciation}</p>
        )}

        <button
          onClick={handlePlayAudio}
          className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg hover:shadow-xl"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        </button>

        <p className="text-sm text-slate-400 mt-4">클릭하여 발음 듣기</p>
      </div>
    </div>
  );
}

// 문장에서 단어 하이라이트
function highlightWord(sentence: string, word: string) {
  const regex = new RegExp(`(${word})`, "gi");
  const parts = sentence.split(regex);

  return parts.map((part, i) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <span key={i} className="font-bold text-teal-600">
        {part}
      </span>
    ) : (
      part
    )
  );
}

// 학습 모드 선택기 (독립 컴포넌트)
export function LearningModeSelector({
  availableModes,
  activeMode,
  onChange,
}: {
  availableModes: LearningMode[];
  activeMode: LearningMode;
  onChange: (mode: LearningMode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {availableModes.map((mode) => {
        const config = LEARNING_MODES[mode];
        const isActive = activeMode === mode;

        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive ? `${config.bgColor} ${config.color} shadow-sm` : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}
            `}
          >
            <span className="text-lg">{config.icon}</span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
