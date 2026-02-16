'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useStudentsStore } from '@/store/students-store';

export default function StudentsPage() {
  const { rows, setRows, addRow, setRow } = useStudentsStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('students')
      .select('id, number, name')
      .order('number')
      .then(({ data }) => {
        setRows((data ?? []).map((r) => ({ id: r.id, number: r.number, name: r.name })));
        setLoading(false);
      });
  }, [setRows]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    for (const row of rows) {
      if (row.id) {
        await supabase.from('students').update({ number: row.number, name: row.name }).eq('id', row.id);
      } else {
        const { data } = await supabase.from('students').insert({ number: row.number, name: row.name }).select('id').single();
        if (data) row.id = data.id;
      }
    }
    const { data } = await supabase.from('students').select('id, number, name').order('number');
    setRows((data ?? []).map((r) => ({ id: r.id, number: r.number, name: r.name })));
    setSaving(false);
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <main style={{ padding: 16 }}>
      <h1>학생 명단</h1>
      <table>
        <thead>
          <tr>
            <th>번호</th>
            <th>이름</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i}>
              <td>
                <input
                  type="number"
                  value={r.number || ''}
                  onChange={(e) => setRow(i, { number: Number(e.target.value) || 0 })}
                />
              </td>
              <td>
                <input
                  value={r.name}
                  onChange={(e) => setRow(i, { name: e.target.value })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow}>
        행 추가
      </button>
      <button type="button" onClick={handleSave} disabled={saving}>
        {saving ? '저장 중...' : '저장'}
      </button>
      <br />
      <Link href="/ratings">등급 입력</Link>
    </main>
  );
}
