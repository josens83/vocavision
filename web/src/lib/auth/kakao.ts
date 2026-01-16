// /web/src/lib/auth/kakao.ts
// 카카오 OAuth 로그인 유틸리티

const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '';
const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || '';
const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * 카카오 로그인 URL 생성
 * redirect_uri를 현재 도메인 기준으로 동적 생성하여 도메인 간 세션 문제 방지
 */
export function getKakaoLoginUrl(): string {
  // 현재 도메인 기준으로 redirect_uri 생성 (브라우저 환경에서만)
  // 이렇게 하면 vocavision-web.vercel.app에서 로그인해도 같은 도메인으로 콜백됨
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback/kakao`
    : KAKAO_REDIRECT_URI;

  const params = new URLSearchParams({
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'profile_nickname',
  });

  return `${KAKAO_AUTH_URL}?${params.toString()}`;
}

/**
 * 카카오 로그인 처리 (백엔드 연동)
 */
export async function loginWithKakao(code: string): Promise<{
  success: boolean;
  token: string;
  user: {
    id: string;
    name?: string;
    email?: string | null;
    avatar?: string | null;
    role: string;
    provider?: string;
    subscriptionStatus: string;
  };
}> {
  const response = await fetch(`${API_URL}/auth/kakao`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || '카카오 로그인에 실패했습니다');
  }

  return data;
}
