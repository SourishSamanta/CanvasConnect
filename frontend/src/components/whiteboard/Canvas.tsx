import React, { useRef, useEffect, useCallback } from 'react';
import { useWhiteboardStore, Stroke, Point } from '@/stores/whiteboardStore';
import { yjsUpdateCursor, yjsClearCursor } from '@/hooks/useWhiteboard'; // ← ADD
import RemoteCursors from './RemoteCursors';  // ← ADD

// drawStroke — completely unchanged
function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  const pts = stroke.points;
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
  ctx.globalCompositeOperation = 'source-over';
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing  = useRef(false);
  const isPanning  = useRef(false);
  const lastPan    = useRef({ x: 0, y: 0 });
  const spaceDown  = useRef(false);

  const { strokes, currentStroke, startStroke, addPoint, endStroke,
          zoom, panX, panY, setZoom, setPan, theme } = useWhiteboardStore();

  // render — completely unchanged
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
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
      ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
    }
    for (const stroke of strokes) drawStroke(ctx, stroke);
    if (currentStroke) drawStroke(ctx, currentStroke);
    ctx.restore();
  }, [strokes, currentStroke, zoom, panX, panY, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      render();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [render]);

  useEffect(() => { render(); }, [render]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); spaceDown.current = true; } };
    const up   = (e: KeyboardEvent) => { if (e.code === 'Space') spaceDown.current = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom, panX, panY, setZoom, setPan } = useWhiteboardStore.getState();
      const rect  = canvas.getBoundingClientRect();
      const mx    = e.clientX - rect.left;
      const my    = e.clientY - rect.top;
      const delta = -e.deltaY * 0.001;
      const newZoom = Math.min(5, Math.max(0.1, zoom * (1 + delta)));
      const scale   = newZoom / zoom;
      setPan(mx - (mx - panX) * scale, my - (my - panY) * scale);
      setZoom(newZoom);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const screenToCanvas = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left - panX) / zoom, y: (e.clientY - rect.top - panY) / zoom };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && spaceDown.current)) {
      isPanning.current = true;
      lastPan.current = { x: e.clientX, y: e.clientY };
      canvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }
    isDrawing.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    startStroke(screenToCanvas(e));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // ← ADDED: broadcast cursor to other users
    yjsUpdateCursor(e.clientX, e.clientY);

    if (isPanning.current) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      lastPan.current = { x: e.clientX, y: e.clientY };
      const { panX, panY } = useWhiteboardStore.getState();
      setPan(panX + dx, panY + dy);
      return;
    }
    if (!isDrawing.current) return;
    addPoint(screenToCanvas(e));
  };

  const handlePointerUp = () => {
    if (isPanning.current) { isPanning.current = false; return; }
    isDrawing.current = false;
    endStroke();
  };

  return (
    // ← ADDED: wrapper div so RemoteCursors can overlay the canvas
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none', cursor: spaceDown.current ? 'grab' : 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { yjsClearCursor(); handlePointerUp(); }} // ← CHANGED
      />
      <RemoteCursors /> {/* ← ADDED */}
    </div>
  );
}