# HAHA LAB v3.1 최종 수정 가이드

## 🎯 요구사항 정리

### 사용자 페이지 (index.html)

#### 1. 상담예약자 - 상담이력
- ✅ 상담: `YYYY-MM-DD HH:MM ~ YYYY-MM-DD HH:MM`
- ✅ 미출석: `YYYY-MM-DD HH:MM` 미출석변경시점 `YYYY-MM-DD HH:MM`
- ✅ 일정삭제: `YYYY-MM-DD HH:MM` 일정삭제시점 `YYYY-MM-DD HH:MM`
- ✅ 일정변경: `YYYY-MM-DD HH:MM -> YYYY-MM-DD HH:MM` 일정변경시점 `YYYY-MM-DD HH:MM`

#### 2. 내담자 - 수업이력
- ✅ **통계 표시**: 주간 수업시간, 월간 수업시간, 총 수업시간
- ✅ 수업: `YYYY-MM-DD HH:MM ~ YYYY-MM-DD HH:MM`
- ✅ 미출석: `YYYY-MM-DD HH:MM` 미출석변경시점 `YYYY-MM-DD HH:MM`
- ✅ 일정삭제: `YYYY-MM-DD HH:MM` 일정삭제시점 `YYYY-MM-DD HH:MM`
- ✅ 일정변경: `YYYY-MM-DD HH:MM -> YYYY-MM-DD HH:MM` 일정변경시점 `YYYY-MM-DD HH:MM`

#### 3. 완료된 일정 모달
- ✅ 캘린더 및 상단 카드 클릭 시
- ✅ 버튼: **상세보기** (상담이력/수업이력으로 이동), **삭제**

#### 4. GNB 타이머
- ✅ 수업 진행 중 오른쪽에 타이머 표시 (초 단위)

---

## 📊 데이터베이스 변경사항

### 1. schedules 테이블
```sql
ALTER TABLE schedules ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
```
- 수업/상담 완료 시점 기록

### 2. histories 테이블
```sql
ALTER TABLE histories ADD COLUMN action_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
```
- 미출석처리시점, 삭제시점, 변경시점 기록

### 3. 통계 함수 추가
```sql
CREATE OR REPLACE FUNCTION get_client_session_stats(p_client_id TEXT)
RETURNS TABLE (
    weekly_minutes INT,
    monthly_minutes INT,
    total_minutes INT,
    total_sessions INT
) ...
```

---

## 🔧 사용자 페이지 (index.html) 수정사항

### 1. GNB 타이머 구현 (초 단위)

#### 위치: GNB 컴포넌트 (Line ~599)

```javascript
function GNB({ user, isSession, sessionData, onExitSession, onOpenSettings, onLogoClick, onNoticeClick, onProfileClick }) {
  const [sessionTimer, setSessionTimer] = useState(0);
  
  useEffect(() => {
    if (isSession) {
      const timer = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setSessionTimer(0);
    }
  }, [isSession]);
  
  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  
  return (
    <header className="h-16 bg-[#FDE047] border-b border-yellow-500/30 flex items-center justify-between px-4 md:px-6 shrink-0 z-20 shadow-sm">
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onLogoClick}>
          <div className="bg-slate-900 text-[#FDE047] font-black p-1.5 rounded text-sm">HL</div>
          <span className="font-black text-lg md:text-xl tracking-tight">HAHA LAB</span>
        </div>
        {isSession && (
          <div className="flex items-center gap-2 md:gap-4">
            <div className="bg-white/40 px-3 py-1.5 rounded-full">
              <span className="font-bold text-xs md:text-base text-slate-900">수업 진행 중</span>
            </div>
            {/* 타이머 추가 */}
            <div className="bg-slate-900 text-[#FDE047] px-4 py-1.5 rounded-full font-mono font-bold text-sm md:text-base">
              {formatTimer(sessionTimer)}
            </div>
          </div>
        )}
      </div>
      {/* ... 나머지 코드 ... */}
    </header>
  );
}
```

---

### 2. 이력 탭 UI 구현

#### 위치: ClientDetailPage 컴포넌트 (Line ~1430)

```javascript
const ClientDetailPage = ({ client, schedules, onClose, onUpdate, onConvert, onDelete, showToast, teacherName, onStartSession, onEdit, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'info');
  const [histories, setHistories] = useState([]);
  const [stats, setStats] = useState({ weeklyMinutes: 0, monthlyMinutes: 0, totalMinutes: 0, totalSessions: 0 });
  
  // 이력 및 통계 불러오기
  useEffect(() => {
    const fetchHistories = async () => {
      const { data } = await supabase
        .from('histories')
        .select('*')
        .eq('client_id', client.id)
        .order('action_time', { ascending: false });
      if (data) setHistories(keysToCamel(data));
    };
    
    const fetchStats = async () => {
      if (client.type === 'client') {
        const { data } = await supabase.rpc('get_client_session_stats', { p_client_id: client.id });
        if (data && data.length > 0) {
          setStats(keysToCamel(data[0]));
        }
      }
    };
    
    fetchHistories();
    fetchStats();
  }, [client.id, client.type]);
  
  // 날짜 포맷 함수
  const formatHistoryDate = (date, time) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} ${time || ''}`.trim();
  };
  
  const formatActionTime = (actionTime) => {
    if (!actionTime) return '';
    const d = new Date(actionTime);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };
  
  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };
  
  // 이력 렌더링 함수
  const renderHistory = (history) => {
    const { action, date, startTime, endTime, durationMinutes, originalDate, changedDate, originalTime, changedTime, actionTime } = history;
    
    if (action === '수업' || action === '상담') {
      return (
        <div className="text-sm">
          <div className="font-bold text-slate-900 mb-1">{action}</div>
          <div className="text-slate-600">
            {formatHistoryDate(date, startTime)} ~ {formatHistoryDate(date, endTime)}
          </div>
          {durationMinutes && (
            <div className="text-xs text-slate-500 mt-1">소요시간: {formatDuration(durationMinutes)}</div>
          )}
        </div>
      );
    }
    
    if (action === '미출석') {
      return (
        <div className="text-sm">
          <div className="font-bold text-red-600 mb-1">미출석</div>
          <div className="text-slate-600">{formatHistoryDate(date, startTime)}</div>
          <div className="text-xs text-slate-500 mt-1">
            미출석처리시점: {formatActionTime(actionTime)}
          </div>
        </div>
      );
    }
    
    if (action === '일정삭제') {
      return (
        <div className="text-sm">
          <div className="font-bold text-red-600 mb-1">일정삭제</div>
          <div className="text-slate-600">{formatHistoryDate(date, startTime)}</div>
          <div className="text-xs text-slate-500 mt-1">
            일정삭제시점: {formatActionTime(actionTime)}
          </div>
        </div>
      );
    }
    
    if (action === '일정변경') {
      return (
        <div className="text-sm">
          <div className="font-bold text-orange-600 mb-1">일정변경</div>
          <div className="text-slate-600">
            {formatHistoryDate(originalDate, originalTime)} → {formatHistoryDate(changedDate, changedTime)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            일정변경시점: {formatActionTime(actionTime)}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{client.name}</h2>
          <p className="text-sm text-slate-500">
            {client.type === 'reserve' ? '상담 예약자' : '내담자'}
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
          <X size={24}/>
        </button>
      </div>
      
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-slate-200 px-6">
        <button 
          onClick={() => setActiveTab('info')} 
          className={`py-3 px-4 font-bold ${activeTab === 'info' ? 'border-b-2 border-[#FDE047] text-slate-900' : 'text-slate-400'}`}
        >
          기본정보
        </button>
        <button 
          onClick={() => setActiveTab('schedule')} 
          className={`py-3 px-4 font-bold ${activeTab === 'schedule' ? 'border-b-2 border-[#FDE047] text-slate-900' : 'text-slate-400'}`}
        >
          스케줄
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={`py-3 px-4 font-bold ${activeTab === 'history' ? 'border-b-2 border-[#FDE047] text-slate-900' : 'text-slate-400'}`}
        >
          {client.type === 'reserve' ? '상담이력' : '수업이력'}
        </button>
      </div>
      
      {/* 탭 내용 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="p-6">
            {/* 기존 기본정보 UI */}
          </div>
        )}
        
        {activeTab === 'schedule' && (
          <div className="p-6">
            {/* 기존 스케줄 UI */}
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="p-6">
            {/* 통계 (내담자만) */}
            {client.type === 'client' && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-xs text-blue-600 font-bold mb-1">주간 수업시간</div>
                  <div className="text-2xl font-black text-blue-900">{formatDuration(stats.weeklyMinutes)}</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                  <div className="text-xs text-purple-600 font-bold mb-1">월간 수업시간</div>
                  <div className="text-2xl font-black text-purple-900">{formatDuration(stats.monthlyMinutes)}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-xs text-green-600 font-bold mb-1">총 수업시간</div>
                  <div className="text-2xl font-black text-green-900">{formatDuration(stats.totalMinutes)}</div>
                </div>
              </div>
            )}
            
            {/* 이력 목록 */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-4">
                {client.type === 'reserve' ? '상담 이력' : '수업 이력'}
              </h3>
              
              {histories.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <History size={48} className="mx-auto mb-4 opacity-50"/>
                  <p>등록된 이력이 없습니다.</p>
                </div>
              )}
              
              {histories.map(h => (
                <div key={h.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition">
                  {renderHistory(h)}
                  {h.memo && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-500">{h.memo}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### 3. 완료된 일정 모달 구현

#### 위치: ScheduleActionModal 수정 또는 새로운 CompletedScheduleModal 생성

```javascript
const CompletedScheduleModal = ({ schedule, onClose, onGoToHistory, onDelete }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{schedule.clientName}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {schedule.type === 'reserve' ? '상담 완료' : '수업 완료'}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={24}/>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-sm text-slate-600 mb-2">일정 정보</div>
            <div className="font-bold text-slate-900">{schedule.date}</div>
            <div className="text-slate-700">{schedule.startTime} ~ {schedule.endTime}</div>
            {schedule.completedAt && (
              <div className="text-xs text-slate-500 mt-2">
                완료 시점: {new Date(schedule.completedAt).toLocaleString('ko-KR')}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => {
                onGoToHistory(schedule);
                onClose();
              }}
              className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
              <History size={20}/>
              상세보기
            </button>
            <button 
              onClick={() => {
                if (confirm('이 일정을 영구 삭제하시겠습니까?')) {
                  onDelete(schedule.id);
                  onClose();
                }
              }}
              className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition flex items-center justify-center gap-2"
            >
              <Trash2 size={20}/>
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### 캘린더에서 완료된 일정 클릭 처리

```javascript
// CalendarManager 컴포넌트 내부
const [selectedSchedule, setSelectedSchedule] = useState(null);

const handleScheduleClick = (schedule) => {
  if (schedule.status === 'completed') {
    // 완료된 일정은 CompletedScheduleModal 표시
    setSelectedSchedule(schedule);
  } else {
    // 진행 중인 일정은 ScheduleActionModal 표시
    setSelectedSchedule(schedule);
  }
};

// 렌더링
{selectedSchedule && selectedSchedule.status === 'completed' && (
  <CompletedScheduleModal 
    schedule={selectedSchedule}
    onClose={() => setSelectedSchedule(null)}
    onGoToHistory={handleGoToHistory}
    onDelete={handleDeleteSchedule}
  />
)}

{selectedSchedule && selectedSchedule.status !== 'completed' && (
  <ScheduleActionModal 
    schedule={selectedSchedule}
    onClose={() => setSelectedSchedule(null)}
    onStart={() => { onStartSession(selectedSchedule); setSelectedSchedule(null); }}
    onNoShow={() => handleStatusChange(selectedSchedule.id, 'noshow')}
    onChange={handleReschedule}
    showToast={showToast}
    onDelete={() => onDeleteSchedule(selectedSchedule.id)}
  />
)}
```

---

## 📊 통계 함수 사용 예시

### Supabase에서 통계 조회
```javascript
// 내담자 수업 통계 조회
const { data, error } = await supabase
  .rpc('get_client_session_stats', { p_client_id: clientId });

if (data && data.length > 0) {
  const stats = data[0];
  console.log('주간 수업시간:', stats.weekly_minutes, '분');
  console.log('월간 수업시간:', stats.monthly_minutes, '분');
  console.log('총 수업시간:', stats.total_minutes, '분');
  console.log('총 수업 횟수:', stats.total_sessions, '회');
}
```

---

## 🧪 테스트 시나리오

### 1. 이력 생성 테스트
```sql
-- 수업 완료
UPDATE schedules SET status = 'completed' WHERE id = 1;
-- histories 테이블 확인
SELECT * FROM histories WHERE type = 'session' ORDER BY action_time DESC LIMIT 1;

-- 미출석 처리
UPDATE schedules SET status = 'noshow' WHERE id = 2;
-- action_time 확인
SELECT action, action_time FROM histories WHERE type = 'noshow' ORDER BY action_time DESC LIMIT 1;

-- 일정 변경
UPDATE schedules SET date = '2026-02-15', start_time = '15:00' WHERE id = 3;
-- original_date, changed_date, action_time 확인
SELECT original_date, changed_date, original_time, changed_time, action_time 
FROM histories WHERE type = 'reschedule' ORDER BY action_time DESC LIMIT 1;

-- 일정 삭제
DELETE FROM schedules WHERE id = 4;
-- 삭제 이력 및 action_time 확인
SELECT * FROM histories WHERE type = 'delete' ORDER BY action_time DESC LIMIT 1;
```

### 2. 통계 함수 테스트
```sql
-- 내담자 통계 조회
SELECT * FROM get_client_session_stats('YOUR_CLIENT_ID');
```

### 3. UI 테스트
1. ✅ GNB 타이머: 수업 시작 → 00:00:00부터 증가 확인
2. ✅ 이력 탭: 프로필 → 수업이력/상담이력 → 포맷 확인
3. ✅ 통계: 내담자 → 수업이력 → 주간/월간/총 수업시간 확인
4. ✅ 완료 모달: 완료된 일정 클릭 → 상세보기/삭제 버튼 확인
5. ✅ 상세보기: 완료 모달 → 상세보기 → 이력 탭으로 이동 확인

---

## 📝 주요 변경 파일

### 1. 데이터베이스 스키마
- ✅ `haha_lab_final_schema_v3.1.sql` - 신규 생성

### 2. 사용자 페이지 (index.html)
- ⚠️ GNB 컴포넌트: 타이머 추가
- ⚠️ ClientDetailPage: 이력 탭 UI 구현
- ⚠️ ClientDetailPage: 통계 표시 추가
- ⚠️ CompletedScheduleModal: 완료 모달 구현
- ⚠️ CalendarManager: 완료 일정 클릭 처리

---

## 🚀 배포 순서

### 1. Supabase 스키마 업데이트
```sql
-- Supabase SQL Editor에서 실행
-- haha_lab_final_schema_v3.1.sql 전체 실행
```

### 2. index.html 수정
위의 코드 조각들을 해당 위치에 삽입

### 3. 테스트
- 수업 시작 → 타이머 확인
- 수업 완료 → 이력 확인
- 이력 탭 → 포맷 및 통계 확인
- 완료 일정 클릭 → 모달 확인

---

## ✅ 완료 체크리스트

- [x] SQL 스키마: completed_at, action_time 필드 추가
- [x] SQL 스키마: 통계 함수 생성
- [x] SQL 스키마: 트리거 업데이트
- [ ] GNB: 타이머 구현 (초 단위)
- [ ] ClientDetailPage: 이력 탭 UI 구현
- [ ] ClientDetailPage: 통계 표시
- [ ] CompletedScheduleModal: 완료 모달 구현
- [ ] CalendarManager: 완료 일정 처리
- [ ] 전체 통합 테스트

---

© 2026 HAHA LAB - 모든 권리 보유
