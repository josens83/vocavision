"use client";

// ============================================
// Types
// ============================================

export interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}

// ============================================
// VocaVision Testimonials Data
// ============================================

export const vocaVisionTestimonials: TestimonialProps[] = [
  {
    quote: "VocaVision 덕분에 수능 영어 1등급을 받았어요! 이미지로 단어를 외우니까 정말 오래 기억에 남아요.",
    author: "김지원",
    role: "고3 수험생",
    rating: 5,
  },
  {
    quote: "토익 900점 목표였는데, 3개월 만에 달성했습니다. AI 개인화 학습이 정말 효과적이에요.",
    author: "박민수",
    role: "취업 준비생",
    rating: 5,
  },
  {
    quote: "아이들과 함께 가족 플랜으로 사용 중이에요. 학습 리포트로 진도 확인이 편리합니다.",
    author: "이현주",
    role: "학부모",
    rating: 5,
  },
  {
    quote: "연상법과 어원 학습이 정말 효과적이에요. 단순 암기보다 훨씬 재미있게 공부할 수 있어요.",
    author: "최서연",
    role: "대학생",
    rating: 5,
  },
  {
    quote: "TEPS 준비하면서 VocaVision 쓰고 있는데, 난이도별로 체계적으로 학습할 수 있어서 좋아요.",
    author: "정우진",
    role: "대학원생",
    rating: 4,
  },
  {
    quote: "출퇴근 시간에 오프라인 모드로 공부해요. 자투리 시간 활용하기 딱 좋습니다.",
    author: "한소희",
    role: "직장인",
    rating: 5,
  },
];

// ============================================
// Star Rating Component
// ============================================

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5 mb-4">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${i < rating ? "text-yellow-400" : "text-slate-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ============================================
// TestimonialCard Component
// ============================================

export function TestimonialCard({ quote, author, role, avatar, rating = 5 }: TestimonialProps) {
  const initials = author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300">
      <StarRating rating={rating} />

      <blockquote className="text-slate-700 mb-6 leading-relaxed">
        &ldquo;{quote}&rdquo;
      </blockquote>

      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={author}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
            {initials}
          </div>
        )}
        <div>
          <div className="font-semibold text-slate-900">{author}</div>
          <div className="text-sm text-slate-500">{role}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TestimonialsGrid Component
// ============================================

export function TestimonialsGrid({ children, columns = 3 }: TestimonialsGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {children}
    </div>
  );
}

// ============================================
// TestimonialsSection Component
// ============================================

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-surface-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-display-md font-bold text-slate-900 mb-4">
            사용자 후기
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            VocaVision으로 영어 실력을 향상시킨 학습자들의 이야기를 들어보세요.
          </p>
        </div>

        <TestimonialsGrid columns={3}>
          {vocaVisionTestimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </TestimonialsGrid>
      </div>
    </section>
  );
}

export default TestimonialCard;
