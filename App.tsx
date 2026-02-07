import React, { useState, useEffect, useRef } from 'react';
import { ViewState, CategoryId, ContentItem, ScheduleItem, Child, CalendarSettings } from './types';
import { Landing } from './views/Landing';
import { Home } from './views/Home';
import { CategoryDetail } from './views/CategoryDetail';
import { Player } from './views/Player';
import { Calendar } from './views/Calendar';
import { Admin } from './views/Admin';
import { CATEGORIES } from './constants';
import { UserCircle, Lock, X, Clock, BellRing } from 'lucide-react';
import { DataService } from './services/db';
import { checkAdminPassword } from './utils/auth';
import { Button } from './components/Button';

const App: React.FC = () => {
  // --- State ---
  const [viewState, setViewState] = useState<ViewState>({ mode: 'landing' });
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [settings, setSettings] = useState<CalendarSettings>({ defaultClassDuration: 40, enableNotifications: true });
  
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Notification State
  const [notificationAlert, setNotificationAlert] = useState<ScheduleItem | null>(null);
  const notifiedScheduleIds = useRef<Set<string>>(new Set());

  // Admin Modal State
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // --- Data Loading ---
  useEffect(() => {
    const initData = async () => {
      const loadedContents = await DataService.getContents();
      setContents(loadedContents);
      
      const loadedSchedules = await DataService.getSchedules();
      setSchedules(loadedSchedules);

      const loadedChildren = await DataService.getChildren();
      setChildren(loadedChildren);

      const loadedSettings = await DataService.getSettings();
      setSettings(loadedSettings);
    };

    initData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'haha-lab-contents') initData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- Clock & Notification Logic ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Notification Check (Only if enabled)
      if (settings.enableNotifications) {
        checkNotifications(now);
      }
    }, 10000); // Check every 10 seconds

    // Initial check update
    setCurrentTime(new Date());

    return () => clearInterval(timer);
  }, [schedules, settings.enableNotifications]);

  const checkNotifications = (now: Date) => {
    schedules.forEach(schedule => {
       if (schedule.status === 'completed' || schedule.status === 'noshow') return;
       if (notifiedScheduleIds.current.has(schedule.id)) return;

       // Parse Schedule Time
       const [year, month, day] = schedule.date.split('-').map(Number);
       const [hour, minute] = schedule.startTime.split(':').map(Number);
       const scheduleTime = new Date(year, month - 1, day, hour, minute);
       
       const diffMs = scheduleTime.getTime() - now.getTime();
       const diffMinutes = Math.ceil(diffMs / (1000 * 60));

       // Trigger 5 minutes before (Checking range 4 < diff <= 5 to allow for interval gaps)
       if (diffMinutes === 5) {
          triggerNotification(schedule);
       }
    });
  };

  const triggerNotification = (schedule: ScheduleItem) => {
    notifiedScheduleIds.current.add(schedule.id);
    setNotificationAlert(schedule);
    playNotificationSound();
  };

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Simple "Ding-Dong" or "Chime"
      const now = ctx.currentTime;
      
      // First note (High)
      osc.frequency.setValueAtTime(880, now); // A5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);

      // Delayed second note (Lower)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.frequency.setValueAtTime(659.25, now + 0.2); // E5
      gain2.gain.setValueAtTime(0.1, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc2.start(now + 0.2);
      osc2.stop(now + 0.8);

    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // --- Handlers ---
  const handleEnter = () => setViewState({ mode: 'home' });

  const handleCategorySelect = (id: CategoryId) => {
    setViewState({ mode: 'category', categoryId: id });
    window.scrollTo(0, 0);
  };

  const handleContentSelect = (content: ContentItem) => {
    setViewState(prev => ({ ...prev, mode: 'player', contentId: content.id }));
  };

  const closePlayer = () => {
    if (viewState.categoryId) {
      setViewState(prev => ({ ...prev, mode: 'category', contentId: undefined }));
    } else {
      setViewState({ mode: 'home' });
    }
  };

  const goHome = () => {
    setViewState({ mode: 'home' });
    window.scrollTo(0, 0);
  };

  const goToCalendar = () => setViewState({ mode: 'calendar' });

  // --- Admin Auth (Custom Modal) ---
  const openAdminLogin = () => {
    setAdminPasswordInput('');
    setIsAdminLoginOpen(true);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAdminPassword(adminPasswordInput)) {
      setIsAdminLoginOpen(false);
      setViewState({ mode: 'admin' });
    } else {
      alert("접속 권한이 없습니다."); // This might still be blocked, but less critical. Ideally render inline error.
      setAdminPasswordInput('');
    }
  };

  // --- CRUD Operations ---
  const addSchedule = (item: ScheduleItem) => {
    const newData = [...schedules, item];
    setSchedules(newData);
    DataService.saveSchedules(newData);
  };
  const updateSchedule = (updatedItem: ScheduleItem) => {
    const newData = schedules.map(s => s.id === updatedItem.id ? updatedItem : s);
    setSchedules(newData);
    DataService.saveSchedules(newData);
  };
  const deleteSchedule = (id: string) => {
    const newData = schedules.filter(s => s.id !== id);
    setSchedules(newData);
    DataService.saveSchedules(newData);
  };
  const addSchedules = (items: ScheduleItem[]) => {
    const newData = [...schedules, ...items];
    setSchedules(newData);
    DataService.saveSchedules(newData);
  };

  const addChild = (item: Child) => {
    const newData = [...children, item];
    setChildren(newData);
    DataService.saveChildren(newData);
  };
  const updateChild = (updatedItem: Child) => {
    const newData = children.map(c => c.id === updatedItem.id ? updatedItem : c);
    setChildren(newData);
    DataService.saveChildren(newData);
  };
  const deleteChild = (id: string) => {
    if (window.confirm('정말로 삭제하시겠습니까? 관련 일정도 함께 확인해주세요.')) {
      const newData = children.filter(c => c.id !== id);
      setChildren(newData);
      DataService.saveChildren(newData);
    }
  };
  
  const updateSettings = (newSettings: CalendarSettings) => {
    setSettings(newSettings);
    DataService.saveSettings(newSettings);
  };

  const addContent = (item: ContentItem) => {
    const newContents = [item, ...contents];
    setContents(newContents);
    DataService.saveContents(newContents);
  };
  const updateContent = (item: ContentItem) => {
    const newContents = contents.map(c => c.id === item.id ? item : c);
    setContents(newContents);
    DataService.saveContents(newContents);
  };
  const deleteContent = (id: string) => {
    // Removed window.confirm to rely on Admin component's custom modal
    const newContents = contents.filter(c => c.id !== id);
    setContents(newContents);
    DataService.saveContents(newContents);
  };

  // --- Format Date for Header ---
  const formattedDate = currentTime.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  const formattedTime = currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  // --- Render Helpers ---
  const renderContent = () => {
    switch (viewState.mode) {
      case 'landing':
        return <Landing onEnter={handleEnter} />;
      case 'home':
        return (
          <Home 
            onCategorySelect={handleCategorySelect} 
            schedules={schedules}
            onUpdateSchedule={updateSchedule}
            onMoreSchedules={goToCalendar}
          />
        );
      case 'category':
        const currentCategory = CATEGORIES.find(c => c.id === viewState.categoryId);
        if (!currentCategory) return <div>Category not found</div>;
        return (
          <CategoryDetail 
            category={currentCategory} 
            contents={contents} 
            onContentSelect={handleContentSelect}
          />
        );
      case 'player':
        const contentToPlay = contents.find(c => c.id === viewState.contentId);
        if (!contentToPlay) return <div>Content not found</div>;
        return <Player content={contentToPlay} onClose={closePlayer} />;
      case 'calendar':
        return (
          <Calendar 
            schedules={schedules} 
            onAddSchedule={addSchedule}
            onAddSchedules={addSchedules}
            onDeleteSchedule={deleteSchedule}
            childrenList={children}
            onAddChild={addChild}
            onUpdateChild={updateChild}
            onDeleteChild={deleteChild}
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        );
      case 'admin':
        return (
          <Admin 
            contents={contents}
            onAddContent={addContent}
            onUpdateContent={updateContent}
            onDeleteContent={deleteContent}
            onClose={goHome}
          />
        );
      default:
        return null;
    }
  };

  if (viewState.mode === 'landing') {
    return renderContent();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
           }}>
      </div>

      {/* Header */}
      {viewState.mode !== 'player' && (
        <header className="bg-kakao-yellow h-[60px] px-4 flex items-center justify-between sticky top-0 z-50 shadow-md text-kakao-brown">
          <div className="flex items-center gap-4">
            <button onClick={goHome} className="flex items-center gap-2 group">
              <div className="bg-kakao-brown text-kakao-yellow w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm group-hover:rotate-3 transition-transform">
                HL
              </div>
              <span className="text-lg font-black tracking-tight group-hover:opacity-80 transition-opacity">
                HAHA LAB
              </span>
            </button>
            
            {/* Real-time Clock */}
            <div className="hidden sm:flex items-center gap-2 text-sm font-bold opacity-80 border-l border-kakao-brown/20 pl-4">
               <span>{formattedDate}</span>
               <span className="font-mono text-base">{formattedTime}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button 
               onClick={goToCalendar}
               className={`px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-2 font-bold text-sm ${viewState.mode === 'calendar' ? 'bg-black/10' : 'hover:bg-black/5'}`}
               aria-label="선생님 일정"
             >
               <UserCircle size={20} strokeWidth={2.5} />
               <span className="hidden xs:inline">김은애 선생님</span>
             </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full relative z-10 ${viewState.mode === 'player' ? '' : 'max-w-7xl mx-auto'}`}>
        {renderContent()}
      </main>

      {/* Footer */}
      {viewState.mode !== 'player' && viewState.mode !== 'admin' && (
        <footer className="bg-gray-100 border-t border-gray-200 py-8 px-4 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div className="flex flex-col items-center md:items-start">
               <span className="font-bold text-gray-600 mb-1">HAHA LAB (하하랩)</span>
               <span>세상의 모든 배움을 즐겁게</span>
               <span className="text-xs mt-2 text-gray-400">© 2026 HAHA LAB Corp. All rights reserved.</span>
            </div>
            
            <div className="flex gap-4 items-center">
               {/* Admin Button (Opens Modal) */}
               <button 
                 onClick={openAdminLogin}
                 className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-300 hover:text-kakao-brown ml-2"
                 title="관리자 접속"
               >
                  <Lock size={16}/>
               </button>
            </div>
          </div>
        </footer>
      )}

      {/* Notification Alert Modal (Bottom Right) */}
      {notificationAlert && (
         <div className="fixed bottom-6 right-6 z-[100] animate-pop-in">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-kakao-yellow p-4 w-72 flex flex-col gap-3 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-kakao-yellow"></div>
               <div className="flex items-start gap-3">
                  <div className="bg-kakao-yellow/20 p-2 rounded-full text-kakao-brown">
                     <BellRing size={24} className="animate-pulse" />
                  </div>
                  <div>
                     <h4 className="font-bold text-gray-800 text-sm">수업 시작 5분 전!</h4>
                     <p className="font-black text-lg text-kakao-brown leading-tight mt-1">{notificationAlert.title}</p>
                     <p className="text-xs text-gray-500 mt-1">{notificationAlert.startTime} 시작</p>
                  </div>
                  <button onClick={() => setNotificationAlert(null)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500">
                     <X size={16} />
                  </button>
               </div>
               <Button onClick={() => { setNotificationAlert(null); goToCalendar(); }} fullWidth className="py-2 text-sm h-8 mt-1">
                  일정 확인하기
               </Button>
            </div>
         </div>
      )}

      {/* Admin Login Modal (Replaces window.prompt) */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl animate-pop-in">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg text-gray-800">관리자 접속</h3>
                 <button onClick={() => setIsAdminLoginOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              <form onSubmit={handleAdminSubmit}>
                 <input 
                   type="password" 
                   autoFocus
                   placeholder="비밀번호 입력" 
                   value={adminPasswordInput}
                   onChange={e => setAdminPasswordInput(e.target.value)}
                   className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-kakao-yellow focus:border-transparent outline-none"
                 />
                 <Button type="submit" fullWidth>확인</Button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;