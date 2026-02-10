# INDEX.HTML 수정 가이드

## 현재 상태
- 원본 index.html.backup (2794줄)이 index.html로 복사됨
- 대부분의 기본 기능은 정상 작동
- 아래 항목들만 추가 수정 필요

## 필요한 수정사항

### 1. 달력 스케줄 클릭 시 상담 미출석 -> 수업과 동일한 이벤트 처리
**위치**: `schedules` 테이블 업데이트 시
**수정**: `status: 'noshow'`로 업데이트하면 trigger에서 자동으로 histories에 기록
**SQL 트리거**: 이미 v4.1 스키마에 구현됨

### 2. 미출석/완료건 모달 상세보기
**위치**: Calendar 컴포넌트의 스케줄 클릭 핸들러
**필요**: 
- status가 'completed' 또는 'noshow'인 스케줄 클릭 시
- histories 테이블에서 해당 schedule_id로 이력 조회
- 모달 표시 (내담자: type='session' 이력, 예약자: type='consultation' 이력)

### 3. 소프트 삭제 (캘린더에서만 삭제)
**위치**: 스케줄 삭제 핸들러
**수정**:
```javascript
// 기존: DELETE FROM schedules
// 수정: UPDATE schedules SET is_visible_in_calendar = FALSE
const { error } = await supabase
  .from('schedules')
  .update({ is_visible_in_calendar: false, status: 'deleted_from_calendar' })
  .eq('id', scheduleId);
```

### 4. 예약자->내담자 변경 시 이력 통합
**위치**: 클라이언트 type 변경 핸들러
**SQL**: 이미 histories 테이블에 is_migrated_from_reserve 필드 있음
**필요**: type 변경 시 기존 consultation 이력의 client_id만 업데이트

### 5. 캘린더 위 일정 카드 클릭 시 빈 화면 이슈
**위치**: UpcomingSchedules 컴포넌트 클릭 핸들러
**수정**: `onStartSession` prop 확인 및 올바른 데이터 전달

### 6. 주간/일간 선택 시 자동 스크롤
**위치**: Calendar 컴포넌트의 view 변경 useEffect
**수정**:
```javascript
useEffect(() => {
  if (calendarView === 'week' || calendarView === 'day') {
    const now = new Date();
    const currentHour = now.getHours();
    const scrollContainer = document.querySelector('.time-grid-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = (currentHour - 2) * 60; // 현재 시간 -2시간 위치로 스크롤
    }
  }
}, [calendarView]);
```

### 7. 수업 진행 중 GNB 타이머
**위치**: GNB 컴포넌트
**현재 상태**: `isSession` prop을 받고 있으나 타이머 미표시
**수정**: sessionData에서 시작 시간 계산하여 경과 시간 표시
```javascript
const [elapsed, setElapsed] = useState(0);
useEffect(() => {
  if (isSession && sessionData) {
    const timer = setInterval(() => {
      const start = new Date(sessionData.startTime);
      const now = new Date();
      setElapsed(Math.floor((now - start) / 1000 / 60)); // 분 단위
    }, 1000);
    return () => clearInterval(timer);
  }
}, [isSession, sessionData]);
```

## 주의사항
- index.html은 2794줄의 대형 파일이므로 부분 수정만 진행
- 원본 기능을 유지하면서 위 항목들만 추가/수정
- Supabase 연동 코드는 이미 완성되어 있음
- SQL 스키마 v4.1 사용 (foreign key 제거됨)

