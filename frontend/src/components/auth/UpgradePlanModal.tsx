import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Zap, Crown, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
  const { user, boardLimit, updatePlan } = useAuthStore();
  const currentPlan = user?.plan || 'free';

  const handleSelectPlan = async (newPlan: 'free' | 'plus' | 'premium') => {
    try {
      await updatePlan(newPlan);
      toast.success(`Successfully upgraded to ${newPlan.toUpperCase()} plan! You can now create more boards.`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update plan');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-3xl p-6 bg-card border-border shadow-2xl">
        <DialogHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Crown className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
            Board Limit Reached!
          </DialogTitle>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You are currently on the <span className="font-bold text-foreground capitalize">{currentPlan} Plan</span> ({boardLimit.current} / {boardLimit.limit} boards used). Upgrade your plan to create more collaborative rooms!
          </p>
        </DialogHeader>

        {/* Plan Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3">
          {/* Free Plan */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
            currentPlan === 'free' ? 'border-primary bg-primary/5 shadow-xs' : 'border-border/60 hover:bg-accent/40'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <ShieldCheck className="w-5 h-5 text-slate-500" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-muted-foreground uppercase">
                  Basic
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Free</h3>
              <p className="text-2xl font-extrabold text-foreground mt-1">3 <span className="text-xs font-normal text-muted-foreground">boards</span></p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mt-3">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Up to 3 active rooms</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Real-time Yjs sync</li>
              </ul>
            </div>
            <Button
              disabled={currentPlan === 'free'}
              onClick={() => handleSelectPlan('free')}
              variant="outline"
              className="mt-4 rounded-xl text-xs"
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Downgrade to Free'}
            </Button>
          </div>

          {/* Plus Plan */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between relative transition-all ${
            currentPlan === 'plus' ? 'border-indigo-500 bg-indigo-500/10 shadow-md' : 'border-indigo-500/40 bg-indigo-500/5 hover:border-indigo-500'
          }`}>
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Most Popular
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 mt-1">
                <Zap className="w-5 h-5 text-indigo-500" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 uppercase">
                  Plus
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Plus</h3>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">10 <span className="text-xs font-normal text-muted-foreground">boards</span></p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mt-3">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-indigo-500" /> Up to 10 active rooms</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-indigo-500" /> Infinite canvas length</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-indigo-500" /> Favorite boards tab</li>
              </ul>
            </div>
            <Button
              onClick={() => handleSelectPlan('plus')}
              className="mt-4 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {currentPlan === 'plus' ? 'Current Plan' : 'Switch to Plus (10 Boards)'}
            </Button>
          </div>

          {/* Premium Plan */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
            currentPlan === 'premium' ? 'border-amber-500 bg-amber-500/10 shadow-md' : 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase">
                  Pro
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Premium</h3>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">20 <span className="text-xs font-normal text-muted-foreground">boards</span></p>
              <ul className="text-xs text-muted-foreground space-y-1.5 mt-3">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500" /> Up to 20 active rooms</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500" /> Unlimited participants</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500" /> Priority WebSocket sync</li>
              </ul>
            </div>
            <Button
              onClick={() => handleSelectPlan('premium')}
              className="mt-4 rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              {currentPlan === 'premium' ? 'Current Plan' : 'Switch to Premium (20 Boards)'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
