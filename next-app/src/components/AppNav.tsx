'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

const links = [
  { href: '/', label: '홈' },
  { href: '/classes', label: '학급 목록' },
  { href: '/students', label: '학생 명단' },
  { href: '/ratings', label: '과목·등급' },
  { href: '/review', label: '평어 생성' },
];

export default function AppNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className="app-nav">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={pathname === href ? 'active' : undefined}
        >
          {label}
        </Link>
      ))}
      {status !== 'loading' && (
        session ? (
          <button
            type="button"
            className="app-nav-btn"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            로그아웃
          </button>
        ) : (
          <Link href="/" className="app-nav-btn">
            로그인
          </Link>
        )
      )}
    </nav>
  );
}
