/**
 * useLazyLoad Hook
 * Intersection Observer를 활용한 지연 로딩 훅
 *
 * 사용 예시:
 * ```tsx
 * const { ref, isVisible, hasLoaded } = useLazyLoad({ threshold: 0.1 });
 *
 * return (
 *   <div ref={ref}>
 *     {isVisible ? <ExpensiveComponent /> : <Skeleton />}
 *   </div>
 * );
 * ```
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface UseLazyLoadOptions {
  /** 요소가 뷰포트에 들어온 것으로 간주되는 비율 (0-1) */
  threshold?: number;
  /** 뷰포트 마진 (예: "200px") - 미리 로드 시작 */
  rootMargin?: string;
  /** 한 번 로드되면 더 이상 관찰하지 않음 */
  triggerOnce?: boolean;
  /** 초기 지연 시간 (ms) */
  delay?: number;
}

interface UseLazyLoadReturn {
  /** 관찰할 요소에 연결할 ref */
  ref: React.RefObject<HTMLDivElement | null>;
  /** 현재 뷰포트에 보이는지 여부 */
  isVisible: boolean;
  /** 한 번이라도 보였는지 여부 */
  hasLoaded: boolean;
  /** 수동으로 로드 트리거 */
  triggerLoad: () => void;
}

export function useLazyLoad({
  threshold = 0.1,
  rootMargin = "200px",
  triggerOnce = true,
  delay = 0,
}: UseLazyLoadOptions = {}): UseLazyLoadReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const triggerLoad = useCallback(() => {
    setIsVisible(true);
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Already loaded and triggerOnce is true
    if (hasLoaded && triggerOnce) return;

    // Check if IntersectionObserver is supported
    if (!("IntersectionObserver" in window)) {
      // Fallback: just show immediately
      triggerLoad();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              setHasLoaded(true);
            }, delay);
          } else {
            setIsVisible(true);
            setHasLoaded(true);
          }

          // Stop observing if triggerOnce
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, delay, hasLoaded, triggerLoad]);

  return { ref, isVisible, hasLoaded, triggerLoad };
}

export default useLazyLoad;
