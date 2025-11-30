"use client";

import { useRouter } from "next/navigation";
import {
  LessonCard,
  PageHeader,
  vocabCategoryColors,
  levelConfigs,
  sampleA1Lessons,
  type VocabularyLesson,
  type Level,
} from "./LessonCard";
import { Breadcrumb } from "./VocabComponents";

// ============================================
// Types
// ============================================

interface VocabularyCategoryPageProps {
  level?: Level;
  lessons?: VocabularyLesson[];
  categoryColor?: string;
}

// ============================================
// Footer Component
// ============================================

function Footer() {
  const levels = [
    { label: "A1 Elementary", href: "/vocabulary/a1" },
    { label: "A2 Pre-intermediate", href: "/vocabulary/a2" },
    { label: "B1 Intermediate", href: "/vocabulary/b1" },
    { label: "B1+ Upper-intermediate", href: "/vocabulary/b1-plus" },
    { label: "B2 Pre-advanced", href: "/vocabulary/b2" },
  ];

  const info = [
    { label: "About us", href: "/about" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
  ];

  const contact = [
    { label: "Contact us", href: "/contact" },
    { label: "Request a topic", href: "/request" },
  ];

  return (
    <footer className="bg-greyblue text-white pt-12 pb-8 mt-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo & Copyright */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <span className="text-emerald-400 text-2xl">✓</span>
              <span className="font-bold text-xl ml-1">VocaVision</span>
            </div>
            <p className="text-gray-400 text-sm">
              © Copyright 2024
              <br />
              vocavision.com
              <br />
              All rights reserved.
            </p>
          </div>

          {/* Levels */}
          <div>
            <h5 className="font-bold mb-4">Levels</h5>
            <ul className="space-y-2">
              {levels.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-gray-400 text-sm hover:text-emerald-400 transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h5 className="font-bold mb-4">Info</h5>
            <ul className="space-y-2">
              {info.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-gray-400 text-sm hover:text-emerald-400 transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h5 className="font-bold mb-4">Get in Touch</h5>
            <ul className="space-y-2">
              {contact.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-gray-400 text-sm hover:text-emerald-400 transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            {/* Social Icons */}
            <div className="flex space-x-3 mt-4">
              {["instagram", "facebook", "twitter", "youtube"].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com`}
                  className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center hover:bg-emerald-500 transition-colors"
                >
                  <span className="text-xs uppercase">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div>
            <a
              href="/level-test"
              className="block w-full py-2 px-4 border-2 border-white text-center rounded-md font-semibold hover:bg-emerald-500 hover:border-emerald-500 transition-all mb-3"
            >
              Take a level test
            </a>
            <a
              href="/pricing"
              className="block w-full py-2 px-4 border-2 border-white text-center rounded-md font-semibold hover:bg-emerald-500 hover:border-emerald-500 transition-all"
            >
              Upgrade to pro
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// Main Category Page Component
// ============================================

export default function VocabularyCategoryPage({
  level = "A1",
  lessons = sampleA1Lessons,
  categoryColor = vocabCategoryColors.vocabulary.primary,
}: VocabularyCategoryPageProps) {
  const router = useRouter();
  const levelConfig = levelConfigs[level];

  const handleLessonClick = (lesson: VocabularyLesson) => {
    router.push(`/vocabulary/${level.toLowerCase()}/${lesson.slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-emerald-50/30">
      {/* Page Header */}
      <PageHeader
        title={`${level} Vocabulary Lessons`}
        color={categoryColor}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4">
        <Breadcrumb
          items={[
            { label: "Vocabulary", href: "/vocabulary" },
            { label: `${level} Vocabulary Lessons` },
          ]}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Left (Ad Space) */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-400 text-sm h-60 flex items-center justify-center">
                Ad Space
              </div>
            </div>
          </aside>

          {/* Lesson Grid */}
          <section className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  categoryColor={categoryColor}
                  onClick={handleLessonClick}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Export components and types
export { Footer };
export type { VocabularyCategoryPageProps };
