'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/app-store';
import type { Level } from '@/lib/types';
import type { Area } from '@/lib/types';
import type { Student } from '@/lib/types';

export default function RatingsPage() {
  const { subject, setSubject } = useAppStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [ratings, setRatings] = useState<Record<string, Level>>({});
  const [loading, setLoading] = useState(true);

  const sub = subject ?? '국어';

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('students').select('id, number, name').order('number'),
      supabase.from('areas').select('id, subject, name, order_index').eq('subject', sub).order('order_index'),
      supabase.from('ratings').select('student_id, area_id, level'),
    ]).then(([s, a, r]) => {
      setStudents((s.data ?? []) as Student[]);
      setAreas((a.data ?? []) as Area[]);
      const map: Record<string, Level> = {};
      for (const x of r.data ?? []) {
        map[`${x.student_id}-${x.area_id}`] = x.level as Level;
      }
      setRatings(map);
      setLoading(false);
    });
  }, [sub]);

  const setRating = async (studentId: string, areaId: string, level: Level | '') => {
    setRatings((prev: Record<string, Level>) => {
      const next = { ...prev };
      if (level === '') delete next[`${studentId}-${areaId}`];
      else next[`${studentId}-${areaId}`] = level;
      return next;
    });
    const supabase = createClient();
    if (level === '') {
      await supabase.from('ratings').delete().eq('student_id', studentId).eq('area_id', areaId);
    } else {
      await supabase.from('ratings').upsert(
        { student_id: studentId, area_id: areaId, level },
        { onConflict: 'student_id,area_id' }
      );
    }
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <main style={{ padding: 16 }}>
      <h1>등급 입력</h1>
      <p>
        과목:{' '}
        <select
          value={sub}
          onChange={(e) => setSubject(e.target.value as '국어' | '수학')}
        >
          <option value="국어">국어</option>
          <option value="수학">수학</option>
        </select>
      </p>
      {students.length === 0 ? (
        <p>
          학생이 없습니다. <Link href="/students">학생 명단</Link>에서 먼저 입력하세요.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>이름</th>
              {areas.map((a) => (
                <th key={a.id}>{a.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st.id}>
                <td>{st.number}</td>
                <td>{st.name}</td>
                {areas.map((a) => (
                  <td key={a.id}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      size={1}
                      value={ratings[`${st.id}-${a.id}`] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '');
                        if (v === '1' || v === '2' || v === '3') {
                          setRating(st.id, a.id, v as Level);
                        } else if (v === '') {
                          setRating(st.id, a.id, '');
                        }
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link href="/review">결과 확인</Link>
    </main>
  );
}
