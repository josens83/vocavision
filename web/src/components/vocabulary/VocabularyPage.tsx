"use client";

import { useState } from "react";
import {
  vocabColors,
  TabButton,
  TabContainer,
  NumberBadge,
  VocabSelect,
  QuizQuestion,
  VocabImageCard,
  ExampleSentence,
  RelatedTestCard,
  Pagination,
  Breadcrumb,
  ContentHeader,
  InstructionBox,
  SectionDivider,
  SocialShare,
  VideoPlayer,
} from "./VocabComponents";

// ============================================
// Types
// ============================================

type TabType = "exercises" | "explanation" | "downloads";

interface VocabularyWord {
  id: number;
  word: string;
  image: string;
}

interface QuizQuestionData {
  id: number;
  prefix?: string;
  suffix: string;
  options: string[];
  correctAnswer: string;
}

interface ExampleSentenceData {
  sentence: string;
  keyword: string;
}

interface RelatedTestData {
  image: string;
  title: string;
  href: string;
}

// ============================================
// Sample Data
// ============================================

const sampleVocabularyWords: VocabularyWord[] = [
  { id: 1, word: "KITCHEN", image: "/images/vocab/kitchen.jpg" },
  { id: 2, word: "BEDROOM", image: "/images/vocab/bedroom.jpg" },
  { id: 3, word: "BATHROOM", image: "/images/vocab/bathroom.jpg" },
  { id: 4, word: "LIVING ROOM", image: "/images/vocab/living-room.jpg" },
  { id: 5, word: "GARAGE", image: "/images/vocab/garage.jpg" },
  { id: 6, word: "GARDEN", image: "/images/vocab/garden.jpg" },
];

const sampleQuizQuestions: QuizQuestionData[] = [
  {
    id: 1,
    prefix: "I cook dinner in the",
    suffix: "every evening.",
    options: ["kitchen", "bedroom", "bathroom", "garage"],
    correctAnswer: "kitchen",
  },
  {
    id: 2,
    prefix: "My car is parked in the",
    suffix: ".",
    options: ["garden", "kitchen", "garage", "bedroom"],
    correctAnswer: "garage",
  },
  {
    id: 3,
    prefix: "I sleep in my",
    suffix: "at night.",
    options: ["bathroom", "bedroom", "kitchen", "garden"],
    correctAnswer: "bedroom",
  },
  {
    id: 4,
    prefix: "I take a shower in the",
    suffix: ".",
    options: ["bedroom", "garage", "bathroom", "living room"],
    correctAnswer: "bathroom",
  },
  {
    id: 5,
    prefix: "We watch TV in the",
    suffix: ".",
    options: ["kitchen", "living room", "garage", "bathroom"],
    correctAnswer: "living room",
  },
];

const sampleExampleSentences: ExampleSentenceData[] = [
  { sentence: "I cook dinner in the {kitchen} every evening.", keyword: "kitchen" },
  { sentence: "My car is parked in the {garage}.", keyword: "garage" },
  { sentence: "I sleep in my {bedroom} at night.", keyword: "bedroom" },
  { sentence: "I take a shower in the {bathroom}.", keyword: "bathroom" },
  { sentence: "We watch TV in the {living room}.", keyword: "living room" },
  { sentence: "The flowers in my {garden} are beautiful.", keyword: "garden" },
];

const sampleRelatedTests: RelatedTestData[] = [
  {
    image: "/images/related/food-vocabulary.jpg",
    title: "음식 관련 어휘 테스트",
    href: "/vocabulary/food",
  },
  {
    image: "/images/related/clothes-vocabulary.jpg",
    title: "의류 관련 어휘 테스트",
    href: "/vocabulary/clothes",
  },
  {
    image: "/images/related/animals-vocabulary.jpg",
    title: "동물 관련 어휘 테스트",
    href: "/vocabulary/animals",
  },
];

// ============================================
// Exercises Tab Content
// ============================================

interface ExercisesTabProps {
  questions: QuizQuestionData[];
  answers: Record<number, string>;
  onAnswerChange: (questionId: number, value: string) => void;
  showResults: boolean;
  onCheckAnswers: () => void;
  onReset: () => void;
  currentExercise: number;
  totalExercises: number;
  onExerciseChange: (num: number) => void;
}

function ExercisesTab({
  questions,
  answers,
  onAnswerChange,
  showResults,
  onCheckAnswers,
  onReset,
  currentExercise,
  totalExercises,
  onExerciseChange,
}: ExercisesTabProps) {
  const allOptions = [...new Set(questions.flatMap((q) => q.options))];

  return (
    <div className="p-6">
      <InstructionBox>
        아래 문장에서 빈칸에 알맞은 단어를 선택하세요.
      </InstructionBox>

      <div className="space-y-2">
        {questions.map((question) => (
          <QuizQuestion
            key={question.id}
            number={question.id}
            prefix={question.prefix}
            suffix={question.suffix}
            options={allOptions}
            value={answers[question.id] || ""}
            onChange={(value) => onAnswerChange(question.id, value)}
            correctAnswer={question.correctAnswer}
            showResult={showResults}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <button
            onClick={onCheckAnswers}
            className="px-6 py-2.5 rounded-lg font-semibold text-white transition-colors"
            style={{ backgroundColor: vocabColors.vocabulary }}
          >
            정답 확인
          </button>
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            다시 풀기
          </button>
        </div>

        <Pagination
          current={currentExercise}
          total={totalExercises}
          onChange={onExerciseChange}
          label="연습문제:"
        />
      </div>
    </div>
  );
}

// ============================================
// Explanation Tab Content
// ============================================

interface ExplanationTabProps {
  words: VocabularyWord[];
  examples: ExampleSentenceData[];
  youtubeId?: string;
}

function ExplanationTab({ words, examples, youtubeId }: ExplanationTabProps) {
  return (
    <div className="p-6">
      {/* Vocabulary Images Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">단어 이미지</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {words.map((word) => (
            <VocabImageCard
              key={word.id}
              number={word.id}
              image={word.image}
              label={word.word}
            />
          ))}
        </div>
      </div>

      <SectionDivider label="예문" />

      {/* Example Sentences */}
      <div className="mb-8">
        <ul className="space-y-1">
          {examples.map((example, index) => (
            <ExampleSentence
              key={index}
              number={index + 1}
              sentence={example.sentence}
              keyword={example.keyword}
            />
          ))}
        </ul>
      </div>

      {/* Video Section */}
      {youtubeId && (
        <>
          <SectionDivider label="학습 영상" />
          <div className="flex justify-center">
            <VideoPlayer youtubeId={youtubeId} />
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Downloads Tab Content
// ============================================

interface DownloadItem {
  name: string;
  format: string;
  size: string;
  href: string;
}

interface DownloadsTabProps {
  downloads?: DownloadItem[];
}

function DownloadsTab({ downloads }: DownloadsTabProps) {
  const defaultDownloads: DownloadItem[] = [
    { name: "단어 목록", format: "PDF", size: "245 KB", href: "#" },
    { name: "플래시카드", format: "PDF", size: "1.2 MB", href: "#" },
    { name: "연습문제", format: "PDF", size: "180 KB", href: "#" },
  ];

  const items = downloads || defaultDownloads;

  return (
    <div className="p-6">
      <InstructionBox>
        아래 학습 자료를 다운로드하여 오프라인에서도 학습하세요.
      </InstructionBox>

      <div className="space-y-3">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: vocabColors.vocabulary }}
              >
                {item.format}
              </div>
              <div>
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">{item.size}</p>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Pro 회원 전용:</strong> 모든 다운로드 자료는 Pro 회원만 이용 가능합니다.
          <a href="/pricing" className="underline ml-1 hover:text-yellow-900">
            업그레이드하기
          </a>
        </p>
      </div>
    </div>
  );
}

// ============================================
// Sidebar Component
// ============================================

interface SidebarProps {
  relatedTests: RelatedTestData[];
}

function Sidebar({ relatedTests }: SidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Related Tests */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          관련 테스트
        </h3>
        <div className="space-y-4">
          {relatedTests.map((test, index) => (
            <RelatedTestCard
              key={index}
              image={test.image}
              title={test.title}
              href={test.href}
            />
          ))}
        </div>
      </div>

      {/* Social Share */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          공유하기
        </h3>
        <SocialShare />
      </div>

      {/* Ad Placeholder */}
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">광고</p>
        <div className="bg-gray-200 h-60 rounded flex items-center justify-center">
          <span className="text-gray-400 text-sm">Ad Space</span>
        </div>
      </div>
    </aside>
  );
}

// ============================================
// Main Vocabulary Page Component
// ============================================

interface VocabularyPageProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  words?: VocabularyWord[];
  questions?: QuizQuestionData[];
  examples?: ExampleSentenceData[];
  relatedTests?: RelatedTestData[];
  youtubeId?: string;
  totalExercises?: number;
}

export default function VocabularyPage({
  title = "집 관련 어휘 (House Vocabulary)",
  breadcrumbs = [
    { label: "홈", href: "/" },
    { label: "어휘", href: "/vocabulary" },
    { label: "집" },
  ],
  words = sampleVocabularyWords,
  questions = sampleQuizQuestions,
  examples = sampleExampleSentences,
  relatedTests = sampleRelatedTests,
  youtubeId,
  totalExercises = 3,
}: VocabularyPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("exercises");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(1);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setShowResults(false);
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
  };

  const handleExerciseChange = (num: number) => {
    setCurrentExercise(num);
    setAnswers({});
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbs} />

      {/* Content Header */}
      <ContentHeader title={title} />

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex gap-1">
              <TabButton
                active={activeTab === "exercises"}
                onClick={() => setActiveTab("exercises")}
              >
                연습문제
              </TabButton>
              <TabButton
                active={activeTab === "explanation"}
                onClick={() => setActiveTab("explanation")}
              >
                설명
              </TabButton>
              <TabButton
                active={activeTab === "downloads"}
                onClick={() => setActiveTab("downloads")}
              >
                다운로드
              </TabButton>
            </div>

            {/* Tab Content */}
            <TabContainer>
              {activeTab === "exercises" && (
                <ExercisesTab
                  questions={questions}
                  answers={answers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showResults}
                  onCheckAnswers={handleCheckAnswers}
                  onReset={handleReset}
                  currentExercise={currentExercise}
                  totalExercises={totalExercises}
                  onExerciseChange={handleExerciseChange}
                />
              )}
              {activeTab === "explanation" && (
                <ExplanationTab
                  words={words}
                  examples={examples}
                  youtubeId={youtubeId}
                />
              )}
              {activeTab === "downloads" && <DownloadsTab />}
            </TabContainer>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72">
            <Sidebar relatedTests={relatedTests} />
          </div>
        </div>
      </div>
    </div>
  );
}
