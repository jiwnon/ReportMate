/**
 * Next.js 미들웨어
 * - 비로그인 사용자도 체험 가능하므로 라우트 차단 없음.
 * - 로그인 사용자 데이터 격리: Server Actions에서 user_id로만 학급 접근.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
