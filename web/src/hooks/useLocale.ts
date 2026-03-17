'use client';
import { useEffect, useState } from 'react';

export function useLocale(): 'ko' | 'en' {
  const [locale, setLocale] = useState<'ko' | 'en'>('ko');

  useEffect(() => {
    // 1. 쿠키에서 locale 읽기
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1];

    // 2. 도메인으로 감지
    const domainLocale = window.location.hostname.includes('vocavision.app')
      ? 'en' : 'ko';

    setLocale((cookieLocale as 'ko' | 'en') || domainLocale);
  }, []);

  return locale;
}
