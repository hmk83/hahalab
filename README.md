# HAHA LAB

> 아동 발달 센터를 위한 종합 관리 시스템

![Version](https://img.shields.io/badge/version-2.0-blue)
![Last Updated](https://img.shields.io/badge/updated-2026--02--10-green)
![Database](https://img.shields.io/badge/database-Supabase-orange)

## 📋 프로젝트 개요

HAHA LAB은 아동 발달 센터의 선생님들이 내담자(학생)와 수업 일정을 효율적으로 관리할 수 있는 웹 기반 시스템입니다. React와 Supabase를 활용한 SPA(Single Page Application)로 구현되었습니다.

## ✨ 주요 기능

### 👨‍🏫 사용자 페이지 (index.html)
- **대시보드**: 오늘의 일정, 다가오는 수업 요약
- **내담자 관리**: 정규 내담자 및 상담 예약자 등록/관리
- **스케줄 관리**: 
  - 월간/주간/일간 캘린더 뷰
  - 드래그 앤 드롭으로 일정 등록
  - 시간 충돌 자동 감지 및 해결 (3가지 방식)
  - 완료 상태 표시 (회색 배경 + 완료 텍스트)
- **수업 모드**: Play Lab 콘텐츠를 활용한 수업 진행
- **상담 모드**: 상담 예약자 정보 입력 및 관리

### 🛠️ 관리자 페이지 (admin.html)
- **대시보드**: 전체 통계 (선생님, 내담자, 콘텐츠 수)
- **선생님 관리**: 계정 생성, 수정, 정지/재개
- **공지사항 관리**: 공지사항 작성 및 아코디언 형태 표시
- **Play Lab 콘텐츠 관리**: 학습 콘텐츠 등록 및 카테고리 관리
- **활동 로그**: 시스템 활동 기록 조회

## 🗄️ 데이터베이스 스키마

### 주요 테이블
- **teachers**: 선생님 계정 정보
- **clients**: 내담자 정보 (정규/예약자)
- **schedules**: 수업 및 상담 일정
- **notices**: 공지사항
- **play_contents**: Play Lab 학습 콘텐츠
- **activity_logs**: 시스템 활동 로그

상세한 스키마는 `haha_lab_final_schema.sql` 참조

## 🚀 설치 및 실행

### 1. Supabase 프로젝트 설정

```bash
# 1. Supabase 프로젝트 생성 (https://supabase.com)
# 2. SQL Editor에서 스키마 실행
cat haha_lab_final_schema.sql | supabase db execute
```

### 2. 환경 설정

각 HTML 파일의 Supabase 설정 부분 수정:

```javascript
// index.html 및 admin.html 내부
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. 로컬 실행

```bash
# 간단한 HTTP 서버 실행
python3 -m http.server 8000

# 또는 Node.js
npx http-server -p 8000
```

브라우저에서 접속:
- 사용자 페이지: `http://localhost:8000/index.html`
- 관리자 페이지: `http://localhost:8000/admin.html`

## 🔐 기본 계정

### 사용자 (선생님)
- **ID**: `teacher01`
- **비밀번호**: `1234`

### 관리자
- **비밀번호**: `zxcasd123`

⚠️ **보안 주의**: 프로덕션 환경에서는 반드시 비밀번호를 변경하세요!

## 📂 프로젝트 구조

```
HAHALAB/
├── index.html                    # 사용자(선생님) 페이지
├── admin.html                    # 관리자 페이지
├── haha_lab_final_schema.sql    # 데이터베이스 스키마
└── README.md                     # 프로젝트 문서
```

## 🎨 기술 스택

- **Frontend**: React 18 (UMD), Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **Icons**: Custom SVG Icons
- **Fonts**: Noto Sans KR, Pretendard

## 📝 주요 업데이트 (v2.0 - 2026-02-10)

### ✅ 사용자 페이지
1. **완료 상태 표시**: 수업/상담 완료 시 회색 배경 + 완료 텍스트
2. **완료 처리 버튼**: 스케줄 모달에서 완료 처리 가능
3. **삭제 기능**: 스케줄 삭제 시 확인 모달 및 토스트 알림
4. **시간 충돌 해결**: 3가지 방식 (전체 밀기, 자동 단축, 직접 설정)

### ✅ 관리자 페이지
1. **공지사항 아코디언**: 클릭하여 펼치고 접기
2. **플레이랩 콘텐츠**: 세로 길이 고정 (aspect-video)
3. **전체 너비 레이아웃**: 공지사항 및 활동로그 페이지

### ✅ 데이터베이스
1. **인덱스 추가**: 성능 최적화
2. **유용한 함수**: 스케줄 조회, 통계 함수
3. **자동 트리거**: 완료 시 활동 로그 자동 생성
4. **샘플 데이터**: 테스트용 초기 데이터

## 🔧 개발 가이드

### 새로운 Play Lab 카테고리 추가

```javascript
// index.html 및 admin.html의 PLAY_CATEGORIES 배열에 추가
const PLAY_CATEGORIES = [
  { 
    id: 'new_category', 
    title: '새 카테고리', 
    sub: '부제목', 
    desc: '설명', 
    icon: IconComponent 
  }
];
```

### 스케줄 상태 확장

```sql
-- schedules 테이블 status 값
-- 'scheduled', 'completed', 'noshow', 'deleted', 'changed'
-- 새로운 상태 추가 시 HTML 파일의 조건문도 수정 필요
```

## 🐛 알려진 이슈

1. **모바일 수업 모드**: 현재 모바일에서는 수업 시작 불가 (토스트 알림)
2. **비밀번호 해싱**: 현재는 평문 저장 (프로덕션에서는 해싱 필요)
3. **실시간 동기화**: 여러 사용자 동시 접속 시 새로고침 필요

## 🤝 기여 방법

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

문의사항: 010-8416-3323 (카카오톡 또는 문자)

## 🙏 감사의 말

이 프로젝트는 아동 발달 센터의 효율적인 운영을 위해 개발되었습니다.
사용해주시는 모든 선생님들께 감사드립니다.

---

© 2026 HAHA LAB Corp. All rights reserved.
