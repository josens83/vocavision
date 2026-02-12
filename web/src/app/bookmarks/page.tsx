'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { EmptyFirstTime } from '@/components/ui/EmptyState';
import { SkeletonListItem } from '@/components/ui/Skeleton';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Bookmark {
  id: string;
  wordId: string;
  notes?: string;
  createdAt: string;
  word: {
    word: string;
    definition: string;
    difficulty: string;
    pronunciation?: string;
  };
}

export default function BookmarksPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const toast = useToast();
  const confirm = useConfirm();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadBookmarks();
  }, [user, hasHydrated, router]);

  const loadBookmarks = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookmarks(response.data.bookmarks);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (wordId: string) => {
    const confirmed = await confirm({
      title: '북마크 삭제',
      message: '이 단어를 북마크에서 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      type: 'warning',
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/bookmarks/${wordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookmarks(bookmarks.filter(b => b.wordId !== wordId));
      toast.success('북마크 삭제 완료', '북마크가 삭제되었습니다');
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      toast.error('북마크 삭제 실패', '다시 시도해주세요');
    }
  };

  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-700',
    INTERMEDIATE: 'bg-blue-100 text-blue-700',
    ADVANCED: 'bg-orange-100 text-orange-700',
    EXPERT: 'bg-red-100 text-red-700',
  };

  const difficultyLabels = {
    BEGINNER: '초급',
    INTERMEDIATE: '중급',
    ADVANCED: '고급',
    EXPERT: '전문가',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> 대시보드
              </Link>
              <h1 className="text-2xl font-bold text-blue-600">내 북마크</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-8">
            <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
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
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← 대시보드
            </Link>
            <h1 className="text-2xl font-bold text-blue-600">내 북마크</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">북마크한 단어</h2>
          <p className="text-gray-600">
            총 {bookmarks.length}개의 단어를 북마크했습니다
          </p>
        </div>

        {bookmarks.length === 0 ? (
          <EmptyFirstTime type="bookmarks" />
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/words/${bookmark.wordId}`}
                        className="text-3xl font-bold text-gray-900 hover:text-blue-600 transition"
                      >
                        {bookmark.word.word}
                      </Link>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          difficultyColors[bookmark.word.difficulty as keyof typeof difficultyColors]
                        }`}
                      >
                        {difficultyLabels[bookmark.word.difficulty as keyof typeof difficultyLabels]}
                      </span>
                    </div>
                    {bookmark.word.pronunciation && (
                      <p className="text-gray-500 mb-2">{bookmark.word.pronunciation}</p>
                    )}
                    <p className="text-lg text-gray-700 mb-3">
                      {bookmark.word.definition}
                    </p>
                    {bookmark.notes && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                        <p className="text-sm text-gray-700">
                          <strong>내 메모:</strong> {bookmark.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveBookmark(bookmark.wordId)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="북마크 삭제"
                  >
                    🗑️
                  </button>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/words/${bookmark.wordId}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                  >
                    자세히 보기 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
