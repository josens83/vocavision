'use client';

import { useEffect, useState } from 'react';

export default function AppIntro() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Capacitor 앱 환경 + 세션당 1회만 표시
    const isCapacitor = typeof window !== 'undefined' &&
      (window.location.href.startsWith('capacitor://') ||
       navigator.userAgent.includes('VocaVision') ||
       (window as any).Capacitor?.isNativePlatform?.());

    if (!isCapacitor) return;

    const shown = sessionStorage.getItem('intro_shown');
    if (shown) return;

    sessionStorage.setItem('intro_shown', '1');
    setVisible(true);

    // 1.8s 후 페이드아웃 시작
    const fadeTimer = setTimeout(() => setFading(true), 1800);
    // 2.6s 후 완전 제거
    const removeTimer = setTimeout(() => setVisible(false), 2600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#141f35',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.8s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* 아이콘 */}
      <div style={{ animation: 'vv-icon 0.5s ease-out 0.2s both' }}>
        <div style={{
          width: 80, height: 80,
          background: '#06B6D4',
          borderRadius: 22,
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          <svg viewBox="0 0 108 108" width="80" height="80">
            <rect width="108" height="108" fill="#06B6D4"/>
            <path
              d="M 22,38 L 34,70 L 46,38 L 58,70 L 70,38 L 82,70 L 86,70 L 86,38"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 브랜드명 */}
      <div style={{ animation: 'vv-up 0.4s ease-out 0.6s both' }}>
        <span style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'white',
          letterSpacing: '-0.3px',
        }}>
          VocaVision AI
        </span>
      </div>

      {/* 태그라인 */}
      <div style={{ animation: 'vv-up 0.4s ease-out 0.9s both', marginTop: 8 }}>
        <span style={{
          fontSize: 15,
          color: '#67E8F9',
          fontStyle: 'italic',
        }}>
          Vocabulary, Visualized.
        </span>
      </div>

      <style>{`
        @keyframes vv-icon {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes vv-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
