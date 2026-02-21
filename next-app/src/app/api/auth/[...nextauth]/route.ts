import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// 복잡한 wrappedHandler, AUTH_ENV_KEYS 다 지우고 아래 딱 세 줄만 남기세요.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };