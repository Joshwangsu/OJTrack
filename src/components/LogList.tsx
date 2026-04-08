import { format } from 'date-fns';
import { Trash2, FileSpreadsheet, Briefcase, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LogEntry } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';

interface LogListProps {
  logs: LogEntry[];
  onDeleteLog: (id: string) => void;
  onExport: () => void;
}

export function LogList({ logs, onDeleteLog, onExport }: LogListProps) {
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="kawaii-card p-6 sm:p-8 md:p-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-cinna-text tracking-tight">History 📖</h2>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">Look at how much you've grown!</p>
        </div>
        <button 
          onClick={onExport} 
          className="bg-cinna-blue text-white px-6 sm:px-8 py-3 sm:py-4 kawaii-button flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto"
          style={{ backgroundColor: '#b9e2f5', color: '#4a7c92', boxShadow: '0 4px 0 #89cff0' }}
        >
          <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
          Export History
        </button>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <AnimatePresence initial={false}>
          {sortedLogs.length === 0 ? (
            <div className="bg-[#d0e9f5]/30 rounded-[1.5rem] sm:rounded-[2rem] py-12 sm:py-20 text-center border-4 border-dashed border-[#d0e9f5]">
              <p className="text-slate-400 font-black italic text-base sm:text-lg">Your history is a blank canvas! 🎨</p>
            </div>
          ) : (
            sortedLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-4 border-[#d0e9f5] rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 group hover:border-cinna-blue transition-colors"
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="bg-cinna-blue/10 border-4 border-cinna-blue/20 p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col items-center min-w-[70px] sm:min-w-[90px] shadow-sm">
                    <span className="text-[10px] sm:text-xs font-black text-cinna-dark-blue uppercase">{format(new Date(log.date), 'MMM')}</span>
                    <span className="text-lg sm:text-2xl font-black text-cinna-text">{format(new Date(log.date), 'dd')}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      {log.endDate && (
                        <span className="bg-cinna-pink/20 text-cinna-pink text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border-2 border-cinna-pink/30">
                          Batch Entry 🌟
                        </span>
                      )}
                    </div>
                    <p className={cn("text-sm sm:text-lg font-black text-cinna-text leading-tight", !log.task && "italic text-slate-300")}>
                      {log.task || "No description provided"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 sm:mt-3">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-cinna-blue" />
                        {log.startTime} - {log.endTime}
                      </div>
                      {log.endDate && (
                        <div className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest">
                          Until {format(new Date(log.endDate), 'MMM dd')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-10 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <div className="text-xl sm:text-3xl font-black text-cinna-text">
                      {(log.totalDuration || log.duration).toFixed(1)}<span className="text-xs sm:text-sm text-slate-400 ml-1">h</span>
                    </div>
                    {log.endDate && (
                      <div className="text-[8px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        {log.duration.toFixed(1)}h/day
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all active:scale-90"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

