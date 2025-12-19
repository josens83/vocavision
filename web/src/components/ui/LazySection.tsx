"use client";

import { ReactNode } from "react";
import { useLazyLoad } from "@/hooks/useLazyLoad";

interface LazySectionProps {
  children: ReactNode;
  /** 로딩 중 표시할 폴백 UI */
  fallback?: ReactNode;
  /** 섹션 최소 높이 (레이아웃 시프트 방지) */
  minHeight?: string | number;
  /** Intersection Observer 옵션 */
  threshold?: number;
  rootMargin?: string;
  /** 애니메이션 클래스 */
  animationClass?: string;
  /** 섹션 ID (앵커 링크용) */
  id?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * LazySection - 스크롤 시 콘텐츠를 지연 로드하는 섹션 래퍼
 *
 * 사용 예시:
 * ```tsx
 * <LazySection fallback={<SkeletonCard />} minHeight={400}>
 *   <ExpensiveDataComponent />
 * </LazySection>
 * ```
 */
export function LazySection({
  children,
  fallback = <DefaultSkeleton />,
  minHeight = 200,
  threshold = 0.1,
  rootMargin = "200px",
  animationClass = "animate-fade-in-up",
  id,
  className = "",
}: LazySectionProps) {
  const { ref, isVisible, hasLoaded } = useLazyLoad({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      id={id}
      className={className}
      style={{
        minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
      }}
    >
      {hasLoaded ? (
        <div className={isVisible ? animationClass : ""}>
          {children}
        </div>
      ) : (
        fallback
      )}
    </section>
  );
}

function DefaultSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default LazySection;
