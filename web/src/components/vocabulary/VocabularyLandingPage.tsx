"use client";

import Link from "next/link";
import { levelConfigs, vocabCategoryColors, type Level } from "./LessonCard";
import { Breadcrumb, ContentHeader } from "./VocabComponents";

// ============================================
// Level Card Component
// ============================================

interface LevelCardProps {
  level: Level;
  lessonCount: number;
}

function LevelCard({ level, lessonCount }: LevelCardProps) {
  const config = levelConfigs[level];
  const levelSlug = level.toLowerCase().replace("+", "-plus");

  return (
    <Link href={`/vocabulary/${levelSlug}`}>
      <article className="group cursor-pointer">
        <div
          className={`
            bg-white rounded-2xl overflow-hidden
            border border-gray-100
            transition-all duration-300 ease-out
            shadow-[0_2px_8px_rgba(0,0,0,0.08)]
            hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]
            hover:-translate-y-1
          `}
        >
          {/* Level Header */}
          <div
            className="py-6 px-4 text-center"
            style={{ backgroundColor: config.badgeColor }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-3">
              <span
                className="text-2xl font-bold"
                style={{ color: config.color }}
              >
                {level}
              </span>
            </div>
            <h3 className="text-white font-semibold text-lg">{config.label}</h3>
          </div>

          {/* Content */}
          <div className="p-4 text-center">
            <p className="text-gray-600 text-sm">
              <span className="font-semibold text-gray-800">{lessonCount}</span>{" "}
              vocabulary lessons
            </p>
            <div
              className="mt-3 inline-flex items-center text-sm font-medium transition-colors group-hover:underline"
              style={{ color: vocabCategoryColors.vocabulary.primary }}
            >
              View lessons
              <svg
                className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1"
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
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ============================================
// Level Stats Data
// ============================================

const levelStats: { level: Level; count: number }[] = [
  { level: "A1", count: 17 },
  { level: "A2", count: 24 },
  { level: "B1", count: 28 },
  { level: "B1+", count: 18 },
  { level: "B2", count: 22 },
  { level: "C1", count: 15 },
];

// ============================================
// Main Landing Page Component
// ============================================

export default function VocabularyLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-emerald-50/30">
      {/* Header */}
      <ContentHeader
        title="Vocabulary Lessons"
        color={vocabCategoryColors.vocabulary.primary}
      />

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Vocabulary" },
          ]}
        />
      </div>

      {/* Intro Section */}
      <section className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
          Build Your English Vocabulary
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          Practice vocabulary with interactive exercises, images, and example sentences.
          Choose your level and start learning today!
        </p>
      </section>

      {/* Level Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {levelStats.map(({ level, count }) => (
            <LevelCard key={level} level={level} lessonCount={count} />
          ))}
        </div>
      </main>

      {/* Features Section */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Why Learn with VocaVision AI?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div
              className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: vocabCategoryColors.vocabulary.light }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: vocabCategoryColors.vocabulary.primary }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Visual Learning</h4>
            <p className="text-gray-600 text-sm">
              Learn words with images and visual context for better retention.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div
              className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: vocabCategoryColors.vocabulary.light }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: vocabCategoryColors.vocabulary.primary }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Interactive Quizzes</h4>
            <p className="text-gray-600 text-sm">
              Test your knowledge with fill-in-the-blank and multiple choice exercises.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div
              className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: vocabCategoryColors.vocabulary.light }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: vocabCategoryColors.vocabulary.primary }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Instant Feedback</h4>
            <p className="text-gray-600 text-sm">
              Get immediate feedback on your answers and track your progress.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
