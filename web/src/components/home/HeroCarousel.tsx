"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export interface HeroSlide {
  id: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  bgGradient?: string;
  image?: string;
}

interface HeroCarouselProps {
  slides?: HeroSlide[];
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

const defaultSlides: HeroSlide[] = [
  {
    id: "daily-goal",
    badge: "오늘의 목표",
    badgeColor: "bg-yellow-500",
    title: "오늘 목표 20단어",
    subtitle: "매일 조금씩, 꾸준히 학습하세요",
    description: "오늘 학습할 단어가 준비되어 있어요. 지금 바로 시작해보세요!",
    ctaText: "학습 시작하기",
    ctaHref: "/learn?exam=CSAT&level=L1&demo=true",
    bgGradient: "from-blue-600 via-indigo-600 to-cyan-600",
  },
  {
    id: "new-update",
    badge: "NEW",
    badgeColor: "bg-green-500",
    title: "EBS 연계어휘 추가",
    subtitle: "4,811개 EBS 어휘 업데이트",
    description: "2027학년도 수능 EBS 연계 어휘가 추가되었습니다. 지금 바로 학습하세요!",
    ctaText: "EBS 어휘 학습",
    ctaHref: "/learn?exam=EBS",
    bgGradient: "from-emerald-600 via-teal-600 to-cyan-600",
  },
  {
    id: "teps-premium",
    badge: "PREMIUM",
    badgeColor: "bg-purple-500",
    title: "TEPS 6,278단어",
    subtitle: "TEPS 고득점을 위한 완벽 준비",
    description: "체계적인 TEPS 어휘 학습으로 목표 점수를 달성하세요.",
    ctaText: "TEPS 학습하기",
    ctaHref: "/learn?exam=TEPS",
    bgGradient: "from-teal-600 via-cyan-600 to-fuchsia-600",
  },
];

export function HeroCarousel({
  slides = defaultSlides,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  className = "",
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const timer = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isAutoPlaying, autoPlayInterval, goToNext, slides.length]);

  const currentSlide = slides[currentIndex];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slide Content */}
      <div
        className={`
          relative min-h-[280px] md:min-h-[320px] p-8 md:p-12
          bg-gradient-to-r ${currentSlide.bgGradient || "from-slate-800 to-slate-900"}
          transition-all duration-500
        `}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl">
          {/* Badge */}
          {currentSlide.badge && (
            <span
              className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white
                ${currentSlide.badgeColor || "bg-white/20"}
                animate-pulse-soft
              `}
            >
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              {currentSlide.badge}
            </span>
          )}

          {/* Title */}
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-white leading-tight">
            {currentSlide.title}
          </h2>

          {/* Subtitle */}
          {currentSlide.subtitle && (
            <p className="mt-2 text-lg md:text-xl text-white/80">{currentSlide.subtitle}</p>
          )}

          {/* Description */}
          {currentSlide.description && (
            <p className="mt-3 text-white/70 max-w-xl">{currentSlide.description}</p>
          )}

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {currentSlide.ctaHref && (
              <Link
                href={currentSlide.ctaHref}
                className="
                  inline-flex items-center gap-2 px-6 py-3
                  bg-white text-slate-900 font-semibold rounded-xl
                  hover:bg-white/90 hover:shadow-lg transition-all
                  hover:-translate-y-0.5
                "
              >
                {currentSlide.ctaText || "자세히 보기"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
            {currentSlide.secondaryCtaHref && (
              <Link
                href={currentSlide.secondaryCtaHref}
                className="
                  inline-flex items-center gap-2 px-6 py-3
                  bg-white/10 text-white font-medium rounded-xl border border-white/20
                  hover:bg-white/20 transition-colors
                "
              >
                {currentSlide.secondaryCtaText || "더 알아보기"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="
              absolute left-4 top-1/2 -translate-y-1/2 z-20
              w-10 h-10 rounded-full bg-white/20 backdrop-blur
              flex items-center justify-center text-white
              hover:bg-white/30 transition-colors
              opacity-0 group-hover:opacity-100
            "
            aria-label="이전 슬라이드"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="
              absolute right-4 top-1/2 -translate-y-1/2 z-20
              w-10 h-10 rounded-full bg-white/20 backdrop-blur
              flex items-center justify-center text-white
              hover:bg-white/30 transition-colors
              opacity-0 group-hover:opacity-100
            "
            aria-label="다음 슬라이드"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-300
                ${index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/40 hover:bg-white/60"
                }
              `}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {isAutoPlaying && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-white/60 transition-all"
            style={{
              width: "100%",
              animation: `shrink ${autoPlayInterval}ms linear`,
            }}
            key={currentIndex}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default HeroCarousel;
