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
// Sample Data - Common Things (A1)
// ============================================

const sampleVocabularyWords: VocabularyWord[] = [
  { id: 1, word: "A HOUSE", image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=200&h=150&fit=crop" },
  { id: 2, word: "A CAR", image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&h=150&fit=crop" },
  { id: 3, word: "A BICYCLE", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200&h=150&fit=crop" },
  { id: 4, word: "A BOOK", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=150&fit=crop" },
  { id: 5, word: "A PEN", image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&h=150&fit=crop" },
  { id: 6, word: "A NOTEBOOK", image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&h=150&fit=crop" },
  { id: 7, word: "A BACKPACK", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=150&fit=crop" },
  { id: 8, word: "A WATCH", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&h=150&fit=crop" },
  { id: 9, word: "A COMPUTER", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=150&fit=crop" },
  { id: 10, word: "A TV", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200&h=150&fit=crop" },
  { id: 11, word: "GLASSES", image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=200&h=150&fit=crop" },
  { id: 12, word: "SHOES", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=150&fit=crop" },
  { id: 13, word: "A WALLET", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=200&h=150&fit=crop" },
  { id: 14, word: "A KEY", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop" },
  { id: 15, word: "A MOBILE PHONE", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=150&fit=crop" },
  { id: 16, word: "HEADPHONES", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=150&fit=crop" },
];

const vocabOptions = [
  "house", "car", "book", "TV", "shoes", "umbrella",
  "mobile phone", "backpack", "computer", "wallet"
];

const sampleQuizQuestions: QuizQuestionData[] = [
  {
    id: 1,
    prefix: "A",
    suffix: "is a bag that you carry on your back.",
    options: vocabOptions,
    correctAnswer: "backpack",
  },
  {
    id: 2,
    prefix: "A",
    suffix: "is something that you read.",
    options: vocabOptions,
    correctAnswer: "book",
  },
  {
    id: 3,
    prefix: "A",
    suffix: "is a thing you use to carry money and credit cards.",
    options: vocabOptions,
    correctAnswer: "wallet",
  },
  {
    id: 4,
    prefix: "A",
    suffix: "is something you watch for entertainment.",
    options: vocabOptions,
    correctAnswer: "TV",
  },
  {
    id: 5,
    prefix: "A",
    suffix: "is a place where people live.",
    options: vocabOptions,
    correctAnswer: "house",
  },
  {
    id: 6,
    prefix: "A",
    suffix: "is a vehicle you drive to move from one place to another.",
    options: vocabOptions,
    correctAnswer: "car",
  },
  {
    id: 7,
    prefix: "",
    suffix: "are things that you wear on your feet.",
    options: vocabOptions,
    correctAnswer: "shoes",
  },
  {
    id: 8,
    prefix: "A",
    suffix: "is a machine you use to play games and do work.",
    options: vocabOptions,
    correctAnswer: "computer",
  },
  {
    id: 9,
    prefix: "A",
    suffix: "is something you use to communicate with others.",
    options: vocabOptions,
    correctAnswer: "mobile phone",
  },
  {
    id: 10,
    prefix: "An",
    suffix: "is an object that protects you from the rain.",
    options: vocabOptions,
    correctAnswer: "umbrella",
  },
];

const sampleExampleSentences: ExampleSentenceData[] = [
  { sentence: "I live in a big {house} with my family.", keyword: "house" },
  { sentence: "He drives an expensive {car}.", keyword: "car" },
  { sentence: "I ride my {bike} in the park.", keyword: "bike" },
  { sentence: "I like to read a {book} in bed.", keyword: "book" },
  { sentence: "I use a {pen} to write at school.", keyword: "pen" },
  { sentence: "I write and draw in my {notebook}.", keyword: "notebook" },
  { sentence: "I carry my books in a {backpack}.", keyword: "backpack" },
  { sentence: "I wear a {watch} on my wrist.", keyword: "watch" },
];

const sampleRelatedTests: RelatedTestData[] = [
  {
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=150&fit=crop",
    title: "Common verbs and verb phrases – A1 English Vocabulary",
    href: "/vocabulary/a1/common-verbs",
  },
  {
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=150&fit=crop",
    title: "Opposite adjectives for describing people and things – A1 English Vocabulary",
    href: "/vocabulary/a1/opposite-adjectives",
  },
];

// ============================================
// Exercises Tab Content
// ============================================

interface ExercisesTabProps {
  lessonTitle?: string;
  lessonDescription?: string;
  exerciseTitle?: string;
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
  lessonTitle = "Common Things",
  lessonDescription,
  exerciseTitle = "Exercise 1",
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
      {/* Top Pagination */}
      <div className="flex justify-end mb-4">
        <Pagination
          current={currentExercise}
          total={totalExercises}
          onChange={onExerciseChange}
          label="연습문제:"
        />
      </div>

      {/* Lesson Title */}
      <h2
        className="text-2xl font-semibold mb-2"
        style={{ color: vocabColors.vocabulary }}
      >
        {lessonTitle}
      </h2>

      {/* Lesson Description */}
      {lessonDescription && (
        <p className="text-gray-600 mb-6">{lessonDescription}</p>
      )}

      <hr className="my-6 border-gray-200" />

      {/* Exercise Title */}
      <h3
        className="text-xl font-semibold mb-4"
        style={{ color: vocabColors.vocabulary }}
      >
        {exerciseTitle}
      </h3>

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

      {/* Check Answers Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={onCheckAnswers}
          className="px-8 py-3 rounded-lg font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
          style={{ backgroundColor: vocabColors.vocabulary }}
        >
          정답 확인
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          다시 풀기
        </button>

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
  lessonTitle?: string;
  lessonDescription?: string;
  categoryTitle?: string;
  words: VocabularyWord[];
  examples: ExampleSentenceData[];
  youtubeId?: string;
  flashcardLink?: string;
}

function ExplanationTab({
  lessonTitle = "Common Things",
  lessonDescription,
  categoryTitle,
  words,
  examples,
  youtubeId,
  flashcardLink,
}: ExplanationTabProps) {
  return (
    <div className="p-6">
      {/* Lesson Title */}
      <h2
        className="text-2xl font-semibold mb-2"
        style={{ color: vocabColors.vocabulary }}
      >
        {lessonTitle}
      </h2>

      {/* Lesson Description */}
      {lessonDescription && (
        <p className="text-gray-600 mb-6">{lessonDescription}</p>
      )}

      {/* Vocabulary Images Grid - Bordered Container */}
      <div
        className="rounded-lg p-6 mb-8"
        style={{
          border: `2px solid ${vocabColors.success}`,
          backgroundColor: "#fdfcfd",
        }}
      >
        {/* Category Title */}
        {categoryTitle && (
          <>
            <h3
              className="text-center text-2xl font-bold tracking-widest mb-1"
              style={{ color: vocabColors.vocabulary }}
            >
              {categoryTitle}
            </h3>
            <p className="text-center text-xs text-gray-400 mb-6">vocavision.kr</p>
          </>
        )}

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

      {/* Example Sentences Section */}
      <h3
        className="text-xl font-semibold mb-4"
        style={{ color: vocabColors.vocabulary }}
      >
        예문
      </h3>

      <ul
        className="p-4 rounded-lg mb-8"
        style={{
          backgroundColor: "#fdfcfd",
          borderLeft: `3px solid ${vocabColors.vocabulary}`,
          boxShadow: `inset 0 0 0 1px ${vocabColors.vocabularyLight}`,
        }}
      >
        {examples.map((example, index) => (
          <ExampleSentence
            key={index}
            number={index + 1}
            sentence={example.sentence}
            keyword={example.keyword}
          />
        ))}
      </ul>

      {/* Video Section */}
      {youtubeId && (
        <>
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: vocabColors.vocabulary }}
          >
            학습 영상: 발음과 함께 복습하기
          </h3>
          <p className="text-gray-600 mb-4">
            아래 영상을 통해 이번 레슨의 단어들을 복습하고 발음을 익혀보세요.
          </p>
          <div className="flex justify-center mb-8">
            <VideoPlayer youtubeId={youtubeId} />
          </div>
        </>
      )}

      {/* Flashcard Link Section */}
      <SectionDivider label="플래시카드" />
      <p className="text-gray-600 text-center">
        연습문제를 완료한 후,{" "}
        <a
          href={flashcardLink || "#"}
          className="font-semibold hover:underline"
          style={{ color: vocabColors.vocabulary }}
        >
          단어 플래시카드
        </a>
        를 사용하여 단어를 암기하세요.
      </p>
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
  lessonTitle?: string;
  lessonDescription?: string;
  categoryTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  words?: VocabularyWord[];
  questions?: QuizQuestionData[];
  examples?: ExampleSentenceData[];
  relatedTests?: RelatedTestData[];
  youtubeId?: string;
  flashcardLink?: string;
  totalExercises?: number;
}

export default function VocabularyPage({
  title = "Common Things – A1 English Vocabulary",
  lessonTitle = "Common Things",
  lessonDescription = "In this elementary vocabulary lesson about Common Things, you will learn about objects and things that we use in our everyday lives. Check the explanation and do the exercises.",
  categoryTitle = "COMMON THINGS",
  breadcrumbs = [
    { label: "Vocabulary", href: "/vocabulary" },
    { label: "A1 Vocabulary Lessons", href: "/vocabulary/a1" },
    { label: "Common things – A1 English Vocabulary" },
  ],
  words = sampleVocabularyWords,
  questions = sampleQuizQuestions,
  examples = sampleExampleSentences,
  relatedTests = sampleRelatedTests,
  youtubeId,
  flashcardLink,
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
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(174.2deg, rgb(255, 252, 248) 7.1%, rgba(240, 246, 238, 1) 67.4%)",
      }}
    >
      {/* Content Header */}
      <ContentHeader title={title} />

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbs} />

      {/* Main Layout */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex gap-1">
              <TabButton
                active={activeTab === "exercises"}
                onClick={() => setActiveTab("exercises")}
              >
                Exercises
              </TabButton>
              <TabButton
                active={activeTab === "explanation"}
                onClick={() => setActiveTab("explanation")}
              >
                Explanation
              </TabButton>
              <TabButton
                active={activeTab === "downloads"}
                onClick={() => setActiveTab("downloads")}
              >
                Downloads
              </TabButton>
            </div>

            {/* Tab Content */}
            <TabContainer>
              {activeTab === "exercises" && (
                <ExercisesTab
                  lessonTitle={lessonTitle}
                  lessonDescription={lessonDescription}
                  exerciseTitle={`Exercise ${currentExercise}`}
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
                  lessonTitle={lessonTitle}
                  lessonDescription={`In this A1 Elementary Vocabulary Lesson, you will learn basic words related to ${lessonTitle}. The pictures and examples below will help you understand and remember the terms.`}
                  categoryTitle={categoryTitle}
                  words={words}
                  examples={examples}
                  youtubeId={youtubeId}
                  flashcardLink={flashcardLink}
                />
              )}
              {activeTab === "downloads" && <DownloadsTab />}
            </TabContainer>

            {/* Social Share */}
            <div className="mt-8">
              <SocialShare />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <Sidebar relatedTests={relatedTests} />
          </aside>
        </div>
      </main>
    </div>
  );
}
