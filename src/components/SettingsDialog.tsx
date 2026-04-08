import { useState } from 'react';
import { Settings, User, Building2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserSettings } from '@/src/types';
import { toast } from 'sonner';

interface SettingsDialogProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export function SettingsDialog({ settings, onSave }: SettingsDialogProps) {
  const [tempSettings, setTempSettings] = useState<UserSettings>(settings);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave(tempSettings);
    setOpen(false);
    toast.success('Settings updated! ✨');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-white border-4 border-[#FEE440] p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] text-purin-light-brown hover:text-purin-yellow hover:border-purin-yellow transition-all shadow-[0_4px_0_#FEE440] active:translate-y-1 active:shadow-none">
        <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-[2rem] sm:rounded-[3rem] border-4 sm:border-8 border-[#FEE440] bg-purin-bg p-6 sm:p-10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl font-black text-purin-text tracking-tight">Settings ⚙️</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm font-bold text-purin-light-brown/60">
            Customize your pudding tracker!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:gap-8 py-6 sm:py-8">
          <div className="grid gap-2 sm:gap-3">
            <Label htmlFor="name" className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-purin-light-brown/60 ml-2 flex items-center gap-2">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-purin-yellow" /> Your Name
            </Label>
            <Input
              id="name"
              value={tempSettings.userName}
              onChange={(e) => setTempSettings({ ...tempSettings, userName: e.target.value })}
              placeholder="Scholar Name"
              className="kawaii-input h-14 sm:h-16"
            />
          </div>
          <div className="grid gap-2 sm:gap-3">
            <Label htmlFor="company" className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-purin-light-brown/60 ml-2 flex items-center gap-2">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-purin-dark-yellow" /> Institution
            </Label>
            <Input
              id="company"
              value={tempSettings.companyName}
              onChange={(e) => setTempSettings({ ...tempSettings, companyName: e.target.value })}
              placeholder="Academic Institution"
              className="kawaii-input h-14 sm:h-16"
            />
          </div>
          <div className="grid gap-2 sm:gap-3">
            <Label htmlFor="target" className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-purin-light-brown/60 ml-2 flex items-center gap-2">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-purin-brown" /> Target Hours
            </Label>
            <Input
              id="target"
              type="number"
              value={tempSettings.targetHours}
              onChange={(e) => setTempSettings({ ...tempSettings, targetHours: parseInt(e.target.value) || 0 })}
              className="kawaii-input h-14 sm:h-16"
            />
          </div>
        </div>
        <DialogFooter>
          <button 
            onClick={handleSave} 
            className="w-full bg-purin-yellow text-purin-brown h-16 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl shadow-[0_6px_0_#FFD700] sm:shadow-[0_8px_0_#FFD700] hover:scale-[1.02] active:translate-y-2 active:shadow-none transition-all"
          >
            Save Changes! ✨
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
