'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
        }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <h1 style={{
              fontSize: '3.75rem',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '1rem',
            }}>
              500
            </h1>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '1rem',
            }}>
              서버 오류가 발생했습니다
            </h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '2rem',
            }}>
              일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>
            <button
              onClick={() => reset()}
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: '500',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
