import { Sun, Moon } from 'lucide-react';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useWhiteboardStore();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleTheme}
          className="fixed bottom-4 left-4 z-30 p-2.5 toolbar-float rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{theme === 'light' ? 'Dark mode' : 'Light mode'}</TooltipContent>
    </Tooltip>
  );
}
