/**
 * 평어 생성 (deterministic, 순수 함수)
 * Math.random() / LLM 미사용. templates 테이블에서만 문장 선택.
 * seed = hash(studentId + areaId + level) + regenerateCount
 * index = seed % templates.length → 해당 템플릿 반환
 */
import type { Template } from '@/lib/types';

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

export function pickSentence(
  templates: Template[],
  studentId: string | number,
  areaId: string,
  level: string,
  regenerateCount: number = 0
): string | null {
  if (templates.length === 0) return null;
  const seed =
    hash([String(studentId), areaId, level].join('.')) + regenerateCount;
  const index = ((seed % templates.length) + templates.length) % templates.length;
  return templates[index]?.sentence ?? null;
}

export type GenerateCommentOptions = {
  studentId: string | number;
  regenerateCount?: number;
};

export function generateComment(
  areaLevels: Array<{ areaId: string; level: string }>,
  templates: Template[],
  options: GenerateCommentOptions
): string {
  const { studentId, regenerateCount = 0 } = options;
  const lines: string[] = [];
  for (const { areaId, level } of areaLevels) {
    const filtered = templates.filter(
      (t) => t.area_id === areaId && t.level === level
    );
    const sentence = pickSentence(
      filtered,
      studentId,
      areaId,
      level,
      regenerateCount
    );
    if (sentence) lines.push(sentence);
  }
  return lines.join('\n');
}
