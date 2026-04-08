import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Dashboard } from './components/Dashboard';
import { LogForm } from './components/LogForm';
import { LogList } from './components/LogList';
import { SettingsDialog } from './components/SettingsDialog';
import { LogEntry, UserSettings } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, History, PlusCircle, GraduationCap, LogOut, Cloud } from 'lucide-react';
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
  addDoc
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
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (!currentUser) {
        setLogs([]);
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

    return () => {
      unsubSettings();
      unsubLogs();
    };
  }, [user, isAuthReady]);

  const handleAddLog = async (entry: Omit<LogEntry, 'id'>) => {
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
      <div className="min-h-screen bg-cinna-bg flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-cinna-blue"
        >
          <Cloud className="w-20 h-20" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cinna-bg flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="kawaii-card p-12 max-w-md w-full text-center space-y-8"
        >
          <div className="w-24 h-24 bg-cinna-blue rounded-[2.5rem] flex items-center justify-center shadow-[0_10px_0_#89cff0] mx-auto rotate-3">
            <GraduationCap className="text-white w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-cinna-text">Welcome! ☁️</h1>
            <p className="text-slate-400 font-bold">Log your OJT journey on the clouds.</p>
          </div>
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-cinna-blue text-white h-16 rounded-[1.5rem] font-black text-lg shadow-[0_6px_0_#89cff0] hover:scale-[1.02] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-6 h-6 bg-white p-1 rounded-full" alt="Google" />
            Login with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinna-bg text-cinna-text font-sans selection:bg-cinna-blue selection:text-white pb-20">
      <header className="pt-8 pb-4 sm:pt-12 sm:pb-8">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cinna-blue rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center shadow-[0_6px_0_#89cff0] sm:shadow-[0_8px_0_#89cff0] rotate-3">
              <GraduationCap className="text-white w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-cinna-text leading-none">OJT Tracker ☁️</h1>
              <p className="text-[10px] sm:text-sm text-slate-400 mt-2 uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black">
                {settings.userName || user.displayName} • {settings.companyName || 'Institution'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SettingsDialog settings={settings} onSave={handleSaveSettings} />
            <button 
              onClick={logout}
              className="bg-white border-4 border-[#d0e9f5] p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] text-slate-400 hover:text-red-400 hover:border-red-400 transition-all shadow-[0_4px_0_#d0e9f5] active:translate-y-1 active:shadow-none"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-6xl">
        <Tabs defaultValue="dashboard" className="space-y-8 sm:space-y-12">
          <div className="flex justify-center">
            <TabsList className="bg-[#d0e9f5] p-1.5 sm:p-2 h-14 sm:h-20 rounded-[1.5rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-[0_4px_0_#b9e2f5] sm:shadow-[0_6px_0_#b9e2f5]">
              <TabsTrigger 
                value="dashboard" 
                className="rounded-[1.2rem] sm:rounded-[2rem] px-3 sm:px-8 gap-1.5 sm:gap-2 data-[state=active]:bg-white data-[state=active]:text-cinna-dark-blue data-[state=active]:shadow-[0_3px_0_#d0e9f5] sm:data-[state=active]:shadow-[0_4px_0_#d0e9f5] font-black text-xs sm:text-base transition-all h-full flex-1 sm:flex-none"
              >
                <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="rounded-[1.2rem] sm:rounded-[2rem] px-3 sm:px-8 gap-1.5 sm:gap-2 data-[state=active]:bg-white data-[state=active]:text-cinna-dark-blue data-[state=active]:shadow-[0_3px_0_#d0e9f5] sm:data-[state=active]:shadow-[0_4px_0_#d0e9f5] font-black text-xs sm:text-base transition-all h-full flex-1 sm:flex-none"
              >
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">History</span>
              </TabsTrigger>
              <TabsTrigger 
                value="add" 
                className="rounded-[1.2rem] sm:rounded-[2rem] px-3 sm:px-8 gap-1.5 sm:gap-2 data-[state=active]:bg-white data-[state=active]:text-cinna-dark-blue data-[state=active]:shadow-[0_3px_0_#d0e9f5] sm:data-[state=active]:shadow-[0_4px_0_#d0e9f5] font-black text-xs sm:text-base transition-all h-full flex-1 sm:flex-none"
              >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Record</span>
              </TabsTrigger>
            </TabsList>
          </div>

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
                <LogList logs={logs} onDeleteLog={handleDeleteLog} onExport={handleExportCSV} />
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
        </Tabs>
      </main>

      <footer className="mt-12 sm:mt-20 text-center">
        <p className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-[0.3em] sm:tracking-[0.5em] font-black">
          Floating on Clouds ☁️ • {new Date().getFullYear()}
        </p>
      </footer>
      
      <Toaster position="top-center" expand={false} richColors />
    </div>
  );
}
