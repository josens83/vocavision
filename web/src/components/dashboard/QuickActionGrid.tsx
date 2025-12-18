'use client';

import Link from 'next/link';

interface QuickAction {
  label: string;
  href: string;
  icon: string;
  bgColor: string;
  badge?: string | number;
}

interface QuickActionGridProps {
  dueReviewCount?: number;
  exam?: string;
  level?: string;
}

export default function QuickActionGrid({
  dueReviewCount = 0,
  exam = 'CSAT',
  level = 'L1',
}: QuickActionGridProps) {
  const actions: QuickAction[] = [
    {
      label: '오늘 복습',
      href: '/review',
      icon: '🔄',
      bgColor: 'bg-orange-100',
      badge: dueReviewCount > 0 ? dueReviewCount : undefined,
    },
    {
      label: '약한 단어',
      href: '/words?filter=weak',
      icon: '🔥',
      bgColor: 'bg-red-100',
    },
    {
      label: '새 단어',
      href: `/learn?exam=${exam}&level=${level}`,
      icon: '🆕',
      bgColor: 'bg-blue-100',
    },
    {
      label: '퀴즈',
      href: '/quiz',
      icon: '🎯',
      bgColor: 'bg-purple-100',
    },
    {
      label: '플래시카드',
      href: `/learn?exam=${exam}&level=${level}&mode=flashcard`,
      icon: '🃏',
      bgColor: 'bg-green-100',
    },
    {
      label: '오답노트',
      href: '/words?filter=wrong',
      icon: '📝',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">빠른 학습</h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100 shadow-sm"
          >
            <div className={`w-10 h-10 ${action.bgColor} rounded-xl flex items-center justify-center mb-2`}>
              <span className="text-xl">{action.icon}</span>
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
            {action.badge !== undefined && (
              <span className="mt-1 text-xs text-orange-500 font-bold">{action.badge}개</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
