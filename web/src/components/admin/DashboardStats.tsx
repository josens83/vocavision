/**
 * VocaVision Admin Dashboard Statistics
 * 대시보드 통계 컴포넌트
 */

'use client';

import React, { useEffect } from 'react';
import { Card, Spinner, ProgressBar } from './ui';
import { useDashboardStats } from '@/hooks/useAdminApi';
import {
  DashboardStats,
  EXAM_CATEGORIES,
  CEFR_LEVELS,
  CEFRLevel,
  ExamCategory,
} from '@/types/admin.types';

// ============================================
// Stats Card Component
// ============================================

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  color: 'pink' | 'purple' | 'green' | 'yellow';
}

function StatsCard({ title, value, icon, trend, color }: StatsCardProps) {
  const colorStyles = {
    pink: 'bg-voca-pink-50 text-voca-pink-500',
    purple: 'bg-voca-purple-50 text-voca-purple-500',
    green: 'bg-green-50 text-green-500',
    yellow: 'bg-yellow-50 text-yellow-500',
  };

  return (
    <Card className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorStyles[color]}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {trend && (
          <p className={`text-xs ${trend.isUp ? 'text-green-500' : 'text-red-500'}`}>
            {trend.isUp ? '+' : '-'}{Math.abs(trend.value)}% from last week
          </p>
        )}
      </div>
    </Card>
  );
}

// ============================================
// Bar Chart Component
// ============================================

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
  maxValue?: number;
}

function BarChart({ data, title, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-20 text-sm text-gray-600 truncate">{item.label}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className="w-12 text-sm text-gray-600 text-right">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================
// Content Completeness Component
// ============================================

interface CompletenessItem {
  label: string;
  value: number;
  total: number;
}

interface ContentCompletenessProps {
  items: CompletenessItem[];
}

function ContentCompleteness({ items }: ContentCompletenessProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">콘텐츠 완성도</h3>
      <div className="space-y-4">
        {items.map((item, index) => {
          const percentage = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="text-gray-900 font-medium">
                  {item.value.toLocaleString()} / {item.total.toLocaleString()} ({percentage}%)
                </span>
              </div>
              <ProgressBar
                progress={percentage}
                color={percentage >= 70 ? 'green' : percentage >= 40 ? 'blue' : 'pink'}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================
// Level Colors
// ============================================

const levelColors: Record<CEFRLevel, string> = {
  A1: '#10B981',
  A2: '#3B82F6',
  B1: '#8B5CF6',
  B2: '#F59E0B',
  C1: '#EF4444',
  C2: '#EC4899',
};

const examColors: Record<string, string> = {
  SUNEUNG: '#FF6699',
  TEPS: '#8B5CF6',
  TOEFL: '#3B82F6',
  TOEIC: '#10B981',
  IELTS: '#F59E0B',
  SAT: '#EC4899',
  GRE: '#EF4444',
  GENERAL: '#6B7280',
};

// ============================================
// DashboardStatsView Component
// ============================================

export function DashboardStatsView() {
  const { stats, loading, error, fetchStats } = useDashboardStats();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="text-voca-pink-500 hover:underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // Mock data for demo if no stats
  const displayStats: DashboardStats = stats || {
    totalWords: 0,
    publishedWords: 0,
    pendingReview: 0,
    draftWords: 0,
    byExamCategory: {} as Record<ExamCategory, number>,
    byLevel: {} as Record<CEFRLevel, number>,
    contentCompleteness: {
      hasEtymology: 0,
      hasMnemonic: 0,
      hasExamples: 0,
      hasCollocations: 0,
      hasAudio: 0,
    },
    recentActivity: [],
  };

  // Prepare chart data
  const examData = EXAM_CATEGORIES.map((cat) => ({
    label: cat.label,
    value: displayStats.byExamCategory[cat.value] || 0,
    color: examColors[cat.value] || '#6B7280',
  })).filter((d) => d.value > 0);

  const levelData = CEFR_LEVELS.map((level) => ({
    label: level,
    value: displayStats.byLevel[level] || 0,
    color: levelColors[level],
  }));

  const completenessItems: CompletenessItem[] = [
    { label: '어원 (Etymology)', value: displayStats.contentCompleteness.hasEtymology, total: displayStats.totalWords },
    { label: '연상법 (Mnemonic)', value: displayStats.contentCompleteness.hasMnemonic, total: displayStats.totalWords },
    { label: '예문 (Examples)', value: displayStats.contentCompleteness.hasExamples, total: displayStats.totalWords },
    { label: '콜로케이션', value: displayStats.contentCompleteness.hasCollocations, total: displayStats.totalWords },
    { label: '발음 오디오', value: displayStats.contentCompleteness.hasAudio, total: displayStats.totalWords },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="전체 단어"
          value={displayStats.totalWords}
          color="pink"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <StatsCard
          title="발행됨"
          value={displayStats.publishedWords}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="검토 대기"
          value={displayStats.pendingReview}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="초안"
          value={displayStats.draftWords}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {examData.length > 0 && (
          <BarChart data={examData} title="시험별 단어 분포" />
        )}
        <BarChart data={levelData} title="난이도별 단어 분포" />
      </div>

      {/* Content Completeness */}
      <ContentCompleteness items={completenessItems} />
    </div>
  );
}

export default DashboardStatsView;
