'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Sheet 높이 (vh 단위, 기본 85) */
  height?: number;
  /** 스냅 포인트 사용 여부 */
  snapPoints?: boolean;
}

/**
 * MobileSheet - 모바일 바텀 시트 컴포넌트
 *
 * 특징:
 * - 스와이프 다운으로 닫기
 * - 드래그 핸들
 * - 스냅 포인트 지원
 * - 오버레이 클릭으로 닫기
 * - 스크롤 가능한 콘텐츠
 */
export default function MobileSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 85,
  snapPoints = false,
}: MobileSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Body 스크롤 잠금 (iOS Safari 대응)
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY, 10) * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY, 10) * -1);
      }
    };
  }, [isOpen]);

  // 드래그 종료 핸들러
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const shouldClose = info.velocity.y > 500 || info.offset.y > 150;

    if (shouldClose) {
      onClose();
    }
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* 오버레이 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* 시트 */}
      <AnimatePresence onExitComplete={() => setIsAnimating(false)}>
        {isOpen && (
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={`
              fixed bottom-0 left-0 right-0 z-50
              bg-white rounded-t-3xl
              overflow-hidden
              touch-none
            `}
            style={{ maxHeight: `${height}vh` }}
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* 헤더 */}
            {title && (
              <div className="flex items-center justify-between px-4 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors touch-target"
                  aria-label="닫기"
                >
                  <svg
                    className="w-5 h-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* 콘텐츠 */}
            <div
              className="overflow-y-auto overscroll-contain p-4 touch-pan-y"
              style={{ maxHeight: `calc(${height}vh - 80px)` }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * MobileSheetTrigger - 모바일에서만 Sheet를 트리거하는 버튼
 */
interface MobileSheetTriggerProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function MobileSheetTrigger({ onClick, children, className = '' }: MobileSheetTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={`md:hidden touch-target ${className}`}
      aria-haspopup="dialog"
    >
      {children}
    </button>
  );
}
