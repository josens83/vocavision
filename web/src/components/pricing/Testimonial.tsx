"use client";

import { ReactNode } from "react";

// ============================================
// Quote Icon Component
// ============================================

function QuoteIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-8 h-8 text-green-200 ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
    </svg>
  );
}

// ============================================
// Avatar Initials Component
// ============================================

interface AvatarInitialsProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarInitials({ name, size = "md" }: AvatarInitialsProps) {
  // Extract initials from name (first letter of each word, max 2)
  const initials = name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center font-semibold text-green-700`}
    >
      {initials}
    </div>
  );
}

// ============================================
// Testimonial Card Component
// ============================================

export interface TestimonialProps {
  quote: string;
  authorName: string;
  authorTitle?: string;
  avatarUrl?: string;
}

export function TestimonialCard({
  quote,
  authorName,
  authorTitle,
  avatarUrl,
}: TestimonialProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center text-center gap-4 h-full">
      {/* Quote Icon */}
      <QuoteIcon />

      {/* Quote Text */}
      <p className="text-slate-600 text-sm leading-relaxed flex-1">
        {quote}
      </p>

      {/* Author */}
      <div className="flex flex-col items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover border-2 border-green-400"
          />
        ) : (
          <AvatarInitials name={authorName} />
        )}
        <div>
          <p className="font-semibold text-slate-800">{authorName}</p>
          {authorTitle && (
            <p className="text-xs text-slate-500">{authorTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Testimonials Grid Component
// ============================================

interface TestimonialsGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function TestimonialsGrid({ children, columns = 3 }: TestimonialsGridProps) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${colsClass[columns]} gap-6 max-w-5xl mx-auto`}>
      {children}
    </div>
  );
}

// ============================================
// Default Testimonials for VocaVision
// ============================================

export const vocaVisionTestimonials: TestimonialProps[] = [
  {
    quote:
      "VocaVision AI를 사용한 후 영어 단어 암기가 훨씬 쉬워졌어요. AI 이미지와 플래시카드가 정말 효과적이고, 매일 학습하는 게 즐거워졌습니다. TOEIC 점수도 100점이나 올랐어요!",
    authorName: "김민지",
    authorTitle: "대학생",
  },
  {
    quote:
      "간격 반복 학습 시스템이 정말 과학적이에요! 잊어버릴 때쯤 복습 알림이 와서 효율적으로 암기할 수 있었습니다. UI도 깔끔하고 사용하기 편해요.",
    authorName: "이준호",
    authorTitle: "직장인",
  },
  {
    quote:
      "영어 학원 강사로서 학생들에게 VocaVision AI를 추천하고 있어요. 학생들의 동기부여에 효과적이고, AI 이미지가 기억에 오래 남아서 더 효과적으로 공부하게 만들어요.",
    authorName: "박서연",
    authorTitle: "영어 강사",
  },
];
