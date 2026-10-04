import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useWhiteboardStore, Stroke, Point } from '@/stores/whiteboardStore';
import { yjsUpdateCursor, yjsClearCursor } from '@/hooks/useWhiteboard';
import RemoteCursors from './RemoteCursors';

function getEffectiveColor(color: string, theme: string): string {
  if (color === 'eraser') return '#000000';
  if (theme === 'dark' && (color === '#1e1e1e' || color === '#000000')) {
    return '#ffffff';
  }
  if (theme === 'light' && color === '#ffffff') {
    return '#1e1e1e';
  }
  return color;
}

function drawArrowHead(ctx: CanvasRenderingContext2D, from: Point, to: Point, size: number) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const headLength = Math.max(12, size * 3.5);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLength * Math.cos(angle - Math.PI / 6),
    to.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    to.x - headLength * Math.cos(angle + Math.PI / 6),
    to.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, theme: string) {
  if (!stroke.points || stroke.points.length === 0) return;
  const pts = stroke.points;

  ctx.beginPath();
  ctx.strokeStyle = getEffectiveColor(stroke.color, theme);
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'source-over';

  if (stroke.tool === 'rectangle') {
    const p0 = pts[0];
    const p1 = pts.length > 1 ? pts[1] : pts[0];
    const minX = Math.min(p0.x, p1.x);
    const minY = Math.min(p0.y, p1.y);
    const w = Math.abs(p1.x - p0.x);
    const h = Math.abs(p1.y - p0.y);
    ctx.strokeRect(minX, minY, w, h);
  } else if (stroke.tool === 'circle') {
    const center = pts[0];
    const edge = pts.length > 1 ? pts[1] : pts[0];
    const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (stroke.tool === 'line') {
    const p0 = pts[0];
    const p1 = pts.length > 1 ? pts[1] : pts[0];
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  } else if (stroke.tool === 'arrow') {
    const p0 = pts[0];
    const p1 = pts.length > 1 ? pts[1] : pts[0];
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    drawArrowHead(ctx, p0, p1, stroke.size);
  } else if (stroke.tool === 'text') {
    const p0 = pts[0];
    const fontSize = stroke.fontSize || 18;
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = getEffectiveColor(stroke.color, theme);
    ctx.textBaseline = 'top';
    const lines = (stroke.text || 'Type text...').split('\n');
    lines.forEach((line, index) => {
      ctx.fillText(line, p0.x, p0.y + index * (fontSize * 1.25));
    });
  } else if (stroke.tool === 'note') {
    const p0 = pts[0];
    const w = 160;
    const h = 140;
    ctx.save();
    ctx.fillStyle = stroke.fillColor || '#fef08a';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(p0.x, p0.y, w, h, 12) : ctx.rect(p0.x, p0.y, w, h);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p0.x, p0.y, w, h);

    const fontSize = stroke.fontSize || 14;
    ctx.font = `500 ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = '#1e293b';
    ctx.textBaseline = 'top';
    const lines = (stroke.text || 'Sticky note...').split('\n');
    lines.forEach((line, index) => {
      if (index * (fontSize * 1.25) < h - 24) {
        ctx.fillText(line, p0.x + 12, p0.y + 12 + index * (fontSize * 1.25), w - 24);
      }
    });
  } else if (stroke.tool === 'laser') {
    if (pts.length < 1) return;
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.lineWidth = stroke.size * 2.5;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fca5a5';
    ctx.fill();
    ctx.restore();
  } else {
    // Freehand Pen
    if (pts.length < 2) {
      ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    } else {
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      }
      ctx.stroke();
    }
  }

  ctx.globalCompositeOperation = 'source-over';
}

function distToSegment(p: Point, v: Point, w: Point) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function isPointNearStroke(p: Point, stroke: Stroke, zoom: number): boolean {
  if (!stroke.points || stroke.points.length === 0) return false;
  const threshold = Math.max(12 / zoom, stroke.size / 2 + 6 / zoom);
  const pts = stroke.points;

  if (stroke.tool === 'rectangle') {
    const p0 = pts[0];
    const p1 = pts.length > 1 ? pts[1] : pts[0];
    const minX = Math.min(p0.x, p1.x) - threshold;
    const maxX = Math.max(p0.x, p1.x) + threshold;
    const minY = Math.min(p0.y, p1.y) - threshold;
    const maxY = Math.max(p0.y, p1.y) + threshold;
    return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
  }

  if (stroke.tool === 'text') {
    const p0 = pts[0];
    const fontSize = stroke.fontSize || 18;
    const minX = p0.x - threshold;
    const maxX = p0.x + 180 + threshold;
    const minY = p0.y - threshold;
    const maxY = p0.y + fontSize * 2 + threshold;
    return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
  }

  if (stroke.tool === 'note') {
    const p0 = pts[0];
    const minX = p0.x - threshold;
    const maxX = p0.x + 160 + threshold;
    const minY = p0.y - threshold;
    const maxY = p0.y + 140 + threshold;
    return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
  }

  if (stroke.tool === 'circle') {
    const center = pts[0];
    const edge = pts.length > 1 ? pts[1] : pts[0];
    const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
    const dist = Math.hypot(p.x - center.x, p.y - center.y);
    return Math.abs(dist - radius) <= threshold || dist <= radius;
  }

  if (pts.length === 1) {
    return Math.hypot(p.x - pts[0].x, p.y - pts[0].y) <= threshold;
  }

  for (let i = 0; i < pts.length - 1; i++) {
    if (distToSegment(p, pts[i], pts[i + 1]) <= threshold) return true;
  }
  return false;
}

function getStrokeBounds(stroke: Stroke) {
  const pts = stroke.points;
  if (stroke.tool === 'circle' && pts.length >= 2) {
    const cx = pts[0].x;
    const cy = pts[0].y;
    const r = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    return { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r, width: r * 2, height: r * 2 };
  }
  if (stroke.tool === 'note' && pts.length >= 1) {
    return { minX: pts[0].x, minY: pts[0].y, maxX: pts[0].x + 160, maxY: pts[0].y + 140, width: 160, height: 140 };
  }
  if (stroke.tool === 'text' && pts.length >= 1) {
    return { minX: pts[0].x, minY: pts[0].y, maxX: pts[0].x + 180, maxY: pts[0].y + 40, width: 180, height: 40 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pt of pts) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function getGroupBounds(strokes: Stroke[], selectedIds: string[]) {
  const selected = strokes.filter((s) => selectedIds.includes(s.id));
  if (selected.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of selected) {
    const b = getStrokeBounds(s);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function isStrokeInBox(stroke: Stroke, box: { minX: number; minY: number; maxX: number; maxY: number }) {
  const b = getStrokeBounds(stroke);
  return !(b.maxX < box.minX || b.minX > box.maxX || b.maxY < box.minY || b.minY > box.maxY);
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const isErasing = useRef(false);
  const isDraggingGroup = useRef(false);
  const isMarqueeSelecting = useRef(false);

  const lastPan = useRef({ x: 0, y: 0 });
  const spaceDown = useRef(false);
  const dragStartPos = useRef<Point>({ x: 0, y: 0 });
  const initialGroupPoints = useRef<Map<string, Point[]>>(new Map());
  const mouseCanvasPos = useRef<Point | null>(null);

  const [marqueeBox, setMarqueeBox] = useState<{ start: Point; current: Point } | null>(null);

  // Inline Text Editing State
  const [editingState, setEditingState] = useState<{ id: string; text: string; x: number; y: number } | null>(null);

  // Mobile Touch Gestures
  const touchStartDist = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1);
  const touchStartMid = useRef<Point | null>(null);
  const touchStartPan = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const {
    strokes,
    currentStroke,
    selectedStrokeIds,
    startStroke,
    addPoint,
    endStroke,
    setSelectedStrokeIds,
    updateStrokes,
    updateStrokeText,
    eraseAtPoint,
    brushSize,
    tool,
    zoom,
    panX,
    panY,
    setZoom,
    setPan,
    theme,
  } = useWhiteboardStore();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenCanvasRef.current;
    const offscreenCtx = offscreen.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    if (offscreen.width !== canvas.width || offscreen.height !== canvas.height) {
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
    }

    // 1. Clear Main Canvas & Render Background Grid
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = theme === 'dark' ? 'hsl(220, 15%, 12%)' : 'hsl(220, 14%, 98%)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);
    ctx.strokeStyle = theme === 'dark' ? 'hsl(220, 14%, 20%)' : 'hsl(220, 14%, 92%)';
    ctx.lineWidth = 0.5 / zoom;

    const gridSize = 24;
    const startX = Math.floor(-panX / zoom / gridSize) * gridSize - gridSize;
    const startY = Math.floor(-panY / zoom / gridSize) * gridSize - gridSize;
    const endX = startX + w / zoom + gridSize * 2;
    const endY = startY + h / zoom + gridSize * 2;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Render Strokes onto Offscreen Canvas
    if (offscreenCtx) {
      offscreenCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      offscreenCtx.clearRect(0, 0, w, h);
      offscreenCtx.save();
      offscreenCtx.translate(panX, panY);
      offscreenCtx.scale(zoom, zoom);

      for (const stroke of strokes) {
        drawStroke(offscreenCtx, stroke, theme);
      }
      if (currentStroke) {
        drawStroke(offscreenCtx, currentStroke, theme);
      }
      offscreenCtx.restore();
    }

    // 3. Composite Offscreen Canvas onto Main Canvas
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(offscreen, 0, 0, w, h);

    // 4. Render Overlays in Canvas Coordinates
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Render Dragging Marquee Box
    if (marqueeBox) {
      const minX = Math.min(marqueeBox.start.x, marqueeBox.current.x);
      const minY = Math.min(marqueeBox.start.y, marqueeBox.current.y);
      const mw = Math.abs(marqueeBox.current.x - marqueeBox.start.x);
      const mh = Math.abs(marqueeBox.current.y - marqueeBox.start.y);

      ctx.fillStyle = theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(minX, minY, mw, mh);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.strokeRect(minX, minY, mw, mh);
    }

    // Render Group Selection Bounding Box
    if (selectedStrokeIds.length > 0) {
      const bounds = getGroupBounds(strokes, selectedStrokeIds);
      if (bounds) {
        const padding = 8 / zoom;
        const bx = bounds.minX - padding;
        const by = bounds.minY - padding;
        const bw = bounds.width + padding * 2;
        const bh = bounds.height + padding * 2;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([6 / zoom, 6 / zoom]);
        ctx.strokeRect(bx, by, bw, bh);

        // Handles
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        const hs = 6 / zoom;
        const corners = [
          { x: bx, y: by },
          { x: bx + bw, y: by },
          { x: bx, y: by + bh },
          { x: bx + bw, y: by + bh },
        ];
        for (const c of corners) {
          ctx.fillRect(c.x - hs / 2, c.y - hs / 2, hs, hs);
          ctx.strokeRect(c.x - hs / 2, c.y - hs / 2, hs, hs);
        }
      }
    }

    // Render Eraser Ring Overlay
    if (tool === 'eraser' && mouseCanvasPos.current) {
      const r = Math.max(12 / zoom, (brushSize * 3) / zoom);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(mouseCanvasPos.current.x, mouseCanvasPos.current.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
      ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1.5 / zoom;
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }, [strokes, currentStroke, selectedStrokeIds, marqueeBox, zoom, panX, panY, theme, tool, brushSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      render();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [render]);

  useEffect(() => {
    render();
  }, [render]);

  // Spacebar pan toggle & Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spaceDown.current = true;
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const { deleteSelectedStrokes, selectedStrokeIds } = useWhiteboardStore.getState();
        if (selectedStrokeIds.length > 0) {
          e.preventDefault();
          deleteSelectedStrokes();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        useWhiteboardStore.getState().duplicateSelectedStrokes();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useWhiteboardStore.getState().redo();
        } else {
          useWhiteboardStore.getState().undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useWhiteboardStore.getState().redo();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Wheel Pan & Pinch Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom, panX, panY, setZoom, setPan } = useWhiteboardStore.getState();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (e.ctrlKey) {
        const delta = -e.deltaY * 0.0015;
        const newZoom = Math.min(5, Math.max(0.1, zoom * (1 + delta)));
        const scale = newZoom / zoom;
        setPan(mx - (mx - panX) * scale, my - (my - panY) * scale);
        setZoom(newZoom);
      } else {
        setPan(panX - e.deltaX, panY - e.deltaY);
      }
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // Mobile Touch Gestures
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchStartDist.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const state = useWhiteboardStore.getState();
        touchStartZoom.current = state.zoom;
        touchStartMid.current = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        touchStartPan.current = { x: state.panX, y: state.panY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDist.current !== null && touchStartMid.current !== null) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const scale = currentDist / touchStartDist.current;
        const newZoom = Math.min(5, Math.max(0.1, touchStartZoom.current * scale));

        const currentMid = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        const dx = currentMid.x - touchStartMid.current.x;
        const dy = currentMid.y - touchStartMid.current.y;

        const { setZoom, setPan } = useWhiteboardStore.getState();
        setPan(touchStartPan.current.x + dx, touchStartPan.current.y + dy);
        setZoom(newZoom);
      }
    };

    const onTouchEnd = () => {
      touchStartDist.current = null;
      touchStartMid.current = null;
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const screenToCanvas = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left - panX) / zoom, y: (e.clientY - rect.top - panY) / zoom };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (editingState) setEditingState(null);

    if (e.button === 1 || (e.button === 0 && (spaceDown.current || tool === 'hand'))) {
      isPanning.current = true;
      lastPan.current = { x: e.clientX, y: e.clientY };
      canvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    const canvasPoint = screenToCanvas(e);

    if (tool === 'eraser') {
      isErasing.current = true;
      const { brushSize, zoom, eraseAtPoint } = useWhiteboardStore.getState();
      const radius = Math.max(12 / zoom, (brushSize * 3) / zoom);
      eraseAtPoint(canvasPoint, radius);
      canvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    if (tool === 'select') {
      const groupBounds = getGroupBounds(strokes, selectedStrokeIds);
      let clickedInsideGroup = false;
      if (groupBounds) {
        const padding = 12 / zoom;
        clickedInsideGroup =
          canvasPoint.x >= groupBounds.minX - padding &&
          canvasPoint.x <= groupBounds.maxX + padding &&
          canvasPoint.y >= groupBounds.minY - padding &&
          canvasPoint.y <= groupBounds.maxY + padding;
      }

      if (clickedInsideGroup) {
        isDraggingGroup.current = true;
        dragStartPos.current = canvasPoint;
        const map = new Map<string, Point[]>();
        for (const s of strokes) {
          if (selectedStrokeIds.includes(s.id)) {
            map.set(s.id, s.points.map((pt) => ({ ...pt })));
          }
        }
        initialGroupPoints.current = map;
        canvasRef.current?.setPointerCapture(e.pointerId);
        return;
      }

      let found: Stroke | null = null;
      for (let i = strokes.length - 1; i >= 0; i--) {
        if (isPointNearStroke(canvasPoint, strokes[i], zoom)) {
          found = strokes[i];
          break;
        }
      }

      if (found) {
        const newIds = e.shiftKey || e.ctrlKey
          ? selectedStrokeIds.includes(found.id)
            ? selectedStrokeIds.filter(id => id !== found.id)
            : [...selectedStrokeIds, found.id]
          : [found.id];

        setSelectedStrokeIds(newIds);
        isDraggingGroup.current = true;
        dragStartPos.current = canvasPoint;
        const map = new Map<string, Point[]>();
        for (const s of strokes) {
          if (newIds.includes(s.id)) {
            map.set(s.id, s.points.map((pt) => ({ ...pt })));
          }
        }
        initialGroupPoints.current = map;
      } else {
        setSelectedStrokeIds([]);
        isMarqueeSelecting.current = true;
        setMarqueeBox({ start: canvasPoint, current: canvasPoint });
      }

      canvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    isDrawing.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    startStroke(canvasPoint);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    yjsUpdateCursor(e.clientX, e.clientY);
    const canvasPoint = screenToCanvas(e);
    mouseCanvasPos.current = canvasPoint;

    if (isPanning.current) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      lastPan.current = { x: e.clientX, y: e.clientY };
      const { panX, panY } = useWhiteboardStore.getState();
      setPan(panX + dx, panY + dy);
      return;
    }

    if (isErasing.current && tool === 'eraser') {
      const { brushSize, zoom, eraseAtPoint } = useWhiteboardStore.getState();
      const radius = Math.max(12 / zoom, (brushSize * 3) / zoom);
      eraseAtPoint(canvasPoint, radius);
      render();
      return;
    }

    if (isMarqueeSelecting.current) {
      setMarqueeBox((prev) => (prev ? { ...prev, current: canvasPoint } : null));

      if (marqueeBox) {
        const minX = Math.min(marqueeBox.start.x, canvasPoint.x);
        const maxX = Math.max(marqueeBox.start.x, canvasPoint.x);
        const minY = Math.min(marqueeBox.start.y, canvasPoint.y);
        const maxY = Math.max(marqueeBox.start.y, canvasPoint.y);

        const box = { minX, minY, maxX, maxY };
        const matchingIds = strokes
          .filter((s) => isStrokeInBox(s, box))
          .map((s) => s.id);
        setSelectedStrokeIds(matchingIds);
      }
      return;
    }

    if (isDraggingGroup.current && selectedStrokeIds.length > 0) {
      const dx = canvasPoint.x - dragStartPos.current.x;
      const dy = canvasPoint.y - dragStartPos.current.y;

      const updatedStrokes: Stroke[] = [];
      for (const s of strokes) {
        if (selectedStrokeIds.includes(s.id)) {
          const initPts = initialGroupPoints.current.get(s.id);
          if (initPts) {
            const newPoints = initPts.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
            updatedStrokes.push({ ...s, points: newPoints });
          }
        }
      }
      if (updatedStrokes.length > 0) {
        updateStrokes(updatedStrokes);
      }
      return;
    }

    if (!isDrawing.current) {
      if (tool === 'eraser' || tool === 'laser') render();
      return;
    }
    addPoint(canvasPoint);
  };

  const handlePointerUp = () => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    if (isErasing.current) {
      isErasing.current = false;
      return;
    }
    if (isMarqueeSelecting.current) {
      isMarqueeSelecting.current = false;
      setMarqueeBox(null);
      return;
    }
    if (isDraggingGroup.current) {
      isDraggingGroup.current = false;
      return;
    }
    if (isDrawing.current) {
      isDrawing.current = false;
      const activeTool = tool;
      endStroke();

      // If text or note tool was used, trigger inline editing on the new stroke
      if (activeTool === 'text' || activeTool === 'note') {
        setTimeout(() => {
          const latestStrokes = useWhiteboardStore.getState().strokes;
          if (latestStrokes.length > 0) {
            const newStroke = latestStrokes[latestStrokes.length - 1];
            if (newStroke.points.length > 0) {
              const pt = newStroke.points[0];
              setEditingState({
                id: newStroke.id,
                text: newStroke.text || '',
                x: pt.x * zoom + panX,
                y: pt.y * zoom + panY,
              });
            }
          }
        }, 50);
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = screenToCanvas(e);
    for (let i = strokes.length - 1; i >= 0; i--) {
      const stroke = strokes[i];
      if ((stroke.tool === 'text' || stroke.tool === 'note') && isPointNearStroke(pt, stroke, zoom)) {
        const screenX = stroke.points[0].x * zoom + panX;
        const screenY = stroke.points[0].y * zoom + panY;
        setEditingState({
          id: stroke.id,
          text: stroke.text || '',
          x: screenX,
          y: screenY,
        });
        break;
      }
    }
  };

  const getCursorStyle = () => {
    if (spaceDown.current || tool === 'hand') return isPanning.current ? 'grabbing' : 'grab';
    if (tool === 'eraser') return 'none';
    if (tool === 'laser') return 'crosshair';
    if (tool === 'select') {
      if (isDraggingGroup.current) return 'grabbing';
      if (isMarqueeSelecting.current) return 'crosshair';
      return 'default';
    }
    return 'crosshair';
  };

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none', cursor: getCursorStyle() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onPointerLeave={() => {
          yjsClearCursor();
          mouseCanvasPos.current = null;
          handlePointerUp();
        }}
      />
      <RemoteCursors />

      {/* Floating Text/Note Input Overlay */}
      {editingState && (
        <textarea
          autoFocus
          value={editingState.text}
          onChange={(e) => {
            const val = e.target.value;
            setEditingState((prev) => (prev ? { ...prev, text: val } : null));
            updateStrokeText(editingState.id, val);
          }}
          onBlur={() => setEditingState(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditingState(null);
          }}
          className="fixed z-50 p-2 rounded-lg bg-background/95 text-foreground border-2 border-primary shadow-2xl focus:outline-none font-sans text-sm resize-both"
          style={{
            left: `${editingState.x}px`,
            top: `${editingState.y}px`,
            width: '180px',
            minHeight: '60px',
          }}
        />
      )}
    </div>
  );
}