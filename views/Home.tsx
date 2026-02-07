import React, { useMemo, useState } from 'react';
import { CATEGORIES } from '../constants';
import { CategoryId, ScheduleItem } from '../types';
import { ArrowRight, Calendar, CheckCircle, XCircle, AlertCircle, Clock, X, Save, AlertTriangle } from 'lucide-react';
import { OptimizedImage } from '../components/OptimizedImage';
import { Button } from '../components/Button';

interface HomeProps {
  onCategorySelect: (id: CategoryId) => void;
  schedules?: ScheduleItem[];
  onUpdateSchedule?: (item: ScheduleItem) => void;
  onMoreSchedules?: () => void;
}

type ActionType = 'complete' | 'noshow' | null;

export const Home: React.FC<HomeProps> = ({ 
  onCategorySelect, 
  schedules = [], 
  onUpdateSchedule, 
  onMoreSchedules 
}) => {
  // --- State for Modals ---
  const [rescheduleTarget, setRescheduleTarget] = useState<ScheduleItem | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    startTime: '',
    note: ''
  });

  // State for Action Modal (Complete/NoShow)
  const [actionTarget, setActionTarget] = useState<{ item: ScheduleItem, type: ActionType } | null>(null);
  const [actionNote, setActionNote] = useState('');

  // --- Schedule Logic ---
  const { recentPast, upcoming } = useMemo(() => {
    const now = new Date();
    // Sort all by date & time
    const sorted = [...schedules].sort((a, b) => 
      new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()
    );

    // Filter past and future
    const past = sorted.filter(s => new Date(`${s.date}T${s.endTime}`) < now);
    const future = sorted.filter(s => new Date(`${s.date}T${s.endTime}`) >= now);

    // Get the most recent past item (last one in the past list)
    const lastPast = past.length > 0 ? past[past.length - 1] : null;
    
    // Get next 2 upcoming items
    const nextTwo = future.slice(0, 2);

    return { recentPast: lastPast, upcoming: nextTwo };
  }, [schedules]);

  // --- Handlers ---
  
  // Open Action Modal
  const initAction = (schedule: ScheduleItem, type: ActionType) => {
    setActionTarget({ item: schedule, type });
    setActionNote('');
  };

  // Submit Action (Complete / NoShow)
  const handleActionSubmit = () => {
    if (!actionTarget || !onUpdateSchedule) return;

    if (actionTarget.type === 'noshow') {
      onUpdateSchedule({ 
        ...actionTarget.item, 
        status: 'noshow', 
        statusNotes: actionNote 
      });
    } else if (actionTarget.type === 'complete') {
      onUpdateSchedule({ 
        ...actionTarget.item, 
        status: 'completed' 
      });
    }
    setActionTarget(null);
  };

  // Open Reschedule Modal
  const openRescheduleModal = (schedule: ScheduleItem) => {
    setRescheduleTarget(schedule);
    setRescheduleForm({
      date: schedule.date,
      startTime: schedule.startTime,
      note: schedule.statusNotes || ''
    });
  };

  // Submit Reschedule
  const handleRescheduleSubmit = () => {
    if (!rescheduleTarget || !onUpdateSchedule) return;
    
    onUpdateSchedule({
      ...rescheduleTarget,
      date: rescheduleForm.date,
      startTime: rescheduleForm.startTime,
      // Recalculate end time based on original duration
      endTime: calculateEndTime(rescheduleForm.startTime, rescheduleTarget.startTime, rescheduleTarget.endTime),
      status: 'rescheduled',
      statusNotes: rescheduleForm.note
    });
    setRescheduleTarget(null);
  };

  const calculateEndTime = (newStart: string, oldStart: string, oldEnd: string) => {
    // Simple duration calc
    const startD = new Date(`2000-01-01T${oldStart}`);
    const endD = new Date(`2000-01-01T${oldEnd}`);
    const diff = endD.getTime() - startD.getTime();
    
    const newStartD = new Date(`2000-01-01T${newStart}`);
    const newEndD = new Date(newStartD.getTime() + diff);
    return newEndD.toTimeString().slice(0, 5);
  };

  // --- Render Helpers ---
  const renderStatusBadge = (status?: string) => {
    switch(status) {
      case 'completed': return <span className="text-green-600 flex items-center gap-1 font-bold text-xs"><CheckCircle size={12}/> 완료됨</span>;
      case 'noshow': return <span className="text-red-500 flex items-center gap-1 font-bold text-xs"><XCircle size={12}/> 미출석</span>;
      case 'rescheduled': return <span className="text-orange-500 flex items-center gap-1 font-bold text-xs"><AlertCircle size={12}/> 변경됨</span>;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 relative">
      
      {/* --- Schedule Section --- */}
      {schedules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <Calendar className="text-kakao-brown" size={24} />
              수업 일정
            </h2>
            <button 
              onClick={onMoreSchedules}
              className="text-sm font-bold text-gray-400 hover:text-kakao-brown transition-colors flex items-center gap-1"
            >
              더보기 <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Past Schedule Card */}
            {recentPast ? (
              <div className={`p-4 rounded-2xl border transition-all ${!recentPast.status ? 'bg-orange-50 border-orange-100 ring-2 ring-orange-200' : 'bg-gray-50 border-gray-200 opacity-80'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-100">이전 수업</span>
                  {renderStatusBadge(recentPast.status)}
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">{recentPast.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{recentPast.date} {recentPast.startTime} ~ {recentPast.endTime}</p>
                
                {/* Actions for Pending Past Schedule */}
                {(!recentPast.status || recentPast.status === 'pending') && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => initAction(recentPast, 'complete')} className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg text-xs font-bold transition-colors">완료</button>
                    <button onClick={() => initAction(recentPast, 'noshow')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-xs font-bold transition-colors">미출석</button>
                    <button onClick={() => openRescheduleModal(recentPast)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-xs font-bold transition-colors">변경</button>
                  </div>
                )}
                {recentPast.statusNotes && (
                  <div className="mt-2 text-xs text-gray-500 bg-white p-2 rounded border border-gray-100 break-words">
                    Memo: {recentPast.statusNotes}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center text-gray-400 text-sm min-h-[140px]">
                완료된 수업이 없습니다.
              </div>
            )}

            {/* Upcoming Schedules */}
            {upcoming.length > 0 ? upcoming.map(sch => (
              <div key={sch.id} className="p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">예정</span>
                    <Clock size={14} className="text-gray-400" />
                 </div>
                 <h3 className="font-bold text-lg text-gray-800 mb-1">{sch.title}</h3>
                 <p className="text-sm text-gray-600 mb-2">{sch.date} <span className="font-bold">{sch.startTime}</span></p>
                 <div className="text-xs text-gray-400">{sch.type === 'class' ? '수업' : '상담'}</div>
              </div>
            )) : (
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center text-gray-400 text-sm min-h-[140px]">
                예정된 일정이 없습니다.
              </div>
            )}
            
            {/* Fill empty slot if only 1 upcoming */}
            {upcoming.length === 1 && (
               <div className="hidden md:flex p-4 rounded-2xl border border-gray-100 bg-gray-50 flex-col items-center justify-center text-gray-400 text-sm">
                 다음 일정이 없습니다.
               </div>
            )}
          </div>
        </div>
      )}

      {/* --- Category Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((category) => (
          <div
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className="group relative overflow-hidden bg-white rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer border border-gray-100 flex flex-col hover:-translate-y-1"
          >
            {/* Illustration Section - Full Fill */}
            <div className={`h-48 relative shrink-0 ${category.color} overflow-hidden`}>
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10"></div>
               
               <OptimizedImage 
                 src={category.imageUrl} 
                 alt={category.title}
                 className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
               />
               
               <div className="absolute bottom-3 left-4 z-20">
                 <span className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-kakao-brown shadow-sm border border-white/50">
                   # {category.subtitle}
                 </span>
               </div>
            </div>

            {/* Content Section - Compacted */}
            <div className="p-5 flex flex-col gap-3">
              <div>
                <h3 className="text-xl font-black text-kakao-brown mb-1.5 group-hover:text-blue-600 transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-500 leading-snug font-medium break-keep line-clamp-2">
                  {category.description}
                </p>
              </div>
              
              <div className="flex items-center justify-end pt-2 border-t border-gray-50 mt-1">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-kakao-brown transition-colors">
                  <span>시작하기</span>
                  <div className="w-7 h-7 rounded-full bg-gray-100 group-hover:bg-kakao-yellow flex items-center justify-center transition-all shadow-sm">
                    <ArrowRight size={14} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Action Modal (Complete / NoShow) --- */}
      {actionTarget && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-pop-in">
              {actionTarget.type === 'complete' ? (
                // Complete Confirmation
                <>
                  <div className="text-center mb-6">
                     <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle size={24} />
                     </div>
                     <h3 className="text-lg font-bold text-gray-800">수업 완료 처리</h3>
                     <p className="text-sm text-gray-500 mt-1">해당 수업을 완료 상태로 변경하시겠습니까?</p>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="secondary" fullWidth onClick={() => setActionTarget(null)}>취소</Button>
                     <Button fullWidth onClick={handleActionSubmit}>완료 처리</Button>
                  </div>
                </>
              ) : (
                // NoShow Input
                <>
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                        <AlertTriangle size={20} /> 미출석 처리
                      </h3>
                      <button onClick={() => setActionTarget(null)}><X size={20} className="text-gray-400"/></button>
                   </div>
                   <div className="mb-4">
                      <label className="text-xs font-bold text-gray-500 block mb-2">미출석 사유</label>
                      <textarea 
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        placeholder="예: 병결, 개인사정, 무단결석 등"
                        className="w-full p-3 border border-gray-200 rounded-xl h-24 text-sm resize-none focus:ring-2 focus:ring-kakao-yellow focus:outline-none"
                        autoFocus
                      />
                   </div>
                   <Button fullWidth onClick={handleActionSubmit} className="bg-red-500 hover:bg-red-600 text-white">처리하기</Button>
                </>
              )}
           </div>
        </div>
      )}

      {/* --- Reschedule Modal --- */}
      {rescheduleTarget && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-pop-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-kakao-brown flex items-center gap-2">
                <Calendar size={20} />
                일정 변경
              </h3>
              <button onClick={() => setRescheduleTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">{rescheduleTarget.title}</p>
                <p className="text-xs text-gray-500 line-through">{rescheduleTarget.date} {rescheduleTarget.startTime}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">새로운 날짜</label>
                <input 
                  type="date" 
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, date: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">새로운 시간</label>
                <input 
                  type="time" 
                  value={rescheduleForm.startTime}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, startTime: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">변경 사유 (메모)</label>
                <textarea 
                  value={rescheduleForm.note}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, note: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm h-20 resize-none"
                  placeholder="변경 사유를 입력하세요."
                />
              </div>
              
              <Button fullWidth onClick={handleRescheduleSubmit} className="mt-2">
                <Save size={16} />
                변경사항 저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};