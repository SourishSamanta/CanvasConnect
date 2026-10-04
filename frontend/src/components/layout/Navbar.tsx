import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Sun, Moon, LayoutDashboard, User, Sparkles, Home, LogIn, LogOut, ShieldCheck, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';

interface NavbarProps {
  onOpenNewBoardModal?: () => void;
}

export default function Navbar({ onOpenNewBoardModal }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, userAvatar, theme, toggleTheme } = useWhiteboardStore();
  const { isAuthenticated, user, boardLimit, logout, openAuthModal } = useAuthStore();

  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';
  const isProfile = location.pathname === '/profile';

  const planName = user?.plan || 'free';
  const getPlanBadge = () => {
    switch (planName) {
      case 'plus':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase">
            <Zap className="w-3 h-3" /> Plus ({boardLimit.limit})
          </span>
        );
      case 'premium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase">
            <Crown className="w-3 h-3" /> Premium ({boardLimit.limit})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase">
            <ShieldCheck className="w-3 h-3" /> Free ({boardLimit.limit})
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5.5 h-5.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
                CanvasConnect
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mt-0.5">
                Collaborative Whiteboard
              </span>
            </div>
          </Link>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-accent/40 p-1 rounded-xl border border-border/40">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isLanding
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isDashboard
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to="/profile"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isProfile
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* + New Board Button */}
            {onOpenNewBoardModal ? (
              <Button
                onClick={onOpenNewBoardModal}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>New Board</span>
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/dashboard?new=true')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>New Board</span>
              </Button>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl w-9 h-9 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Auth Buttons / User Pill */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl border border-border/50 bg-card hover:bg-accent/60 transition-all group"
                  title="View Profile"
                >
                  <span className="text-lg w-7 h-7 rounded-lg bg-accent/80 flex items-center justify-center border border-border/40 group-hover:scale-110 transition-transform">
                    {user?.avatar || userAvatar}
                  </span>
                  <div className="flex flex-col text-left hidden sm:flex">
                    <span className="text-xs font-semibold max-w-[100px] truncate text-foreground leading-tight">
                      {user?.name || userName}
                    </span>
                    {getPlanBadge()}
                  </div>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="rounded-xl w-9 h-9 border border-border/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => openAuthModal('login')}
                  className="rounded-xl text-xs font-semibold h-9 px-3 text-muted-foreground hover:text-foreground"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" /> Log In
                </Button>
                <Button
                  onClick={() => openAuthModal('signup')}
                  className="rounded-xl text-xs font-semibold h-9 px-3.5 bg-accent hover:bg-accent/80 text-foreground border border-border/60"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal />
    </>
  );
}
