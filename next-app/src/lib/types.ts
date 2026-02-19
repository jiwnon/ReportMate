/**
 * ReportMate MVP - DB 스키마 타입
 * level: 1/2/3/4 (매우잘함/잘함/보통/노력요함)
 */

export type Level = '1' | '2' | '3' | '4';

/** 1학기 | 2학기 */
export type Semester = 1 | 2;

/** 평어 레벨 단계 수 (2: 잘함/노력요함, 3: 잘함/보통/노력요함, 4: 매우잘함/잘함/보통/노력요함) */
export type LevelStep = 2 | 3 | 4;

/** 레벨 단계별 선택지: 라벨 + DB에 저장할 level (1~4) */
export const LEVEL_STEP_OPTIONS: Record<LevelStep, Array<{ label: string; value: Level }>> = {
  2: [
    { label: '잘함', value: '2' },
    { label: '노력요함', value: '4' },
  ],
  3: [
    { label: '잘함', value: '2' },
    { label: '보통', value: '3' },
    { label: '노력요함', value: '4' },
  ],
  4: [
    { label: '매우잘함', value: '1' },
    { label: '잘함', value: '2' },
    { label: '보통', value: '3' },
    { label: '노력요함', value: '4' },
  ],
};

/**
 * DB level(1~4)을 현재 레벨 단계에 맞는 select value로 변환.
 * 2단계: 1,2,3 → '2'(잘함), 4 → '4'; 3단계: 1,2 → '2', 3 → '3', 4 → '4'; 4단계: 그대로.
 */
export function levelToSelectValue(level: Level, step: LevelStep): Level {
  if (step === 4) return level;
  if (step === 3) return (level === '1' || level === '2' ? '2' : level) as Level;
  return (level === '4' ? '4' : '2') as Level; // 2-step
}

/** 과목: 국어, 수학, 통합(바생/슬생/즐생) */
export type SubjectCode = '국어' | '수학' | '바생' | '슬생' | '즐생';

/** 통합 과목 선택지 (바른생활, 슬기로운생활, 즐거운생활) */
export const INTEGRATED_SUBJECTS: SubjectCode[] = ['바생', '슬생', '즐생'];

/** 기본 과목 선택지 (국어, 수학, 통합은 UI에서 바생/슬생/즐생으로 세분) */
export const MAIN_SUBJECTS: ('국어' | '수학' | '통합')[] = ['국어', '수학', '통합'];

export const SUBJECT_LABELS: Record<SubjectCode, string> = {
  국어: '국어',
  수학: '수학',
  바생: '바른생활',
  슬생: '슬기로운생활',
  즐생: '즐거운생활',
};

export interface Classroom {
  id: string;
  grade: number;
  class_number: number;
  name: string;
}

export interface Area {
  id: string;
  subject: string;
  name: string;
  order_index: number;
  semester?: number;
}

export interface Template {
  id: string;
  area_id: string;
  level: Level;
  sentence: string;
}

export interface Student {
  id: string;
  number: number;
  name: string;
  classroom_id?: string | null;
}

export interface Rating {
  student_id: string;
  area_id: string;
  level: Level;
}

/** 활동 메모: GPT-4 평어 재작성 시 참고 (classroom_id, semester, subject 범위) */
export interface Activity {
  id: string;
  classroom_id: string;
  semester: Semester;
  subject: string | null;
  description: string;
  created_at?: string;
}

export const SUBJECTS: SubjectCode[] = ['국어', '수학', ...INTEGRATED_SUBJECTS];
