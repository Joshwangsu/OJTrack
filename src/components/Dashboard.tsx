import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LogEntry, UserSettings } from '@/src/types';
import { Clock, Target, Calendar, TrendingUp, Hourglass } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

interface DashboardProps {
  logs: LogEntry[];
  settings: UserSettings;
}

export function Dashboard({ logs, settings }: DashboardProps) {
  const totalHours = logs.reduce((acc, log) => acc + (log.totalDuration || log.duration), 0);
  const progress = Math.min((totalHours / settings.targetHours) * 100, 100);
  const remainingHours = Math.max(settings.targetHours - totalHours, 0);

  // Calculate projected completion
  let projectedDate = 'N/A';
  if (logs.length > 0 && totalHours > 0 && totalHours < settings.targetHours) {
    const firstLogDate = new Date(logs[logs.length - 1].date);
    const today = new Date();
    const daysElapsed = Math.max(differenceInDays(today, firstLogDate), 1);
    const avgHoursPerDay = totalHours / daysElapsed;
    
    if (avgHoursPerDay > 0) {
      const daysRemaining = Math.ceil(remainingHours / avgHoursPerDay);
      projectedDate = format(addDays(today, daysRemaining), 'MMM dd, yyyy');
    }
  }

  const stats = [
    {
      label: 'Total Hours',
      value: `${totalHours.toFixed(1)}h`,
      icon: Clock,
      color: 'text-cinna-dark-blue',
      bg: 'bg-blue-50',
    },
    {
      label: 'Target Hours',
      value: `${settings.targetHours}h`,
      icon: Target,
      color: 'text-cinna-pink',
      bg: 'bg-pink-50',
    },
    {
      label: 'Remaining',
      value: `${remainingHours.toFixed(1)}h`,
      icon: Hourglass,
      color: 'text-cinna-text',
      bg: 'bg-slate-50',
    },
    {
      label: 'Projected End',
      value: projectedDate,
      icon: Calendar,
      color: 'text-cinna-dark-blue',
      bg: 'bg-cyan-50',
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            className="kawaii-card p-4 sm:p-6 flex flex-col items-center text-center space-y-3 sm:space-y-4"
          >
            <div className={`p-3 sm:p-5 rounded-full ${stat.bg} border-4 border-white shadow-sm`}>
              <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <h3 className="text-lg sm:text-2xl font-black mt-1 text-cinna-text">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="kawaii-card p-6 sm:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-cinna-text tracking-tight">OJT Progress ☁️</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">Floating towards your goal!</p>
          </div>
          <div className="bg-cinna-blue/10 border-4 border-cinna-blue/20 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl">
            <span className="text-xl sm:text-2xl font-black text-cinna-dark-blue">
              {totalHours.toFixed(1)} <span className="text-slate-400 text-sm sm:text-base font-bold">/ {settings.targetHours}h</span>
            </span>
          </div>
        </div>
        
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-[#d0e9f5] h-8 sm:h-10 rounded-full p-1.5 sm:p-2 overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, type: "spring" }}
              className="h-full bg-cinna-blue rounded-full shadow-[0_3px_0_#89cff0] sm:shadow-[0_4px_0_#89cff0] relative"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full h-1/2 mt-0.5 sm:mt-1 mx-1 sm:mx-2" />
            </motion.div>
          </div>
          <div className="flex justify-between px-2 sm:px-4">
            {[0, 25, 50, 75, 100].map((mark) => (
              <div key={mark} className="flex flex-col items-center">
                <div className="w-1.5 sm:w-2 h-3 sm:h-4 bg-[#d0e9f5] rounded-full mb-1 sm:mb-2" />
                <span className="text-[10px] sm:text-xs font-black text-slate-400">{mark}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
