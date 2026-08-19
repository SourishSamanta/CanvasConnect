import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import { Plus, Sun, Moon, LayoutDashboard, User, Sparkles, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onOpenNewBoardModal?: () => void;
}

export default function Navbar({ onOpenNewBoardModal }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, userAvatar, theme, toggleTheme } = useWhiteboardStore();

  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';
  const isProfile = location.pathname === '/profile';

  return (
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

          {/* User Profile Pill */}
          <Link
            to="/profile"
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl border border-border/50 bg-card hover:bg-accent/60 transition-all group"
            title="View Profile"
          >
            <span className="text-lg w-7 h-7 rounded-lg bg-accent/80 flex items-center justify-center border border-border/40 group-hover:scale-110 transition-transform">
              {userAvatar}
            </span>
            <span className="text-xs font-semibold max-w-[100px] truncate text-foreground hidden sm:inline-block">
              {userName || 'User'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
