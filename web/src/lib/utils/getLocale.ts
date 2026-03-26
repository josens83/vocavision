import { headers } from 'next/headers';

/**
 * 서버 컴포넌트/메타데이터에서 locale 감지
 * middleware가 설정한 x-locale 헤더 사용
 * 주의: useLocale() 훅과 중복 로직 생성 금지 — 이 함수는 서버 전용
 */
export function getServerLocale(): 'ko' | 'en' {
  try {
    const headersList = headers();
    const locale = headersList.get('x-locale');
    return locale === 'en' ? 'en' : 'ko';
  } catch {
    return 'ko';
  }
}

export function getSiteUrl(locale: 'ko' | 'en'): string {
  return locale === 'en' ? 'https://vocavision.app' : 'https://vocavision.kr';
}
