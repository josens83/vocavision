/**
 * VocaVision Admin Dashboard
 * 메인 대시보드 컴포넌트
 */

'use client';

import React, { useState, useCallback } from 'react';
import { DashboardStatsView } from './DashboardStats';
import { WordList } from './WordList';
import {
  WordFormModal,
  BatchUploadModal,
  AIGenerationModal,
  ReviewModal,
  WordDetailView,
} from './WordForms';
import { AdminWord, NavItem } from '@/types/admin.types';

// ============================================
// Navigation Items
// ============================================

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'words',
    label: '단어 관리',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'review',
    label: '콘텐츠 검토',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    badge: 12,
  },
  {
    id: 'generation',
    label: 'AI 생성',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: '설정',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ============================================
// Sidebar Component
// ============================================

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

function Sidebar({ activeTab, onTabChange, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-greyblue text-white z-40
        transition-all duration-300 flex flex-col
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-voca-pink-400 to-voca-purple-400 bg-clip-text text-transparent">
            VocaVision
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <svg
            className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 transition-colors
              ${
                activeTab === item.id
                  ? 'bg-white/10 text-white border-r-2 border-voca-pink-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            {item.icon}
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs bg-voca-pink-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-gray-400">VocaVision Admin v1.0</p>
        </div>
      )}
    </aside>
  );
}

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  title: string;
  sidebarCollapsed: boolean;
}

function Header({ title, sidebarCollapsed }: HeaderProps) {
  return (
    <header
      className={`
        fixed top-0 right-0 h-16 bg-white border-b z-30
        flex items-center justify-between px-6
        transition-all duration-300
        ${sidebarCollapsed ? 'left-16' : 'left-64'}
      `}
    >
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-voca-pink-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-voca-pink-500 to-voca-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            A
          </div>
          <span className="text-sm font-medium text-gray-700">Admin</span>
        </div>
      </div>
    </header>
  );
}

// ============================================
// Main Dashboard Component
// ============================================

export function AdminDashboard() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [showWordForm, setShowWordForm] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Selected word states
  const [selectedWord, setSelectedWord] = useState<AdminWord | null>(null);
  const [editWord, setEditWord] = useState<AdminWord | null>(null);
  const [generatingWord, setGeneratingWord] = useState<AdminWord | null>(null);
  const [reviewingWord, setReviewingWord] = useState<AdminWord | null>(null);

  // Handlers
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleWordSelect = (word: AdminWord) => {
    setSelectedWord(word);
  };

  const handleAddWord = () => {
    setEditWord(null);
    setShowWordForm(true);
  };

  const handleEditWord = () => {
    if (selectedWord) {
      setEditWord(selectedWord);
      setShowWordForm(true);
    }
  };

  const handleGenerateContent = (word: AdminWord) => {
    setGeneratingWord(word);
    setShowAIGeneration(true);
  };

  const handleReview = () => {
    if (selectedWord) {
      setReviewingWord(selectedWord);
      setShowReview(true);
    }
  };

  // Get page title
  const getPageTitle = () => {
    const item = navItems.find((n) => n.id === activeTab);
    return item?.label || '대시보드';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Header */}
      <Header title={getPageTitle()} sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <main
        className={`
          pt-16 min-h-screen transition-all duration-300
          ${sidebarCollapsed ? 'pl-16' : 'pl-64'}
        `}
      >
        <div className="p-6" key={refreshKey}>
          {activeTab === 'dashboard' && <DashboardStatsView />}

          {activeTab === 'words' && (
            <WordList
              onWordSelect={handleWordSelect}
              onAddWord={handleAddWord}
              onBatchUpload={() => setShowBatchUpload(true)}
              onGenerateContent={handleGenerateContent}
            />
          )}

          {activeTab === 'review' && (
            <div className="text-center py-12 text-gray-500">
              콘텐츠 검토 페이지 (개발 중)
            </div>
          )}

          {activeTab === 'generation' && (
            <div className="text-center py-12 text-gray-500">
              AI 생성 관리 페이지 (개발 중)
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-12 text-gray-500">
              설정 페이지 (개발 중)
            </div>
          )}
        </div>
      </main>

      {/* Word Detail Slide Panel */}
      {selectedWord && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedWord(null)}
          />
          <WordDetailView
            word={selectedWord}
            onClose={() => setSelectedWord(null)}
            onEdit={handleEditWord}
            onGenerate={() => handleGenerateContent(selectedWord)}
            onReview={handleReview}
          />
        </>
      )}

      {/* Modals */}
      <WordFormModal
        isOpen={showWordForm}
        onClose={() => {
          setShowWordForm(false);
          setEditWord(null);
        }}
        editWord={editWord}
        onSuccess={handleRefresh}
      />

      <BatchUploadModal
        isOpen={showBatchUpload}
        onClose={() => setShowBatchUpload(false)}
        onSuccess={handleRefresh}
      />

      <AIGenerationModal
        isOpen={showAIGeneration}
        onClose={() => {
          setShowAIGeneration(false);
          setGeneratingWord(null);
        }}
        word={generatingWord}
        onSuccess={handleRefresh}
      />

      <ReviewModal
        isOpen={showReview}
        onClose={() => {
          setShowReview(false);
          setReviewingWord(null);
        }}
        word={reviewingWord}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

export default AdminDashboard;
