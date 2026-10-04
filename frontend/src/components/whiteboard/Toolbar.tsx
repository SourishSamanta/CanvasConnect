import { useState, useRef, useEffect } from 'react';
import {
  GripVertical,
  MousePointer2,
  Hand,
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Square,
  Circle as CircleIcon,
  Minus,
  MoveRight,
  Shapes,
  Type,
  StickyNote,
  Sparkles,
  ChevronDown,
  Copy,
} from 'lucide-react';
import {
  useWhiteboardStore,
  AVAILABLE_COLORS,
  AVAILABLE_NOTE_COLORS,
  Tool,
} from '@/stores/whiteboardStore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Toolbar() {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingToolbar = useRef(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const {
    tool,
    setTool,
    color,
    setColor,
    fillColor,
    setFillColor,
    brushSize,
    setBrushSize,
    undo,
    redo,
    clearCanvas,
    canUndo,
    canRedo,
    selectedStrokeIds,
    deleteSelectedStrokes,
    duplicateSelectedStrokes,
    theme,
  } = useWhiteboardStore();

  const isShapeTool = ['rectangle', 'circle', 'line', 'arrow'].includes(tool);

  // Filter colors based on Light/Dark mode rule
  const visibleColors = AVAILABLE_COLORS.filter((c) => {
    if (theme === 'light') return c !== '#ffffff';
    return c !== '#1e1e1e';
  });

  const shapeOptions: { id: Tool; icon: typeof Square; label: string }[] = [
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: CircleIcon, label: 'Circle' },
    { id: 'line', icon: Minus, label: 'Straight Line' },
    { id: 'arrow', icon: MoveRight, label: 'Arrow' },
  ];

  const widthOptions = [
    { size: 1, label: '1px (Thin)' },
    { size: 3, label: '3px (Medium)' },
    { size: 8, label: '8px (Thick)' },
  ];

  const getActiveShapeIcon = () => {
    const active = shapeOptions.find((s) => s.id === tool);
    if (active) {
      const Icon = active.icon;
      return <Icon size={16} />;
    }
    return <Shapes size={16} />;
  };

  // Center toolbar initially when mounted
  useEffect(() => {
    if (toolbarRef.current && position === null) {
      const rect = toolbarRef.current.getBoundingClientRect();
      const initialX = Math.max(8, (window.innerWidth - rect.width) / 2);
      setPosition({ x: initialX, y: 16 });
    }
  }, [position]);

  // Window resize bounds clamping
  useEffect(() => {
    const handleResize = () => {
      if (!toolbarRef.current || position === null) return;
      const rect = toolbarRef.current.getBoundingClientRect();
      const clampedX = Math.max(8, Math.min(window.innerWidth - rect.width - 8, position.x));
      const clampedY = Math.max(8, Math.min(window.innerHeight - rect.height - 8, position.y));
      if (clampedX !== position.x || clampedY !== position.y) {
        setPosition({ x: clampedX, y: clampedY });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Draggable Toolbar Event Handlers
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!toolbarRef.current) return;
    isDraggingToolbar.current = true;
    const rect = toolbarRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingToolbar.current || !toolbarRef.current) return;
    const rect = toolbarRef.current.getBoundingClientRect();
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

    const clampedX = Math.max(8, Math.min(window.innerWidth - rect.width - 8, newX));
    const clampedY = Math.max(8, Math.min(window.innerHeight - rect.height - 8, newY));

    setPosition({ x: clampedX, y: clampedY });
  };

  const handleDragEnd = () => {
    isDraggingToolbar.current = false;
  };

  return (
    <div
      ref={toolbarRef}
      style={
        position
          ? { position: 'fixed', left: `${position.x}px`, top: `${position.y}px` }
          : { position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)' }
      }
      className="z-30 flex items-center gap-0.5 sm:gap-1 toolbar-float rounded-2xl p-1 sm:p-1.5 border border-border/80 backdrop-blur-md bg-background/90 shadow-lg select-none max-w-[calc(100vw-1rem)]"
    >
      {/* Drag Handle */}
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground transition-colors shrink-0 flex items-center justify-center"
        title="Drag toolbar"
      >
        <GripVertical size={16} />
      </div>

      <div className="w-px h-4 bg-border/80 mx-0.5 shrink-0" />

      {/* Select Tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTool('select')}
            className={cn(
              'p-1.5 rounded-xl transition-all duration-150 shrink-0',
              tool === 'select'
                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <MousePointer2 size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Select & Move</TooltipContent>
      </Tooltip>

      {/* Hand / Pan Tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTool('hand')}
            className={cn(
              'p-1.5 rounded-xl transition-all duration-150 shrink-0',
              tool === 'hand'
                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Hand size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Hand (Pan Canvas)</TooltipContent>
      </Tooltip>

      {/* Pen Tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTool('pen')}
            className={cn(
              'p-1.5 rounded-xl transition-all duration-150 shrink-0',
              tool === 'pen'
                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Pencil size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Pen</TooltipContent>
      </Tooltip>

      {/* Eraser Tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTool('eraser')}
            className={cn(
              'p-1.5 rounded-xl transition-all duration-150 shrink-0',
              tool === 'eraser'
                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Eraser size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Eraser</TooltipContent>
      </Tooltip>

      {/* Shapes Dropdown Menu */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-0.5 p-1.5 rounded-xl transition-all duration-150 shrink-0',
                  isShapeTool
                    ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {getActiveShapeIcon()}
                <ChevronDown size={12} className="opacity-70" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Shapes</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="center" className="w-40 z-50 p-1">
          {shapeOptions.map(({ id, icon: Icon, label }) => (
            <DropdownMenuItem
              key={id}
              onClick={() => setTool(id)}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-colors',
                tool === id ? 'bg-accent text-accent-foreground font-semibold' : ''
              )}
            >
              <Icon size={15} className="text-muted-foreground" />
              <span>{label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Text Tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTool('text')}
            className={cn(
              'p-1.5 rounded-xl transition-all duration-150 shrink-0',
              tool === 'text'
                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Type size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Text Tool</TooltipContent>
      </Tooltip>

      {/* Sticky Note Tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTool('note')}
            className={cn(
              'p-1.5 rounded-xl transition-all duration-150 shrink-0',
              tool === 'note'
                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <StickyNote size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Sticky Note</TooltipContent>
      </Tooltip>

      {/* Laser Pointer Tool */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTool('laser')}
            className={cn(
              'p-1.5 rounded-xl transition-all duration-150 shrink-0',
              tool === 'laser'
                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Sparkles size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Laser Pointer</TooltipContent>
      </Tooltip>

      <div className="w-px h-4 bg-border/80 mx-0.5 shrink-0" />

      {/* Line Width Selector */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all shrink-0">
                <span className="font-mono">{brushSize}px</span>
                <ChevronDown size={12} className="opacity-70" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Line Width</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="center" className="w-32 z-50 p-1">
          {widthOptions.map(({ size, label }) => (
            <DropdownMenuItem
              key={size}
              onClick={() => setBrushSize(size)}
              className={cn(
                'flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors',
                brushSize === size ? 'bg-accent text-accent-foreground font-semibold' : ''
              )}
            >
              <span>{label}</span>
              <div
                className="rounded-full bg-current"
                style={{ width: `${Math.min(12, size + 2)}px`, height: `${Math.min(12, size + 2)}px` }}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-4 bg-border/80 mx-0.5 shrink-0" />

      {/* Color Palette / Sticky Note Color Picker */}
      {tool === 'note' ? (
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {AVAILABLE_NOTE_COLORS.map((nc) => (
            <Tooltip key={nc}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setFillColor(nc)}
                  className={cn(
                    'w-4 h-4 sm:w-5 sm:h-5 rounded-full border transition-all duration-150 hover:scale-110 shrink-0',
                    fillColor === nc ? 'ring-2 ring-primary scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: nc }}
                />
              </TooltipTrigger>
              <TooltipContent>Note Color</TooltipContent>
            </Tooltip>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {visibleColors.map((c) => (
            <Tooltip key={c}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setColor(c);
                    if (tool === 'eraser' || tool === 'select' || tool === 'hand') setTool('pen');
                  }}
                  className={cn(
                    'w-4 h-4 sm:w-5 sm:h-5 rounded-full border transition-all duration-150 hover:scale-110 shrink-0',
                    color === c && tool !== 'eraser' && tool !== 'select' && tool !== 'hand'
                      ? 'border-primary ring-2 ring-primary/30 scale-110'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              </TooltipTrigger>
              <TooltipContent>Color ({c})</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Selected Items Quick Actions Bar */}
      {selectedStrokeIds.length > 0 && (
        <>
          <div className="w-px h-4 bg-border/80 mx-0.5 shrink-0" />
          <div className="flex items-center gap-0.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={duplicateSelectedStrokes}
                  className="p-1.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all shrink-0"
                >
                  <Copy size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Duplicate Selected (Ctrl+D)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={deleteSelectedStrokes}
                  className="p-1.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete Selected (Del)</TooltipContent>
            </Tooltip>
          </div>
        </>
      )}

      <div className="w-px h-4 bg-border/80 mx-0.5 shrink-0" />

      {/* History & Canvas Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all disabled:opacity-30 shrink-0"
            >
              <Undo2 size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all disabled:opacity-30 shrink-0"
            >
              <Redo2 size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={clearCanvas}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Clear Canvas</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
