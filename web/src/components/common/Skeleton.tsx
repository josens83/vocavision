// /web/src/components/common/Skeleton.tsx
// 스켈레톤 로딩 컴포넌트 모음

'use client';

const cn = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(' ');

interface SkeletonProps {
  className?: string;
}

/**
 * 기본 스켈레톤 블록
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gray-200',
        className
      )}
    />
  );
}

/**
 * 텍스트 스켈레톤 - 여러 줄의 텍스트 로딩
 */
export function SkeletonText({
  lines = 3,
  className = ''
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * 카드 스켈레톤 - 이미지 + 텍스트 카드
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border overflow-hidden', className)}>
      {/* 이미지 영역 */}
      <Skeleton className="aspect-[4/3] rounded-none" />

      {/* 컨텐츠 영역 */}
      <div className="p-4 space-y-3">
        {/* 레벨 뱃지 + 카테고리 */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-5 rounded" />
          <Skeleton className="w-20 h-4" />
        </div>

        {/* 제목 */}
        <Skeleton className="h-5 w-3/4" />

        {/* 설명 */}
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

/**
 * 리스트 아이템 스켈레톤
 */
export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={cn(
      'flex items-center gap-4 p-4 bg-white rounded-xl border',
      className
    )}>
      {/* 레벨 뱃지 */}
      <Skeleton className="w-10 h-6 rounded" />

      {/* 텍스트 */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* 우측 아이콘/액션 */}
      <Skeleton className="w-16 h-4" />
    </div>
  );
}

/**
 * 캘린더 스켈레톤 - 스트릭 캘린더용
 */
export function SkeletonCalendar({ className = '' }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border p-6', className)}>
      {/* 헤더 */}
      <Skeleton className="h-6 w-24 mb-4" />

      {/* 통계 */}
      <div className="flex gap-6 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, week) => (
          <div key={week} className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, day) => (
              <Skeleton
                key={day}
                className="aspect-square rounded-lg"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 단어 카드 스켈레톤 - WordCard용
 */
export function SkeletonWordCard({
  variant = 'default',
  className = ''
}: {
  variant?: 'default' | 'compact' | 'mini';
  className?: string;
}) {
  if (variant === 'mini') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Skeleton className="w-8 h-5 rounded" />
        <Skeleton className="w-16 h-4" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-3 p-3 bg-white rounded-xl border',
        className
      )}>
        <Skeleton className="w-10 h-6 rounded" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
    );
  }

  // default variant
  return (
    <div className={cn(
      'bg-white rounded-2xl border overflow-hidden',
      className
    )}>
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-5 rounded" />
          <Skeleton className="w-16 h-4" />
        </div>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

/**
 * 스터디 타입 카드 스켈레톤
 */
export function SkeletonStudyCard({ className = '' }: { className?: string }) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border p-5 space-y-4',
      className
    )}>
      {/* 아이콘 */}
      <Skeleton className="w-12 h-12 rounded-xl" />

      {/* 제목 + 설명 */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-full" />
      </div>

      {/* 통계 */}
      <div className="flex justify-between">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-12 h-4" />
      </div>
    </div>
  );
}

/**
 * 프로필/아바타 스켈레톤
 */
export function SkeletonAvatar({
  size = 'md',
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <Skeleton
      className={cn(
        'rounded-full',
        sizeClasses[size],
        className
      )}
    />
  );
}

/**
 * 통계 카드 스켈레톤
 */
export function SkeletonStatsCard({ className = '' }: { className?: string }) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border p-6',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/**
 * 네비게이션 스켈레톤
 */
export function SkeletonNav({ className = '' }: { className?: string }) {
  return (
    <div className={cn(
      'flex items-center justify-between p-4 bg-white border-b',
      className
    )}>
      {/* 로고 */}
      <Skeleton className="w-32 h-8" />

      {/* 네비게이션 링크 */}
      <div className="hidden md:flex items-center gap-6">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-16 h-4" />
      </div>

      {/* 우측 액션 */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-20 h-9 rounded-lg" />
      </div>
    </div>
  );
}

export default Skeleton;
