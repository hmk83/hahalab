# HAHA LAB v3.2 수정사항

## 1. SQL 스키마 수정사항 (haha_lab_final_schema.sql)

### 1.1 histories 테이블 구조 변경
- YYYYMMDD HH:mm 형식으로 저장하도록 필드 재구성
- 기존 date, start_time, end_time 필드 대신 event_datetime, start_datetime, end_datetime 등 사용
- 주요 필드:
  - `event_datetime`: 이벤트 발생 시각 (YYYYMMDD HH:mm)
  - `start_datetime`: 시작 시각 (YYYYMMDD HH:mm)
  - `end_datetime`: 종료 시각 (YYYYMMDD HH:mm)
  - `noshow_datetime`: 미출석 처리 시각
  - `delete_datetime`: 삭제 처리 시각
  - `reschedule_datetime`: 일정 변경 시각
  - `original_datetime`: 원래 일정
  - `changed_datetime`: 변경된 일정

### 1.2 수업시간 통계 함수 추가
```sql
CREATE OR REPLACE FUNCTION get_session_time_stats(p_client_id TEXT)
RETURNS TABLE (
    weekly_minutes INT,
    monthly_minutes INT,
    total_minutes INT
)
```
- 주간/월간/총 수업시간을 분 단위로 계산
- histories 테이블에서 session_history만 집계

### 1.3 트리거 함수 업데이트
- `log_schedule_completion()`: YYYYMMDD HH:mm 형식으로 이력 저장
- `log_schedule_deletion()`: 삭제 시각을 YYYYMMDD HH:mm 형식으로 저장
- Asia/Seoul 타임존 사용

---

## 2. index.html 수정사항

### 2.1 GNB 컴포넌트 - 진행 중 수업 타이머 추가

**위치**: 라인 599-628

**수정 전**:
```javascript
{isSession && <div className="flex items-center gap-2 md:gap-4 bg-white/40 px-3 py-1.5 rounded-full"><span className="font-bold text-xs md:text-base text-slate-900">수업 진행 중</span></div>}
```

**수정 후**:
```javascript
function GNB({ user, isSession, sessionData, onExitSession, onOpenSettings, onLogoClick, onNoticeClick, onProfileClick }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (!isSession || !sessionData) {
      setElapsedTime(0);
      return;
    }
    
    // 수업 시작 시간 계산
    const startTime = new Date(`${sessionData.date}T${sessionData.startTime}`);
    
    // 1초마다 경과 시간 업데이트
    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000); // 초 단위
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isSession, sessionData]);
  
  const formatElapsedTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  return (
    <header className="h-16 bg-[#FDE047] border-b border-yellow-500/30 flex items-center justify-between px-4 md:px-6 shrink-0 z-20 shadow-sm">
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onLogoClick}>
          <div className="bg-slate-900 text-[#FDE047] font-black p-1.5 rounded text-sm">HL</div>
          <span className="font-black text-lg md:text-xl tracking-tight">HAHA LAB</span>
        </div>
        {isSession && (
          <div className="flex items-center gap-2 md:gap-4 bg-white/40 px-3 py-1.5 rounded-full">
            <span className="font-bold text-xs md:text-base text-slate-900">수업 진행 중</span>
            <span className="font-mono font-black text-sm md:text-lg text-red-600">
              {formatElapsedTime(elapsedTime)}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {isSession ? 
          null 
          : 
          <>
            <div onClick={onProfileClick} className="flex items-center gap-2 bg-white/30 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/50 transition">
                <User size={14}/>
                <span className="font-bold text-xs md:text-sm whitespace-nowrap">{user?.name} <span className="hidden md:inline">선생님</span></span>
            </div>
            <button onClick={onOpenSettings} className="p-2 hover:bg-white/20 rounded-full transition"><Settings size={20}/></button>
            <button onClick={onNoticeClick} className="p-2 hover:bg-white/20 rounded-full transition relative">
                <Megaphone size={20}/>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-50 rounded-full border border-[#FDE047]"></span>
            </button>
          </>
        }
      </div>
    </header>
  );
}
```

### 2.2 CalendarManager - 캘린더 카드 모달 상세보기/삭제 버튼 추가

**위치**: 라인 1616-1799

**캘린더 상단 카드 클릭 시 모달 추가**:

```javascript
// ScheduleDetailModal 컴포넌트 추가 (라인 1616 위쪽에 삽입)
function ScheduleDetailModal({ schedule, onClose, onDelete, onGoToHistory }) {
  const handleDelete = async () => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      await onDelete(schedule.id);
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-xl">{schedule.clientName}</h3>
            <button onClick={onClose} className="text-white hover:opacity-80"><X size={24}/></button>
          </div>
          <p className="text-slate-400 text-sm">{schedule.type === 'client' ? '수업' : '상담'}</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="text-slate-400" size={18}/>
            <span className="font-bold">{schedule.date}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="text-slate-400" size={18}/>
            <span className="font-bold">{schedule.startTime} - {schedule.endTime}</span>
          </div>
          {schedule.memo && (
            <div className="flex items-start gap-3 text-sm">
              <FileText className="text-slate-400 mt-0.5" size={18}/>
              <span className="text-slate-600">{schedule.memo}</span>
            </div>
          )}
          {schedule.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <span className="text-green-700 font-bold text-sm">✓ 완료됨</span>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            {schedule.status === 'completed' && (
              <button 
                onClick={() => { onGoToHistory(schedule); onClose(); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
              >
                상세보기
              </button>
            )}
            <button 
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// CalendarManager 컴포넌트 수정
function CalendarManager({ schedules, setSchedules, clients, dragItem, currentTime, onStartSession, onAddClick, showToast, onConflict, user, onDeleteSchedule, onGoToHistory }) {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  // ... 기존 코드 ...
  
  const handleScheduleCardClick = (sch) => {
    setSelectedSchedule(sch);
  };
  
  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      {/* ... 기존 코드 ... */}
      
      {/* 캘린더 상단 카드들 */}
      <div className="mb-6 space-y-2">
        {todaySchedules.map((sch) => (
          <div
            key={sch.id}
            className="cursor-pointer hover:shadow-lg transition"
            onClick={() => handleScheduleCardClick(sch)}
          >
            {/* 기존 카드 UI */}
          </div>
        ))}
      </div>
      
      {/* 모달 */}
      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onDelete={onDeleteSchedule}
          onGoToHistory={onGoToHistory}
        />
      )}
      
      {/* ... 나머지 코드 ... */}
    </div>
  );
}
```

### 2.3 ClientDetailPage - 상담이력/수업이력 탭 구현

**위치**: 라인 2323-2550

**수정 사항**:
1. histories 테이블에서 이력 데이터 불러오기
2. 주간/월간/총 수업시간 표시
3. YYYYMMDD HH:mm 형식으로 표시

```javascript
function ClientDetailPage({ client, schedules, setSchedules, onClose, onUpdate, onDelete, onConvert, showToast, teacherName, onStartSession, onEdit, initialTab }) {
    const [activeTab, setActiveTab] = useState(initialTab || '정보');
    const [histories, setHistories] = useState([]);
    const [sessionStats, setSessionStats] = useState({ weeklyMinutes: 0, monthlyMinutes: 0, totalMinutes: 0 });
    
    // 이력 데이터 불러오기
    useEffect(() => {
        const fetchHistories = async () => {
            const { data } = await supabase
                .from('histories')
                .select('*')
                .eq('client_id', client.id.toString())
                .order('created_at', { ascending: false });
            if (data) {
                setHistories(keysToCamel(data));
            }
        };
        fetchHistories();
    }, [client.id]);
    
    // 수업시간 통계 불러오기
    useEffect(() => {
        const fetchSessionStats = async () => {
            const { data } = await supabase.rpc('get_session_time_stats', {
                p_client_id: client.id.toString()
            });
            if (data && data.length > 0) {
                setSessionStats(keysToCamel(data[0]));
            }
        };
        if (client.type === 'client') {
            fetchSessionStats();
        }
    }, [client.id, client.type]);
    
    // 분을 시간:분 형식으로 변환
    const formatMinutes = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}시간 ${m}분`;
    };
    
    // 상담이력 필터링
    const consultationHistories = histories.filter(h => h.category === 'consultation_history');
    
    // 수업이력 필터링
    const sessionHistories = histories.filter(h => h.category === 'session_history');
    
    // 이력 항목 렌더링
    const renderHistoryItem = (h) => {
        let timeDisplay = '';
        
        if (h.action === '수업완료' || h.action === '상담완료') {
            timeDisplay = `${h.startDatetime} ~ ${h.endDatetime} (${h.durationMinutes}분)`;
        } else if (h.action === '미출석') {
            timeDisplay = `미출석: ${h.startDatetime} / 처리시점: ${h.noshowDatetime}`;
        } else if (h.action === '일정삭제') {
            timeDisplay = `일정: ${h.startDatetime} / 삭제시점: ${h.deleteDatetime}`;
        } else if (h.action === '일정변경') {
            timeDisplay = `${h.originalDatetime} → ${h.changedDatetime} / 변경시점: ${h.rescheduleDatetime}`;
        }
        
        return (
            <div key={h.id} className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-blue-700">{h.action}</span>
                    <span className="text-xs text-slate-500">{h.eventDatetime || h.createdAt}</span>
                </div>
                <p className="text-sm text-slate-700">{timeDisplay}</p>
                {h.details && <p className="text-xs text-slate-500 mt-1">{h.details}</p>}
            </div>
        );
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="bg-slate-900 p-6 shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-white font-bold text-2xl mb-1">{client.name}</h2>
                            <p className="text-slate-400 text-sm">{client.type === 'client' ? '내담자' : '상담예약자'}</p>
                        </div>
                        <button onClick={onClose} className="text-white hover:opacity-80"><X size={24}/></button>
                    </div>
                </div>
                
                {/* 탭 메뉴 */}
                <div className="flex border-b bg-slate-50 shrink-0">
                    {['정보', '일정', client.type === 'client' ? '수업이력' : '상담이력'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 font-bold transition ${activeTab === tab ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                {/* 콘텐츠 */}
                <div className="flex-1 overflow-auto p-6">
                    {/* 정보 탭 - 기존 코드 유지 */}
                    {activeTab === '정보' && (
                        <div className="space-y-6">
                            {/* 기존 정보 탭 내용 */}
                        </div>
                    )}
                    
                    {/* 일정 탭 - 기존 코드 유지 */}
                    {activeTab === '일정' && (
                        <div className="space-y-4">
                            {/* 기존 일정 탭 내용 */}
                        </div>
                    )}
                    
                    {/* 상담이력/수업이력 탭 */}
                    {activeTab === (client.type === 'client' ? '수업이력' : '상담이력') && (
                        <div className="space-y-6">
                            {/* 수업시간 통계 (내담자만) */}
                            {client.type === 'client' && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                                    <h3 className="font-bold text-lg text-slate-800 mb-4">수업시간 통계</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600 mb-1">주간 수업시간</p>
                                            <p className="font-bold text-xl text-blue-600">{formatMinutes(sessionStats.weeklyMinutes)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600 mb-1">월간 수업시간</p>
                                            <p className="font-bold text-xl text-indigo-600">{formatMinutes(sessionStats.monthlyMinutes)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600 mb-1">총 수업시간</p>
                                            <p className="font-bold text-xl text-purple-600">{formatMinutes(sessionStats.totalMinutes)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* 이력 목록 */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-lg text-slate-800 mb-4">
                                    {client.type === 'client' ? '수업 이력' : '상담 이력'}
                                </h3>
                                {(client.type === 'client' ? sessionHistories : consultationHistories).length === 0 ? (
                                    <p className="text-center text-slate-400 py-10">이력이 없습니다.</p>
                                ) : (
                                    (client.type === 'client' ? sessionHistories : consultationHistories).map(renderHistoryItem)
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

### 2.4 상담예약자 → 내담자 전환 시 이력 이동 로직

**위치**: ClientDetailPage의 handleConvert 함수

```javascript
const handleConvert = async () => {
    if (!window.confirm(`${client.name}님을 정규 내담자로 전환하시겠습니까?\n상담 예약 이력은 수업 이력으로 이동됩니다.`)) return;
    
    try {
        // 1. 클라이언트 타입 변경
        const { error: clientError } = await supabase
            .from('clients')
            .update({ type: 'client' })
            .eq('id', client.id);
        
        if (clientError) throw clientError;
        
        // 2. 관련 스케줄 타입 변경
        const { error: scheduleError } = await supabase
            .from('schedules')
            .update({ type: 'client' })
            .eq('client_id', client.id.toString());
        
        if (scheduleError) throw scheduleError;
        
        // 3. 상담이력을 수업이력으로 변경
        const { error: historyError } = await supabase
            .from('histories')
            .update({
                category: 'session_history',
                type: 'session'
            })
            .eq('client_id', client.id.toString())
            .eq('category', 'consultation_history');
        
        if (historyError) throw historyError;
        
        showToast('정규 내담자로 전환되었습니다.', 'success');
        onConvert();
        onClose();
    } catch (error) {
        console.error('전환 실패:', error);
        showToast('전환 중 오류가 발생했습니다.', 'error');
    }
};
```

---

## 3. 테스트 체크리스트

### 3.1 SQL 테스트
```sql
-- 1. histories 테이블 구조 확인
SELECT * FROM histories LIMIT 1;

-- 2. 수업시간 통계 함수 테스트
SELECT * FROM get_session_time_stats('1');

-- 3. 트리거 테스트 - 스케줄 완료
UPDATE schedules SET status = 'completed' WHERE id = 1;
SELECT * FROM histories WHERE client_id = '1' ORDER BY created_at DESC LIMIT 1;

-- 4. 트리거 테스트 - 미출석
UPDATE schedules SET status = 'noshow' WHERE id = 2;
SELECT * FROM histories WHERE action = '미출석' ORDER BY created_at DESC LIMIT 1;

-- 5. 트리거 테스트 - 일정 변경
UPDATE schedules SET date = '2026-02-15', start_time = '15:00' WHERE id = 3;
SELECT * FROM histories WHERE action = '일정변경' ORDER BY created_at DESC LIMIT 1;

-- 6. 트리거 테스트 - 일정 삭제
DELETE FROM schedules WHERE id = 4;
SELECT * FROM histories WHERE action = '일정삭제' ORDER BY created_at DESC LIMIT 1;
```

### 3.2 UI 테스트
1. **GNB 타이머**:
   - 수업 시작 후 초단위 타이머가 정상 작동하는지 확인
   - 00:00:00 형식으로 표시되는지 확인
   
2. **캘린더 모달**:
   - 캘린더 상단 카드 클릭 시 모달이 표시되는지 확인
   - 완료된 일정의 경우 "상세보기" 버튼이 표시되는지 확인
   - "삭제" 버튼이 정상 작동하는지 확인
   
3. **이력 탭**:
   - 내담자 프로필의 "수업이력" 탭이 정상 표시되는지 확인
   - 상담예약자 프로필의 "상담이력" 탭이 정상 표시되는지 확인
   - 주간/월간/총 수업시간이 정확히 계산되는지 확인
   - YYYYMMDD HH:mm 형식으로 시간이 표시되는지 확인
   
4. **전환 기능**:
   - 상담예약자를 내담자로 전환 시 이력이 수업이력으로 이동하는지 확인

---

## 4. 배포 가이드

### 4.1 Supabase SQL 실행
1. Supabase 대시보드 → SQL Editor
2. `haha_lab_final_schema.sql` 파일 내용 복사
3. 실행 (기존 테이블이 있는 경우 DROP 후 재생성)

### 4.2 HTML 파일 수정
1. `public/index.html` 파일 열기
2. 위의 수정사항 적용
3. Supabase URL 및 Key 확인

### 4.3 로컬 테스트
```bash
cd /home/user/webapp/public
python3 -m http.server 8000
```
브라우저에서 http://localhost:8000/index.html 접속

---

## 5. 주요 변경 요약

### SQL
- histories 테이블 YYYYMMDD HH:mm 형식으로 재설계
- get_session_time_stats 함수 추가
- 트리거 함수들 YYYYMMDD HH:mm 형식 적용

### HTML
- GNB에 진행 중 수업 초단위 타이머 추가
- 캘린더 상단 카드 클릭 시 상세 모달 추가
- 상담이력/수업이력 탭 구현
- 주간/월간/총 수업시간 통계 표시
- 상담예약자 → 내담자 전환 시 이력 자동 이동

---

## 6. 버전 정보
- **버전**: v3.2
- **업데이트 날짜**: 2026-02-10
- **주요 기능**: 이력 시스템 완성, 타이머 추가, 통계 기능
