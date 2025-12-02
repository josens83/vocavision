// ============================================
// VocaVision Admin Dashboard - Main Page
// 전체 어드민 대시보드 페이지
// ============================================

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DashboardStatsView } from './DashboardStats';
import { WordList } from './WordList';
import {
  WordFormModal,
  BatchUploadModal,
  AIGenerationModal,
  ReviewModal,
  WordDetailView,
} from './WordForms';
import { VocaWord, VocaContentFull } from './types/admin.types';
import { useWordDetail, useDashboardStats, useBatchGeneration } from './hooks/useAdminApi';

// ---------------------------------------------
// Sidebar Navigation
// ---------------------------------------------
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'words',
    label: '단어 관리',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'review',
    label: '검토 대기',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'no-content',
    label: '콘텐츠 없음',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'sets',
    label: '단어장',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

// ---------------------------------------------
// Sidebar Component
// ---------------------------------------------
interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
  pendingReviewCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeNav, onNavChange, pendingReviewCount = 0 }) => {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold">V</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">VocaVision</h1>
            <p className="text-xs text-slate-400">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeNav === item.id
                ? 'bg-pink-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
            {item.id === 'review' && pendingReviewCount > 0 && (
              <span className="ml-auto bg-amber-500 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingReviewCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Do Hurn</p>
            <p className="text-xs text-slate-400 truncate">Admin</p>
          </div>
          <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

// ---------------------------------------------
// Header Component
// ---------------------------------------------
const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Breadcrumb could go here */}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="검색..."
            className="w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none text-sm"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
        </button>

        {/* Settings */}
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

// ---------------------------------------------
// Main Admin Dashboard Page
// ---------------------------------------------
export const AdminDashboard: React.FC = () => {
  // Navigation state
  const [activeNav, setActiveNav] = useState('dashboard');

  // Modal states
  const [showWordForm, setShowWordForm] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Selected word for modals/detail view
  const [selectedWord, setSelectedWord] = useState<VocaWord | null>(null);
  const [editWord, setEditWord] = useState<VocaWord | null>(null);

  // Word detail
  const { word: detailWord, fetchWord, clearWord } = useWordDetail();

  // Dashboard stats for pending review count
  const { stats, fetchStats } = useDashboardStats();

  // Batch generation
  const { startBatchGeneration } = useBatchGeneration();

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Handlers
  const handleWordSelect = useCallback((word: VocaWord) => {
    fetchWord(word.id);
  }, [fetchWord]);

  const handleAddWord = useCallback(() => {
    setEditWord(null);
    setShowWordForm(true);
  }, []);

  const handleEditWord = useCallback(() => {
    if (detailWord) {
      setEditWord(detailWord as VocaWord);
      setShowWordForm(true);
    }
  }, [detailWord]);

  const handleBatchUpload = useCallback(() => {
    setShowBatchUpload(true);
  }, []);

  const handleGenerateContent = useCallback((word: VocaWord) => {
    setSelectedWord(word);
    setShowAIGeneration(true);
  }, []);

  const handleReview = useCallback(() => {
    if (detailWord) {
      setSelectedWord(detailWord as VocaWord);
      setShowReview(true);
    }
  }, [detailWord]);

  const handleBatchGenerate = useCallback(async (wordIds: string[]) => {
    const success = await startBatchGeneration(wordIds);
    if (success) {
      alert(`${wordIds.length}개 단어에 대한 AI 생성이 시작되었습니다. 백그라운드에서 처리됩니다.`);
      triggerRefresh();
    }
  }, [startBatchGeneration, triggerRefresh]);

  const handleCloseDetail = useCallback(() => {
    clearWord();
  }, [clearWord]);

  const handleFormSuccess = useCallback(() => {
    triggerRefresh();
    clearWord();
  }, [triggerRefresh, clearWord]);

  // Render content based on active nav
  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <DashboardStatsView
            onAddWord={handleAddWord}
            onBatchUpload={handleBatchUpload}
            onNavigateToReview={() => setActiveNav('review')}
            onNavigateToNoContent={() => setActiveNav('no-content')}
            onNavigateToWords={() => setActiveNav('words')}
            onNavigateToPublished={() => setActiveNav('published')}
            onNavigateToDraft={() => setActiveNav('draft')}
          />
        );
      case 'words':
        return (
          <WordList
            key={refreshTrigger}
            onWordSelect={handleWordSelect}
            onAddWord={handleAddWord}
            onBatchUpload={handleBatchUpload}
            onGenerateContent={handleGenerateContent}
            onBatchGenerate={handleBatchGenerate}
          />
        );
      case 'review':
        return (
          <WordList
            key={`review-${refreshTrigger}`}
            onWordSelect={handleWordSelect}
            onAddWord={handleAddWord}
            onBatchUpload={handleBatchUpload}
            onGenerateContent={handleGenerateContent}
            onBatchGenerate={handleBatchGenerate}
            initialFilters={{ status: ['PENDING_REVIEW'] }}
            title="검토 대기 목록"
            hideFilters={false}
            hideActions={true}
          />
        );
      case 'no-content':
        return (
          <WordList
            key={`no-content-${refreshTrigger}`}
            onWordSelect={handleWordSelect}
            onAddWord={handleAddWord}
            onBatchUpload={handleBatchUpload}
            onGenerateContent={handleGenerateContent}
            onBatchGenerate={handleBatchGenerate}
            initialFilters={{ hasContent: false }}
            title="콘텐츠 없는 단어"
            hideFilters={false}
            hideActions={false}
          />
        );
      case 'published':
        return (
          <WordList
            key={`published-${refreshTrigger}`}
            onWordSelect={handleWordSelect}
            onAddWord={handleAddWord}
            onBatchUpload={handleBatchUpload}
            onGenerateContent={handleGenerateContent}
            onBatchGenerate={handleBatchGenerate}
            initialFilters={{ status: ['PUBLISHED'] }}
            title="발행된 단어"
            hideFilters={false}
            hideActions={true}
          />
        );
      case 'draft':
        return (
          <WordList
            key={`draft-${refreshTrigger}`}
            onWordSelect={handleWordSelect}
            onAddWord={handleAddWord}
            onBatchUpload={handleBatchUpload}
            onGenerateContent={handleGenerateContent}
            onBatchGenerate={handleBatchGenerate}
            initialFilters={{ status: ['DRAFT'] }}
            title="초안 단어"
            hideFilters={false}
            hideActions={false}
          />
        );
      case 'sets':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-slate-900">단어장 관리</h2>
            <p className="text-slate-500 mt-2">Coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        pendingReviewCount={stats?.pendingReview ?? 0}
      />

      {/* Main Content */}
      <div className="ml-64">
        <Header />
        <main className="p-6">{renderContent()}</main>
      </div>

      {/* Modals */}
      <WordFormModal
        isOpen={showWordForm}
        onClose={() => setShowWordForm(false)}
        editWord={editWord}
        onSuccess={handleFormSuccess}
      />

      <BatchUploadModal
        isOpen={showBatchUpload}
        onClose={() => setShowBatchUpload(false)}
        onSuccess={triggerRefresh}
      />

      <AIGenerationModal
        isOpen={showAIGeneration}
        onClose={() => {
          setShowAIGeneration(false);
          setSelectedWord(null);
        }}
        word={selectedWord}
        onSuccess={handleFormSuccess}
      />

      <ReviewModal
        isOpen={showReview}
        onClose={() => {
          setShowReview(false);
          setSelectedWord(null);
        }}
        word={selectedWord}
        onSuccess={handleFormSuccess}
      />

      {/* Word Detail Slide Panel */}
      {detailWord && (
        <WordDetailView
          word={detailWord as VocaWord & { content?: VocaContentFull }}
          onClose={handleCloseDetail}
          onEdit={handleEditWord}
          onGenerate={() => {
            setSelectedWord(detailWord as VocaWord);
            setShowAIGeneration(true);
          }}
          onReview={handleReview}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
