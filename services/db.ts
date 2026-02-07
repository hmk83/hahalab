import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ContentItem, ScheduleItem, Child, CalendarSettings } from '../types';
import { INITIAL_CONTENTS } from '../constants';

// Storage Keys
const KEY_CONTENTS = 'haha-lab-contents';
const KEY_SCHEDULES = 'haha-lab-schedules';
const KEY_CHILDREN = 'haha-lab-children';
const KEY_SETTINGS = 'haha-lab-settings';
const KEY_DB_CONFIG = 'haha-lab-db-config';

interface DBConfig {
  url: string;
  key: string;
  enabled: boolean;
}

// In-memory cache
let supabase: SupabaseClient | null = null;
let isConnected = false;

// Initialize Supabase if config exists
const loadConfig = (): DBConfig | null => {
  // Priority 1: Check Environment Variables (Cloudflare Pages)
  // Safely check if import.meta.env exists to prevent crash in non-Vite preview environments
  try {
    const env = (import.meta as any).env;
    const envUrl = env?.VITE_SUPABASE_URL;
    const envKey = env?.VITE_SUPABASE_KEY;

    if (envUrl && envKey) {
      return { url: envUrl, key: envKey, enabled: true };
    }
  } catch (e) {
    // Ignore environment access errors
    console.warn('Environment variables not accessible:', e);
  }

  // Priority 2: Check Local Storage (Admin UI Manual Input)
  try {
    const stored = localStorage.getItem(KEY_DB_CONFIG);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

const initSupabase = () => {
  const config = loadConfig();
  if (config && config.enabled && config.url && config.key) {
    try {
      supabase = createClient(config.url, config.key);
      isConnected = true;
      console.log('Supabase Connected');
    } catch (e) {
      console.error('Failed to init Supabase', e);
      isConnected = false;
    }
  } else {
    supabase = null;
    isConnected = false;
  }
};

initSupabase();

// --- Generic Helper to Sync with DB ---
// We use a simple key-value structure in a 'haha_data' table: { key: string, value: json }
// Users need to create a table named 'haha_data' with columns 'key' (text, primary) and 'value' (jsonb) in Supabase.

const syncToCloud = async (key: string, data: any) => {
  if (!isConnected || !supabase) return;
  try {
    const { error } = await supabase
      .from('haha_data')
      .upsert({ key, value: data }, { onConflict: 'key' });
    if (error) console.error(`Cloud save failed for ${key}:`, error);
  } catch (e) {
    console.error('Cloud sync error', e);
  }
};

const fetchFromCloud = async (key: string) => {
  if (!isConnected || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('haha_data')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error || !data) return null;
    return data.value;
  } catch (e) {
    return null;
  }
};

// --- Data Services ---

export const DataService = {
  getDBConfig: () => loadConfig(),
  
  saveDBConfig: (config: DBConfig) => {
    localStorage.setItem(KEY_DB_CONFIG, JSON.stringify(config));
    initSupabase();
    // If enabled, trigger a force push of local data to cloud
    if (config.enabled) {
      DataService.pushAllToCloud();
    }
  },

  // Push local data to cloud (Initial Sync)
  pushAllToCloud: async () => {
    const contents = JSON.parse(localStorage.getItem(KEY_CONTENTS) || '[]');
    const schedules = JSON.parse(localStorage.getItem(KEY_SCHEDULES) || '[]');
    const children = JSON.parse(localStorage.getItem(KEY_CHILDREN) || '[]');
    const settings = JSON.parse(localStorage.getItem(KEY_SETTINGS) || '{}');

    await syncToCloud(KEY_CONTENTS, contents);
    await syncToCloud(KEY_SCHEDULES, schedules);
    await syncToCloud(KEY_CHILDREN, children);
    await syncToCloud(KEY_SETTINGS, settings);
    alert('클라우드 동기화가 완료되었습니다.');
  },

  // Pull cloud data to local
  pullAllFromCloud: async () => {
    const contents = await fetchFromCloud(KEY_CONTENTS);
    if (contents) localStorage.setItem(KEY_CONTENTS, JSON.stringify(contents));

    const schedules = await fetchFromCloud(KEY_SCHEDULES);
    if (schedules) localStorage.setItem(KEY_SCHEDULES, JSON.stringify(schedules));

    const children = await fetchFromCloud(KEY_CHILDREN);
    if (children) localStorage.setItem(KEY_CHILDREN, JSON.stringify(children));

    const settings = await fetchFromCloud(KEY_SETTINGS);
    if (settings) localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));

    window.location.reload(); // Refresh to apply
  },

  // --- CRUD Wrappers ---
  // Currently reads from LocalStorage for speed, but writes to both (Optimistic UI)

  getContents: async (): Promise<ContentItem[]> => {
    if (isConnected) {
      const cloudData = await fetchFromCloud(KEY_CONTENTS);
      if (cloudData) {
        localStorage.setItem(KEY_CONTENTS, JSON.stringify(cloudData));
        return cloudData;
      }
    }
    const local = localStorage.getItem(KEY_CONTENTS);
    return local ? JSON.parse(local) : INITIAL_CONTENTS;
  },

  saveContents: (data: ContentItem[]) => {
    localStorage.setItem(KEY_CONTENTS, JSON.stringify(data));
    syncToCloud(KEY_CONTENTS, data);
    window.dispatchEvent(new Event('storage'));
  },

  getSchedules: async (): Promise<ScheduleItem[]> => {
    if (isConnected) {
      const cloudData = await fetchFromCloud(KEY_SCHEDULES);
      if (cloudData) {
        localStorage.setItem(KEY_SCHEDULES, JSON.stringify(cloudData));
        return cloudData;
      }
    }
    const local = localStorage.getItem(KEY_SCHEDULES);
    return local ? JSON.parse(local) : [];
  },

  saveSchedules: (data: ScheduleItem[]) => {
    localStorage.setItem(KEY_SCHEDULES, JSON.stringify(data));
    syncToCloud(KEY_SCHEDULES, data);
  },

  getChildren: async (): Promise<Child[]> => {
    if (isConnected) {
      const cloudData = await fetchFromCloud(KEY_CHILDREN);
      if (cloudData) {
        localStorage.setItem(KEY_CHILDREN, JSON.stringify(cloudData));
        return cloudData;
      }
    }
    const local = localStorage.getItem(KEY_CHILDREN);
    return local ? JSON.parse(local) : [];
  },

  saveChildren: (data: Child[]) => {
    localStorage.setItem(KEY_CHILDREN, JSON.stringify(data));
    syncToCloud(KEY_CHILDREN, data);
  },

  getSettings: async (): Promise<CalendarSettings> => {
     if (isConnected) {
      const cloudData = await fetchFromCloud(KEY_SETTINGS);
      if (cloudData) {
        localStorage.setItem(KEY_SETTINGS, JSON.stringify(cloudData));
        return cloudData;
      }
    }
    const local = localStorage.getItem(KEY_SETTINGS);
    return local ? JSON.parse(local) : { defaultClassDuration: 40, enableNotifications: true };
  },

  saveSettings: (data: CalendarSettings) => {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(data));
    syncToCloud(KEY_SETTINGS, data);
  }
};