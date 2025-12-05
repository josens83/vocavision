'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import BottomTabBar from './BottomTabBar';

interface TabLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  headerTitle?: string;
  headerRight?: ReactNode;
}

export default function TabLayout({
  children,
  showHeader = true,
  headerTitle,
  headerRight,
}: TabLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      {showHeader && (
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              {headerTitle || 'VocaVision'}
            </Link>
            {headerRight || (
              <Link
                href="/notifications"
                className="text-gray-600 hover:text-blue-600 transition"
              >
                <span className="text-xl">🔔</span>
              </Link>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main>{children}</main>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
}
