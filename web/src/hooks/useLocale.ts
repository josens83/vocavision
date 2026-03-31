'use client';
import { useState } from 'react';

export function useLocale(): 'ko' | 'en' {
  const [locale] = useState<'ko' | 'en'>(() => {
    if (typeof window === 'undefined') return 'ko';

    // 1. 도메인으로 즉시 감지 (가장 신뢰)
    const domainLocale = window.location.hostname.includes('vocavision.app')
      ? 'en' : 'ko';

    // 2. 쿠키 확인 (있으면 우선)
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] as 'ko' | 'en' | undefined;

    return cookieLocale || domainLocale;
  });

  return locale;
}
