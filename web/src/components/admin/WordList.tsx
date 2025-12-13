// ============================================
// VocaVision Admin Dashboard - Word List
// ============================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Badge,
  Card,
  Input,
  Select,
  Checkbox,
  Spinner,
  EmptyState,
  Modal,
  Alert,
} from './ui';
import {
  VocaWord,
  WordFilters,
  ExamCategory,
  DifficultyLevel,
  ContentStatus,
  EXAM_CATEGORY_LABELS,
  LEVEL_LABELS,
  LEVEL_SHORT_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  LEVEL_COLORS,
} from './types/admin.types';
import { useWordList, apiClient } from './hooks/useAdminApi';

// ---------------------------------------------
// Filter Panel Component
// ---------------------------------------------
interface FilterPanelProps {
  filters: WordFilters;
  onFilterChange: (filters: Partial<WordFilters>) => void;
  onReset: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const examOptions = Object.entries(EXAM_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const levelOptions = Object.entries(LEVEL_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const toggleExamCategory = (cat: ExamCategory) => {
    const current = filters.examCategories || [];
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    onFilterChange({ examCategories: updated });
  };

  const toggleLevel = (level: DifficultyLevel) => {
    const current = filters.levels || [];
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    onFilterChange({ levels: updated });
  };

  const toggleStatus = (status: ContentStatus) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onFilterChange({ status: updated });
  };

  return (
    <Card padding="sm" className="mb-4">
      {/* Search & Toggle */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="단어 검색..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          필터
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <Button variant="ghost" size="sm" onClick={onReset}>
          초기화
        </Button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
          {/* Exam Categories */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              시험 카테고리
            </label>
            <div className="flex flex-wrap gap-2">
              {examOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleExamCategory(opt.value as ExamCategory)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.examCategories?.includes(opt.value as ExamCategory)
                      ? 'bg-pink-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Levels */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              난이도
            </label>
            <div className="flex flex-wrap gap-2">
              {levelOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleLevel(opt.value as DifficultyLevel)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.levels?.includes(opt.value as DifficultyLevel)
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={
                    filters.levels?.includes(opt.value as DifficultyLevel)
                      ? { backgroundColor: LEVEL_COLORS[opt.value as DifficultyLevel] }
                      : {}
                  }
                >
                  {opt.value}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              상태
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleStatus(opt.value as ContentStatus)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.status?.includes(opt.value as ContentStatus)
                      ? `${STATUS_COLORS[opt.value as ContentStatus].bg} ${STATUS_COLORS[opt.value as ContentStatus].text}`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Has Content */}
          <div className="flex items-center gap-4">
            <label className="block text-sm font-medium text-slate-700">
              콘텐츠 여부
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="hasContent"
                  checked={filters.hasContent === null}
                  onChange={() => onFilterChange({ hasContent: null })}
                  className="text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm text-slate-600">전체</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="hasContent"
                  checked={filters.hasContent === true}
                  onChange={() => onFilterChange({ hasContent: true })}
                  className="text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm text-slate-600">있음</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="hasContent"
                  checked={filters.hasContent === false}
                  onChange={() => onFilterChange({ hasContent: false })}
                  className="text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm text-slate-600">없음</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// ---------------------------------------------
// Word Table Component
// ---------------------------------------------
interface WordTableProps {
  words: VocaWord[];
  loading: boolean;
  onRowClick: (word: VocaWord) => void;
  onGenerateClick: (word: VocaWord) => void;
  onDeleteClick?: (wordId: string, wordName: string) => void;
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
}

const WordTable: React.FC<WordTableProps> = ({
  words,
  loading,
  onRowClick,
  onGenerateClick,
  onDeleteClick,
  selectedIds,
  onSelectChange,
}) => {
  const toggleAll = () => {
    if (selectedIds.length === words.length) {
      onSelectChange([]);
    } else {
      onSelectChange(words.map((w) => w.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <EmptyState
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        }
        title="단어가 없습니다"
        description="검색 조건을 변경하거나 새 단어를 추가해보세요."
        action={<Button variant="primary">단어 추가</Button>}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedIds.length === words.length && words.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
              단어
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
              난이도
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
              시험
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
              상태
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
              콘텐츠
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
              액션
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {words.map((word) => (
            <tr
              key={word.id}
              className="hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => onRowClick(word)}
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(word.id)}
                  onChange={() => toggleOne(word.id)}
                  className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {word.content?.primaryGifUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={word.content.primaryGifUrl}
                        alt={word.word}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-pink-500">
                        {word.word[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{word.word}</p>
                    {word.partOfSpeech && (
                      <p className="text-xs text-slate-400">
                        {Array.isArray(word.partOfSpeech) ? word.partOfSpeech.join(', ') : word.partOfSpeech}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: LEVEL_COLORS[word.level] || '#6B7280' }}
                  title={LEVEL_LABELS[word.level] || word.level}
                >
                  {LEVEL_SHORT_LABELS[word.level] || word.level}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {/* Show exam-level mappings if available */}
                  {word.examLevels && word.examLevels.length > 0 ? (
                    <>
                      {word.examLevels.slice(0, 2).map((el, idx) => (
                        <span
                          key={`${el.examCategory}-${el.level}-${idx}`}
                          title={`${EXAM_CATEGORY_LABELS[el.examCategory]} - ${LEVEL_SHORT_LABELS[el.displayLevel]}`}
                        >
                          <Badge color="pink" size="sm">
                            {EXAM_CATEGORY_LABELS[el.examCategory]}-{el.level}
                          </Badge>
                        </span>
                      ))}
                      {word.examLevels.length > 2 && (
                        <Badge color="gray" size="sm">
                          +{word.examLevels.length - 2}
                        </Badge>
                      )}
                    </>
                  ) : (
                    /* Fallback to examCategories for backward compatibility */
                    <>
                      {(word.examCategories || []).slice(0, 2).map((cat) => (
                        <Badge key={cat} color="pink" size="sm">
                          {EXAM_CATEGORY_LABELS[cat]}
                        </Badge>
                      ))}
                      {(word.examCategories?.length || 0) > 2 && (
                        <Badge color="gray" size="sm">
                          +{(word.examCategories?.length || 0) - 2}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  color={
                    word.status === 'PUBLISHED'
                      ? 'green'
                      : word.status === 'APPROVED'
                      ? 'blue'
                      : word.status === 'PENDING_REVIEW'
                      ? 'yellow'
                      : 'gray'
                  }
                >
                  {STATUS_LABELS[word.status]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {word.content ? (
                  <div className="flex items-center gap-1">
                    {word.content.humanReviewed ? (
                      <span className="text-emerald-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    ) : (
                      <span className="text-amber-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                    <span className="text-sm text-slate-500">AI 생성됨</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">없음</span>
                )}
              </td>
              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  {/* AI 생성/재생성 버튼 */}
                  <button
                    onClick={() => onGenerateClick(word)}
                    className={`p-2 rounded-lg transition-colors ${
                      word.content
                        ? 'text-amber-500 hover:bg-amber-50'
                        : 'text-purple-500 hover:bg-purple-50'
                    }`}
                    title={word.content ? 'AI 콘텐츠 재생성' : 'AI 콘텐츠 생성'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {word.content ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      )}
                    </svg>
                  </button>
                  {/* 삭제 버튼 */}
                  {onDeleteClick && (
                    <button
                      onClick={() => onDeleteClick(word.id, word.word)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------
// Pagination Component
// ---------------------------------------------
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}) => {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
      <div className="text-sm text-slate-500">
        전체 <span className="font-medium text-slate-900">{total.toLocaleString()}</span>개 중{' '}
        <span className="font-medium text-slate-900">{start.toLocaleString()}</span>-
        <span className="font-medium text-slate-900">{end.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  page === pageNum
                    ? 'bg-pink-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------
// Main WordList Component
// ---------------------------------------------
interface WordListProps {
  onWordSelect: (word: VocaWord) => void;
  onAddWord: () => void;
  onBatchUpload: () => void;
  onGenerateContent: (word: VocaWord) => void;
  /** 여러 단어 일괄 AI 생성 */
  onBatchGenerate?: (wordIds: string[]) => void;
  /** 단어 삭제 */
  onDeleteWord?: (wordId: string) => void;
  /** 초기 필터 설정 (검토 대기 목록 등에서 사용) */
  initialFilters?: Partial<WordFilters>;
  /** 헤더 타이틀 커스텀 */
  title?: string;
  /** 필터 패널 숨기기 */
  hideFilters?: boolean;
  /** 추가/배치 버튼 숨기기 */
  hideActions?: boolean;
}

// Status change options for bulk update
const BULK_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '초안', color: 'gray' },
  { value: 'PENDING_REVIEW', label: '검토 대기', color: 'yellow' },
  { value: 'APPROVED', label: '승인', color: 'blue' },
  { value: 'PUBLISHED', label: '발행', color: 'green' },
] as const;

export const WordList: React.FC<WordListProps> = ({
  onWordSelect,
  onAddWord,
  onBatchUpload,
  onGenerateContent,
  onBatchGenerate,
  onDeleteWord,
  initialFilters = {},
  title = '단어 관리',
  hideFilters = false,
  hideActions = false,
}) => {
  const { words, pagination, loading, error, fetchWords } = useWordList();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk Status Change Modal State
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<string>('APPROVED');
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);
  const [bulkStatusError, setBulkStatusError] = useState<string | null>(null);
  const [bulkStatusSuccess, setBulkStatusSuccess] = useState(false);

  // Quick bulk action loading state
  const [quickActionLoading, setQuickActionLoading] = useState(false);

  const [filters, setFilters] = useState<WordFilters>({
    search: '',
    examCategories: [],
    levels: [],
    status: [],
    hasContent: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch words when filters change
  useEffect(() => {
    fetchWords({ ...filters, search: debouncedSearch });
  }, [fetchWords, debouncedSearch, filters.examCategories, filters.levels, filters.status, filters.hasContent, filters.sortBy, filters.sortOrder, filters.page, filters.limit]);

  const handleFilterChange = useCallback((updates: Partial<WordFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      examCategories: [],
      levels: [],
      status: [],
      hasContent: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // Handle bulk status change
  const handleBulkStatusChange = async () => {
    if (selectedIds.length === 0) return;

    setBulkStatusLoading(true);
    setBulkStatusError(null);
    setBulkStatusSuccess(false);

    try {
      const result = await apiClient<{ updated: number; message: string }>(
        '/admin/words/bulk-status',
        {
          method: 'POST',
          body: JSON.stringify({
            wordIds: selectedIds,
            status: bulkStatusTarget,
          }),
        }
      );

      setBulkStatusSuccess(true);
      // Refresh word list after 1.5 seconds
      setTimeout(() => {
        setShowBulkStatusModal(false);
        setBulkStatusSuccess(false);
        setSelectedIds([]);
        fetchWords({ ...filters, search: debouncedSearch });
      }, 1500);
    } catch (err) {
      setBulkStatusError(err instanceof Error ? err.message : '상태 변경 실패');
    } finally {
      setBulkStatusLoading(false);
    }
  };

  // Quick bulk approve (direct without modal)
  const handleQuickBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`${selectedIds.length}개 단어를 승인하시겠습니까?`)) return;

    setQuickActionLoading(true);
    try {
      await apiClient<{ updated: number }>(
        '/admin/words/bulk-status',
        {
          method: 'POST',
          body: JSON.stringify({
            wordIds: selectedIds,
            status: 'APPROVED',
          }),
        }
      );
      alert(`${selectedIds.length}개 단어가 승인되었습니다.`);
      setSelectedIds([]);
      fetchWords({ ...filters, search: debouncedSearch });
    } catch (err) {
      alert(`승인 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setQuickActionLoading(false);
    }
  };

  // Quick bulk publish (direct without modal)
  const handleQuickBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`${selectedIds.length}개 단어를 발행하시겠습니까?`)) return;

    setQuickActionLoading(true);
    try {
      await apiClient<{ updated: number }>(
        '/admin/words/bulk-status',
        {
          method: 'POST',
          body: JSON.stringify({
            wordIds: selectedIds,
            status: 'PUBLISHED',
          }),
        }
      );
      alert(`${selectedIds.length}개 단어가 발행되었습니다.`);
      setSelectedIds([]);
      fetchWords({ ...filters, search: debouncedSearch });
    } catch (err) {
      alert(`발행 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setQuickActionLoading(false);
    }
  };

  // Handle single word delete
  const handleDeleteWord = async (wordId: string, wordName: string) => {
    if (!confirm(`"${wordName}" 단어를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      await apiClient(`/admin/words/${wordId}`, { method: 'DELETE' });
      alert('단어가 삭제되었습니다.');
      fetchWords({ ...filters, search: debouncedSearch });
    } catch (err) {
      alert(`삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  // Close modal and reset states
  const handleCloseBulkStatusModal = () => {
    setShowBulkStatusModal(false);
    setBulkStatusError(null);
    setBulkStatusSuccess(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1">
            전체 {pagination.total.toLocaleString()}개 단어
          </p>
        </div>
        {!hideActions && (
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBatchUpload}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              배치 업로드
            </Button>
            <Button variant="primary" onClick={onAddWord}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              단어 추가
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      {!hideFilters && (
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      )}

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-pink-700">
            <strong>{selectedIds.length}</strong>개 선택됨
          </span>
          <div className="flex items-center gap-2">
            {/* Quick Bulk Approve */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleQuickBulkApprove}
              disabled={quickActionLoading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              일괄 승인
            </Button>
            {/* Quick Bulk Publish */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleQuickBulkPublish}
              disabled={quickActionLoading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              일괄 발행
            </Button>
            {/* AI Batch Generate */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (onBatchGenerate) {
                  onBatchGenerate(selectedIds);
                  // Don't clear selection here - modal will handle completion
                }
              }}
              className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              🎨 AI 이미지 생성
            </Button>
            {/* Other Status Change */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBulkStatusModal(true)}
            >
              기타 상태
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              선택 해제
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card padding="none">
        <WordTable
          words={words}
          loading={loading}
          onRowClick={onWordSelect}
          onGenerateClick={onGenerateContent}
          onDeleteClick={handleDeleteWord}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
        />

        {/* Pagination */}
        {!loading && words.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        )}
      </Card>

      {/* Bulk Status Change Confirm Modal */}
      <Modal
        isOpen={showBulkStatusModal}
        onClose={handleCloseBulkStatusModal}
        title="상태 일괄 변경"
        size="md"
      >
        <div className="space-y-4">
          {bulkStatusSuccess ? (
            <Alert type="success" title="변경 완료!">
              {selectedIds.length}개 단어의 상태가 변경되었습니다.
            </Alert>
          ) : (
            <>
              {/* Warning Message */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-amber-800">주의</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      <strong>{selectedIds.length}개</strong> 단어의 상태를 일괄 변경합니다.
                      이 작업은 되돌릴 수 없습니다.
                    </p>
                  </div>
                </div>
              </div>

              {bulkStatusError && (
                <Alert type="error" title="오류">
                  {bulkStatusError}
                </Alert>
              )}

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  변경할 상태 선택
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BULK_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setBulkStatusTarget(option.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        bulkStatusTarget === option.value
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          option.value === 'DRAFT' ? 'bg-gray-400' :
                          option.value === 'PENDING_REVIEW' ? 'bg-yellow-400' :
                          option.value === 'APPROVED' ? 'bg-blue-400' :
                          option.value === 'PUBLISHED' ? 'bg-green-400' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium text-slate-700">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Words Preview */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-500 mb-2">선택된 단어:</p>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {words
                    .filter((w) => selectedIds.includes(w.id))
                    .slice(0, 10)
                    .map((w) => (
                      <Badge key={w.id} color="gray" size="sm">
                        {w.word}
                      </Badge>
                    ))}
                  {selectedIds.length > 10 && (
                    <Badge color="gray" size="sm">
                      +{selectedIds.length - 10}개
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={handleCloseBulkStatusModal}
                  disabled={bulkStatusLoading}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBulkStatusChange}
                  loading={bulkStatusLoading}
                >
                  {selectedIds.length}개 단어 상태 변경
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default WordList;
