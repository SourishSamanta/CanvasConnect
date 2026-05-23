import { Plus, Minus, RotateCcw } from 'lucide-react';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function ZoomControls() {
  const { zoom, setZoom, setPan } = useWhiteboardStore();

  const zoomIn = () => setZoom(zoom * 1.2);
  const zoomOut = () => setZoom(zoom / 1.2);
  const resetView = () => {
    setZoom(1);
    setPan(0, 0);
  };

  return (
    <div className="fixed bottom-4 right-4 z-30 flex items-center gap-1 toolbar-float rounded-xl px-1.5 py-1 border border-border">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <Minus size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Zoom out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={resetView}
            className="px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all min-w-[48px] text-center"
          >
            {Math.round(zoom * 100)}%
          </button>
        </TooltipTrigger>
        <TooltipContent>Reset view</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <Plus size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Zoom in</TooltipContent>
      </Tooltip>
    </div>
  );
}
