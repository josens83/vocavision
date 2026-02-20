// Sentry 에러 모니터링 — @sentry/nextjs 설치 후 활성화
// 설치: npm install @sentry/nextjs
// 설정: NEXT_PUBLIC_SENTRY_DSN 환경변수

export function captureException(error: Error, context?: Record<string, any>): void {
  // TODO: Sentry 설치 후 활성화
  // Sentry.captureException(error, { extra: context });
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', error.message, context);
  }
}

export function captureMessage(message: string, level: string = 'info'): void {
  // TODO: Sentry 설치 후 활성화
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level}]`, message);
  }
}
