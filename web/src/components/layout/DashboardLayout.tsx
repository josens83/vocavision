'use client';

import { ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';
import BottomTabBar from './BottomTabBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop: Sidebar + Main */}
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <DashboardSidebar />

        {/* Main Content */}
        <main className="flex-1 min-w-0 min-h-screen pb-20 lg:pb-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile: Bottom Tab Bar - hidden on desktop */}
      <div className="lg:hidden">
        <BottomTabBar />
      </div>
    </div>
  );
}
