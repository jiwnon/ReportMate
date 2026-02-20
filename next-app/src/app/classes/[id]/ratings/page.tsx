'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getClassroomDataForRatingsAction, upsertRatingAction, addActivityAction, deleteActivityAction } from '@/lib/actions/classrooms';
import { useAppStore } from '@/store/app-store';
import { useGuestStore, isGuestId } from '@/store/guest-store';
import { createClient, hasSupabaseEnv } from '@/lib/supabase/client';
import type { Level } from '@/lib/types';
import type { Area } from '@/lib/types';
import type { Student } from '@/lib/types';
import type { Classroom } from '@/lib/types';
import type { Activity } from '@/lib/types';
import type { LevelStep } from '@/lib/types';
import { SUBJECT_LABELS, LEVEL_STEP_OPTIONS, levelToSelectValue } from '@/lib/types';
import type { SubjectCode } from '@/lib/types';

function ClassRatingsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const sem = searchParams.get('sem');
  const subjectParam = searchParams.get('subject');
  const semester = sem === '2' ? 2 : 1;
  const subject = (subjectParam ?? '국어') as SubjectCode;
  const { data: session, status } = useSession();
  const { setClassroom, setSemester, setSubject, selectedAreaIds, levelStep } = useAppStore();

  const getGuestClassroom = useGuestStore((s) => s.getClassroom);
  const getGuestStudents = useGuestStore((s) => s.getStudents);
  const getGuestRatings = useGuestStore((s) => s.getRatings);
  const setGuestRating = useGuestStore((s) => s.setRating);
  const getGuestActivities = useGuestStore((s) => s.getActivities);
  const addGuestActivity = useGuestStore((s) => s.addActivity);
  const deleteGuestActivity = useGuestStore((s) => s.deleteActivity);

  const [classroom, setClassroomState] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [ratings, setRatings] = useState<Record<string, Level>>({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityInput, setActivityInput] = useState('');
  const [activitySaving, setActivitySaving] = useState(false);
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
      setStudents(getGuestStudents(id));
      const guestRatings = getGuestRatings();
      setRatings(guestRatings);
      setActivities(getGuestActivities(id, semester, subject).map((a) => ({ ...a, classroom_id: id, semester, subject } as Activity)));
      if (hasSupabaseEnv()) {
        createClient()
          .from('areas')
          .select('id, subject, name, order_index, semester')
          .eq('subject', subject)
          .eq('semester', semester)
          .order('order_index')
          .then(({ data }) => setAreas((data ?? []) as Area[]));
      }
      setLoading(false);
      return;
    }

    if (!session) {
      setError('권한이 없습니다.');
      setLoading(false);
      return;
    }

    setError(null);
    getClassroomDataForRatingsAction(id, semester, subject)
      .then((res) => {
        if (res) {
          setClassroomState(res.classroom);
          setClassroom(res.classroom);
          setSemester(semester);
          setSubject(subject);
          setStudents(res.students);
          setAreas(res.areas);
          setRatings(res.ratings);
          setActivities(res.activities);
        } else setError('학급을 찾을 수 없거나 권한이 없습니다.');
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id, semester, subject, session, status, getGuestClassroom, getGuestStudents, getGuestRatings, getGuestActivities, setClassroom, setSemester, setSubject]);

  // 단원/레벨단계는 세션만 유지 → 없으면 단원 선택으로
  useEffect(() => {
    if (!loading && !error && selectedAreaIds.length === 0) {
      router.replace(`/classes/${id}/units?sem=${semester}&subject=${subject}`);
      return;
    }
    if (!loading && !error && !levelStep) {
      router.replace(`/classes/${id}/level-step?sem=${semester}&subject=${subject}`);
      return;
    }
  }, [loading, error, selectedAreaIds.length, levelStep, id, semester, subject, router]);

  const areasFiltered = areas.filter((a) => selectedAreaIds.includes(a.id));
  const levelOptions = levelStep ? LEVEL_STEP_OPTIONS[levelStep] : [];

  const ratingKey = (studentId: string, areaId: string) =>
    isGuestId(id) ? `${studentId}::${areaId}` : `${studentId}-${areaId}`;

  const setRating = async (studentId: string, areaId: string, level: Level | '') => {
    const key = ratingKey(studentId, areaId);
    setRatings((prev) => {
      const next = { ...prev };
      if (level === '') delete next[key];
      else next[key] = level;
      return next;
    });
    if (isGuestId(id)) {
      setGuestRating(key, level === '' ? null : level);
      return;
    }
    const result = await upsertRatingAction(studentId, areaId, level === '' ? null : level);
    if (result.error) setError(result.error);
  };

  const addActivity = async () => {
    const desc = activityInput.trim();
    if (!desc || activitySaving) return;
    setActivitySaving(true);
    if (isGuestId(id)) {
      addGuestActivity(id, semester, subject, desc);
      setActivities(
        getGuestActivities(id, semester, subject).map((a) => ({ ...a, classroom_id: id, semester, subject } as Activity))
      );
      setActivityInput('');
      setActivitySaving(false);
      return;
    }
    const result = await addActivityAction(id, semester, subject, desc);
    setActivitySaving(false);
    if (result.error) setError(result.error);
    else if (result.activity) {
      setActivities((prev) => [...prev, result.activity!]);
      setActivityInput('');
    }
  };

  const deleteActivity = async (activityId: string) => {
    if (isGuestId(id)) {
      deleteGuestActivity(id, activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      return;
    }
    const result = await deleteActivityAction(activityId);
    if (result.error) setError(result.error);
    else setActivities((prev) => prev.filter((a) => a.id !== activityId));
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!classroom) return <div className="alert alert-error">학급을 찾을 수 없습니다.</div>;
  if (selectedAreaIds.length === 0 || !levelStep) return <div className="loading">이동 중...</div>;

  return (
    <div className="card">
      <h1>{classroom.name} · {semester}학기 · {SUBJECT_LABELS[subject]} 등급</h1>
      <p className="sub">
        학생별·선택 단원별로 {levelOptions.map((o) => o.label).join(' / ')} 선택 (변경 시 자동 저장)
        {isGuestId(id) && <span style={{ color: 'var(--color-text-muted)' }}> (체험: 저장되지 않음)</span>}
      </p>

      <section className="activities-section" style={{ marginBottom: 24 }}>
        <h2 className="section-title">이번 학기 학습 활동</h2>
        <p className="sub" style={{ marginBottom: 10 }}>
          이 과목·학기의 대표 활동을 적어 두면 평어 생성 시 GPT가 반영합니다.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 12 }}>
          <input
            type="text"
            className="input"
            placeholder="활동 설명 입력"
            value={activityInput}
            onChange={(e) => setActivityInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addActivity()}
            style={{ flex: '1 1 200px', minWidth: 160 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={addActivity}
            disabled={activitySaving || !activityInput.trim()}
          >
            {activitySaving ? '추가 중...' : '추가'}
          </button>
        </div>
        {activities.length > 0 && (
          <ul className="activities-list" style={{ margin: 0, paddingLeft: 20 }}>
            {activities.map((a) => (
              <li key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ flex: 1 }}>{a.description}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteActivity(a.id)}
                  aria-label="삭제"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {students.length === 0 ? (
        <div className="alert alert-error">
          이 학급에 학생이 없습니다. <Link href={`/classes/${id}/students`}>학생 명단</Link>에서 먼저 입력하세요.
        </div>
      ) : (
        <>
          <div className="table-wrap ratings-table">
            <table>
              <thead>
                <tr>
                  <th>번호</th>
                  <th>이름</th>
                  {areasFiltered.map((a) => <th key={a.id}>{a.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id}>
                    <td>{st.number}</td>
                    <td>{st.name}</td>
                    {areasFiltered.map((a) => {
                      const dbLevel = ratings[ratingKey(st.id, a.id)];
                      const selectValue = dbLevel ? levelToSelectValue(dbLevel, levelStep!) : '';
                      return (
                        <td key={a.id}>
                          <select
                            className="input input-level"
                            value={selectValue}
                            onChange={(e) => {
                              const v = e.target.value;
                              setRating(st.id, a.id, v === '' ? '' : (v as Level));
                            }}
                          >
                            <option value="">선택</option>
                            {levelOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/review" className="btn btn-primary">
              평어 생성
            </Link>
            <Link href={`/classes/${id}/level-step?sem=${semester}&subject=${subject}`} className="btn btn-ghost">
              레벨 단계 변경
            </Link>
            <Link href={`/classes/${id}/units?sem=${semester}&subject=${subject}`} className="btn btn-ghost">
              단원 다시 선택
            </Link>
            <Link href={`/classes/${id}`} className="btn btn-ghost">
              학급으로
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ClassRatingsPage() {
  return (
    <Suspense fallback={<div className="loading">로딩 중...</div>}>
      <ClassRatingsContent />
    </Suspense>
  );
}
