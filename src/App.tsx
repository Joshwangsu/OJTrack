import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Dashboard } from './components/Dashboard';
import { LogForm } from './components/LogForm';
import { LogList } from './components/LogList';
import { WeeklyJournal } from './components/WeeklyJournal';
import { SettingsDialog } from './components/SettingsDialog';
import { LogEntry, UserSettings, WeeklyJournal as WeeklyJournalType } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, History, PlusCircle, GraduationCap, LogOut, Cloud, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  setDoc, 
  deleteDoc, 
  orderBy,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { toast } from 'sonner';

const DEFAULT_SETTINGS: UserSettings = {
  targetHours: 480,
  userName: '',
  companyName: '',
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [journals, setJournals] = useState<WeeklyJournalType[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (!currentUser) {
        setLogs([]);
        setJournals([]);
        setSettings(DEFAULT_SETTINGS);
        setIsLoaded(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Data Sync
  useEffect(() => {
    if (!user || !isAuthReady) return;

    // Sync Settings
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'current');
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as UserSettings);
      } else {
        const initialSettings = { ...DEFAULT_SETTINGS, userName: user.displayName || '' };
        setDoc(settingsRef, { ...initialSettings, userId: user.uid })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/settings/current`));
      }
      setIsLoaded(true);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/settings/current`));

    // Sync Logs
    const logsRef = collection(db, 'users', user.uid, 'logs');
    const q = query(logsRef, orderBy('date', 'desc'));
    const unsubLogs = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogEntry[];
      setLogs(logsData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/logs`));

    // Sync Journals
    const journalsRef = collection(db, 'users', user.uid, 'journals');
    const qJournals = query(journalsRef, orderBy('weekStartDate', 'desc'));
    const unsubJournals = onSnapshot(qJournals, (snapshot) => {
      const journalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeeklyJournalType[];
      setJournals(journalsData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/journals`));

    return () => {
      unsubSettings();
      unsubLogs();
      unsubJournals();
    };
  }, [user, isAuthReady]);

  const handleAddLog = async (entry: Omit<LogEntry, 'id'>): Promise<void> => {
    if (!user) return;
    try {
      const logsRef = collection(db, 'users', user.uid, 'logs');
      await addDoc(logsRef, {
        ...entry,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/logs`);
    }
  };

  const handleUpdateLog = async (id: string, updates: Partial<LogEntry>) => {
    if (!user) return;
    try {
      const logRef = doc(db, 'users', user.uid, 'logs', id);
      await updateDoc(logRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/logs/${id}`);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!user) return;
    try {
      const logRef = doc(db, 'users', user.uid, 'logs', id);
      await deleteDoc(logRef);
      toast.success('Log entry removed! ☁️');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/logs/${id}`);
    }
  };

  const handleSaveSettings = async (newSettings: UserSettings) => {
    if (!user) return;
    try {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'current');
      await setDoc(settingsRef, { ...newSettings, userId: user.uid, updatedAt: new Date().toISOString() });
      toast.success('Settings updated! ✨');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/settings/current`);
    }
  };

  const handleAddJournal = async (journal: Omit<WeeklyJournalType, 'id'>) => {
    if (!user) return;
    try {
      const journalsRef = collection(db, 'users', user.uid, 'journals');
      await addDoc(journalsRef, {
        ...journal,
        userId: user.uid
      });
      toast.success('Journal reflection saved! 🍮');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/journals`);
    }
  };

  const handleUpdateJournal = async (id: string, updates: Partial<WeeklyJournalType>) => {
    if (!user) return;
    try {
      const journalRef = doc(db, 'users', user.uid, 'journals', id);
      await updateDoc(journalRef, updates);
      toast.success('Journal reflection updated! ✨');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/journals/${id}`);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }
    const headers = ['Date', 'End Date', 'Start Time', 'End Time', 'Daily Hours', 'Total Hours', 'Activity', 'Classification'];
    const csvContent = [
      headers.join(','),
      ...logs.map((log) => [
        log.date.split('T')[0],
        log.endDate ? log.endDate.split('T')[0] : '',
        log.startTime,
        log.endTime,
        log.duration.toFixed(2),
        (log.totalDuration || log.duration).toFixed(2),
        `"${(log.task || '').replace(/"/g, '""')}"`,
        log.category
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ojt_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('History exported successfully');
  };

  if (!isAuthReady || (user && !isLoaded)) {
    return (
      <div className="min-h-screen bg-purin-bg flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-purin-yellow"
        >
          <Cloud className="w-20 h-20" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-purin-bg flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="kawaii-card p-12 max-w-md w-full text-center space-y-8"
        >
          <div className="w-24 h-24 bg-purin-yellow rounded-[2.5rem] flex items-center justify-center shadow-[0_10px_0_#FFD700] mx-auto rotate-3">
            <GraduationCap className="text-purin-brown w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-purin-text">Welcome! 🍮</h1>
            <p className="text-purin-light-brown font-bold">Log your OJT journey with Pompompurin.</p>
          </div>
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-purin-yellow text-purin-brown h-16 rounded-[1.5rem] font-black text-lg shadow-[0_6px_0_#FFD700] hover:scale-[1.02] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-6 h-6 bg-white p-1 rounded-full" alt="Google" />
            Login with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purin-bg text-purin-text font-sans selection:bg-purin-yellow selection:text-purin-brown pb-20">
      <Tabs defaultValue="dashboard" className="w-full">
        <header className="pt-6 pb-4 sm:pt-10 sm:pb-6">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-start lg:items-center justify-between gap-4">
              {/* Title Section */}
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purin-yellow rounded-[1rem] sm:rounded-[1.5rem] flex items-center justify-center shadow-[0_4px_0_#FFD700] sm:shadow-[0_6px_0_#FFD700] rotate-3 shrink-0">
                  <GraduationCap className="text-purin-brown w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-black tracking-tight text-purin-text leading-none">OJT Tracker 🍮</h1>
                  <p className="hidden sm:block text-[10px] sm:text-xs text-purin-light-brown mt-1 uppercase tracking-[0.15em] font-black">
                    {settings.userName || user.displayName} • {settings.companyName || 'Institution'}
                  </p>
                </div>
              </div>

              {/* Desktop Navbar */}
              <div className="hidden lg:flex flex-1 justify-center px-4">
                <TabsList className="bg-[#FEE440]/30 p-1.5 h-16 rounded-[2rem] w-full max-w-2xl shadow-[0_4px_0_#FEE440]/50">
                  <TabsTrigger 
                    key="desktop-dashboard"
                    value="dashboard" 
                    className="rounded-[1.5rem] px-6 gap-2 data-[state=active]:bg-purin-yellow data-[state=active]:text-purin-brown data-[state=active]:shadow-[0_3px_0_#FFD700] font-black text-sm transition-all h-full flex-1"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    key="desktop-logs"
                    value="logs" 
                    className="rounded-[1.5rem] px-6 gap-2 data-[state=active]:bg-purin-yellow data-[state=active]:text-purin-brown data-[state=active]:shadow-[0_3px_0_#FFD700] font-black text-sm transition-all h-full flex-1"
                  >
                    <History className="w-4 h-4" />
                    <span>History</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    key="desktop-journal"
                    value="journal" 
                    className="rounded-[1.5rem] px-6 gap-2 data-[state=active]:bg-purin-yellow data-[state=active]:text-purin-brown data-[state=active]:shadow-[0_3px_0_#FFD700] font-black text-sm transition-all h-full flex-1"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Weekly Journal</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    key="desktop-add"
                    value="add" 
                    className="rounded-[1.5rem] px-6 gap-2 data-[state=active]:bg-purin-yellow data-[state=active]:text-purin-brown data-[state=active]:shadow-[0_3px_0_#FFD700] font-black text-sm transition-all h-full flex-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Record</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Buttons Section */}
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <SettingsDialog settings={settings} onSave={handleSaveSettings} />
                <button 
                  onClick={logout}
                  className="bg-white border-4 border-[#FEE440] p-2.5 sm:p-3.5 rounded-[1rem] sm:rounded-[1.2rem] text-purin-light-brown hover:text-red-400 hover:border-red-400 transition-all shadow-[0_4px_0_#FEE440] active:translate-y-1 active:shadow-none"
                >
                  <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Mobile Navbar */}
            <div className="lg:hidden mt-6 flex justify-center">
              <TabsList className="bg-[#FEE440]/30 p-1.5 h-14 sm:h-16 rounded-[1.5rem] w-full max-w-xl shadow-[0_4px_0_#FEE440]/50">
                <TabsTrigger 
                  key="mobile-dashboard"
                  value="dashboard" 
                  className="rounded-[1.2rem] px-3 gap-1.5 data-[state=active]:bg-purin-yellow data-[state=active]:text-purin-brown data-[state=active]:shadow-[0_3px_0_#FFD700] font-black text-xs transition-all h-full flex-1"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger 
                  key="mobile-logs"
                  value="logs" 
                  className="rounded-[1.2rem] px-3 gap-1.5 data-[state=active]:bg-purin-yellow data-[state=active]:text-purin-brown data-[state=active]:shadow-[0_3px_0_#FFD700] font-black text-xs transition-all h-full flex-1"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
                <TabsTrigger 
                  key="mobile-journal"
                  value="journal" 
                  className="rounded-[1.2rem] px-3 gap-1.5 data-[state=active]:bg-purin-yellow data-[state=active]:text-purin-brown data-[state=active]:shadow-[0_3px_0_#FFD700] font-black text-xs transition-all h-full flex-1"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Journal</span>
                </TabsTrigger>
                <TabsTrigger 
                  key="mobile-add"
                  value="add" 
                  className="rounded-[1.2rem] px-3 gap-1.5 data-[state=active]:bg-purin-yellow data-[state=active]:text-purin-brown data-[state=active]:shadow-[0_3px_0_#FFD700] font-black text-xs transition-all h-full flex-1"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Record</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-6xl">
          <AnimatePresence mode="wait">
            <TabsContent value="dashboard" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
              >
                <Dashboard logs={logs} settings={settings} />
              </motion.div>
            </TabsContent>

            <TabsContent value="logs" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
              >
                <LogList logs={logs} onDeleteLog={handleDeleteLog} onUpdateLog={handleUpdateLog} onExport={handleExportCSV} />
              </motion.div>
            </TabsContent>

            <TabsContent value="journal" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
              >
                <WeeklyJournal 
                  journals={journals} 
                  onSaveJournal={handleAddJournal} 
                  onUpdateJournal={handleUpdateJournal} 
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="add" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
              >
                <LogForm onAddLog={handleAddLog} />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </main>
      </Tabs>

      <footer className="mt-12 sm:mt-20 text-center">
        <p className="text-[10px] sm:text-xs text-purin-light-brown/30 uppercase tracking-[0.3em] sm:tracking-[0.5em] font-black">
          Collecting Puddings 🍮 • {new Date().getFullYear()}
        </p>
      </footer>
      
      <Toaster position="top-center" expand={false} richColors />
    </div>
  );
}
