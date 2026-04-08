import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Save, BookOpen, Clock } from 'lucide-react';
import { WeeklyJournal as WeeklyJournalType } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface WeeklyJournalProps {
  journals: WeeklyJournalType[];
  onSaveJournal: (journal: Omit<WeeklyJournalType, 'id'>) => void;
  onUpdateJournal: (id: string, journal: Partial<WeeklyJournalType>) => void;
}

export function WeeklyJournal({ journals, onSaveJournal, onUpdateJournal }: WeeklyJournalProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [reflection, setReflection] = useState('');
  const [existingJournal, setExistingJournal] = useState<WeeklyJournalType | null>(null);

  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  useEffect(() => {
    const journal = journals.find(j => 
      format(new Date(j.weekStartDate), 'yyyy-MM-dd') === format(currentWeekStart, 'yyyy-MM-dd')
    );
    if (journal) {
      setExistingJournal(journal);
      setReflection(journal.reflection);
    } else {
      setExistingJournal(null);
      setReflection('');
    }
  }, [currentWeekStart, journals]);

  const handleSave = () => {
    if (!reflection.trim()) {
      toast.error('Please write something before saving! 🍮');
      return;
    }

    if (existingJournal) {
      onUpdateJournal(existingJournal.id, { 
        reflection,
        updatedAt: new Date().toISOString()
      });
    } else {
      onSaveJournal({
        weekStartDate: currentWeekStart.toISOString(),
        weekEndDate: currentWeekEnd.toISOString(),
        reflection,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="kawaii-card p-6 sm:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-purin-text tracking-tight">Weekly Journal 📖</h2>
            <p className="text-xs sm:text-sm font-bold text-purin-light-brown mt-1">Reflect on your progress this week!</p>
          </div>
          
          <div className="flex items-center bg-purin-yellow/20 rounded-2xl p-2 border-4 border-purin-yellow/40">
            <button 
              onClick={prevWeek}
              className="p-2 hover:bg-purin-yellow/30 rounded-xl transition-colors text-purin-brown"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="px-4 text-center min-w-[200px]">
              <div className="text-[10px] font-black uppercase tracking-widest text-purin-light-brown/60">Week of</div>
              <div className="text-sm sm:text-base font-black text-purin-brown">
                {format(currentWeekStart, 'MMM dd')} - {format(currentWeekEnd, 'MMM dd, yyyy')}
              </div>
            </div>
            <button 
              onClick={nextWeek}
              className="p-2 hover:bg-purin-yellow/30 rounded-xl transition-colors text-purin-brown"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <Textarea
              placeholder="How was your week? What did you learn? Any challenges? 🍮"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="min-h-[300px] kawaii-input text-lg p-8 resize-none focus:ring-0"
            />
            <div className="absolute bottom-4 right-4 text-[10px] font-black uppercase tracking-widest text-purin-light-brown/30">
              {reflection.length} characters
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="bg-purin-yellow text-purin-brown px-10 py-4 rounded-[1.5rem] font-black text-lg shadow-[0_6px_0_#FFD700] hover:scale-[1.02] active:translate-y-1 active:shadow-none transition-all flex items-center gap-3"
            >
              <Save className="w-6 h-6" />
              {existingJournal ? 'Update Reflection' : 'Save Reflection'}
            </button>
          </div>
        </div>
      </div>

      {journals.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-purin-text px-4">Past Reflections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {journals
              .filter(j => j.id !== existingJournal?.id)
              .sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime())
              .slice(0, 4)
              .map((journal, index) => (
                <motion.div
                  key={journal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="kawaii-card p-6 cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => setCurrentWeekStart(new Date(journal.weekStartDate))}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purin-yellow/20 rounded-lg">
                      <BookOpen className="w-5 h-5 text-purin-brown" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-purin-light-brown/60">
                        {format(new Date(journal.weekStartDate), 'MMM dd')} - {format(new Date(journal.weekEndDate), 'MMM dd')}
                      </div>
                      <div className="text-xs font-bold text-purin-brown">Weekly Reflection</div>
                    </div>
                  </div>
                  <p className="text-sm text-purin-text line-clamp-3 italic">
                    "{journal.reflection}"
                  </p>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
