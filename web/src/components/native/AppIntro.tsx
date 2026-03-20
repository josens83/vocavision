'use client';

import { useEffect, useState } from 'react';

export default function AppIntro() {
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'fading'>('hidden');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    if ((window as any).__vvIntroShown) return;
    (window as any).__vvIntroShown = true;

    setPhase('visible');
    const t1 = setTimeout(() => setPhase('fading'), 2500);
    const t2 = setTimeout(() => setPhase('hidden'), 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#141f35',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'fading' ? 0 : 1,
      transition: phase === 'fading' ? 'opacity 0.8s ease' : 'none',
      pointerEvents: 'none',
    }}>
      {/* 아이콘 */}
      <div style={{ animation: 'vv-icon 0.5s ease-out 0s both', marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 22, overflow: 'hidden' }}>
          <svg viewBox="0 0 200 200" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67E8F9"/>
                <stop offset="100%" stopColor="#0891B2"/>
              </linearGradient>
            </defs>
            <rect width="200" height="200" rx="45" fill="url(#ig)"/>
            <text x="100" y="128" fontSize="66" fontWeight="700" fill="white"
              textAnchor="middle"
              fontFamily="system-ui,-apple-system,sans-serif">
              VV&#923;I
            </text>
          </svg>
        </div>
      </div>
      {/* VocaVision AI */}
      <div style={{ animation: 'vv-up 0.4s ease-out 0.4s both' }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>
          VocaVision AI
        </span>
      </div>
      {/* Vocabulary, Visualized. */}
      <div style={{ animation: 'vv-up 0.4s ease-out 0.7s both', marginTop: 8 }}>
        <span style={{ fontSize: 15, color: '#67E8F9', fontStyle: 'italic' }}>
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
