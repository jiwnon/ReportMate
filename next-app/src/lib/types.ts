/**
 * ReportMate MVP - DB 스키마 타입
 * level: 1/2/3 (상/중/하 대체)
 */

export type Level = '1' | '2' | '3';

export interface Area {
  id: string;
  subject: string;
  name: string;
  order_index: number;
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
}

export interface Rating {
  student_id: string;
  area_id: string;
  level: Level;
}

export type SubjectCode = '국어' | '수학';
export const SUBJECTS: SubjectCode[] = ['국어', '수학'];
