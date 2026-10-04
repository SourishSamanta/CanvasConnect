import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useWhiteboardStore, AVAILABLE_AVATARS } from '@/stores/whiteboardStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Mail, Lock, User, ShieldCheck, Zap, Crown, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, signup } = useAuthStore();
  const { updateUserProfile } = useWhiteboardStore();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(authModalTab || 'login');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'plus' | 'premium'>('free');
  const [selectedAvatar, setSelectedAvatar] = useState('🎨');

  // Sync tab with store when modal opens
  React.useEffect(() => {
    setActiveTab(authModalTab);
  }, [authModalTab, isAuthModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'login') {
        if (!email || !password) {
          toast.error('Please fill in all fields');
          setLoading(false);
          return;
        }
        await login(email, password);
        const loggedUser = useAuthStore.getState().user;
        if (loggedUser) {
          updateUserProfile({ userName: loggedUser.name, userAvatar: loggedUser.avatar });
        }
        toast.success('Successfully logged in!');
      } else {
        if (!name || !email || !password) {
          toast.error('Please fill in all required fields');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signup(name, email, password, selectedPlan, selectedAvatar);
        updateUserProfile({ userName: name, userAvatar: selectedAvatar });
        toast.success(`Welcome to CanvasConnect! Enrolled in ${selectedPlan.toUpperCase()} plan.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={closeAuthModal}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border-border shadow-2xl overflow-hidden">
        {/* Header Header */}
        <DialogHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary via-indigo-500 to-purple-600 flex items-center justify-center shadow-md text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
            {activeTab === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {activeTab === 'login'
              ? 'Log in to access your personal boards & database rooms'
              : 'Sign up to get your personal board workspace with plan limits'}
          </p>
        </DialogHeader>

        {/* Auth Toggle Tabs */}
        <div className="flex bg-accent/50 p-1 rounded-2xl border border-border/50 my-2">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {activeTab === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sourish Samanta"
                  className="pl-9 h-11 rounded-xl bg-background"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="pl-9 h-11 rounded-xl bg-background"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 h-11 rounded-xl bg-background"
              />
            </div>
          </div>

          {/* Sign Up Plan Selection & Avatar */}
          {activeTab === 'signup' && (
            <>
              {/* Plan Choice Cards */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Select Subscription Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'free', name: 'Free', limit: '3 Boards', icon: ShieldCheck, color: 'text-slate-500' },
                    { id: 'plus', name: 'Plus', limit: '10 Boards', icon: Zap, color: 'text-indigo-500' },
                    { id: 'premium', name: 'Premium', limit: '20 Boards', icon: Crown, color: 'text-amber-500' },
                  ].map((p) => {
                    const isSel = selectedPlan === p.id;
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlan(p.id as any)}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                          isSel
                            ? 'border-primary bg-primary/10 shadow-xs'
                            : 'border-border/60 hover:bg-accent/40'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Icon className={`w-3.5 h-3.5 ${p.color}`} />
                          <span className="text-xs font-bold text-foreground">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-primary">{p.limit}</span>
                        {isSel && <Check className="w-3.5 h-3.5 text-primary mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Choose Avatar ({selectedAvatar})
                </label>
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {AVAILABLE_AVATARS.slice(0, 10).map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center shrink-0 border ${
                        selectedAvatar === av ? 'border-primary bg-primary/10 scale-110' : 'border-transparent'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] mt-2"
          >
            {loading ? 'Processing...' : activeTab === 'login' ? 'Log In to Workspace' : 'Create Account'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
