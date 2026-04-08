import * as React from 'react';
import { useState } from 'react';
import { format, parse, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { LogEntry } from '@/src/types';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LogFormProps {
  onAddLog: (entry: Omit<LogEntry, 'id'>) => void;
}

export function LogForm({ onAddLog }: LogFormProps) {
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [task, setTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    
    let dailyDuration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (dailyDuration < 0) dailyDuration += 24;

    if (mode === 'single') {
      onAddLog({
        date: startDate.toISOString(),
        startTime,
        endTime,
        duration: dailyDuration,
        totalDuration: dailyDuration,
        task: task || undefined,
        category: 'General',
        status: 'completed',
      });
    } else {
      const days = differenceInDays(endDate, startDate) + 1;
      if (days <= 0) {
        toast.error('End date must be after start date');
        return;
      }
      
      onAddLog({
        date: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime,
        endTime,
        duration: dailyDuration,
        totalDuration: dailyDuration * days,
        task: task || undefined,
        category: 'General',
        status: 'completed',
      });
    }

    setTask('');
    toast.success(mode === 'single' ? 'Log entry added! ✨' : 'Batch entries added! 🌟');
  };

  return (
    <div className="kawaii-card p-6 sm:p-8 md:p-12 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-cinna-text tracking-tight text-center sm:text-left">Record Hours 📝</h2>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1 text-center sm:text-left">What did you learn today?</p>
        </div>
        <div className="bg-[#d0e9f5] p-1.5 sm:p-2 rounded-[1.5rem] sm:rounded-[2rem] flex shadow-inner">
          <button 
            onClick={() => setMode('single')}
            className={cn(
              "px-4 sm:px-8 py-2 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] text-xs sm:text-sm font-black transition-all",
              mode === 'single' ? "bg-white text-cinna-dark-blue shadow-[0_3px_0_#d0e9f5]" : "text-slate-400"
            )}
          >
            Single
          </button>
          <button 
            onClick={() => setMode('range')}
            className={cn(
              "px-4 sm:px-8 py-2 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] text-xs sm:text-sm font-black transition-all",
              mode === 'range' ? "bg-white text-cinna-dark-blue shadow-[0_3px_0_#d0e9f5]" : "text-slate-400"
            )}
          >
            Range
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 ml-2">
              {mode === 'single' ? 'Date' : 'Start Date'}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-black kawaii-input h-14 sm:h-16"
                >
                  <CalendarIcon className="mr-3 h-4 w-4 sm:h-5 sm:w-5 text-cinna-blue" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-[2rem] border-4 border-[#d0e9f5] shadow-2xl">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {mode === 'range' && (
            <div className="space-y-3 sm:space-y-4">
              <Label className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 ml-2">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-black kawaii-input h-14 sm:h-16"
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 sm:h-5 sm:w-5 text-cinna-blue" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[2rem] border-4 border-[#d0e9f5] shadow-2xl">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => d && setEndDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 sm:gap-10">
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 ml-2 flex items-center gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" /> Start
            </Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="kawaii-input h-14 sm:h-16"
            />
          </div>
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 ml-2 flex items-center gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" /> End
            </Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="kawaii-input h-14 sm:h-16"
            />
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Label className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 ml-2">
            Activity <span className="text-slate-300 font-bold">(Optional)</span>
          </Label>
          <Input
            placeholder="Tell me all about it! ☁️"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="kawaii-input h-14 sm:h-16"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-cinna-blue text-white h-16 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl shadow-[0_6px_0_#89cff0] sm:shadow-[0_8px_0_#89cff0] hover:scale-[1.02] active:translate-y-2 active:shadow-none transition-all"
        >
          {mode === 'single' ? 'Save Entry! ✨' : 'Save Batch! 🌟'}
        </button>
      </form>
    </div>
  );
}
