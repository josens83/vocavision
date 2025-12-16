// /web/src/lib/auth/kakao.ts
// 카카오 OAuth 로그인 유틸리티

const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '';
const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || '';
const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * 카카오 로그인 URL 생성
 */
export function getKakaoLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: KAKAO_REDIRECT_URI,
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
