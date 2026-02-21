'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

type Props = { requiredRedirectUri: string; error?: string };

export default function LandingAuth({ requiredRedirectUri, error }: Props) {
  const router = useRouter();
  const hasError = !!error;

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'reportmate-auth-done') {
        window.removeEventListener('message', onMessage);
        router.push('/classes');
        router.refresh();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [router]);

  function handleSignIn() {
    signIn('google', { callbackUrl: '/auth/popup-done' });
  }

  return (
    <div className="landing-auth">
      <p className="landing-intro">
        ReportMate는 초등 선생님을 위한 평어 생성 서비스입니다.
      </p>
      <div className="landing-actions">
        <button
          type="button"
          onClick={handleSignIn}
          className="btn btn-primary landing-btn-google"
        >
          <GoogleIcon />
          회원가입
        </button>
        {hasError && (
          <div className="landing-error" role="alert">
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Google 로그인에 실패했습니다.</p>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console → 사용자 인증 정보</a>에서 해당 OAuth 클라이언트를 연 뒤, <strong>승인된 리디렉션 URI</strong>에 아래 주소를 <strong>그대로</strong> 추가하세요.
            </p>
            <code className="landing-error-uri">{requiredRedirectUri}</code>
            <p style={{ margin: '8px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
              테스트 앱이면 OAuth 동의 화면에서 <strong>테스트 사용자</strong>에 로그인할 이메일을 추가해야 합니다. .env.local 의 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 도 확인하세요.
            </p>
          </div>
        )}
        <p className="landing-hint">
          로그인하면 학급·등급이 저장됩니다. 로그인 없이도 체험할 수 있습니다.
        </p>
        <a href="/classes" className="btn btn-secondary">
          로그인 없이 체험하기
        </a>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
