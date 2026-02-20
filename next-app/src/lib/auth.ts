/**
 * NextAuth 설정 (Google OAuth)
 * - getServerSession: Server Components / API / Server Actions에서 세션 조회
 */
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Cloudflare 등에서 Host 기반 URL 사용 (타입에는 없음)
  // @ts-expect-error - trustHost is supported at runtime
  trustHost: true,
};
