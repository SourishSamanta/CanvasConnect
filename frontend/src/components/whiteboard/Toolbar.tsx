import { Pencil, Eraser, Undo2, Redo2, Trash2 } from 'lucide-react';
import { useWhiteboardStore, AVAILABLE_COLORS, Tool } from '@/stores/whiteboardStore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function Toolbar() {
  const { tool, setTool, color, setColor, brushSize, setBrushSize, undo, redo, clearCanvas, undoStack, redoStack } =
    useWhiteboardStore();

  const tools: { id: Tool; icon: typeof Pencil; label: string }[] = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 toolbar-float rounded-xl px-2 py-1.5 border border-border">
      {/* Tools */}
      {tools.map(({ id, icon: Icon, label }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTool(id)}
              className={cn(
                'p-2 rounded-lg transition-all duration-150',
                tool === id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      {/* Colors */}
      {AVAILABLE_COLORS.map((c) => (
        <Tooltip key={c}>
          <TooltipTrigger asChild>
            <button
              onClick={() => { setColor(c); setTool('pen'); }}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-all duration-150 hover:scale-110',
                color === c && tool === 'pen' ? 'border-foreground scale-110' : c === '#ffffff' ? 'border-border' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
            />
          </TooltipTrigger>
          <TooltipContent>Color</TooltipContent>
        </Tooltip>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      {/* Brush size */}
      <div className="flex items-center gap-2 px-2">
        <input
          type="range"
          min={1}
          max={20}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-20 h-1 accent-foreground cursor-pointer"
        />
        <span className="text-xs text-muted-foreground w-4 text-center">{brushSize}</span>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Undo/Redo/Clear */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all disabled:opacity-30"
          >
            <Undo2 size={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Undo</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all disabled:opacity-30"
          >
            <Redo2 size={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Redo</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all"
          >
            <Trash2 size={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Clear canvas</TooltipContent>
      </Tooltip>
    </div>
  );
}
