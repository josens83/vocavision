"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { PLATFORM_STATS } from "@/constants/stats";

export type Level = "beginner" | "intermediate" | "advanced" | "expert";

export interface CategoryCardProps {
  title: string;
  description: string;
  level: Level;
  wordCount: number;
  href: string;
  icon?: ReactNode;
  progress?: number;
  isNew?: boolean;
}

// 미니멀 스타일 - 레벨별 색상만 유지
const levelStyles: Record<Level, {
  text: string;
  bgLight: string;
  badgeBg: string;
  badgeText: string;
  label: string;
}> = {
  beginner: {
    text: "text-green-600",
    bgLight: "bg-green-50",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    label: "Beginner",
  },
  intermediate: {
    text: "text-blue-600",
    bgLight: "bg-blue-50",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    label: "Intermediate",
  },
  advanced: {
    text: "text-orange-600",
    bgLight: "bg-orange-50",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    label: "Advanced",
  },
  expert: {
    text: "text-teal-600",
    bgLight: "bg-teal-50",
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-700",
    label: "Expert",
  },
};

const DefaultIcon = ({ level }: { level: Level }) => {
  const firstLetter = level.charAt(0).toUpperCase();
  const styles = levelStyles[level];
  return <span className={`text-4xl font-bold ${styles.text}`}>{firstLetter}</span>;
};

export function CategoryCard({ title, description, level, wordCount, href, icon, progress, isNew }: CategoryCardProps) {
  const styles = levelStyles[level];

  return (
    <Link href={href} className="group block">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-teal-300 hover:shadow-sm transition-all duration-200">
        {/* 아이콘 영역 */}
        <div className={`relative h-32 ${styles.bgLight} flex items-center justify-center`}>
          <div className="transform group-hover:scale-110 transition-transform duration-200">
            {icon || <DefaultIcon level={level} />}
          </div>

          {isNew && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-teal-500 text-white text-xs font-bold rounded-full">NEW</div>
          )}

          <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full ${styles.badgeBg} ${styles.badgeText} text-xs font-medium`}>
            {styles.label}
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="p-5">
          <h3 className={`text-lg font-semibold text-gray-900 mb-2`}>
            {title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{description}</p>

          {progress !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>진행률</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${styles.text.replace('text-', 'bg-')} rounded-full transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{wordCount.toLocaleString()}개 단어</span>
            <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-teal-50 transition-colors`}>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface CategoryGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function CategoryGrid({ children, columns = 4 }: CategoryGridProps) {
  const colsClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return <div className={`grid grid-cols-1 ${colsClass[columns]} gap-6`}>{children}</div>;
}

export const vocaVisionCategories: CategoryCardProps[] = [
  { title: "L1(기초)", description: "수능 필수 기본 어휘를 학습합니다.", level: "beginner", wordCount: PLATFORM_STATS.levels.L1, href: "/learn?exam=CSAT&level=L1" },
  { title: "L2(중급)", description: "실력 향상을 위한 중급 수준의 단어입니다.", level: "intermediate", wordCount: PLATFORM_STATS.levels.L2, href: "/learn?exam=CSAT&level=L2" },
  { title: "L3(고급)", description: "1등급 목표 고급 어휘입니다.", level: "advanced", wordCount: PLATFORM_STATS.levels.L3, href: "/learn?exam=CSAT&level=L3" },
];

// 시험 기반 카테고리
export type ExamType = "csat" | "sat" | "toefl" | "toeic" | "teps";

export interface ExamCategoryCardProps {
  title: string;
  fullName: string;
  description: string;
  examType: ExamType;
  wordCount: number;
  href: string;
  icon: string;
  isActive: boolean;
  progress?: number;
}

// 미니멀 시험 스타일
const examStyles: Record<ExamType, {
  text: string;
  bgLight: string;
  badgeBg: string;
  badgeText: string;
}> = {
  csat: {
    text: "text-blue-600",
    bgLight: "bg-blue-50",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
  },
  sat: {
    text: "text-red-600",
    bgLight: "bg-red-50",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
  },
  toefl: {
    text: "text-orange-600",
    bgLight: "bg-orange-50",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
  },
  toeic: {
    text: "text-green-600",
    bgLight: "bg-green-50",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
  },
  teps: {
    text: "text-purple-600",
    bgLight: "bg-purple-50",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
  },
};

export function ExamCategoryCard({ title, fullName, description, examType, wordCount, href, icon, isActive, progress }: ExamCategoryCardProps) {
  const styles = examStyles[examType];

  if (!isActive) {
    return (
      <div className="block opacity-60 cursor-not-allowed">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="relative h-32 bg-gray-100 flex items-center justify-center">
            <div className="text-4xl">{icon}</div>
            <div className="absolute top-3 right-3 px-2 py-1 bg-gray-200 text-gray-500 text-xs font-bold rounded-full">
              준비 중
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-semibold text-gray-400 mb-1">{title}</h3>
            <p className="text-xs text-gray-400 mb-2">{fullName}</p>
            <p className="text-sm text-gray-400 line-clamp-2 mb-4">{description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">콘텐츠 준비 중</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={href} className="group block">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-teal-300 hover:shadow-sm transition-all duration-200">
        <div className={`relative h-32 ${styles.bgLight} flex items-center justify-center`}>
          <div className="text-4xl transform group-hover:scale-110 transition-transform duration-200">
            {icon}
          </div>
          <div className={`absolute top-3 right-3 px-2 py-1 ${styles.badgeBg} ${styles.badgeText} text-xs font-bold rounded-full`}>
            학습 가능
          </div>
          <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full ${styles.badgeBg} ${styles.badgeText} text-xs font-medium`}>
            {title}
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mb-2">{fullName}</p>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{description}</p>

          {progress !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>진행률</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${styles.text.replace('text-', 'bg-')} rounded-full transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{wordCount.toLocaleString()}개 단어</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-teal-50 transition-colors">
              <svg className="w-4 h-4 text-gray-600 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export const examCategories: ExamCategoryCardProps[] = [
  {
    title: "수능",
    fullName: "대학수학능력시험",
    description: "수능 영어 1~2등급 목표 필수 어휘 (L1(기초) ~ L3(고급))",
    examType: "csat",
    wordCount: PLATFORM_STATS.csatWords,
    href: "/learn?exam=CSAT&level=L1&demo=true",
    icon: "📝",
    isActive: true,
  },
  {
    title: "SAT",
    fullName: "미국 대학입학시험",
    description: "SAT 1500+ 목표 고급 어휘",
    examType: "sat",
    wordCount: 0,
    href: "/courses/sat",
    icon: "🇺🇸",
    isActive: false,
  },
  {
    title: "TOEFL",
    fullName: "학술 영어 능력시험",
    description: "TOEFL 100+ 목표 학술 어휘",
    examType: "toefl",
    wordCount: 0,
    href: "/courses/toefl",
    icon: "🌍",
    isActive: false,
  },
  {
    title: "TOEIC",
    fullName: "국제 의사소통 영어",
    description: "TOEIC 900+ 목표 비즈니스 어휘",
    examType: "toeic",
    wordCount: 0,
    href: "/courses/toeic",
    icon: "💼",
    isActive: false,
  },
  {
    title: "TEPS",
    fullName: "서울대 영어능력시험",
    description: "TEPS 500+ 목표 심화 어휘",
    examType: "teps",
    wordCount: 0,
    href: "/courses/teps",
    icon: "🎓",
    isActive: false,
  },
];

export type StudyType = "flashcard" | "quiz" | "review" | "vocabulary";

export interface StudyTypeCardProps {
  title: string;
  description: string;
  type: StudyType;
  href: string;
  count?: number;
  countLabel?: string;
  guestHint?: string;
  requiresAuth?: boolean;
  onAuthRequired?: () => void;
}

const studyTypeStyles: Record<StudyType, { text: string; bgLight: string; icon: ReactNode }> = {
  flashcard: {
    text: "text-teal-600",
    bgLight: "bg-teal-50",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  quiz: {
    text: "text-blue-600",
    bgLight: "bg-blue-50",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  review: {
    text: "text-orange-600",
    bgLight: "bg-orange-50",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  },
  vocabulary: {
    text: "text-green-600",
    bgLight: "bg-green-50",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
};

export function StudyTypeCard({ title, description, type, href, count, countLabel = "항목", guestHint, requiresAuth, onAuthRequired }: StudyTypeCardProps) {
  const styles = studyTypeStyles[type];

  const content = (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:border-teal-300 hover:shadow-sm transition-all duration-200">
      <div className={`w-12 h-12 rounded-xl ${styles.bgLight} ${styles.text} flex items-center justify-center`}>
        {styles.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          {requiresAuth && (
            <span className="text-sm text-amber-600">🔒</span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      {count !== undefined ? (
        <div className="text-right">
          <div className={`text-2xl font-bold ${styles.text}`}>{count.toLocaleString()}</div>
          <div className="text-xs text-gray-400">{countLabel}</div>
        </div>
      ) : guestHint ? (
        <div className="text-right">
          <div className="text-sm text-gray-400">{guestHint}</div>
        </div>
      ) : null}
      <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );

  if (requiresAuth && onAuthRequired) {
    return (
      <button onClick={onAuthRequired} className="group block w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className="group block">
      {content}
    </Link>
  );
}
