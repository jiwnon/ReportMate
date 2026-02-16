import { create } from 'zustand';

export type StudentRow = { id?: string; number: number; name: string };

type StudentsState = {
  rows: StudentRow[];
  setRows: (rows: StudentRow[]) => void;
  addRow: () => void;
  setRow: (index: number, patch: Partial<StudentRow>) => void;
};

export const useStudentsStore = create<StudentsState>((set) => ({
  rows: [],
  setRows: (rows) => set({ rows }),
  addRow: () =>
    set((s) => {
      const max =
        s.rows.length ? Math.max(...s.rows.map((r) => r.number), 0) : 0;
      return { rows: [...s.rows, { number: max + 1, name: '' }] };
    }),
  setRow: (index, patch) =>
    set((s) => ({
      rows: s.rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    })),
}));
