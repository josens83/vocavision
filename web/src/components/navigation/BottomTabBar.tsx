'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

// SVG Icons
const icons = {
  home: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? 'text-pink-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  learn: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? 'text-pink-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  review: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? 'text-pink-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  words: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? 'text-pink-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  user: (active: boolean) => (
    <svg className={`w-6 h-6 ${active ? 'text-pink-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

// Tab configurations
const guestTabs = [
  { key: 'home', label: '홈', href: '/', icon: icons.home },
  { key: 'learn', label: '수능', href: '/learn?exam=CSAT', icon: icons.learn },
  { key: 'words', label: '단어', href: '/words', icon: icons.words },
  { key: 'login', label: '로그인', href: '/auth/login', icon: icons.user },
];

const authTabs = [
  { key: 'home', label: '홈', href: '/', icon: icons.home },
  { key: 'learn', label: '학습', href: '/learn?exam=CSAT', icon: icons.learn },
  { key: 'review', label: '복습', href: '/review', icon: icons.review },
  { key: 'my', label: 'MY', href: '/dashboard', icon: icons.user, showLoggedIn: true },
];

// Paths where tab bar should be hidden
const hiddenPaths = ['/auth', '/admin', '/checkout'];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Portal needs to be mounted on client side only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide on specific paths
  const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));

  // Also hide on word detail pages (/words/[id])
  const isWordDetailPage = /^\/words\/[^/]+$/.test(pathname);

  if (shouldHide || isWordDetailPage) return null;

  const tabs = user ? authTabs : guestTabs;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    const basePath = href.split('?')[0];
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  const tabBar = (
    <nav
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex justify-around items-center h-16 w-full px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const showLoggedInDot = 'showLoggedIn' in tab && tab.showLoggedIn;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] py-2 transition-colors"
            >
              <div className="relative">
                {tab.icon(active)}
                {showLoggedInDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
                )}
              </div>
              <span className={`text-[10px] mt-1 truncate ${active ? 'text-pink-500 font-medium' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  // Use Portal to render directly to body, bypassing parent CSS issues
  if (!mounted) return null;

  return createPortal(tabBar, document.body);
}
