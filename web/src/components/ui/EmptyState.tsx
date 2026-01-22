/**
 * Empty State Components
 * 데이터가 없을 때 표시할 빈 상태 UI 컴포넌트
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children?: ReactNode;
}

// Main Empty State Component
export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-12 text-center border border-gray-200"
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      )}

      {children}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-brand-primary/25 hover:-translate-y-0.5 active:scale-95"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-brand-primary/25 hover:-translate-y-0.5 active:scale-95"
              >
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </motion.div>
  );
}

// Preset Empty States for common use cases

// No Search Results
export function EmptySearchResults({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon="🔍"
      title="검색 결과 없음"
      description={query ? `"${query}"에 대한 검색 결과가 없습니다.` : '검색 결과가 없습니다.'}
      action={onClear ? { label: '검색 초기화', onClick: onClear } : undefined}
    />
  );
}

// No Data Yet (First Time User)
export function EmptyFirstTime({
  type,
  actionHref,
  actionLabel = '시작하기'
}: {
  type: 'words' | 'decks' | 'bookmarks' | 'history' | 'reviews';
  actionHref?: string;
  actionLabel?: string;
}) {
  const configs = {
    words: {
      icon: '📚',
      title: '아직 학습한 단어가 없어요',
      description: '지금 바로 첫 단어를 학습해보세요!',
      defaultHref: '/learn',
    },
    decks: {
      icon: '📂',
      title: '아직 생성한 덱이 없어요',
      description: '나만의 단어장을 만들어보세요!',
      defaultHref: '/decks/create',
    },
    bookmarks: {
      icon: '⭐',
      title: '아직 북마크한 단어가 없어요',
      description: '학습하고 싶은 단어를 북마크해보세요!',
      defaultHref: '/words',
    },
    history: {
      icon: '📊',
      title: '아직 학습 기록이 없어요',
      description: '학습을 시작하면 기록이 여기에 표시됩니다.',
      defaultHref: '/learn',
    },
    reviews: {
      icon: '✅',
      title: '복습할 단어가 없어요',
      description: '잘하고 있어요! 새로운 단어를 학습해보세요.',
      defaultHref: '/learn',
    },
  };

  const config = configs[type];

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      action={{
        label: actionLabel,
        href: actionHref || config.defaultHref,
      }}
    />
  );
}

// All Caught Up (No Pending Reviews)
export function EmptyAllCaughtUp() {
  return (
    <EmptyState
      icon="🎉"
      title="모든 복습 완료!"
      description="오늘 복습할 단어를 모두 학습했어요. 잘하고 있어요!"
      action={{
        label: '새 단어 학습하기',
        href: '/learn',
      }}
      secondaryAction={{
        label: '대시보드로',
        href: '/dashboard',
      }}
    />
  );
}

// Error Loading Data
export function EmptyError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="😢"
      title="데이터를 불러올 수 없어요"
      description="일시적인 오류가 발생했습니다. 다시 시도해주세요."
      action={onRetry ? { label: '다시 시도', onClick: onRetry } : undefined}
    />
  );
}

// Offline State
export function EmptyOffline() {
  return (
    <EmptyState
      icon="📴"
      title="오프라인 상태입니다"
      description="인터넷 연결을 확인해주세요. 일부 기능은 오프라인에서도 사용 가능합니다."
    />
  );
}

// Coming Soon
export function EmptyComingSoon({ feature }: { feature?: string }) {
  return (
    <EmptyState
      icon="🚧"
      title="준비 중이에요"
      description={feature ? `${feature} 기능이 곧 추가될 예정입니다!` : '이 기능은 곧 추가될 예정입니다!'}
      action={{
        label: '대시보드로',
        href: '/dashboard',
      }}
    />
  );
}

// No Notifications
export function EmptyNotifications({ message }: { message?: string } = {}) {
  return (
    <EmptyState
      icon="🔔"
      title="알림이 없어요"
      description={message || "새로운 알림이 도착하면 여기에 표시됩니다."}
    />
  );
}

// Quiz/Game Completion Celebratory State
export function CelebrateCompletion({
  score,
  total,
  onRetry,
  onHome,
  onNext,
  isGuest = false,
  totalProgress,
}: {
  score: number;
  total: number;
  onRetry?: () => void;
  onHome?: () => void;
  onNext?: () => void;
  /** Guest 사용자일 경우 가입 유도 CTA 표시 */
  isGuest?: boolean;
  /** 전체 진행 상황 (예: { learned: 40, total: 1000 }) */
  totalProgress?: { learned: number; total: number };
}) {
  const percentage = Math.round((score / total) * 100);
  const isPerfect = percentage === 100;
  const isGood = percentage >= 80;
  const overallPercentage = totalProgress ? Math.round((totalProgress.learned / totalProgress.total) * 100) : 0;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl p-8 text-center border border-gray-200 max-w-md mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-7xl mb-4"
      >
        {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
      </motion.div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {isPerfect ? '완벽해요!' : isGood ? '잘했어요!' : '수고했어요!'}
      </h3>

      <p className="text-gray-600 mb-4">
        {total}문제 중 {score}문제 정답
      </p>

      <div className="text-4xl font-bold text-brand-primary mb-4">
        {percentage}%
      </div>

      {/* 전체 진행 상황 표시 */}
      {totalProgress && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>전체 진행</span>
            <span className="font-medium">{totalProgress.learned}/{totalProgress.total} 단어 ({overallPercentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full transition-all"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* 다음 20개 학습 버튼 - 가장 눈에 띄게 */}
        {onNext && (
          <button
            onClick={onNext}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-pink-500/25"
          >
            다음 20개 학습 →
          </button>
        )}

        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95"
            >
              다시 도전
            </button>
          )}
          {onHome && (
            <button
              onClick={onHome}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95"
            >
              홈으로
            </button>
          )}
        </div>
      </div>

      {/* Guest 사용자에게 가입 유도 */}
      {isGuest && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-xl p-4">
            <p className="text-sm text-gray-700 mb-3">
              가입하면 학습 기록이 저장되고,<br />
              내일 자동으로 복습을 추천받을 수 있어요!
            </p>
            <div className="flex gap-2 justify-center">
              <Link
                href="/auth/register"
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                무료로 가입하기
              </Link>
              <Link
                href="/auth/login"
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition-colors"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default EmptyState;
