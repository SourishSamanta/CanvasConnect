import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import {
  useWhiteboardStore, AVAILABLE_AVATARS, AVAILABLE_CURSOR_COLORS, CanvasTemplate
} from '@/stores/whiteboardStore';
import { useAuthStore } from '@/stores/authStore';
import {
  User, Palette, Sparkles, Check, Save, MousePointer2, LayoutGrid, ArrowLeft,
  ShieldCheck, Zap, Crown, LogOut, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ProfilePage() {
  const navigate = useNavigate();
  const {
    userName, userAvatar, userTagline, cursorColor, preferredTemplate,
    updateUserProfile, boardHistory
  } = useWhiteboardStore();

  const { isAuthenticated, user, boardLimit, updatePlan, logout, openAuthModal } = useAuthStore();

  // Local Form State
  const [name, setName] = useState(user?.name || userName);
  const [avatar, setAvatar] = useState(user?.avatar || userAvatar);
  const [tagline, setTagline] = useState(userTagline);
  const [color, setColor] = useState(cursorColor);
  const [template, setTemplate] = useState<CanvasTemplate>(preferredTemplate || 'grid');
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Display Name cannot be empty');
      return;
    }

    updateUserProfile({
      userName: name.trim(),
      userAvatar: avatar,
      userTagline: tagline.trim(),
      cursorColor: color,
      preferredTemplate: template,
    });

    toast.success('Profile saved successfully!');
  };

  const handlePlanChange = async (newPlan: 'free' | 'plus' | 'premium') => {
    if (!isAuthenticated) {
      openAuthModal('signup');
      return;
    }
    setUpdatingPlan(true);
    try {
      await updatePlan(newPlan);
      toast.success(`Plan updated to ${newPlan.toUpperCase()} (${newPlan === 'free' ? 3 : newPlan === 'plus' ? 10 : 20} boards)`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update plan');
    } finally {
      setUpdatingPlan(false);
    }
  };

  const currentPlan = user?.plan || 'free';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl border border-border/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <User className="w-7 h-7 text-primary" />
                Account Profile & Customization
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage your account credentials, board limits, avatar, and canvas defaults.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="rounded-xl bg-primary text-primary-foreground font-semibold px-6 h-11 flex items-center gap-2 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </Button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-2 space-y-8">
            {/* Account & Auth Status Card */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Account Authentication
                </h2>
                {isAuthenticated ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    ✓ Logged In
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    Guest Mode
                  </span>
                )}
              </div>

              {isAuthenticated ? (
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/40 border border-border/60">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Logged in as</p>
                    <p className="text-sm font-bold text-foreground">{user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={logout}
                    className="rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" /> Log Out
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-accent/30 border border-border/60 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Sign in to save all your whiteboards to your persistent MongoDB database!
                  </p>
                  <Button
                    onClick={() => openAuthModal('login')}
                    className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
                  >
                    Log In / Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Board Limit Subscription Plan Selector */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Subscription Plan & Board Limits
                </h2>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Current: {currentPlan} ({boardLimit.limit} boards)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a plan to fit your whiteboard workspace needs. Free allows 3 boards, Plus allows 10 boards, and Premium allows 20 boards.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { id: 'free', name: 'Free Plan', limit: '3 Boards', icon: ShieldCheck, color: 'text-slate-500' },
                  { id: 'plus', name: 'Plus Plan', limit: '10 Boards', icon: Zap, color: 'text-indigo-500' },
                  { id: 'premium', name: 'Premium Plan', limit: '20 Boards', icon: Crown, color: 'text-amber-500' },
                ].map((p) => {
                  const isSel = currentPlan === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={updatingPlan}
                      onClick={() => handlePlanChange(p.id as any)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
                        isSel
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border/60 hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${p.color}`} />
                        {isSel && <Check className="w-4 h-4 text-primary font-bold" />}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-foreground block">{p.name}</span>
                        <span className="text-xs font-bold text-primary mt-0.5 block">{p.limit} limit</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Name & Tagline */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Personal Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Display Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="rounded-xl h-11 bg-background"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Tagline / Role
                  </label>
                  <Input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Lead Designer"
                    className="rounded-xl h-11 bg-background"
                    maxLength={50}
                  />
                </div>
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="text-xl">{avatar}</span>
                  Select Avatar
                </h2>
                <span className="text-xs text-muted-foreground">Chosen Avatar: {avatar}</span>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 pt-2">
                {AVAILABLE_AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all border-2 ${
                      avatar === a
                        ? 'border-primary bg-primary/10 scale-110 shadow-sm'
                        : 'border-transparent hover:bg-accent hover:scale-105'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Cursor Color Selection */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Collaborative Cursor Color
              </h2>
              <p className="text-xs text-muted-foreground">
                This color highlights your cursor pointer and badge when drawing live with team members.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {AVAILABLE_CURSOR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-full transition-all flex items-center justify-center shadow-xs ${
                      color === c ? 'ring-4 ring-primary/30 scale-110' : 'hover:scale-105 opacity-90'
                    }`}
                  >
                    {color === c && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Canvas Preference */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" />
                Preferred Default Canvas Template
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {[
                  { id: 'grid', label: 'Grid Paper' },
                  { id: 'dots', label: 'Dot Matrix' },
                  { id: 'blank', label: 'Blank White' },
                  { id: 'dark', label: 'Dark Mode' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplate(tpl.id as CanvasTemplate)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      template === tpl.id
                        ? 'border-primary bg-primary/10 font-bold text-primary shadow-xs'
                        : 'border-border/60 text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <span className="text-xs">{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview & Stats */}
          <div className="space-y-6">
            {/* Live Session Badge Preview */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                Live Session Appearance
              </h3>
              <p className="text-xs text-muted-foreground">
                Here is how other participants will see your avatar and cursor inside live whiteboard rooms:
              </p>

              {/* Mock Canvas Box */}
              <div className="relative h-44 rounded-xl bg-accent/40 border border-dashed border-border flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#8883_1px,transparent_1px)] [background-size:12px_12px]" />

                {/* Simulated Live Cursor & Tag */}
                <div className="relative z-10 flex flex-col items-start transition-all transform hover:scale-105">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold shadow-lg shadow-black/10" style={{ backgroundColor: color }}>
                    <MousePointer2 className="w-3.5 h-3.5 fill-current" />
                    <span>{name || 'User'}</span>
                    <span className="text-sm">{avatar}</span>
                  </div>
                </div>
              </div>

              {/* Profile Card Summary */}
              <div className="pt-2 flex items-center gap-3 border-t border-border/40">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-2xl border border-border/60">
                  {avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-foreground truncate">{name || 'User'}</div>
                  <div className="text-xs text-muted-foreground truncate">{tagline || 'Collaborator'}</div>
                </div>
              </div>
            </div>

            {/* Quick Stats Box */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-foreground">Session Statistics</h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Subscription Plan</span>
                  <span className="font-bold text-primary capitalize">{currentPlan} ({boardLimit.limit} boards)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Saved Boards</span>
                  <span className="font-bold text-foreground">{boardHistory.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Favorite Boards</span>
                  <span className="font-bold text-primary">{boardHistory.filter(b => b.isFavorite).length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Cursor Theme</span>
                  <span className="font-bold font-mono" style={{ color: color }}>● Swatch Color</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-md shadow-primary/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
