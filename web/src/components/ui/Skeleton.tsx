/**
 * Skeleton Loading Components
 * 로딩 상태를 위한 스켈레톤 UI 컴포넌트
 */

'use client';

import { motion } from 'framer-motion';

// Base Skeleton with shimmer effect
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
      style={{
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

// Card Skeleton
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

// List Item Skeleton
export function SkeletonListItem() {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="w-20 h-8 rounded-lg" />
    </div>
  );
}

// Word Card Skeleton
export function SkeletonWordCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// Dashboard Stats Skeleton
export function SkeletonDashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
          <Skeleton className="h-10 w-16 mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}

// Dashboard Continue Learning Skeleton
export function SkeletonContinueLearning() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
        <Skeleton className="w-full md:w-32 h-12 rounded-xl" />
      </div>
    </div>
  );
}

// Calendar Skeleton
export function SkeletonCalendar() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div>
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div>
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-6 mx-auto rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Game Mode Card Skeleton
export function SkeletonGameCard() {
  return (
    <div className="rounded-2xl overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 bg-white">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

// Deck Card Skeleton
export function SkeletonDeckCard() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-4" />
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-4 w-8" />
      </div>
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="w-12 h-10 rounded-lg" />
      </div>
    </div>
  );
}

// Full Page Loading Skeleton
export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />

        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

// Dashboard Page Skeleton
export function SkeletonDashboard() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      {/* Hero */}
      <div className="mb-8">
        <Skeleton className="h-8 w-72 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Continue Learning */}
      <SkeletonContinueLearning />

      {/* Level Selection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Calendar */}
      <SkeletonCalendar />

      {/* Stats */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <Skeleton className="h-6 w-24 mb-4" />
        <SkeletonDashboardStats />
      </div>
    </div>
  );
}

export default Skeleton;
