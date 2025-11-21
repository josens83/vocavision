// Phase 2-4: Offline fallback page

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="max-w-md mx-auto px-4 text-center">
        {isOnline ? (
          <>
            <div className="text-8xl mb-6 animate-bounce">✅</div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">다시 연결되었습니다!</h1>
            <p className="text-gray-600 mb-6">곧 대시보드로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="text-8xl mb-6 animate-pulse">📡</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">오프라인 상태입니다</h1>
            <p className="text-lg text-gray-600 mb-6">
              인터넷 연결을 확인해주세요. 연결되면 자동으로 다시 시작됩니다.
            </p>

            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <h2 className="text-xl font-bold mb-4">오프라인에서도 가능한 기능</h2>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  저장된 단어 복습
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  학습 기록 보기
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  플래시카드 학습
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">✗</span>
                  새 단어 추가 (온라인 필요)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">✗</span>
                  커뮤니티 기능 (온라인 필요)
                </li>
              </ul>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              다시 시도
            </button>

            <p className="mt-6 text-sm text-gray-500">
              인터넷 연결 상태: <span className="font-bold text-red-600">오프라인</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
