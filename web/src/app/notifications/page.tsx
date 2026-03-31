'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { EmptyNotifications } from '@/components/ui/EmptyState';
import { SkeletonListItem } from '@/components/ui/Skeleton';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderTime: string;
  reminderDays: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const toast = useToast();
  const confirm = useConfirm();
  const isEn = useLocale() === 'en';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadNotifications();
    loadPreferences();
  }, [user, hasHydrated, router]);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_URL}/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_URL}/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const notification = notifications.find((n) => n.id === id);
      setNotifications(notifications.filter((n) => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    const confirmed = await confirm({
      title: isEn ? 'Delete All Notifications' : '모든 알림 삭제',
      message: isEn ? 'Delete all notifications? This cannot be undone.' : '모든 알림을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.',
      confirmText: isEn ? 'Delete All' : '모두 삭제',
      cancelText: isEn ? 'Cancel' : '취소',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/notifications/clear-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications([]);
      setUnreadCount(0);
      toast.success(isEn ? 'Notifications Cleared' : '알림 삭제 완료', isEn ? 'All notifications have been deleted' : '모든 알림이 삭제되었습니다');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      toast.error(isEn ? 'Failed to Delete' : '알림 삭제 실패', isEn ? 'Please try again' : '다시 시도해주세요');
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        `${API_URL}/notifications/preferences`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      REVIEW_REMINDER: '📚',
      STREAK_WARNING: '🔥',
      STREAK_ACHIEVED: '🏆',
      ACHIEVEMENT_UNLOCK: '🎉',
      GOAL_COMPLETED: '✅',
      GOAL_REMINDER: '🎯',
      WEEKLY_SUMMARY: '📊',
      NEW_WORDS: '✨',
    };
    return icons[type] || '🔔';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return isEn ? 'Just now' : '방금 전';
    if (minutes < 60) return isEn ? `${minutes}m ago` : `${minutes}분 전`;
    if (hours < 24) return isEn ? `${hours}h ago` : `${hours}시간 전`;
    if (days < 7) return isEn ? `${days}d ago` : `${days}일 전`;

    return date.toLocaleDateString(isEn ? 'en-US' : 'ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const dayNames = isEn ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['월', '화', '수', '목', '금', '토', '일'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  {isEn ? '← Dashboard' : '← 대시보드'}
                </Link>
                <h1 className="text-2xl font-bold text-blue-600">{isEn ? 'Notifications' : '알림'}</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                {isEn ? '← Dashboard' : '← 대시보드'}
              </Link>
              <h1 className="text-2xl font-bold text-blue-600">{isEn ? 'Notifications' : '알림'}</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isEn ? 'All' : '전체'}
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isEn ? `Unread (${unreadCount})` : `읽지 않음 (${unreadCount})`}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isEn ? 'Settings' : '설정'}
          </button>
        </div>

        {activeTab !== 'settings' ? (
          <>
            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex justify-end gap-3 mb-4">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {isEn ? 'Mark All Read' : '모두 읽음 처리'}
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {isEn ? 'Delete All' : '모두 삭제'}
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <EmptyNotifications
                  message={activeTab === 'unread' ? (isEn ? 'No unread notifications' : '읽지 않은 알림이 없습니다') : undefined}
                />
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-xl p-4 shadow-sm transition hover:shadow-md ${
                      !notification.isRead ? 'border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3
                            className={`font-semibold ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{notification.message}</p>
                        <div className="flex gap-3">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              {isEn ? 'Mark as Read' : '읽음 처리'}
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-sm text-gray-500 hover:text-red-600"
                          >
                            {isEn ? 'Delete' : '삭제'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Settings Tab */
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">{isEn ? 'Notification Settings' : '알림 설정'}</h2>

            {preferences && (
              <div className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{isEn ? 'Email Notifications' : '이메일 알림'}</h3>
                    <p className="text-sm text-gray-600">
                      {isEn ? 'Receive important notifications via email' : '중요한 알림을 이메일로 받습니다'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) =>
                        updatePreferences({ emailNotifications: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{isEn ? 'Push Notifications' : '푸시 알림'}</h3>
                    <p className="text-sm text-gray-600">
                      {isEn ? 'Receive real-time notifications in the app' : '앱에서 실시간 알림을 받습니다'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications}
                      onChange={(e) =>
                        updatePreferences({ pushNotifications: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <hr className="my-6" />

                {/* Reminder Time */}
                <div>
                  <h3 className="font-semibold mb-2">{isEn ? 'Reminder Time' : '리마인더 시간'}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {isEn ? 'Set the time to receive daily study reminders' : '매일 학습 리마인더를 받을 시간을 설정하세요'}
                  </p>
                  <input
                    type="time"
                    value={preferences.reminderTime}
                    onChange={(e) =>
                      updatePreferences({ reminderTime: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Reminder Days */}
                <div>
                  <h3 className="font-semibold mb-2">{isEn ? 'Reminder Days' : '리마인더 요일'}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {isEn ? 'Select the days to receive reminders' : '리마인더를 받을 요일을 선택하세요'}
                  </p>
                  <div className="flex gap-2">
                    {dayNames.map((day, index) => {
                      const dayNumber = index + 1;
                      const isSelected = preferences.reminderDays
                        .split(',')
                        .includes(String(dayNumber));

                      return (
                        <button
                          key={day}
                          onClick={() => {
                            const days = preferences.reminderDays
                              .split(',')
                              .filter(Boolean);
                            const newDays = isSelected
                              ? days.filter((d) => d !== String(dayNumber))
                              : [...days, String(dayNumber)];
                            updatePreferences({
                              reminderDays: newDays.sort().join(','),
                            });
                          }}
                          className={`w-10 h-10 rounded-full font-medium transition ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
