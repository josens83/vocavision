/**
 * VocaVision Admin Word List
 * 단어 목록 테이블 컴포넌트
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, Input, Select, Checkbox, Spinner, EmptyState } from './ui';
import { useWordList } from '@/hooks/useAdminApi';
import {
  AdminWord,
  WordFilters,
  EXAM_CATEGORIES,
  CEFR_LEVELS,
  CONTENT_STATUS_LABELS,
  LEVEL_COLORS,
  STATUS_COLORS,
  CEFRLevel,
  ExamCategory,
  ContentStatus,
} from '@/types/admin.types';

// ============================================
// Filter Panel Component
// ============================================

interface FilterPanelProps {
  filters: WordFilters;
  onFilterChange: (filters: WordFilters) => void;
  onReset: () => void;
}

function FilterPanel({ filters, onFilterChange, onReset }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card padding="sm" className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="단어 검색..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            필터
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            초기화
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t">
          {/* Exam Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">시험</label>
            <div className="space-y-1">
              {EXAM_CATEGORIES.slice(0, 4).map((cat) => (
                <Checkbox
                  key={cat.value}
                  label={cat.label}
                  checked={filters.examCategories?.includes(cat.value) || false}
                  onChange={(e) => {
                    const current = filters.examCategories || [];
                    const updated = e.target.checked
                      ? [...current, cat.value]
                      : current.filter((c) => c !== cat.value);
                    onFilterChange({ ...filters, examCategories: updated });
                  }}
                />
              ))}
            </div>
          </div>

          {/* CEFR Levels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">난이도</label>
            <div className="flex flex-wrap gap-2">
              {CEFR_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    const current = filters.levels || [];
                    const updated = current.includes(level)
                      ? current.filter((l) => l !== level)
                      : [...current, level];
                    onFilterChange({ ...filters, levels: updated });
                  }}
                  className={`
                    px-2 py-1 text-xs font-medium rounded-full border transition-colors
                    ${
                      filters.levels?.includes(level)
                        ? LEVEL_COLORS[level]
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <div className="space-y-1">
              {Object.entries(CONTENT_STATUS_LABELS).map(([status, label]) => (
                <Checkbox
                  key={status}
                  label={label}
                  checked={filters.status?.includes(status as ContentStatus) || false}
                  onChange={(e) => {
                    const current = filters.status || [];
                    const updated = e.target.checked
                      ? [...current, status as ContentStatus]
                      : current.filter((s) => s !== status);
                    onFilterChange({ ...filters, status: updated });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ============================================
// Word Table Row Component
// ============================================

interface WordRowProps {
  word: AdminWord;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
  onGenerate: () => void;
}

function WordRow({ word, selected, onSelect, onClick, onGenerate }: WordRowProps) {
  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={onClick}>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onChange={(e) => onSelect(e.target.checked)} />
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{word.word}</div>
        <div className="text-sm text-gray-500 truncate max-w-xs">
          {word.definitionKo || word.definition}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={LEVEL_COLORS[word.level]}>{word.level}</Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {word.examCategories.slice(0, 2).map((cat) => (
            <Badge key={cat} color="gray" size="sm">
              {EXAM_CATEGORIES.find((c) => c.value === cat)?.label || cat}
            </Badge>
          ))}
          {word.examCategories.length > 2 && (
            <Badge color="gray" size="sm">
              +{word.examCategories.length - 2}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={STATUS_COLORS[word.contentStatus]}>
          {CONTENT_STATUS_LABELS[word.contentStatus]}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {word.hasEtymology && <ContentIcon type="etymology" />}
          {word.hasMnemonic && <ContentIcon type="mnemonic" />}
          {word.hasExamples && <ContentIcon type="examples" />}
          {word.hasCollocations && <ContentIcon type="collocations" />}
          {word.hasAudio && <ContentIcon type="audio" />}
        </div>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onGenerate}
          disabled={word.contentStatus === 'PUBLISHED'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </Button>
      </td>
    </tr>
  );
}

// ============================================
// Content Icon Component
// ============================================

interface ContentIconProps {
  type: 'etymology' | 'mnemonic' | 'examples' | 'collocations' | 'audio';
}

function ContentIcon({ type }: ContentIconProps) {
  const icons = {
    etymology: (
      <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20" title="어원">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
    mnemonic: (
      <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20" title="연상법">
        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
      </svg>
    ),
    examples: (
      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20" title="예문">
        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
    collocations: (
      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" title="콜로케이션">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
      </svg>
    ),
    audio: (
      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20" title="오디오">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
      </svg>
    ),
  };

  return icons[type] || null;
}

// ============================================
// Pagination Component
// ============================================

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

function Pagination({ page, totalPages, total, limit, onChange }: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="text-sm text-gray-500">
        총 {total.toLocaleString()}개 중 {start}-{end}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          이전
        </Button>
        <span className="px-3 text-sm text-gray-600">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}

// ============================================
// WordList Component
// ============================================

interface WordListProps {
  onWordSelect: (word: AdminWord) => void;
  onAddWord: () => void;
  onBatchUpload: () => void;
  onGenerateContent: (word: AdminWord) => void;
}

export function WordList({
  onWordSelect,
  onAddWord,
  onBatchUpload,
  onGenerateContent,
}: WordListProps) {
  const { words, pagination, loading, error, fetchWords } = useWordList();
  const [filters, setFilters] = useState<WordFilters>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const loadWords = useCallback(() => {
    fetchWords({
      ...filters,
      page: currentPage,
      limit: 20,
    });
  }, [fetchWords, filters, currentPage]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const handleFilterChange = (newFilters: WordFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(words.map((w) => w.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectWord = (wordId: string, selected: boolean) => {
    const newSet = new Set(selectedIds);
    if (selected) {
      newSet.add(wordId);
    } else {
      newSet.delete(wordId);
    }
    setSelectedIds(newSet);
  };

  const allSelected = words.length > 0 && words.every((w) => selectedIds.has(w.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">단어 관리</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBatchUpload}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            배치 업로드
          </Button>
          <Button onClick={onAddWord}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            단어 추가
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card padding="sm" className="flex items-center justify-between bg-voca-pink-50">
          <span className="text-sm text-voca-pink-700">
            {selectedIds.size}개 선택됨
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              AI 생성
            </Button>
            <Button variant="ghost" size="sm">
              삭제
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadWords}>다시 시도</Button>
          </div>
        ) : words.length === 0 ? (
          <EmptyState
            title="단어가 없습니다"
            description="새 단어를 추가하거나 배치 업로드를 사용해 보세요."
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            action={<Button onClick={onAddWord}>단어 추가</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <Checkbox
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">단어</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">난이도</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">시험</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">콘텐츠</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-16">AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {words.map((word) => (
                    <WordRow
                      key={word.id}
                      word={word}
                      selected={selectedIds.has(word.id)}
                      onSelect={(selected) => handleSelectWord(word.id, selected)}
                      onClick={() => onWordSelect(word)}
                      onGenerate={() => onGenerateContent(word)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onChange={setCurrentPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}

export default WordList;
