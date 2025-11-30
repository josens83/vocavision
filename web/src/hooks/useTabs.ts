import { useState, useCallback } from 'react';

// ============================================
// Tabs State Management Hook
// ============================================

export type TabId = 'exercises' | 'explanation' | 'downloads' | string;

export interface UseTabsReturn<T extends TabId = TabId> {
  activeTab: T;
  setActiveTab: (tab: T) => void;
  isActive: (tab: T) => boolean;
}

export function useTabs<T extends TabId = TabId>(
  defaultTab: T
): UseTabsReturn<T> {
  const [activeTab, setActiveTabState] = useState<T>(defaultTab);

  const setActiveTab = useCallback((tab: T) => {
    setActiveTabState(tab);
  }, []);

  const isActive = useCallback(
    (tab: T) => activeTab === tab,
    [activeTab]
  );

  return {
    activeTab,
    setActiveTab,
    isActive,
  };
}

// ============================================
// Tab Configuration Helper
// ============================================

export interface TabConfig<T extends TabId = TabId> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

export function createTabConfig<T extends TabId>(
  tabs: TabConfig<T>[]
): TabConfig<T>[] {
  return tabs;
}

// Default vocabulary page tabs
export const vocabularyTabs = createTabConfig([
  { id: 'exercises' as const, label: 'Exercises' },
  { id: 'explanation' as const, label: 'Explanation' },
  { id: 'downloads' as const, label: 'Downloads' },
]);

// Grammar page tabs
export const grammarTabs = createTabConfig([
  { id: 'exercises' as const, label: 'Exercises' },
  { id: 'explanation' as const, label: 'Explanation' },
  { id: 'downloads' as const, label: 'Downloads' },
]);

export default useTabs;
