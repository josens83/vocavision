'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import { progressAPI, authAPI } from '@/lib/api';
import DailyGoalWidgetEnhanced from '@/components/dashboard/DailyGoalWidgetEnhanced';
import StreakWidget from '@/components/dashboard/StreakWidget';
import axios from 'axios';

// 시험별 코스 데이터
const examCourses = [
  {
    id: 'CSAT' as ExamType,
    name: '수능',
    fullName: '대학수학능력시험',
    description: '수능 1~2등급 목표',
    wordCount: '429',
    icon: '📝',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    isActive: true,  // 실제 데이터 있음
  },
  {
    id: 'SAT' as ExamType,
    name: 'SAT',
    fullName: '미국대학입학시험',
    description: 'SAT 1500+ 목표',
    wordCount: '4,500+',
    icon: '🇺🇸',
    gradient: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    isActive: false,  // 준비 중
  },
  {
    id: 'TOEFL' as ExamType,
    name: 'TOEFL',
    fullName: '학술영어능력시험',
    description: 'TOEFL 100+ 목표',
    wordCount: '5,000+',
    icon: '🌍',
    gradient: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    isActive: false,  // 준비 중
  },
  {
    id: 'TOEIC' as ExamType,
    name: 'TOEIC',
    fullName: '국제의사소통영어',
    description: 'TOEIC 900+ 목표',
    wordCount: '3,500+',
    icon: '💼',
    gradient: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    isActive: false,  // 준비 중
  },
  {
    id: 'TEPS' as ExamType,
    name: 'TEPS',
    fullName: '서울대영어능력시험',
    description: 'TEPS 500+ 목표',
    wordCount: '4,000+',
    icon: '🎓',
    gradient: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    isActive: false,  // 준비 중
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

interface DueReview {
  count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [dueReviews, setDueReviews] = useState<DueReview>({ count: 0 });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage before checking auth
    if (!hasHydrated) {
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadDashboardData();
    loadNotificationCount();
  }, [user, hasHydrated, router]);

  const loadDashboardData = async () => {
    try {
      const [profileData, progressData, reviewsData] = await Promise.all([
        authAPI.getProfile(),
        progressAPI.getUserProgress(),
        progressAPI.getDueReviews(),
      ]);

      setStats(progressData.stats);
      setDueReviews({ count: reviewsData.count });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/notifications?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadNotifications(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            VocaVision
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/chat" className="text-cyan-600 hover:text-cyan-700 transition font-medium">
              AI 도우미
            </Link>
            <Link href="/words" className="text-gray-600 hover:text-blue-600 transition">
              단어
            </Link>
            <Link href="/bookmarks" className="text-gray-600 hover:text-blue-600 transition">
              북마크
            </Link>
            <Link href="/statistics" className="text-gray-600 hover:text-blue-600 transition">
              통계
            </Link>
            <Link href="/notifications" className="relative text-gray-600 hover:text-blue-600 transition">
              <span className="text-xl">🔔</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>
            <Link href="/settings" className="text-gray-600 hover:text-blue-600 transition">
              설정
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            안녕하세요, {user?.name || '학습자'}님! 👋
          </h2>
          <p className="text-gray-600">오늘도 영어 실력을 키워볼까요?</p>
        </div>

        {/* 시험별 코스 섹션 - 핵심 진입점 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">시험별 코스</h3>
            <Link href="/exam" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              전체 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {examCourses.map((course) => (
              <Link
                key={course.id}
                href={course.isActive ? `/courses/${course.id?.toLowerCase()}` : '#'}
                onClick={(e) => !course.isActive && e.preventDefault()}
                className={`${course.bgColor} ${course.borderColor} border-2 rounded-xl p-4 transition-all duration-300 group relative ${
                  course.isActive
                    ? 'hover:shadow-lg cursor-pointer'
                    : 'opacity-70 cursor-not-allowed'
                }`}
              >
                {/* 준비 중 뱃지 */}
                {!course.isActive && (
                  <div className="absolute top-2 right-2 bg-gray-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    준비 중
                  </div>
                )}
                {/* 활성 뱃지 */}
                {course.isActive && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    학습 가능
                  </div>
                )}
                <div className="text-3xl mb-2">{course.icon}</div>
                <h4 className={`font-bold transition ${
                  course.isActive
                    ? 'text-gray-900 group-hover:text-blue-600'
                    : 'text-gray-500'
                }`}>
                  {course.name}
                </h4>
                <p className="text-xs text-gray-500 mb-1">{course.fullName}</p>
                <p className={`text-sm ${course.isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                  {course.isActive ? course.description : '곧 업데이트 예정'}
                </p>
                <div className={`mt-2 text-xs font-medium ${
                  course.isActive ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  {course.isActive ? `${course.wordCount}개 단어` : `${course.wordCount} 단어 예정`}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Grid - Benchmarking: Duolingo 스타일 스트릭 시스템 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 학습한 단어 통계 */}
          <StatCard
            icon="📚"
            title="학습한 단어"
            value={stats?.totalWordsLearned || 0}
            suffix="개"
            color="blue"
          />

          {/* Duolingo 스타일 스트릭 위젯 - 불꽃 애니메이션, 마일스톤 배지, 스트릭 프리즈 */}
          <StreakWidget
            currentStreak={stats?.currentStreak || 0}
            longestStreak={stats?.longestStreak || 0}
            lastActiveDate={stats?.lastActiveDate || null}
            streakFreezeCount={0}  // TODO: 백엔드에서 스트릭 프리즈 아이템 구현 후 연동
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Start Learning */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="mb-4">
              <h3 className="text-2xl font-bold mb-2">복습할 단어</h3>
              <p className="text-blue-100">
                {dueReviews.count}개의 단어가 복습을 기다리고 있어요
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/learn"
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                학습 시작
              </Link>
              <Link
                href="/quiz"
                className="inline-block bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-300 transition"
              >
                퀴즈 풀기
              </Link>
            </div>
          </div>

          {/* Daily Goal Widget - Benchmarking: Duolingo 스타일 원형 게이지 + 축하 애니메이션 */}
          <DailyGoalWidgetEnhanced />

          {/* Subscription Status */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-xl font-bold mb-4">구독 상태</h3>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {user?.subscriptionStatus === 'TRIAL' && '🎁'}
                  {user?.subscriptionStatus === 'ACTIVE' && '✅'}
                  {user?.subscriptionStatus === 'FREE' && '🆓'}
                </span>
                <span className="font-semibold">
                  {user?.subscriptionStatus === 'TRIAL' && '무료 체험'}
                  {user?.subscriptionStatus === 'ACTIVE' && '프리미엄'}
                  {user?.subscriptionStatus === 'FREE' && '무료 플랜'}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                {user?.subscriptionStatus === 'TRIAL' &&
                  '무료 체험 기간을 즐기세요!'}
                {user?.subscriptionStatus === 'ACTIVE' &&
                  '모든 프리미엄 기능을 사용하고 계십니다'}
                {user?.subscriptionStatus === 'FREE' &&
                  '프리미엄으로 업그레이드하여 더 많은 기능을 사용하세요'}
              </p>
            </div>
            {user?.subscriptionStatus !== 'ACTIVE' && (
              <Link
                href="/pricing"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                업그레이드
              </Link>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/chat" className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl p-6 hover:shadow-lg transition relative overflow-hidden">
            <div className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">NEW</div>
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-lg font-bold mb-1">AI 학습 도우미</h3>
            <p className="text-sm text-cyan-100">단어 질문, 퀴즈, 학습 팁</p>
          </Link>
          <Link href="/words" className="bg-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="text-lg font-bold mb-1">단어 탐색</h3>
            <p className="text-sm text-gray-600">모든 단어 검색 및 학습</p>
          </Link>
          <Link href="/games" className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">🎮</div>
            <h3 className="text-lg font-bold mb-1">학습 게임</h3>
            <p className="text-sm text-purple-100">Match, True/False, Write 모드</p>
          </Link>
          <Link href="/decks" className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">🃏</div>
            <h3 className="text-lg font-bold mb-1">커스텀 덱</h3>
            <p className="text-sm text-indigo-100">Anki 스타일 덱 관리</p>
          </Link>
          <Link href="/leagues" className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-lg font-bold mb-1">리그</h3>
            <p className="text-sm text-yellow-100">주간 경쟁 & 리더보드</p>
          </Link>
          <Link href="/collections" className="bg-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-lg font-bold mb-1">컬렉션</h3>
            <p className="text-sm text-gray-600">주제별 단어 모음</p>
          </Link>
          <Link href="/quiz" className="bg-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-bold mb-1">퀴즈 모드</h3>
            <p className="text-sm text-gray-600">실력을 테스트하세요</p>
          </Link>
          <Link href="/achievements" className="bg-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-lg font-bold mb-1">업적</h3>
            <p className="text-sm text-gray-600">목표 달성하기</p>
          </Link>
          <Link href="/bookmarks" className="bg-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="text-lg font-bold mb-1">북마크</h3>
            <p className="text-sm text-gray-600">저장한 단어 모음</p>
          </Link>
          <Link href="/history" className="bg-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-bold mb-1">학습 기록</h3>
            <p className="text-sm text-gray-600">복습 내역 확인</p>
          </Link>
          <Link href="/statistics" className="bg-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-bold mb-1">상세 통계</h3>
            <p className="text-sm text-gray-600">학습 진행 상황 확인</p>
          </Link>
          <Link href="/notifications" className="bg-white rounded-2xl p-6 hover:shadow-lg transition relative">
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="text-lg font-bold mb-1">알림</h3>
            <p className="text-sm text-gray-600">알림 및 리마인더</p>
            {unreadNotifications > 0 && (
              <span className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadNotifications}
              </span>
            )}
          </Link>
          <Link href="/settings" className="bg-white rounded-2xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="text-lg font-bold mb-1">설정</h3>
            <p className="text-sm text-gray-600">프로필 및 환경설정</p>
          </Link>
        </div>

        {/* Learning Methods */}
        <div className="bg-white rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold mb-6">학습 방법</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MethodCard icon="📸" title="이미지" />
            <MethodCard icon="🎬" title="동영상" />
            <MethodCard icon="🎵" title="라이밍" />
            <MethodCard icon="🧠" title="연상법" />
            <MethodCard icon="📚" title="어원" />
            <MethodCard icon="🔄" title="간격반복" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">최근 활동</h3>
          <p className="text-gray-500 text-center py-8">
            학습을 시작하면 여기에 활동 내역이 표시됩니다
          </p>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  suffix,
  color,
}: {
  icon: string;
  title: string;
  value: number;
  suffix: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }[color];

  return (
    <div className={`${colorClasses} rounded-2xl p-6`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm opacity-80 mb-1">{title}</div>
      <div className="text-3xl font-bold">
        {value}
        <span className="text-lg ml-1">{suffix}</span>
      </div>
    </div>
  );
}

function MethodCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition cursor-pointer">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-medium text-gray-700">{title}</div>
    </div>
  );
}
