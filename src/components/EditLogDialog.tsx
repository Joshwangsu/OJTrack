import * as React from 'react';
import { useState, useEffect } from 'react';
import { format, parse, differenceInCalendarDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { LogEntry } from '@/src/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface EditLogDialogProps {
  log: LogEntry;
  onUpdateLog: (id: string, entry: Partial<LogEntry>) => Promise<void>;
}

export function EditLogDialog({ log, onUpdateLog }: EditLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(log.date));
  const [endDate, setEndDate] = useState<Date | undefined>(log.endDate ? new Date(log.endDate) : undefined);
  const [startTime, setStartTime] = useState(log.startTime);
  const [endTime, setEndTime] = useState(log.endTime);
  const [task, setTask] = useState(log.task || '');

  // Sync state when dialog opens or log changes
  useEffect(() => {
    if (open) {
      setStartDate(new Date(log.date));
      setEndDate(log.endDate ? new Date(log.endDate) : undefined);
      setStartTime(log.startTime);
      setEndTime(log.endTime);
      setTask(log.task || '');
    }
  }, [open, log]);

  const handleUpdate = async () => {
    try {
      const start = parse(startTime, 'HH:mm', new Date());
      const end = parse(endTime, 'HH:mm', new Date());
      
      let dailyDuration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (dailyDuration < 0) dailyDuration += 24;

      const updates: any = {
        date: startDate.toISOString(),
        startTime,
        endTime,
        duration: dailyDuration,
      };

      // Handle optional task - use empty string to clear it if needed, 
      // as Firestore rules allow strings and updateDoc doesn't like undefined.
      updates.task = task.trim();

      if (endDate) {
        if (endDate < startDate) {
          toast.error('End date cannot be before start date! 🍮');
          return;
        }
        updates.endDate = endDate.toISOString();
        const days = differenceInCalendarDays(endDate, startDate) + 1;
        updates.totalDuration = dailyDuration * days;
      } else {
        updates.totalDuration = dailyDuration;
      }

      await onUpdateLog(log.id, updates);
      setOpen(false);
      toast.success('Log entry updated! ✨');
    } catch (error) {
      console.error('Error updating log:', error);
      toast.error('Failed to update log entry. 🍮');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-purin-yellow/10 text-purin-brown hover:bg-purin-yellow/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all active:scale-90">
        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem] sm:rounded-[3rem] border-4 sm:border-8 border-[#FEE440] bg-purin-bg p-6 sm:p-10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl font-black text-purin-text tracking-tight">Edit Log 📝</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className={log.endDate ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-3"}>
            <div className="space-y-3">
              <Label className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-purin-light-brown/60 ml-2">
                {log.endDate ? 'Start Date' : 'Date'}
              </Label>
              <Popover>
                <PopoverTrigger
                  render={(props) => (
                    <Button {...props} variant="outline" className="w-full justify-start text-left font-black kawaii-input h-14">
                      <CalendarIcon className="mr-3 h-4 w-4 text-purin-yellow" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  )}
                />
                <PopoverContent className="w-auto p-0 rounded-[2rem] border-4 border-[#FEE440] shadow-2xl">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {log.endDate && (
              <div className="space-y-3">
                <Label className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-purin-light-brown/60 ml-2">End Date</Label>
                <Popover>
                  <PopoverTrigger
                    render={(props) => (
                      <Button {...props} variant="outline" className="w-full justify-start text-left font-black kawaii-input h-14">
                        <CalendarIcon className="mr-3 h-4 w-4 text-purin-yellow" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    )}
                  />
                  <PopoverContent className="w-auto p-0 rounded-[2rem] border-4 border-[#FEE440] shadow-2xl">
                    <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-purin-light-brown/60 ml-2 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Start
              </Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="kawaii-input h-14" />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-purin-light-brown/60 ml-2 flex items-center gap-2">
                <Clock className="w-3 h-3" /> End
              </Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="kawaii-input h-14" />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-purin-light-brown/60 ml-2">Activity</Label>
            <Input value={task} onChange={(e) => setTask(e.target.value)} className="kawaii-input h-14" />
          </div>
        </div>

        <DialogFooter>
          <button 
            onClick={handleUpdate}
            className="w-full bg-purin-yellow text-purin-brown h-16 rounded-[1.5rem] font-black text-lg shadow-[0_6px_0_#FFD700] hover:scale-[1.02] active:translate-y-1 active:shadow-none transition-all"
          >
            Save Changes! ✨
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
