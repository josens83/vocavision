import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const locale = hostname.includes('vocavision.app') ? 'en' : 'ko';

  const response = NextResponse.next();
  response.cookies.set('locale', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1년
    sameSite: 'lax',
  });
  response.headers.set('x-locale', locale);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
