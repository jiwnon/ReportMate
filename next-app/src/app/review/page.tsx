'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/app-store';
import { generateComment } from '@/lib/generator';
import type { Template } from '@/lib/types';
import type { Student } from '@/lib/types';
import type { Area } from '@/lib/types';
import type { Rating } from '@/lib/types';

export default function ReviewPage() {
  const { subject } = useAppStore();
  const sub = subject ?? '국어';
  const [students, setStudents] = useState<Student[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [regenerateCounts, setRegenerateCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('students').select('id, number, name').order('number'),
      supabase.from('areas').select('id, subject, name, order_index').eq('subject', sub).order('order_index'),
      supabase.from('ratings').select('student_id, area_id, level'),
      supabase.from('templates').select('id, area_id, level, sentence'),
    ]).then(([s, a, r, t]) => {
      setStudents((s.data ?? []) as Student[]);
      setAreas((a.data ?? []) as Area[]);
      setRatings((r.data ?? []) as Rating[]);
      setTemplates((t.data ?? []) as Template[]);
      setLoading(false);
    });
  }, [sub]);

  const areaIds = new Set(areas.map((x) => x.id));
  const templatesForSubject = templates.filter((t) => areaIds.has(t.area_id));
  const ratingMap: Record<string, string> = {};
  for (const r of ratings) {
    ratingMap[`${r.student_id}-${r.area_id}`] = r.level;
  }

  const getText = (student: Student, regCount: number) => {
    const areaLevels = areas.map((a) => ({
      areaId: a.id,
      level: ratingMap[`${student.id}-${a.id}`] ?? '2',
    }));
    return generateComment(areaLevels, templatesForSubject, {
      studentId: student.id,
      regenerateCount: regCount,
    });
  };

  const regCount = (studentId: string) => regenerateCounts[studentId] ?? 0;
  const setRegCount = (studentId: string, n: number) => {
    setRegenerateCounts((prev) => ({ ...prev, [studentId]: n }));
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <main style={{ padding: 16 }}>
      <h1>결과 확인</h1>
      {students.map((st) => (
        <div key={st.id} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <strong>{st.number}. {st.name}</strong>
            <button
              type="button"
              onClick={() => setRegCount(st.id, regCount(st.id) + 1)}
            >
              다시 생성
            </button>
            <button
              type="button"
              onClick={() => {
                const t = getText(st, regCount(st.id));
                if (t) void navigator.clipboard.writeText(t);
              }}
            >
              복사
            </button>
          </div>
          <textarea
            readOnly
            rows={6}
            style={{ width: '100%', boxSizing: 'border-box' }}
            value={getText(st, regCount(st.id))}
          />
        </div>
      ))}
      <Link href="/">처음으로</Link>
    </main>
  );
}
