'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 팝업 로그인 후 NextAuth가 이 URL로 리다이렉트함.
 * 부모 창에 메시지 보내고 팝업 닫기 → 부모는 /classes로 이동.
 */
export default function AuthPopupDonePage() {
  const router = useRouter();

  useEffect(() => {
    const origin = window.location.origin;
    if (window.opener) {
      window.opener.postMessage({ type: 'reportmate-auth-done' }, origin);
      window.close();
    } else {
      router.replace('/classes');
    }
  }, [router]);

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      로그인 완료. 이 창이 자동으로 닫힙니다.
    </div>
  );
}
