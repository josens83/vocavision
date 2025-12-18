'use client';

import Link from 'next/link';

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
}

interface BadgeShowcaseProps {
  badges: Badge[];
}

// Default badges if none provided
const defaultBadges: Badge[] = [
  {
    id: 'streak7',
    name: '7일 연속 학습',
    icon: '🔥',
    description: '7일 연속으로 학습하기',
    earned: false,
  },
  {
    id: 'words100',
    name: '100단어 마스터',
    icon: '📚',
    description: '100개 단어 학습 완료',
    earned: false,
  },
  {
    id: 'words500',
    name: '500단어 마스터',
    icon: '🎯',
    description: '500개 단어 학습 완료',
    earned: false,
  },
];

export default function BadgeShowcase({ badges = defaultBadges }: BadgeShowcaseProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">내 배지</h2>
        <Link href="/achievements" className="text-sm text-pink-600 font-medium hover:underline">
          전체 보기 →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-4 rounded-xl text-center transition ${
              badge.earned
                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200'
                : 'bg-gray-50 opacity-60'
            }`}
          >
            <span className={`text-3xl block mb-2 ${!badge.earned && 'grayscale'}`}>
              {badge.icon}
            </span>
            <p className={`text-sm font-medium ${badge.earned ? 'text-gray-900' : 'text-gray-500'}`}>
              {badge.name}
            </p>
            {!badge.earned && (
              <p className="text-xs text-gray-400 mt-1">미획득</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
