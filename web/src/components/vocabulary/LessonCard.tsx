"use client";

import { useState } from "react";

// ============================================
// Types
// ============================================

export type Level = "A1" | "A2" | "B1" | "B1+" | "B2" | "C1";

export interface LevelConfig {
  color: string;
  lightColor: string;
  badgeColor: string;
  label: string;
}

export interface VocabularyLesson {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  category: string;
  level: Level;
  levelLabel: string;
}

// ============================================
// Level Configuration
// ============================================

export const levelConfigs: Record<Level, LevelConfig> = {
  A1: {
    color: "#10B981",
    lightColor: "#D1FAE5",
    badgeColor: "#6EE7B7",
    label: "Elementary",
  },
  A2: {
    color: "#3B82F6",
    lightColor: "#DBEAFE",
    badgeColor: "#93C5FD",
    label: "Pre-intermediate",
  },
  B1: {
    color: "#8B5CF6",
    lightColor: "#EDE9FE",
    badgeColor: "#C4B5FD",
    label: "Intermediate",
  },
  "B1+": {
    color: "#F59E0B",
    lightColor: "#FEF3C7",
    badgeColor: "#FCD34D",
    label: "Upper-intermediate",
  },
  B2: {
    color: "#EF4444",
    lightColor: "#FEE2E2",
    badgeColor: "#FCA5A5",
    label: "Pre-advanced",
  },
  C1: {
    color: "#EC4899",
    lightColor: "#FCE7F3",
    badgeColor: "#F9A8D4",
    label: "Advanced",
  },
};

// ============================================
// Category Colors
// ============================================

export const vocabCategoryColors = {
  vocabulary: {
    primary: "#14B8A6",
    light: "#FFE2EB",
    header: "#14B8A6",
  },
  grammar: {
    primary: "#1A8EC1",
    light: "#ADD6E8",
    header: "#1A8EC1",
  },
  listening: {
    primary: "#FECC00",
    light: "#FFE89B",
    header: "#FECC00",
  },
  reading: {
    primary: "#ED1C24",
    light: "#F8A1A6",
    header: "#ED1C24",
  },
};

// ============================================
// Level Badge Component
// ============================================

interface LevelBadgeProps {
  level: Level;
  size?: "sm" | "md" | "lg";
}

export function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const config = levelConfigs[level] || levelConfigs.A1;

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-14 h-14 text-base",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center
        font-bold text-white shadow-lg
        border-2 border-white
        transform transition-transform duration-300
        hover:scale-110
      `}
      style={{ backgroundColor: config.badgeColor }}
    >
      {level}
    </div>
  );
}

// ============================================
// Lesson Card Component
// ============================================

interface LessonCardProps {
  lesson: VocabularyLesson;
  categoryColor?: string;
  onClick?: (lesson: VocabularyLesson) => void;
}

export function LessonCard({
  lesson,
  categoryColor = vocabCategoryColors.vocabulary.primary,
  onClick,
}: LessonCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Generate gradient background for placeholder
  const getPlaceholderGradient = (category: string) => {
    const gradients = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
      "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    ];
    const index = category.length % gradients.length;
    return gradients[index];
  };

  return (
    <article
      className="group cursor-pointer"
      onClick={() => onClick?.(lesson)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          bg-white rounded-2xl overflow-hidden
          border border-gray-100
          transition-all duration-300 ease-out
          ${
            isHovered
              ? "shadow-[0_8px_30px_rgba(0,0,0,0.12)] transform -translate-y-1"
              : "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          }
        `}
      >
        {/* Image Container */}
        <div className="relative aspect-video overflow-hidden">
          {/* Cover Image or Placeholder */}
          {imageError || !lesson.coverImage ? (
            <div
              className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${
                isHovered ? "scale-105" : "scale-100"
              }`}
              style={{ background: getPlaceholderGradient(lesson.category) }}
            >
              <div className="text-white/80 text-center px-4">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <img
              src={lesson.coverImage}
              alt={lesson.title}
              className={`
                w-full h-full object-cover
                transition-transform duration-500
                ${isHovered ? "scale-105" : "scale-100"}
              `}
              onError={() => setImageError(true)}
            />
          )}

          {/* Level Badge - Top Right */}
          <div className="absolute top-3 right-3 z-10">
            <LevelBadge level={lesson.level} size="md" />
          </div>

          {/* Category Banner - Bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <div
              className="py-2 px-3 text-white text-xs font-bold tracking-wider text-center"
              style={{ backgroundColor: categoryColor }}
            >
              {lesson.category}
            </div>
          </div>

          {/* Small Level Tag - Bottom Left */}
          <div className="absolute bottom-10 left-2">
            <span
              className="px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.9)" }}
            >
              {lesson.level}
            </span>
          </div>
        </div>

        {/* Title Section */}
        <div className="p-4">
          <h4
            className={`
              text-sm font-medium text-gray-700 leading-snug
              line-clamp-2 min-h-[2.5rem]
              transition-colors duration-300
              ${isHovered ? "text-teal-500" : ""}
            `}
          >
            {lesson.title}
          </h4>
        </div>
      </div>
    </article>
  );
}

// ============================================
// Page Header Component
// ============================================

interface PageHeaderProps {
  title: string;
  color?: string;
}

export function PageHeader({
  title,
  color = vocabCategoryColors.vocabulary.primary,
}: PageHeaderProps) {
  return (
    <header className="py-4 px-6 text-center" style={{ backgroundColor: color }}>
      <h1 className="text-xl md:text-2xl font-semibold text-white uppercase tracking-wide">
        {title}
      </h1>
    </header>
  );
}

// ============================================
// Sample Data
// ============================================

export const sampleA1Lessons: VocabularyLesson[] = [
  {
    id: "1",
    title: "Common things – A1 English Vocabulary",
    slug: "common-things",
    coverImage: "/images/common-things.jpg",
    category: "COMMON THINGS",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "2",
    title: "Common verbs and verb phrases – A1 English Vocabulary",
    slug: "common-verbs",
    coverImage: "/images/common-verbs.jpg",
    category: "COMMON VERBS",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "3",
    title: "Family and relatives – A1 English Vocabulary",
    slug: "family-relatives",
    coverImage: "/images/family.jpg",
    category: "FAMILY AND RELATIVES",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "4",
    title: "Opposite adjectives for describing people and things – A1 English Vocabulary",
    slug: "opposite-adjectives",
    coverImage: "/images/adjectives.jpg",
    category: "DESCRIBING PEOPLE & THINGS",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "5",
    title: "Daily routines – A1 English Vocabulary",
    slug: "daily-routines",
    coverImage: "/images/routines.jpg",
    category: "DAILY ROUTINES",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "6",
    title: "Days, months and seasons – A1 English Vocabulary",
    slug: "days-months-seasons",
    coverImage: "/images/calendar.jpg",
    category: "DAYS, MONTHS, SEASONS",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "7",
    title: "Food and meals – A1 English Vocabulary",
    slug: "food-meals",
    coverImage: "/images/food.jpg",
    category: "FOOD & MEALS",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "8",
    title: "Countries and nationalities – A1 English Vocabulary",
    slug: "countries-nationalities",
    coverImage: "/images/flags.jpg",
    category: "COUNTRIES & NATIONALITIES",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "9",
    title: "Shops and shopping – A1 English Vocabulary",
    slug: "shops-shopping",
    coverImage: "/images/shopping.jpg",
    category: "SHOPS & SHOPPING",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "10",
    title: "Parts of the body – A1 English Vocabulary",
    slug: "body-parts",
    coverImage: "/images/body.jpg",
    category: "PARTS OF THE BODY",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "11",
    title: "Clothes – A1 English Vocabulary",
    slug: "clothes",
    coverImage: "/images/clothes.jpg",
    category: "CLOTHES",
    level: "A1",
    levelLabel: "Elementary",
  },
  {
    id: "12",
    title: "The house: rooms, parts, and things – A1 English Vocabulary",
    slug: "house-rooms",
    coverImage: "/images/house.jpg",
    category: "THE HOUSE",
    level: "A1",
    levelLabel: "Elementary",
  },
];
