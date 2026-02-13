# HAHA LAB - 아동 발달 센터 관리 시스템

## 📋 프로젝트 개요

HAHA LAB은 아동 발달 센터를 위한 통합 관리 시스템입니다. 내담자 관리, 스케줄 관리, Play Lab 콘텐츠, 이력 추적 등의 기능을 제공합니다.

### 주요 기능
- 👥 **내담자 및 예약 상담자 관리**
- 📅 **수업/상담 스케줄 관리** (월간/주간/일간 뷰)
- 🎮 **Play Lab 학습 콘텐츠** (7개 카테고리)
- 📊 **이력 추적 시스템** (수업/상담/일정변경/미출석/삭제 이력)
- 🔔 **공지사항 시스템** (관리자 전용)
- ⚙️ **설정 및 환경 맞춤화**

---

## 🗂️ 프로젝트 구조

```
webapp/
├── public/
│   ├── index.html              # 사용자 페이지 (선생님용)
│   ├── admin.html              # 관리자 페이지
│   └── playlab/                # Play Lab 콘텐츠 (선택사항)
│       ├── 01-000.html
│       ├── 01-001.html
│       └── 01-002.html
├── haha_lab_final_schema.sql   # Supabase 데이터베이스 스키마
├── MODIFICATIONS.md            # 상세 수정 가이드
├── README.md                   # 이 파일
└── .gitignore                  # Git 제외 파일 목록
```

---

## 🗄️ 데이터베이스 스키마

### 주요 테이블

#### 1. teachers (선생님)
- 로그인 ID/비밀번호
- 센터 정보, 요금제
- 상태 관리 (Active, Paused, Suspended)

#### 2. clients (내담자/예약자)
- 기본 정보 (이름, 성별, 생년월일, 연령)
- 타입: `client` (정규), `reserve` (예약)
- 상태: `active`, `paused`, `terminated`, `deleted`
- 보호자 정보, 진단명, 초기 상담

#### 3. schedules (스케줄)
- 수업/상담 일정
- 날짜, 시간, 상태 (scheduled, completed, noshow, deleted)
- Drag & Drop 지원

#### 4. histories (이력) ⭐ NEW
- 모든 활동 이력 추적
- 수업 완료, 상담 완료, 일정 변경, 미출석, 삭제
- 소요 시간, 변경 전후 정보 기록

#### 5. notices (공지사항)
- 관리자 공지사항
- 타입: 일반, 업데이트, 점검, 이벤트
- 숨김 처리 가능

#### 6. play_contents (Play Lab 콘텐츠)
- 7개 카테고리 (생각/소리/듣기/보기/말하기/생활/아트)
- 썸네일, 태그, 조회수
- 숨김 처리 가능

---

## ✨ 주요 기능 상세

### 사용자 페이지 (index.html)

#### 1. 내담자/예약자 관리
- ✅ 신규 등록 (정규/예약 구분)
- ✅ 상세 정보 편집
- ✅ 상태 관리 (활동중/정지/종결/삭제)
- ✅ 초성 검색 및 필터링
- ✅ 예약자 → 정규 내담자 전환

#### 2. 스케줄 관리
- ✅ 월간/주간/일간 달력 뷰
- ✅ Drag & Drop으로 일정 등록
- ✅ 시간 충돌 감지 및 자동 조정
- ✅ 수업 시작, 완료, 미출석 처리
- ✅ 일정 변경 및 삭제

#### 3. 이력 시스템 ⭐ NEW
- ✅ **수업 이력**: 시작/종료 시간, 소요 시간 자동 기록
- ✅ **상담 이력**: 상담 진행 및 완료 기록
- ✅ **일정 변경 이력**: 변경 전후 날짜/시간 비교
- ✅ **미출석 이력**: 미출석 날짜 및 시간 기록
- ✅ **삭제 이력**: 삭제된 일정 정보 보존
- ✅ 프로필 내 이력 탭에서 전체 이력 조회

#### 4. Play Lab 학습 모드
- ✅ 7개 카테고리별 콘텐츠
- ✅ 검색 및 해시태그 필터
- ✅ 학습 완료 처리
- ✅ 조회수 자동 증가

#### 5. 삭제된 프로필 처리 ⭐ NEW
- ✅ 삭제된 프로필 클릭 시 경고 메시지
- ✅ "삭제된 내담자/예약 상담자입니다" 표시
- ✅ 영구 삭제 버튼만 노출
- ✅ 미완료 수업/상담 일괄 삭제

### 관리자 페이지 (admin.html)

#### 1. 대시보드
- ✅ 전체 통계 (선생님, 내담자, 콘텐츠 수)
- ✅ 최근 활동 로그
- ✅ 통계 분석 (준비 중)

#### 2. 선생님 관리
- ✅ 선생님 등록 및 정보 수정
- ✅ 요금제 설정 (Basic, Pro, Enterprise)
- ✅ 활동 정지/재개 기능
- ✅ 등록 내담자 수 제한 관리

#### 3. 공지사항 관리 ⭐ NEW
- ✅ **공지사항 등록**: 타입별 분류 (일반/업데이트/점검/이벤트)
- ✅ **공지사항 수정**: 기존 공지사항 내용 수정
- ✅ **공지사항 삭제**: 불필요한 공지사항 영구 삭제
- ✅ **숨기기/보이기**: 특정 공지사항 임시 숨김 처리
- ✅ HTML 콘텐츠 지원
- ✅ 아코디언 방식 리스트

#### 4. Play Lab 콘텐츠 관리
- ✅ 콘텐츠 등록/수정/삭제
- ✅ 카테고리별 분류
- ✅ 썸네일 업로드 (Supabase Storage)
- ✅ 숨김 처리

#### 5. 활동 로그
- ✅ 시스템 활동 기록
- ✅ 수업/상담 완료 로그
- ✅ 학생 관리 로그

---

## 🚀 설치 및 실행

### 1. Supabase 설정

#### 프로젝트 생성
1. [Supabase](https://supabase.com) 접속 및 로그인
2. 새 프로젝트 생성
3. 프로젝트 URL과 Anon Key 복사

#### 데이터베이스 스키마 적용
```sql
-- Supabase SQL Editor에서 실행
-- haha_lab_final_schema.sql 파일 내용 복사하여 실행
```

#### 환경 변수 설정
```javascript
// admin.html, index.html 파일에서 수정
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_KEY = 'your-anon-key';
```

### 2. 로컬 실행

#### 단순 파일 열기
```bash
# 브라우저에서 직접 열기
open public/index.html      # 사용자 페이지
open public/admin.html      # 관리자 페이지
```

#### 로컬 서버 실행 (권장)
```bash
# Python 3
python3 -m http.server 8000

# 브라우저에서 접속
http://localhost:8000/public/index.html
http://localhost:8000/public/admin.html
```

### 3. 로그인 정보

#### 사용자 페이지
- 아이디: `teacher01`
- 비밀번호: `1234`

#### 관리자 페이지
- 비밀번호: `zxcasd123`

---

## 🔧 설정 및 커스터마이징

### 사용자 설정 (index.html)
- ⚙️ 기본 수업 시간 설정
- ⚙️ 수업 시작 5분 전 알림
- ⚙️ 미완료 수업 알림 (5분 경과 후)
- ⚙️ 정지/종결 내담자 표시 여부

### 관리자 설정 (admin.html)
- ⚙️ 요금제별 내담자 수 제한 설정
- ⚙️ 선생님 활동 정지/재개
- ⚙️ 공지사항 표시 관리

---

## 📊 이력 추적 시스템 (NEW)

### 자동 기록되는 이력 항목

#### 1. 수업 완료
- 📝 수업 시작 시간
- 📝 수업 종료 시간
- 📝 총 소요 시간 (분)
- 📝 수업 날짜

#### 2. 상담 완료
- 📝 상담 시작 시간
- 📝 상담 종료 시간
- 📝 총 소요 시간 (분)
- 📝 상담 날짜

#### 3. 일정 변경
- 📝 원래 날짜
- 📝 변경된 날짜
- 📝 원래 시간
- 📝 변경된 시간

#### 4. 미출석
- 📝 미출석 날짜
- 📝 예정 시간

#### 5. 일정 삭제
- 📝 삭제된 일정 정보
- 📝 삭제 날짜 및 시간

### 이력 조회 방법
1. 내담자/예약자 프로필 클릭
2. "수업이력" 또는 "상담이력" 탭 선택
3. 시간순으로 정렬된 전체 이력 확인

---

## 🔄 상담예약자 → 내담자 전환

### 전환 프로세스
1. 예약자 상세 페이지에서 "내담자로 전환" 버튼 클릭
2. 타입이 `reserve`에서 `client`로 변경
3. 모든 상담 이력이 자동으로 수업 이력으로 이동
4. 전환 이력이 자동 생성됨

### 이력 이전
- ✅ 기존 상담예약 이력 → 수업이력으로 이동
- ✅ 이력 타입 자동 변경 (`consultation_history` → `session_history`)
- ✅ 전환 일시 및 내용 기록

---

## 🛠️ 기술 스택

- **Frontend**: React 18 (UMD), Babel Standalone, Tailwind CSS
- **Icons**: Lucide Icons
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Custom (Teacher ID + Password)

---

## 📝 데이터베이스 트리거

### 1. 스케줄 완료 트리거
```sql
CREATE TRIGGER trigger_log_schedule_completion
    AFTER UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION log_schedule_completion();
```
- 수업/상담 완료 시 자동으로 histories 테이블에 기록
- 소요 시간 자동 계산

### 2. 스케줄 삭제 트리거
```sql
CREATE TRIGGER trigger_log_schedule_deletion
    BEFORE DELETE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION log_schedule_deletion();
```
- 스케줄 삭제 전 이력 생성
- 삭제된 일정 정보 보존

### 3. 공지사항 수정 시간 트리거
```sql
CREATE TRIGGER trigger_update_notice_timestamp
    BEFORE UPDATE ON notices
    FOR EACH ROW
    EXECUTE FUNCTION update_notice_timestamp();
```
- 공지사항 수정 시 `updated_at` 자동 갱신

---

## 🔍 주요 SQL 쿼리 예제

### 특정 내담자 이력 조회
```sql
SELECT * FROM histories 
WHERE client_id = 'YOUR_CLIENT_ID' 
ORDER BY created_at DESC;
```

### 오늘의 완료된 수업 조회
```sql
SELECT * FROM schedules 
WHERE teacher_id = 'teacher01' 
AND date = '2026-02-10' 
AND status = 'completed';
```

### 내담자별 총 수업 시간
```sql
SELECT 
    client_id, 
    client_name, 
    SUM(duration_minutes) as total_minutes
FROM histories 
WHERE category = 'session_history' 
AND action = '수업완료'
GROUP BY client_id, client_name;
```

---

## 🐛 알려진 이슈 및 해결 방법

### 1. 스케줄 시간 충돌
- **증상**: 같은 시간에 여러 일정 등록 시도
- **해결**: 자동 충돌 감지 및 조정 옵션 제공 (전체 밀기/자동 단축/직접 설정)

### 2. 이력 중복 생성
- **증상**: 트리거로 인한 이력 중복
- **해결**: 트리거 함수 내 조건문으로 중복 방지

### 3. 삭제된 프로필 표시
- **증상**: 삭제된 프로필이 목록에 계속 표시
- **해결**: `status = 'deleted'` 필터링 적용

---

## 📄 라이선스

© 2026 HAHA LAB Corp. All rights reserved.

---

## 👥 문의

- **관리자**: 010-8416-3323 (카카오톡 또는 문자)
- **이메일**: support@hahalab.com

---

## 📚 추가 문서

- [MODIFICATIONS.md](./MODIFICATIONS.md) - 상세 수정 가이드 및 코드 조각
- [Play Lab 콘텐츠 가이드](./public/playlab/README.md) - Play Lab 콘텐츠 등록 방법

---

## 🎯 로드맵

### v3.1 (예정)
- [ ] 통계 분석 대시보드
- [ ] 내담자별 진척도 차트
- [ ] 이메일 알림 기능
- [ ] 모바일 앱 (PWA)

### v3.2 (예정)
- [ ] 다중 센터 지원
- [ ] 급여 관리 시스템
- [ ] 학부모 포털
- [ ] API 문서화

---

**Last Updated**: 2026-02-10  
**Version**: 3.0
