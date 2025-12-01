// ============================================
// VocaVision Admin Dashboard - Stats Overview
// ============================================

'use client';

import React, { useEffect } from 'react';
import { Card, Spinner } from './ui';
import {
  DashboardStats,
  EXAM_CATEGORY_LABELS,
  LEVEL_LABELS,
  LEVEL_COLORS,
} from './types/admin.types';
import { useDashboardStats } from './hooks/useAdminApi';

// ---------------------------------------------
// Stat Card Component
// ---------------------------------------------
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtext,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {value.toLocaleString()}
          </p>
          {subtext && (
            <p className="text-sm text-slate-400 mt-1">{subtext}</p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// Progress Ring Component
// ---------------------------------------------
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  value: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  color,
  label,
  value,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-900">{progress}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{value.toLocaleString()}개</p>
      </div>
    </div>
  );
};

// ---------------------------------------------
// Bar Chart Component (Simple)
// ---------------------------------------------
interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  maxValue: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, maxValue }) => {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-16 text-sm text-slate-600 font-medium">
            {item.label}
          </div>
          <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <div className="w-12 text-sm text-slate-700 text-right">
            {item.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------
// Dashboard Stats Component
// ---------------------------------------------
interface DashboardStatsViewProps {
  onAddWord?: () => void;
  onBatchUpload?: () => void;
  onNavigateToReview?: () => void;
  onNavigateToNoContent?: () => void;
}

export const DashboardStatsView: React.FC<DashboardStatsViewProps> = ({
  onAddWord,
  onBatchUpload,
  onNavigateToReview,
  onNavigateToNoContent,
}) => {
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 text-sm text-red-500 underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate content coverage percentages
  const totalWithContent = Math.max(stats.totalWords, 1);
  const coverageData = [
    {
      label: '어원',
      value: stats.contentCoverage.hasEtymology,
      progress: Math.round((stats.contentCoverage.hasEtymology / totalWithContent) * 100),
      color: '#8B5CF6',
    },
    {
      label: '연상법',
      value: stats.contentCoverage.hasMnemonic,
      progress: Math.round((stats.contentCoverage.hasMnemonic / totalWithContent) * 100),
      color: '#F59E0B',
    },
    {
      label: '예문',
      value: stats.contentCoverage.hasExamples,
      progress: Math.round((stats.contentCoverage.hasExamples / totalWithContent) * 100),
      color: '#10B981',
    },
    {
      label: '미디어',
      value: stats.contentCoverage.hasMedia,
      progress: Math.round((stats.contentCoverage.hasMedia / totalWithContent) * 100),
      color: '#EC4899',
    },
  ];

  // Exam category data
  const examData = Object.entries(stats.byExamCategory || {}).map(([key, value]) => ({
    label: EXAM_CATEGORY_LABELS[key as keyof typeof EXAM_CATEGORY_LABELS] || key,
    value: value as number,
    color: '#FF6699',
  }));

  // Level data
  const levelData = Object.entries(stats.byLevel || {}).map(([key, value]) => ({
    label: key,
    value: value as number,
    color: LEVEL_COLORS[key as keyof typeof LEVEL_COLORS] || '#94A3B8',
  }));

  const maxExam = Math.max(...examData.map((d) => d.value), 1);
  const maxLevel = Math.max(...levelData.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
          <p className="text-slate-500 mt-1">VocaVision 콘텐츠 현황</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="전체 단어"
          value={stats.totalWords}
          color="#FF6699"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <StatCard
          title="발행됨"
          value={stats.publishedWords}
          color="#10B981"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          subtext={`${Math.round((stats.publishedWords / stats.totalWords) * 100)}% 발행률`}
        />
        <StatCard
          title="검토 대기"
          value={stats.pendingReview}
          color="#F59E0B"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="초안"
          value={stats.draftWords}
          color="#94A3B8"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Category Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            시험별 분포
          </h3>
          <BarChart data={examData} maxValue={maxExam} />
        </Card>

        {/* Level Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            난이도별 분포
          </h3>
          <BarChart data={levelData} maxValue={maxLevel} />
        </Card>
      </div>

      {/* Content Coverage */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          콘텐츠 완성도
        </h3>
        <div className="flex flex-wrap justify-around gap-6">
          {coverageData.map((item) => (
            <ProgressRing
              key={item.label}
              progress={item.progress}
              color={item.color}
              label={item.label}
              value={item.value}
            />
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          빠른 작업
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={onAddWord}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-pink-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">단어 추가</span>
          </button>

          <button
            onClick={onBatchUpload}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">배치 업로드</span>
          </button>

          <button
            onClick={onNavigateToReview}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">검토하기</span>
            {stats.pendingReview > 0 && (
              <span className="text-xs text-amber-600 font-medium">
                {stats.pendingReview}개 대기
              </span>
            )}
          </button>

          <button
            onClick={onNavigateToNoContent}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">AI 생성 필요</span>
            <span className="text-xs text-slate-500">콘텐츠 없는 단어</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default DashboardStatsView;
