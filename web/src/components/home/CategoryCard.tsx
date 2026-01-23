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

const levelStyles: Record<Level, {
  text: string;
  bg: string;
  bgLight: string;
  border: string;
  shadow: string;
  gradient: string;
  label: string;
}> = {
  beginner: {
    text: "text-level-beginner",
    bg: "bg-level-beginner",
    bgLight: "bg-level-beginner-light",
    border: "hover:border-level-beginner",
    shadow: "hover:shadow-glow-green",
    gradient: "from-level-beginner to-level-beginner-dark",
    label: "Beginner",
  },
  intermediate: {
    text: "text-level-intermediate",
    bg: "bg-level-intermediate",
    bgLight: "bg-level-intermediate-light",
    border: "hover:border-level-intermediate",
    shadow: "hover:shadow-glow-blue",
    gradient: "from-level-intermediate to-level-intermediate-dark",
    label: "Intermediate",
  },
  advanced: {
    text: "text-level-advanced",
    bg: "bg-level-advanced",
    bgLight: "bg-level-advanced-light",
    border: "hover:border-level-advanced",
    shadow: "hover:shadow-glow-orange",
    gradient: "from-level-advanced to-level-advanced-dark",
    label: "Advanced",
  },
  expert: {
    text: "text-level-expert",
    bg: "bg-level-expert",
    bgLight: "bg-level-expert-light",
    border: "hover:border-level-expert",
    shadow: "hover:shadow-glow-purple",
    gradient: "from-level-expert to-level-expert-dark",
    label: "Expert",
  },
};

const DefaultIcon = ({ level }: { level: Level }) => {
  const firstLetter = level.charAt(0).toUpperCase();
  return <span className="text-5xl font-display font-bold opacity-80">{firstLetter}</span>;
};

export function CategoryCard({ title, description, level, wordCount, href, icon, progress, isNew }: CategoryCardProps) {
  const styles = levelStyles[level];

  return (
    <Link href={href} className="group block">
      <div className={`card overflow-hidden ${styles.border} ${styles.shadow} transition-all duration-300 ease-out`}>
        <div className={`relative h-36 ${styles.bgLight} flex items-center justify-center overflow-hidden`}>
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id={`grid-${level}`} width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.5" fill="currentColor" className={styles.text} />
                </pattern>
              </defs>
              <rect width="100" height="100" fill={`url(#grid-${level})`} />
            </svg>
          </div>

          <div className={`relative z-10 ${styles.text} transform group-hover:scale-110 transition-transform duration-300`}>
            {icon || <DefaultIcon level={level} />}
          </div>

          {isNew && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-study-flashcard text-slate-900 text-xs font-bold rounded-full">NEW</div>
          )}

          <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full ${styles.bg} text-white text-xs font-medium`}>
            {styles.label}
          </div>
        </div>

        <div className="p-5">
          <h3 className={`text-lg font-display font-semibold mb-2 ${styles.text} group-hover:translate-x-1 transition-transform duration-200`}>
            {title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">{description}</p>

          {progress !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>진행률</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className={`progress-bar__fill bg-gradient-to-r ${styles.gradient}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{wordCount.toLocaleString()}개 단어</span>
            <div className={`w-8 h-8 rounded-full ${styles.bgLight} flex items-center justify-center transform group-hover:translate-x-1 transition-all duration-200`}>
              <svg className={`w-4 h-4 ${styles.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  { title: "L1 기초", description: "수능 필수 기본 어휘를 학습합니다.", level: "beginner", wordCount: PLATFORM_STATS.levels.L1, href: "/learn?exam=CSAT&level=L1" },
  { title: "L2 중급", description: "실력 향상을 위한 중급 수준의 단어입니다.", level: "intermediate", wordCount: PLATFORM_STATS.levels.L2, href: "/learn?exam=CSAT&level=L2" },
  { title: "L3 고급", description: "1등급 목표 고급 어휘입니다.", level: "advanced", wordCount: PLATFORM_STATS.levels.L3, href: "/learn?exam=CSAT&level=L3" },
];

// 시험 기반 카테고리 (새로 추가)
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

const examStyles: Record<ExamType, {
  text: string;
  bg: string;
  bgLight: string;
  border: string;
  gradient: string;
}> = {
  csat: {
    text: "text-blue-600",
    bg: "bg-blue-500",
    bgLight: "bg-blue-50",
    border: "hover:border-blue-400",
    gradient: "from-blue-500 to-blue-600",
  },
  sat: {
    text: "text-red-600",
    bg: "bg-red-500",
    bgLight: "bg-red-50",
    border: "hover:border-red-400",
    gradient: "from-red-500 to-red-600",
  },
  toefl: {
    text: "text-orange-600",
    bg: "bg-orange-500",
    bgLight: "bg-orange-50",
    border: "hover:border-orange-400",
    gradient: "from-orange-500 to-orange-600",
  },
  toeic: {
    text: "text-green-600",
    bg: "bg-green-500",
    bgLight: "bg-green-50",
    border: "hover:border-green-400",
    gradient: "from-green-500 to-green-600",
  },
  teps: {
    text: "text-purple-600",
    bg: "bg-purple-500",
    bgLight: "bg-purple-50",
    border: "hover:border-purple-400",
    gradient: "from-purple-500 to-cyan-600",
  },
};

export function ExamCategoryCard({ title, fullName, description, examType, wordCount, href, icon, isActive, progress }: ExamCategoryCardProps) {
  const styles = examStyles[examType];

  if (!isActive) {
    return (
      <div className="block opacity-60 cursor-not-allowed">
        <div className={`card overflow-hidden border-gray-200 transition-all duration-300`}>
          <div className={`relative h-36 bg-gray-100 flex items-center justify-center overflow-hidden`}>
            <div className="text-5xl">{icon}</div>
            <div className="absolute top-3 right-3 px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">
              준비 중
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-display font-semibold mb-1 text-gray-400">{title}</h3>
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
      <div className={`card overflow-hidden ${styles.border} hover:shadow-lg transition-all duration-300`}>
        <div className={`relative h-36 ${styles.bgLight} flex items-center justify-center overflow-hidden`}>
          <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div className={`absolute top-3 right-3 px-2 py-1 ${styles.bg} text-white text-xs font-bold rounded-full`}>
            학습 가능
          </div>
          <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full ${styles.bg} text-white text-xs font-medium`}>
            {title}
          </div>
        </div>

        <div className="p-5">
          <h3 className={`text-lg font-display font-semibold mb-1 ${styles.text} group-hover:translate-x-1 transition-transform duration-200`}>
            {title}
          </h3>
          <p className="text-xs text-slate-500 mb-2">{fullName}</p>
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">{description}</p>

          {progress !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>진행률</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className={`progress-bar__fill bg-gradient-to-r ${styles.gradient}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{wordCount.toLocaleString()}개 단어</span>
            <div className={`w-8 h-8 rounded-full ${styles.bgLight} flex items-center justify-center transform group-hover:translate-x-1 transition-all duration-200`}>
              <svg className={`w-4 h-4 ${styles.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    description: "수능 영어 1~2등급 목표 필수 어휘 (L1 기초 ~ L3 고급)",
    examType: "csat",
    wordCount: PLATFORM_STATS.totalWords,
    href: "/learn?exam=CSAT",
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
  /** 비로그인 시 표시할 힌트 메시지 */
  guestHint?: string;
  /** 로그인 필요 여부 (true면 비로그인 시 모달 표시) */
  requiresAuth?: boolean;
  /** 로그인 필요 시 클릭 핸들러 */
  onAuthRequired?: () => void;
}

const studyTypeStyles: Record<StudyType, { text: string; bgLight: string; icon: ReactNode }> = {
  flashcard: {
    text: "text-study-flashcard-dark",
    bgLight: "bg-study-flashcard-light",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  quiz: {
    text: "text-study-quiz-dark",
    bgLight: "bg-study-quiz-light",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  review: {
    text: "text-study-review-dark",
    bgLight: "bg-study-review-light",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  },
  vocabulary: {
    text: "text-study-vocabulary-dark",
    bgLight: "bg-study-vocabulary-light",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
};

export function StudyTypeCard({ title, description, type, href, count, countLabel = "항목", guestHint, requiresAuth, onAuthRequired }: StudyTypeCardProps) {
  const styles = studyTypeStyles[type];

  const content = (
    <div className="card p-5 flex items-center gap-4 hover:border-slate-300 transition-all duration-200">
      <div className={`w-14 h-14 rounded-xl ${styles.bgLight} ${styles.text} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
        {styles.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-slate-600 transition-colors">{title}</h4>
          {requiresAuth && (
            <span className="text-sm text-amber-600">🔒</span>
          )}
        </div>
        <p className="text-sm text-slate-500 truncate">{description}</p>
      </div>
      {count !== undefined ? (
        <div className="text-right">
          <div className={`text-2xl font-display font-bold ${styles.text}`}>{count.toLocaleString()}</div>
          <div className="text-xs text-slate-400">{countLabel}</div>
        </div>
      ) : guestHint ? (
        <div className="text-right">
          <div className="text-sm text-slate-400">{guestHint}</div>
        </div>
      ) : null}
      <svg className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );

  // 로그인 필요한 카드면 버튼으로 처리
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
