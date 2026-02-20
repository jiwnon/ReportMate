import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

const AUTH_ENV_KEYS = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
] as const;

function getMissingAuthEnv(): string[] {
  return AUTH_ENV_KEYS.filter((key) => !process.env[key]?.trim());
}

async function wrappedHandler(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const missing = getMissingAuthEnv();
  if (missing.length > 0) {
    const body = [
      '로그인을 쓰려면 아래 환경 변수가 필요합니다.',
      '',
      '비어 있는 변수: ' + missing.join(', '),
      '',
      '로컬: next-app/.env.local 에 위 변수 넣고 npm run dev 재시작.',
      '',
      '배포(Cloudflare): Workers & Pages > report-mate > Settings > Variables and Secrets',
      '  - Variables: NEXTAUTH_URL(https://report-mate.org), GOOGLE_CLIENT_ID',
      '  - Secrets: NEXTAUTH_SECRET, GOOGLE_CLIENT_SECRET 추가 후 재배포.',
      '',
      '예시: next-app/.env.example 참고.',
    ].join('\n');
    return new Response(body, {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  return await handler(req, context);
}

export async function GET(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return wrappedHandler(req, context);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return wrappedHandler(req, context);
}
