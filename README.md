# HAHA LAB v3.2 - 아동 발달 치료 관리 시스템

## 📌 프로젝트 개요
- **버전**: v3.2
- **업데이트**: 2026-02-10  
- **설명**: Supabase 기반 아동 발달 치료 스케줄 및 내담자 관리 시스템
- **주요 기술**: React 18, Supabase (PostgreSQL), Tailwind CSS

---

## ✨ v3.2 주요 업데이트

### 🆕 신규 기능
1. **상담이력/수업이력 추적 시스템**
   - YYYYMMDD HH:mm 형식 통일
   - 자동 이력 기록 (완료/미출석/변경/삭제)
   - 상담예약자: 상담이력 탭
   - 내담자: 수업이력 탭

2. **수업시간 통계**
   - 주간 수업시간
   - 월간 수업시간  
   - 총 수업시간
   - 실시간 자동 계산

3. **실시간 타이머 (GNB)**
   - 수업 진행 중 초단위 타이머 표시
   - HH:MM:SS 형식

4. **캘린더 모달 개선**
   - 완료된 일정 클릭 → 상세보기 모달
   - 상세보기 버튼 → 이력 탭 이동
   - 삭제 버튼

---

## 📋 주요 기능

### 사용자 페이지
1. **내담자/상담예약자 관리**
   - 프로필 CRUD
   - 상담예약자 ↔ 내담자 전환
   - 수업정지/종결 상태 관리

2. **스케줄 관리**
   - 캘린더 뷰 (월간/주간/일간)
   - 드래그 앤 드롭 일정 등록
   - 수업 시작/종료, 미출석 처리

3. **이력 추적 시스템** 🆕
   - 수업/상담 완료 자동 기록
   - 미출석/일정변경/삭제 자동 기록
   - YYYYMMDD HH:mm 형식

4. **Play Lab 콘텐츠**
   - 7가지 카테고리 치료 콘텐츠
   - 태그 기반 검색

### 관리자 페이지
1. **대시보드** - 센터별 통계
2. **공지사항 관리** - CRUD, 숨기기/보이기
3. **콘텐츠 관리** - Play Lab 콘텐츠
4. **활동 로그** - 시스템 활동 기록

---

## 🗄️ 데이터베이스 구조 (v3.2)

### 핵심 테이블
| 테이블 | 설명 |
|--------|------|
| **teachers** | 선생님 정보 |
| **clients** | 내담자/상담예약자 |
| **schedules** | 수업/상담 일정 |
| **histories** 🆕 | 이력 추적 (v3.2) |
| **notices** | 공지사항 |
| **play_contents** | 치료 콘텐츠 |
| **activity_logs** | 활동 로그 |

### 🆕 histories 테이블 (v3.2)
```sql
CREATE TABLE histories (
    id BIGINT PRIMARY KEY,
    teacher_id TEXT,
    client_id TEXT,
    client_name TEXT,
    type TEXT,  -- session/consultation/noshow/reschedule/delete
    category TEXT,  -- session_history/consultation_history
    action TEXT,  -- 수업완료/상담완료/미출석/일정변경/일정삭제
    
    -- YYYYMMDD HH:mm 형식 필드
    event_datetime TEXT,
    start_datetime TEXT,
    end_datetime TEXT,
    noshow_datetime TEXT,
    delete_datetime TEXT,
    reschedule_datetime TEXT,
    original_datetime TEXT,
    changed_datetime TEXT,
    
    duration_minutes INT,
    details TEXT,
    memo TEXT
);
```

### 🆕 함수 (v3.2)
```sql
-- 수업시간 통계
get_session_time_stats(p_client_id TEXT)
RETURNS TABLE (
    weekly_minutes INT,
    monthly_minutes INT,
    total_minutes INT
)
```

### 🆕 트리거 (v3.2)
- `log_schedule_completion` - 완료/미출석/변경 자동 기록
- `log_schedule_deletion` - 삭제 자동 기록
- `update_notice_timestamp` - 공지사항 수정 시각

---

## 📊 이력 시스템 동작

### 1. 수업/상담 완료
```
수업 20260210 14:00 ~ 20260210 14:50 (50분)
상담 20260210 15:00 ~ 20260210 16:00 (60분)
```

### 2. 미출석 처리
```
미출석: 20260210 14:00
미출석변경시점: 20260210 14:05
```

### 3. 일정 변경
```
일정변경 20260210 14:00 -> 20260211 15:00
일정변경시점: 20260210 13:00
```

### 4. 일정 삭제
```
일정삭제: 20260210 14:00
일정삭제시점: 20260210 13:30
```

---

## 🔄 상담예약자 → 내담자 전환

### 자동 변환 프로세스
```javascript
1. clients.type: 'reserve' → 'client'
2. schedules.type: 'reserve' → 'client'
3. histories.category: 'consultation_history' → 'session_history'
```

**결과**: 모든 상담 이력이 수업 이력으로 자동 이동

---

## 🚀 설치 및 실행

### 1. Supabase 설정
```bash
1. Supabase 프로젝트 생성
2. SQL Editor에서 haha_lab_final_schema.sql 실행
3. URL 및 Anon Key 복사
```

### 2. 환경 변수
```javascript
// public/index.html, public/admin.html
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. 로컬 실행
```bash
cd /home/user/webapp/public
python3 -m http.server 8000

# 브라우저 접속:
# http://localhost:8000/index.html (사용자)
# http://localhost:8000/admin.html (관리자)
```

### 4. 테스트 계정
```
ID: teacher01
PW: 1234
```

---

## 📂 프로젝트 구조

```
webapp/
├── haha_lab_final_schema.sql          # v3.2 SQL 스키마
├── public/
│   ├── index.html                      # 사용자 페이지
│   └── admin.html                      # 관리자 페이지
├── MODIFICATIONS_v3.2.md               # 상세 수정사항
├── FINAL_COMPLETION_REPORT_v3.2.md    # 완료 보고서
├── README.md                           # 본 문서
└── .git/                               # Git 저장소
```

---

## 💡 주요 SQL 예제

### 이력 조회
```sql
-- 수업 이력
SELECT * FROM histories 
WHERE client_id = '1' 
AND category = 'session_history'
ORDER BY created_at DESC;

-- 수업시간 통계
SELECT * FROM get_session_time_stats('1');
```

### 스케줄 처리
```sql
-- 수업 완료
UPDATE schedules SET status = 'completed' WHERE id = 1;

-- 미출석
UPDATE schedules SET status = 'noshow' WHERE id = 2;

-- 일정 변경
UPDATE schedules 
SET date = '2026-02-15', start_time = '15:00' 
WHERE id = 3;

-- 일정 삭제
DELETE FROM schedules WHERE id = 4;
```

---

## 🎯 기술 스택

- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL)
- **Functions**: PL/pgSQL
- **Triggers**: PostgreSQL Triggers
- **Timezone**: Asia/Seoul

---

## 📈 v3.2 개선 사항

### SQL
✅ histories 테이블 YYYYMMDD HH:mm 재설계  
✅ get_session_time_stats 함수 추가  
✅ 트리거 Asia/Seoul 타임존  

### UI/UX
✅ GNB 실시간 타이머 (초단위)  
✅ 캘린더 카드 모달  
✅ 이력 탭 (상담이력/수업이력)  
✅ 수업시간 통계 표시  

### 데이터
✅ 자동 이력 기록  
✅ 상담↔수업 전환 자동화  
✅ 이력 연속성 보장  

---

## 📞 지원

- **위치**: `/home/user/webapp`
- **Git**: 7dd925d
- **버전**: v3.2
- **날짜**: 2026-02-10

---

## 📜 라이선스

© 2026 HAHA LAB Corp. All rights reserved.

---

## 🎉 변경 이력

### v3.2 (2026-02-10)
- ✅ histories 테이블 YYYYMMDD HH:mm 형식
- ✅ GNB 실시간 타이머 (초단위)
- ✅ 캘린더 모달 개선
- ✅ 상담이력/수업이력 탭
- ✅ 주간/월간/총 수업시간 통계
- ✅ 자동 이력 기록 시스템

### v3.0 (2026-02-08)
- 초기 프로젝트 구조
- 기본 CRUD 기능
- 캘린더 뷰

---

**Happy Coding! 🚀**
