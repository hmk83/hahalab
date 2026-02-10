# HAHA LAB v4.1 - 최종 배포 버전

## 📦 프로젝트 개요
- **프로젝트명**: HAHA LAB
- **버전**: v4.1
- **타입**: 아동 발달 센터 관리 시스템
- **기술 스택**: React 18, Supabase, Tailwind CSS

## 📁 파일 구조
```
/home/user/webapp/
├── index.html                              # ✅ 메인 대시보드 (선생님용)
├── admin.html                              # ✅ 관리자 콘솔 (v4.1 업데이트)
├── haha_lab_final_schema_v4.1.sql         # ✅ 최신 SQL 스키마
├── INDEX_MODIFICATIONS_GUIDE.md            # index.html 수정 가이드
└── README.md                               # 이 파일
```

## 🔐 접속 정보

### Supabase 연결
- **URL**: `https://gxungzlecmibgvykoiib.supabase.co`
- **Anon Key**: `sb_publishable_hzQriBXTJeAwATA2NjnV7A_Tr9E1hfE`

### 관리자 접속
- **URL**: `admin.html`
- **Access Token**: `zxcasd123`

### 샘플 선생님 계정
- **ID**: `teacher01` / **PW**: `password123`
- **ID**: `teacher02` / **PW**: `password456`

## ✨ v4.1 주요 업데이트 (2026-02-10)

### 🔒 Admin.html 보안 강화
1. **비밀번호 마스킹**
   - 선생님 목록: 비밀번호 `****`로 표시
   - 상세 화면 (수정 모드 아닐 때): `****`로 마스킹

2. **비밀번호 변경 프로세스**
   ```
   ① 수정 버튼 클릭
   ② 비밀번호 필드 수정
   ③ 저장 버튼 클릭
   ④ 관리자 비밀번호 입력 (zxcasd123)
   ⑤ 새 비밀번호 2회 입력 (4~6자리 영문+숫자)
   ⑥ 일치 확인 후 저장
   ```

3. **데이터 무결성**
   - Foreign Key 제약조건 제거 (clients, schedules)
   - 유연한 teacher_id 관리
   - 내담자/예약자 등록 오류 해결

### 📊 Index.html 기능 (기존 유지)
- ✅ 달력 뷰 (월/주/일)
- ✅ 내담자 관리
- ✅ 스케줄 관리
- ✅ Play Lab 콘텐츠
- ✅ 공지사항
- ✅ 세션 모드

### 🔧 추가 개선 필요 사항
> `INDEX_MODIFICATIONS_GUIDE.md` 참조

1. **달력 스케줄 클릭 시 상담 미출석 이벤트 처리**
2. **미출석/완료건 모달 상세보기 (이력 조회)**
3. **소프트 삭제** (is_visible_in_calendar = false)
4. **예약자→내담자 변경 시 이력 통합**
5. **캘린더 위 일정 카드 클릭 빈 화면 이슈**
6. **주간/일간 뷰 현재 시간 자동 스크롤**
7. **수업 진행 중 GNB 타이머 표시**

## 🚀 배포 방법

### 1단계: Supabase 데이터베이스 설정
```sql
-- Supabase SQL Editor에서 실행
-- haha_lab_final_schema_v4.1.sql 파일 내용 복사 후 실행
```

### 2단계: 파일 배포
```bash
# 정적 파일 호스팅 (Cloudflare Pages, Netlify, Vercel 등)
# index.html, admin.html 파일 업로드
```

### 3단계: 테스트
1. `index.html` 접속 → 선생님 로그인
2. `admin.html` 접속 → 관리자 로그인
3. 내담자 등록 테스트
4. 일정 생성 테스트

## 🗄️ 데이터베이스 스키마

### 주요 테이블
```
├── teachers          # 선생님 정보
├── clients           # 내담자/예약자
├── schedules         # 일정 (is_visible_in_calendar 필드 추가)
├── histories         # 수업/상담 이력
├── notices           # 공지사항
├── play_contents     # Play Lab 콘텐츠
└── activity_logs     # 활동 로그
```

### 트리거 자동화
- ✅ 수업/상담 완료 시 → histories 자동 기록
- ✅ 수업/상담 미출석 시 → histories 자동 기록
- ✅ 일정 삭제 시 → histories 삭제 기록
- ✅ 공지사항 수정 시 → updated_at 자동 갱신

## 🐛 알려진 이슈 및 해결 방법

### 이슈 1: 내담자 등록 실패
```
오류: insert or update on table "clients" violates foreign key constraint
해결: v4.1 SQL 스키마 사용 (Foreign Key 제거됨)
```

### 이슈 2: 비밀번호 그대로 노출
```
문제: admin.html에서 선생님 비밀번호가 평문으로 표시
해결: ✅ v4.1에서 수정됨 (****로 마스킹)
```

### 이슈 3: 캘린더 일정 카드 클릭 시 빈 화면
```
상태: 확인 필요
해결책: INDEX_MODIFICATIONS_GUIDE.md 참조
```

## 📝 개발 히스토리

### v4.1 (2026-02-10)
- ✅ Foreign Key 제약조건 제거
- ✅ Admin 비밀번호 보안 강화
- ✅ 비밀번호 변경 프로세스 개선

### v4.0 (2026-02-10)
- 통합 이력 시스템 (수업 + 상담)
- 캘린더 표시 관리 (소프트 삭제)
- 예약자→내담자 전환 지원
- 자동 스크롤 및 타이머 기능

### v3.2
- Supabase 연동 완료
- 기본 CRUD 기능

## 🔜 향후 개선 계획

1. **실시간 알림 시스템** (Supabase Realtime)
2. **모바일 앱 버전** (React Native)
3. **통계 대시보드** (차트 및 리포트)
4. **파일 첨부 기능** (Supabase Storage)
5. **백업/복원 기능**

## 📞 지원

문제 발생 시:
1. `INDEX_MODIFICATIONS_GUIDE.md` 확인
2. Supabase 콘솔에서 로그 확인
3. 브라우저 콘솔 (F12) 에러 확인

---

**© 2026 HAHA LAB Corp. All rights reserved.**
