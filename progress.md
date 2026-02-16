# ReportMate 진행 상황

## 목표

1학년 1학기 국어·수학 생활기록부 평어를 빠르게 작성하는 **엑셀 대체** 웹 앱.  
SaaS가 아닌 단일 세션 도구. AI 문장 생성 미사용, templates 테이블에서만 문장 선택 (deterministic).

---

## 완료된 작업

### 1. MVP 단순화 (라우팅·개념 정리)

- 프로젝트/멀티테넌트/인증 제거
- 라우팅: `/` · `/students` · `/ratings` · `/review`

### 2. Supabase 스키마 (MVP)

- **areas**: id(uuid), subject, name, order_index
- **templates**: id(uuid), area_id(FK), level('1'|'2'|'3'), sentence
- **students**: id(uuid), number, name
- **ratings**: (student_id, area_id) PK, level('1'|'2'|'3')

마이그레이션: `next-app/supabase/migrations/20240216100000_rm_mvp_schema.sql`

### 3. 템플릿 시드 스크립트

- `next-app/scripts/seed-templates.mjs`: xlsx(열: area | level | sentence) → 중복 제거 후 templates insert
- supabase-js 사용, SUBJECT env로 과목 지정

### 4. 타입·generator

- Level = '1'|'2'|'3', Area, Template(area_id, level), Student, Rating
- generator: `generateComment(areaLevels, templates, { studentId, regenerateCount })` — deterministic, 순수 함수

### 5. 페이지 구현

- **/students**: 학생 번호/이름 테이블, 행 추가, 저장 → Supabase (Zustand students-store)
- **/ratings**: 행=학생, 열=areas, 셀=1/2/3, 변경 시 자동 저장
- **/review**: students·ratings·templates 조회 → generateComment per 학생, 다시 생성(regenerateCount), 복사

### 6. 문서

- README.md(next-app): 스택, 라우팅, 사용 흐름, DB 구조

---

## 다음 작업 (예정)

- [ ] areas 초기 데이터 시딩 (국어/수학 단원)
- [ ] 엑셀 다운로드 (xlsx)
- [ ] UI 정리 (스타일·접근성)
- [ ] npm 빌드 환경 점검 (next-pwa 등 의존성)
