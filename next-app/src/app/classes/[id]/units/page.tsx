'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { createClient, hasSupabaseEnv } from '@/lib/supabase/client';
import { getClassroomWithAreasAction } from '@/lib/actions/classrooms';
import { useAppStore } from '@/store/app-store';
import { useGuestStore, isGuestId } from '@/store/guest-store';
import type { Area } from '@/lib/types';
import type { Classroom } from '@/lib/types';
import type { SubjectCode } from '@/lib/types';
import type { Semester } from '@/lib/types';
import { SUBJECT_LABELS } from '@/lib/types';

function UnitsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const sem = searchParams.get('sem');
  const subjectParam = searchParams.get('subject');
  const semester = (sem === '2' ? 2 : 1) as Semester;
  const subject = (subjectParam ?? '국어') as SubjectCode;

  const { data: session, status } = useSession();
  const { setClassroom, setSemester, setSubject, setSelectedAreaIds, selectedAreaIds } = useAppStore();
  const getGuestClassroom = useGuestStore((s) => s.getClassroom);

  const [classroom, setClassroomState] = useState<Classroom | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedAreaIds));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (isGuestId(id)) {
      const c = getGuestClassroom(id);
      if (!c) {
        setError('학급을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      setClassroomState(c);
      setClassroom(c);
      setSemester(semester);
      setSubject(subject);
      if (!hasSupabaseEnv()) {
        setLoading(false);
        return;
      }
      createClient()
        .from('areas')
        .select('id, subject, name, order_index, semester')
        .eq('subject', subject)
        .eq('semester', semester)
        .order('order_index')
        .then(({ data, error: err }) => {
          if (err) setError(err.message);
          else {
            const areaList = (data ?? []) as Area[];
            setAreas(areaList);
            setSelected(new Set(areaList.filter((x) => selectedAreaIds.includes(x.id)).map((x) => x.id)));
          }
          setLoading(false);
        });
      return;
    }

    if (!session) {
      setError('권한이 없습니다.');
      setLoading(false);
      return;
    }

    setError(null);
    getClassroomWithAreasAction(id, subject, semester)
      .then((res) => {
        if (res) {
          setClassroomState(res.classroom);
          setClassroom(res.classroom);
          setSemester(semester);
          setSubject(subject);
          setAreas(res.areas);
          setSelected(new Set(res.areas.filter((x) => selectedAreaIds.includes(x.id)).map((x) => x.id)));
        } else setError('학급을 찾을 수 없거나 권한이 없습니다.');
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id, semester, subject, session, status, getGuestClassroom, setClassroom, setSemester, setSubject, selectedAreaIds]);

  const toggle = (areaId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  };

  const goNext = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setSelectedAreaIds(ids);
    router.push(`/classes/${id}/level-step?sem=${semester}&subject=${subject}`);
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!classroom) return <div className="alert alert-error">학급을 찾을 수 없습니다.</div>;

  return (
    <div className="card">
      <h1>{classroom.name} · {semester}학기 · {SUBJECT_LABELS[subject]} 단원 선택</h1>
      <p className="sub">평가할 단원을 선택하세요. (최소 1개)</p>

      <section className="units-section" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {areas.map((a) => (
            <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selected.has(a.id)}
                onChange={() => toggle(a.id)}
              />
              <span>{a.name}</span>
            </label>
          ))}
        </div>
        {areas.length === 0 && (
          <p className="sub">이 과목·학기에 등록된 단원이 없습니다.</p>
        )}
      </section>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={goNext}
          disabled={selected.size === 0}
        >
          다음: 레벨 단계 선택
        </button>
        <Link href={`/classes/${id}`} className="btn btn-ghost">
          학급으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function UnitsPage() {
  return (
    <Suspense fallback={<div className="loading">로딩 중...</div>}>
      <UnitsContent />
    </Suspense>
  );
}
