import React, { useState, useMemo } from 'react';
import { ScheduleItem, Child, Guardian, CalendarSettings } from '../types';
import { Button } from '../components/Button';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Trash2, Search, User, Phone, StickyNote, AlertTriangle, ArrowRight, Settings, Repeat, CheckCircle, Bell } from 'lucide-react';

interface CalendarProps {
  schedules: ScheduleItem[];
  onAddSchedule: (item: ScheduleItem) => void;
  onAddSchedules: (items: ScheduleItem[]) => void;
  onDeleteSchedule: (id: string) => void;
  childrenList: Child[];
  onAddChild: (item: Child) => void;
  onUpdateChild: (item: Child) => void;
  onDeleteChild: (id: string) => void;
  settings: CalendarSettings;
  onUpdateSettings: (s: CalendarSettings) => void;
}

type CalendarView = 'month' | 'week' | 'day';
type ChildTab = 'regular' | 'consultation';
type ScheduleMode = 'single' | 'multi' | 'recurring';

const INITIAL_CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const getChosung = (str: string) => {
  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const code = str.charCodeAt(0) - 44032;
  if (code > -1 && code < 11172) return CHO[Math.floor(code / 588)];
  return str.charAt(0);
};

const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minutes);
  return date.toTimeString().slice(0, 5);
};

export const Calendar: React.FC<CalendarProps> = ({ 
  schedules, onAddSchedule, onAddSchedules, onDeleteSchedule,
  childrenList, onAddChild, onUpdateChild, onDeleteChild,
  settings, onUpdateSettings
}) => {
  // --- View State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [childTab, setChildTab] = useState<ChildTab>('regular');
  
  // --- Modals State ---
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- Drag & Drop State ---
  const [dragItem, setDragItem] = useState<{ type: 'child' | 'schedule', id: string } | null>(null);

  // --- Schedule Logic State ---
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('single');
  const [selectedDates, setSelectedDates] = useState<string[]>([]); // For Multi-select
  
  // --- Forms ---
  const [scheduleForm, setScheduleForm] = useState<{
    id?: string;
    title: string;
    childId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: ScheduleItem['type'];
    description: string;
    // Recurring fields
    endDate: string;
    frequency: 'weekly' | 'monthly';
  }>({
    title: '',
    childId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: addMinutes('10:00', settings.defaultClassDuration),
    type: 'class',
    description: '',
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    frequency: 'weekly',
  });

  const [childForm, setChildForm] = useState<Child>({
    id: '',
    name: '',
    status: 'regular',
    gender: 'male',
    dob: '',
    guardians: [{ name: '', phone: '', relationship: '모' }],
    notes: '',
    createdAt: 0,
  });

  // --- Helpers ---
  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getNextClass = (childId: string) => {
    const now = new Date();
    const future = schedules
      .filter(s => s.childId === childId)
      .filter(s => {
        const sDate = new Date(`${s.date}T${s.startTime}`);
        return sDate > now;
      })
      .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());
    
    if (future.length > 0) return `${future[0].date.slice(5)} ${future[0].startTime}`;
    return '일정 없음';
  };

  // --- Filtered Lists ---
  const filteredChildren = useMemo(() => {
    return childrenList
      .filter(c => c.status === childTab)
      .filter(c => c.name.includes(searchQuery))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [childrenList, childTab, searchQuery]);

  const groupedChildren = useMemo(() => {
    const groups: Record<string, Child[]> = {};
    filteredChildren.forEach(child => {
      const char = getChosung(child.name);
      if (!groups[char]) groups[char] = [];
      groups[char].push(child);
    });
    return groups;
  }, [filteredChildren]);

  // --- Handlers ---
  const openChildDetail = (child: Child) => {
    setChildForm(child);
    setIsDetailModalOpen(true);
  };

  const handleStartAddChild = (status: ChildTab = childTab) => {
    setChildForm({
      id: '',
      name: '',
      status: status,
      gender: 'male',
      dob: '',
      guardians: [{ name: '', phone: '', relationship: '모' }],
      notes: '',
      createdAt: 0
    });
    setIsChildModalOpen(true);
  };

  const handleChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isDuplicate = childrenList.some(c => c.name === childForm.name && c.id !== childForm.id);
    if (isDuplicate) {
      alert("이미 등록된 이름입니다. 이름 뒤에 숫자나 별명을 붙여주세요.");
      return;
    }

    if (childForm.id) {
      onUpdateChild({ ...childForm });
    } else {
      onAddChild({ ...childForm, id: Date.now().toString(), createdAt: Date.now() });
    }
    setIsChildModalOpen(false);
  };

  // --- Schedule Logic ---
  const handleDateSelection = (dateStr: string) => {
    if (scheduleMode === 'multi') {
      if (selectedDates.includes(dateStr)) {
        setSelectedDates(selectedDates.filter(d => d !== dateStr));
      } else {
        setSelectedDates([...selectedDates, dateStr].sort());
      }
    } else {
      setScheduleForm({ ...scheduleForm, date: dateStr });
    }
  };

  const handleScheduleUpdate = (targetDate: string, scheduleId: string) => {
     // Find original schedule
     const original = schedules.find(s => s.id === scheduleId);
     if (!original) return;

     // In a real app we might ask if they want to keep the time.
     // For now, we just move the date, keeping the time.
     if(confirm(`${original.title} 일정을 ${targetDate}로 이동하시겠습니까?`)) {
        onDeleteSchedule(scheduleId); // Remove old
        onAddSchedule({
           ...original,
           date: targetDate,
           status: 'rescheduled', // Mark as rescheduled automatically if moved? Or keep original status? Let's reset status or mark changed.
           statusNotes: (original.statusNotes ? original.statusNotes + '\n' : '') + `[일정변경] ${original.date} -> ${targetDate}`
        });
     }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSchedules: ScheduleItem[] = [];
    const baseId = Date.now().toString();

    // Helper to check conflicts (simplified for batch)
    const hasConflict = (d: string, s: string, e: string) => {
      const startMs = new Date(`${d}T${s}`).getTime();
      const endMs = new Date(`${d}T${e}`).getTime();
      return schedules.some(sch => {
        if (sch.date !== d) return false;
        const schStart = new Date(`${sch.date}T${sch.startTime}`).getTime();
        const schEnd = new Date(`${sch.date}T${sch.endTime}`).getTime();
        return (startMs < schEnd && endMs > schStart);
      });
    };

    if (scheduleMode === 'single') {
       if (hasConflict(scheduleForm.date, scheduleForm.startTime, scheduleForm.endTime)) {
         if (!window.confirm(`${scheduleForm.date} ${scheduleForm.startTime}에 일정이 겹칩니다. 그래도 등록하시겠습니까?`)) return;
       }
       newSchedules.push({
         id: baseId,
         childId: scheduleForm.childId || undefined,
         title: scheduleForm.title,
         date: scheduleForm.date,
         startTime: scheduleForm.startTime,
         endTime: scheduleForm.endTime,
         type: scheduleForm.type,
         description: scheduleForm.description
       });
    } else if (scheduleMode === 'multi') {
       selectedDates.forEach((d, idx) => {
          newSchedules.push({
            id: `${baseId}-${idx}`,
            childId: scheduleForm.childId || undefined,
            title: scheduleForm.title,
            date: d,
            startTime: scheduleForm.startTime,
            endTime: scheduleForm.endTime,
            type: scheduleForm.type,
            description: scheduleForm.description
          });
       });
    } else if (scheduleMode === 'recurring') {
       // Generate dates
       const start = new Date(scheduleForm.date);
       const end = new Date(scheduleForm.endDate);
       let current = new Date(start);
       let idx = 0;
       
       while (current <= end) {
         const dStr = current.toISOString().split('T')[0];
         newSchedules.push({
            id: `${baseId}-${idx}`,
            childId: scheduleForm.childId || undefined,
            title: scheduleForm.title,
            date: dStr,
            startTime: scheduleForm.startTime,
            endTime: scheduleForm.endTime,
            type: scheduleForm.type,
            description: scheduleForm.description,
            isRecurring: true,
            recurringGroupId: baseId
         });
         
         if (scheduleForm.frequency === 'weekly') current.setDate(current.getDate() + 7);
         else if (scheduleForm.frequency === 'monthly') current.setMonth(current.getMonth() + 1);
         idx++;
       }
    }

    if (newSchedules.length > 0) {
      if (newSchedules.length === 1) onAddSchedule(newSchedules[0]);
      else onAddSchedules(newSchedules);
      setIsScheduleModalOpen(false);
      // Reset
      setSelectedDates([]);
      setScheduleMode('single');
    }
  };

  // --- Render Sub-Components ---

  // Mini Calendar for Selection
  const renderMiniCalendar = () => {
    // A simple current-month view for picking dates
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-2 select-none">
         <div className="flex justify-between items-center mb-2 px-1">
            <button type="button" onClick={() => setCurrentDate(new Date(y, m - 1, 1))}><ChevronLeft size={16}/></button>
            <span className="font-bold text-sm">{y}년 {m + 1}월</span>
            <button type="button" onClick={() => setCurrentDate(new Date(y, m + 1, 1))}><ChevronRight size={16}/></button>
         </div>
         <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['일','월','화','수','목','금','토'].map(d => <div key={d} className="text-gray-400">{d}</div>)}
            {blanks.map((_, i) => <div key={`b-${i}`}></div>)}
            {days.map(d => {
              const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = selectedDates.includes(dStr) || (scheduleMode !== 'multi' && scheduleForm.date === dStr);
              return (
                <div 
                  key={d} 
                  onClick={() => handleDateSelection(dStr)}
                  className={`p-1 rounded cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-kakao-yellow font-bold' : ''}`}
                >
                  {d}
                </div>
              );
            })}
         </div>
      </div>
    );
  };

  // Detail Modal Calendar View (Read-Only for specific child)
  const renderChildCalendar = (targetChildId: string) => {
     // Simplified list view for child detail
     const childSchedules = schedules.filter(s => s.childId === targetChildId).sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
     return (
       <div className="mt-4 border-t border-gray-100 pt-4">
         <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
           <CalendarIcon size={16}/> 수업 일정
         </h4>
         <div className="max-h-60 overflow-y-auto space-y-2">
            {childSchedules.length === 0 ? <p className="text-sm text-gray-400">일정이 없습니다.</p> : 
               childSchedules.map(sch => (
                 <div key={sch.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-kakao-brown">{sch.date}</span>
                       <span>{sch.startTime} ~ {sch.endTime}</span>
                       <span className="text-xs bg-white border px-1 rounded">{sch.title}</span>
                    </div>
                 </div>
               ))
            }
         </div>
       </div>
     )
  };

  // --- Main Calendar Render Logic ---
  const getSchedulesForDate = (dateStr: string) => schedules.filter(s => s.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  const renderMainCalendar = () => {
    // Basic Month View implementation
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden shadow-sm h-full">
         {['일','월','화','수','목','금','토'].map(d => <div key={d} className="bg-gray-50 p-2 text-center text-xs font-bold">{d}</div>)}
         {[...blanks, ...days].map((d, i) => {
            if (!d) return <div key={`b-${i}`} className="bg-white min-h-[80px]"></div>;
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const daySchedules = getSchedulesForDate(dateStr);
            return (
              <div 
                key={d}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                   e.preventDefault();
                   if (!dragItem) return;

                   if (dragItem.type === 'child') {
                     // Creating new schedule from Child list
                     const child = childrenList.find(c => c.id === dragItem.id);
                     if (child) {
                       setScheduleForm({
                         ...scheduleForm, childId: child.id, title: `${child.name} 수업`, date: dateStr,
                         startTime: '10:00', endTime: addMinutes('10:00', settings.defaultClassDuration)
                       });
                       setIsScheduleModalOpen(true);
                     }
                   } else if (dragItem.type === 'schedule') {
                     // Moving existing schedule
                     handleScheduleUpdate(dateStr, dragItem.id);
                   }
                   setDragItem(null);
                }} 
                onClick={() => {
                   setScheduleForm({ ...scheduleForm, date: dateStr });
                   setIsScheduleModalOpen(true);
                }}
                className="bg-white min-h-[80px] p-1 hover:bg-gray-50 cursor-pointer"
              >
                 <div className="text-xs font-bold mb-1">{d}</div>
                 <div className="space-y-0.5">
                   {daySchedules.map(s => (
                     <div 
                       key={s.id} 
                       draggable
                       onDragStart={(e) => {
                          e.stopPropagation();
                          setDragItem({ type: 'schedule', id: s.id });
                       }}
                       onClick={(e) => {
                         e.stopPropagation();
                         // Ideally open edit modal, for now just reuse the create modal populated
                         setScheduleForm({
                           id: s.id,
                           title: s.title,
                           childId: s.childId || '',
                           date: s.date,
                           startTime: s.startTime,
                           endTime: s.endTime,
                           type: s.type,
                           description: s.description || '',
                           frequency: 'weekly',
                           endDate: ''
                         });
                         // We could enable edit mode logic here, but for brevity using the create flow as a "template" or simple add.
                         // To properly edit, we'd need an "isEditing" flag.
                         // For this request, Drag & Drop is the key requirement.
                       }}
                       className={`text-[10px] p-0.5 rounded border truncate cursor-move ${
                         s.status === 'completed' ? 'bg-gray-100 text-gray-400 border-gray-200' :
                         s.status === 'noshow' ? 'bg-red-50 text-red-500 border-red-100' :
                         s.status === 'rescheduled' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                         'bg-orange-100 text-orange-800 border-orange-200'
                       }`}
                     >
                       {s.title}
                     </div>
                   ))}
                 </div>
              </div>
            );
         })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col md:flex-row overflow-hidden bg-gray-100">
      
      {/* Left Panel */}
      <div className="w-full md:w-[320px] lg:w-[360px] bg-white border-r border-gray-200 flex flex-col h-full z-20 shadow-lg">
         {/* Tabs */}
         <div className="flex border-b border-gray-100">
            <button onClick={() => setChildTab('regular')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${childTab === 'regular' ? 'border-kakao-brown text-kakao-brown' : 'border-transparent text-gray-400'}`}>재원생</button>
            <button onClick={() => setChildTab('consultation')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${childTab === 'consultation' ? 'border-kakao-brown text-kakao-brown' : 'border-transparent text-gray-400'}`}>상담아동</button>
         </div>
         
         {/* Controls */}
         <div className="p-3 border-b border-gray-100 flex gap-2">
            <div className="relative flex-1">
               <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
               <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-2 py-1.5 bg-gray-50 rounded-lg text-sm border-none focus:ring-1 focus:ring-kakao-yellow" placeholder="이름 검색" />
            </div>
            <button onClick={() => handleStartAddChild(childTab)} className="bg-kakao-yellow p-1.5 rounded-lg text-kakao-brown hover:brightness-95"><Plus size={18}/></button>
         </div>

         {/* List */}
         <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
            {Object.keys(groupedChildren).sort().map(char => (
               <div key={char} className="mb-4">
                  <div className="text-xs font-bold text-gray-400 mb-1 ml-1">{char}</div>
                  <div className="space-y-2">
                     {groupedChildren[char].map(child => (
                        <div 
                          key={child.id} 
                          draggable
                          onDragStart={(e) => { 
                             setDragItem({ type: 'child', id: child.id });
                             e.dataTransfer.setData('text/plain', child.id); // Fallback
                          }}
                          onClick={() => openChildDetail(child)}
                          className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                           <div className="flex justify-between items-start">
                              <span className="font-bold text-gray-800">{child.name}</span>
                              <span className={`text-[10px] px-1.5 rounded-full ${child.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>{child.gender === 'male' ? '남' : '여'}</span>
                           </div>
                           <div className="text-xs text-gray-500 mt-1">{calculateAge(child.dob)}세 / {getNextClass(child.id)}</div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
         <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="flex bg-gray-100 rounded-lg p-1">
                  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-1 hover:bg-white rounded"><ChevronLeft size={16}/></button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-1 hover:bg-white rounded"><ChevronRight size={16}/></button>
               </div>
               <h2 className="text-xl font-black text-gray-800">{currentDate.getFullYear()}년 {currentDate.getMonth()+1}월</h2>
            </div>
            <div className="flex gap-2">
               <Button variant="secondary" onClick={() => setIsSettingsModalOpen(true)} className="px-2 py-1.5 h-9"><Settings size={18}/></Button>
               <Button onClick={() => setIsScheduleModalOpen(true)} className="px-3 py-1.5 h-9 text-xs"><Plus size={16}/> 일정 추가</Button>
            </div>
         </div>
         <div className="flex-1 overflow-hidden p-4 bg-gray-50">
            {renderMainCalendar()}
         </div>
      </div>

      {/* --- MODALS --- */}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-pop-in flex flex-col max-h-[90vh]">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-kakao-brown"><CalendarIcon size={20}/> 일정 등록</h3>
               
               <div className="flex flex-col md:flex-row gap-6 overflow-y-auto">
                  {/* Left: Settings */}
                  <div className="flex-1 space-y-4">
                     {/* Mode Selector */}
                     <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['single', 'multi', 'recurring'] as const).map(m => (
                           <button key={m} onClick={() => setScheduleMode(m)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${scheduleMode === m ? 'bg-white shadow-sm text-kakao-brown' : 'text-gray-500'}`}>
                             {m === 'single' ? '단일' : m === 'multi' ? '다중선택' : '반복'}
                           </button>
                        ))}
                     </div>

                     {/* Child Selector */}
                     <div>
                        <div className="flex justify-between items-center mb-1">
                           <label className="text-xs font-bold text-gray-500">아동 선택</label>
                           <button onClick={() => { setIsScheduleModalOpen(false); handleStartAddChild('consultation'); }} className="text-xs text-blue-600 font-bold hover:underline">+ 상담아동 등록</button>
                        </div>
                        <select 
                          value={scheduleForm.childId} 
                          onChange={e => {
                             const child = childrenList.find(c => c.id === e.target.value);
                             setScheduleForm({ ...scheduleForm, childId: e.target.value, title: child ? `${child.name} 수업` : '' });
                          }}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        >
                           <option value="">선택 안함</option>
                           <optgroup label="재원생">
                              {childrenList.filter(c => c.status === 'regular').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </optgroup>
                           <optgroup label="상담아동">
                              {childrenList.filter(c => c.status === 'consultation').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </optgroup>
                        </select>
                     </div>

                     <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">제목</label>
                        <input type="text" value={scheduleForm.title} onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
                     </div>
                     
                     {/* Time */}
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label className="text-xs font-bold text-gray-500 block mb-1">시작 시간</label>
                           <input 
                             type="time" 
                             value={scheduleForm.startTime} 
                             onChange={e => setScheduleForm({...scheduleForm, startTime: e.target.value, endTime: addMinutes(e.target.value, settings.defaultClassDuration)})} 
                             className="w-full p-2 border border-gray-200 rounded-lg text-sm" 
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500 block mb-1">종료 (자동)</label>
                           <input type="time" value={scheduleForm.endTime} readOnly className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" />
                        </div>
                     </div>

                     {/* Recurring Options */}
                     {scheduleMode === 'recurring' && (
                        <div className="p-3 bg-yellow-50 rounded-lg space-y-2 border border-yellow-100">
                           <div className="text-xs font-bold text-yellow-800 flex items-center gap-1"><Repeat size={12}/> 반복 설정</div>
                           <div className="flex gap-2">
                              <select value={scheduleForm.frequency} onChange={e => setScheduleForm({...scheduleForm, frequency: e.target.value as any})} className="flex-1 p-1.5 border rounded text-sm">
                                 <option value="weekly">매주</option>
                                 <option value="monthly">매월</option>
                              </select>
                              <input type="date" value={scheduleForm.endDate} onChange={e => setScheduleForm({...scheduleForm, endDate: e.target.value})} className="flex-1 p-1.5 border rounded text-sm" />
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Right: Date Picker / List */}
                  <div className="flex-1 border-l border-gray-100 pl-6 flex flex-col">
                     <label className="text-xs font-bold text-gray-500 block mb-2">
                        {scheduleMode === 'multi' ? '날짜 선택 (클릭하여 추가)' : scheduleMode === 'recurring' ? '시작일 선택' : '날짜 선택'}
                     </label>
                     {renderMiniCalendar()}
                     
                     {/* Selected Dates List for Multi mode */}
                     {scheduleMode === 'multi' && (
                        <div className="mt-4 flex-1 overflow-y-auto max-h-40 border-t border-gray-100 pt-2">
                           <div className="text-xs font-bold text-gray-400 mb-1">{selectedDates.length}개 선택됨</div>
                           <div className="space-y-1">
                              {selectedDates.map(d => (
                                 <div key={d} className="flex justify-between items-center text-sm bg-gray-50 p-1.5 rounded">
                                    <span>{d}</span>
                                    <span className="text-gray-500 text-xs">{scheduleForm.startTime}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                  <Button variant="secondary" fullWidth onClick={() => setIsScheduleModalOpen(false)}>취소</Button>
                  <Button fullWidth onClick={handleScheduleSubmit}>등록하기</Button>
               </div>
            </div>
         </div>
      )}

      {/* Child Detail Modal */}
      {isDetailModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-pop-in max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-gray-800">{childForm.name}</h2>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${childForm.status === 'regular' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                           {childForm.status === 'regular' ? '재원생' : '상담아동'}
                        </span>
                     </div>
                     <p className="text-sm text-gray-500">{childForm.dob} ({calculateAge(childForm.dob)}세) / {childForm.gender === 'male' ? '남' : '여'}</p>
                  </div>
                  <button onClick={() => { setIsDetailModalOpen(false); handleStartAddChild(childForm.status); setChildForm(childForm); }} className="text-sm text-gray-400 underline">수정</button>
               </div>

               <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-xl">
                     <h4 className="text-xs font-bold text-gray-500 mb-2">보호자 정보</h4>
                     {childForm.guardians.map((g, i) => (
                        <div key={i} className="flex justify-between text-sm mb-1 last:mb-0">
                           <span className="font-bold">{g.name} ({g.relationship})</span>
                           <a href={`tel:${g.phone}`} className="text-blue-600 flex items-center gap-1"><Phone size={12}/> {g.phone}</a>
                        </div>
                     ))}
                  </div>
                  <div>
                     <h4 className="text-xs font-bold text-gray-500 mb-1">메모</h4>
                     <p className="text-sm text-gray-700 bg-white border border-gray-100 p-2 rounded-lg min-h-[60px]">{childForm.notes || '특이사항 없음'}</p>
                  </div>
                  
                  {renderChildCalendar(childForm.id)}
               </div>

               <div className="mt-6 flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => setIsDetailModalOpen(false)}>닫기</Button>
               </div>
            </div>
         </div>
      )}

      {/* Child Add/Edit Modal (Reused Logic but supporting status) */}
      {isChildModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-pop-in">
               <h3 className="text-lg font-bold mb-4">아동 정보 {childForm.id ? '수정' : '등록'}</h3>
               <form onSubmit={handleChildSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="flex gap-2 mb-2 bg-gray-100 p-1 rounded-lg">
                     <button type="button" onClick={() => setChildForm({...childForm, status: 'regular'})} className={`flex-1 py-1.5 text-xs font-bold rounded ${childForm.status === 'regular' ? 'bg-white shadow text-kakao-brown' : 'text-gray-400'}`}>재원생</button>
                     <button type="button" onClick={() => setChildForm({...childForm, status: 'consultation'})} className={`flex-1 py-1.5 text-xs font-bold rounded ${childForm.status === 'consultation' ? 'bg-white shadow text-kakao-brown' : 'text-gray-400'}`}>상담아동</button>
                  </div>
                  <input required placeholder="이름" value={childForm.name} onChange={e => setChildForm({...childForm, name: e.target.value})} className="w-full p-2 border rounded" />
                  <div className="flex gap-2">
                     <input required type="date" value={childForm.dob} onChange={e => setChildForm({...childForm, dob: e.target.value})} className="flex-1 p-2 border rounded" />
                     <select value={childForm.gender} onChange={e => setChildForm({...childForm, gender: e.target.value as any})} className="w-24 p-2 border rounded">
                        <option value="male">남</option>
                        <option value="female">여</option>
                     </select>
                  </div>
                  <div className="bg-gray-50 p-2 rounded space-y-2">
                     <div className="text-xs font-bold text-gray-500">보호자</div>
                     {childForm.guardians.map((g, i) => (
                        <div key={i} className="flex gap-1">
                           <input placeholder="이름" value={g.name} onChange={e => {const ng=[...childForm.guardians]; ng[i].name=e.target.value; setChildForm({...childForm, guardians:ng})}} className="flex-1 p-1.5 border rounded text-sm"/>
                           <input placeholder="관계" value={g.relationship} onChange={e => {const ng=[...childForm.guardians]; ng[i].relationship=e.target.value; setChildForm({...childForm, guardians:ng})}} className="w-16 p-1.5 border rounded text-sm"/>
                           <input placeholder="연락처" value={g.phone} onChange={e => {const ng=[...childForm.guardians]; ng[i].phone=e.target.value; setChildForm({...childForm, guardians:ng})}} className="flex-1 p-1.5 border rounded text-sm"/>
                        </div>
                     ))}
                  </div>
                  <textarea placeholder="특이사항" value={childForm.notes} onChange={e => setChildForm({...childForm, notes: e.target.value})} className="w-full p-2 border rounded h-20 text-sm"></textarea>
                  <div className="flex gap-2 pt-2">
                     <Button type="button" variant="secondary" fullWidth onClick={() => setIsChildModalOpen(false)}>취소</Button>
                     <Button type="submit" fullWidth>저장</Button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-80 p-6 shadow-xl animate-pop-in">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={20}/> 설정</h3>
               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-gray-500 block mb-1">기본 수업 시간 (분)</label>
                     <input 
                       type="number" 
                       value={settings.defaultClassDuration} 
                       onChange={e => onUpdateSettings({...settings, defaultClassDuration: Number(e.target.value)})} 
                       className="w-full p-2 border border-gray-200 rounded-lg"
                     />
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                     <div className="flex items-center gap-2">
                        <Bell size={18} className="text-gray-500"/>
                        <span className="text-sm font-bold text-gray-700">수업 5분 전 알림</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.enableNotifications ?? true} 
                          onChange={(e) => onUpdateSettings({...settings, enableNotifications: e.target.checked})} 
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kakao-yellow"></div>
                     </label>
                  </div>
               </div>
               <div className="mt-6">
                  <Button fullWidth onClick={() => setIsSettingsModalOpen(false)}>확인</Button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};