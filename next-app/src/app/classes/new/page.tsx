'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { createClassroomAction } from '@/lib/actions/classrooms';
import { useGuestStore } from '@/store/guest-store';

export default function NewClassPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const addClassroom = useGuestStore((s) => s.addClassroom);

  const [grade, setGrade] = useState<number>(1);
  const [classNumber, setClassNumber] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = `${grade}학년 ${classNumber}반`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (session?.user) {
      const result = await createClassroomAction(grade, classNumber, name);
      if ('error' in result) {
        setError(result.error);
        setSaving(false);
        return;
      }
      router.push(`/classes/${result.id}`);
      return;
    }

    const classroom = addClassroom({ grade, class_number: classNumber, name });
    setSaving(false);
    router.push(`/classes/${classroom.id}`);
  };

  if (status === 'loading') return <div className="loading">로딩 중...</div>;

  return (
    <div className="card">
      <h1>학급 등록</h1>
      <p className="sub">
        학년과 반을 선택하면 학급 이름이 자동으로 만들어집니다. (예: 1학년 1반)
        {!session && (
          <span style={{ display: 'block', marginTop: 4, color: 'var(--color-text-muted)' }}>
            체험 모드: 저장되지 않습니다.
          </span>
        )}
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="grade">학년</label>
          <select
            id="grade"
            className="input"
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <option key={g} value={g}>
                {g}학년
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="class">반</label>
          <select
            id="class"
            className="input"
            value={classNumber}
            onChange={(e) => setClassNumber(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}반
              </option>
            ))}
          </select>
        </div>
        <p style={{ marginBottom: 16 }}>
          <strong>학급 이름:</strong> {name}
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중...' : session ? '등록' : '체험 추가'}
          </button>
          <Link href="/classes" className="btn btn-ghost">
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
