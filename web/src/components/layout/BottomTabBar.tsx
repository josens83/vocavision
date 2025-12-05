'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Tab {
  id: string;
  label: string;
  icon: string;
  activeIcon: string;
  href: string;
}

const tabs: Tab[] = [
  {
    id: 'home',
    label: '홈',
    icon: '🏠',
    activeIcon: '🏠',
    href: '/dashboard',
  },
  {
    id: 'learn',
    label: '학습',
    icon: '📚',
    activeIcon: '📚',
    href: '/courses',
  },
  {
    id: 'review',
    label: '복습',
    icon: '🔄',
    activeIcon: '🔄',
    href: '/review',
  },
  {
    id: 'my',
    label: 'MY',
    icon: '👤',
    activeIcon: '👤',
    href: '/my',
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (tab: Tab) => {
    if (tab.href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    if (tab.href === '/courses') {
      return pathname.startsWith('/courses') || pathname.startsWith('/learn');
    }
    return pathname.startsWith(tab.href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto">
        <div className="grid grid-cols-4">
          {tabs.map((tab) => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex flex-col items-center py-2 px-1 transition-colors ${
                  active
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className={`text-2xl mb-0.5 ${active ? 'scale-110' : ''} transition-transform`}>
                  {active ? tab.activeIcon : tab.icon}
                </span>
                <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
                {active && (
                  <div className="absolute bottom-0 w-12 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
