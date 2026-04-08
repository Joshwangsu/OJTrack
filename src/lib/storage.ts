import { LogEntry, UserSettings } from '../types';

const STORAGE_KEY = 'ojt_tracker_logs';
const SETTINGS_KEY = 'ojt_tracker_settings';

export const storage = {
  getLogs: (): LogEntry[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveLogs: (logs: LogEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  },
  getSettings: (): UserSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { targetHours: 480, userName: '', companyName: '' };
  },
  saveSettings: (settings: UserSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
