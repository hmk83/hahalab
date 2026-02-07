export enum CategoryId {
  THINKING = 'thinking',
  SOUND = 'sound',
  LISTENING = 'listening',
  VISUAL = 'visual',
  SPEAKING = 'speaking',
  LIFE = 'life',
  ART = 'art',
}

export interface Category {
  id: CategoryId;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  color: string;
}

export interface ContentItem {
  id: string;
  categoryId: CategoryId;
  title: string;
  thumbnailUrl: string;
  tags: string[];
  targetUrl: string;
  createdAt: number;
}

export interface Guardian {
  name: string;
  phone: string;
  relationship: string;
}

export interface Child {
  id: string;
  name: string;
  status: 'regular' | 'consultation'; // 재원생 vs 상담아동
  gender: 'male' | 'female';
  dob: string; // YYYY-MM-DD
  guardians: Guardian[];
  notes: string;
  createdAt: number;
}

export interface CalendarSettings {
  defaultClassDuration: number; // minutes, e.g., 40 or 50
  enableNotifications: boolean; // 5분 전 알림 사용 여부
}

export interface ScheduleItem {
  id: string;
  childId?: string; 
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: 'counseling' | 'class' | 'meeting';
  description?: string;
  isRecurring?: boolean;
  recurringGroupId?: string;
  
  // Status Tracking
  status?: 'pending' | 'completed' | 'noshow' | 'rescheduled';
  statusNotes?: string;
}

export type ViewMode = 'landing' | 'home' | 'category' | 'admin' | 'player' | 'calendar';

export interface ViewState {
  mode: ViewMode;
  categoryId?: CategoryId;
  contentId?: string;
}