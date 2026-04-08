export interface LogEntry {
  id: string;
  date: string; // Start date (ISO string)
  endDate?: string; // Optional end date for batch logging (ISO string)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // in hours per day
  totalDuration: number; // total hours for the entry (duration * days)
  task?: string; // Optional task description
  category: string;
  status: 'completed' | 'pending';
}

export interface UserSettings {
  targetHours: number;
  userName: string;
  companyName: string;
}

export interface WeeklyJournal {
  id: string;
  weekStartDate: string; // ISO string
  weekEndDate: string; // ISO string
  reflection: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
