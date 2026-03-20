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
    const t1 = setTimeout(() => setPhase('fading'), 400);
    const t2 = setTimeout(() => setPhase('hidden'), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#141f35',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'fading' ? 0 : 1,
      transition: phase === 'fading' ? 'opacity 0.5s ease' : 'none',
      pointerEvents: 'none',
    }}>
      <div style={{ animation: 'vv-in 0.3s ease-out both' }}>
        <div style={{ width: 80, height: 80, borderRadius: 22, overflow: 'hidden' }}>
          <svg viewBox="0 0 108 108" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67E8F9"/>
                <stop offset="100%" stopColor="#0891B2"/>
              </linearGradient>
            </defs>
            <rect width="108" height="108" fill="url(#ig)"/>
            <path d="M 28,40 L 40,70 L 52,40" fill="none" stroke="white" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 56,70 L 68,40 L 80,70" fill="none" stroke="white" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <style>{`
        @keyframes vv-in {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
