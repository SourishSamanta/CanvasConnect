import { create } from 'zustand';
import { apiCreateRoom, apiGetRoom } from '@/lib/api';
import {
  yjsConnect, yjsDisconnect, yjsAddStroke,
  yjsUndo, yjsRedo, yjsClearCanvas,
} from '@/hooks/useWhiteboard';

export type Tool = 'pen' | 'eraser';
export type Theme = 'light' | 'dark';

export interface Point { x: number; y: number }

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  tool: Tool;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  cursorColor: string;
  cursor?: Point;
  isActive: boolean;
}

const COLORS = ['#1e1e1e', '#ffffff', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#f5c211', '#7048e8'];
const CURSOR_COLORS = [
  'hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)',
  'hsl(25, 95%, 53%)',  'hsl(280, 67%, 55%)', 'hsl(340, 82%, 52%)',
];
const AVATARS = ['🐱','🐶','🦊','🐸','🐼','🐨','🦁','🐯','🐰','🐻','🐵','🦄'];

export const AVAILABLE_COLORS = COLORS;
export const AVAILABLE_AVATARS = AVATARS;

function generateId() { return Math.random().toString(36).substring(2, 9); }

// Pick a deterministic cursor color from userId
function pickColor(userId: string) {
  const i = userId.charCodeAt(0) % CURSOR_COLORS.length;
  return CURSOR_COLORS[i];
}

interface WhiteboardState {
  // Room
  roomCode: string | null;
  userName: string;
  userAvatar: string;
  userId: string;
  participants: Participant[];
  isInRoom: boolean;
  showRoomCode: boolean;
  isConnecting: boolean; // NEW — show a spinner in the lobby while API + WS connect

  // Drawing — strokes now come from Yjs, not local state
  tool: Tool;
  color: string;
  brushSize: number;
  strokes: Stroke[];         // written by yjsConnect's onStrokesChange callback
  currentStroke: Stroke | null;
  undoStack: Stroke[][];     // kept for Toolbar disabled-state check only
  redoStack: Stroke[][];     // kept for Toolbar disabled-state check only

  // Viewport
  zoom: number;
  panX: number;
  panY: number;

  // Theme
  theme: Theme;

  // UI
  isPanelOpen: boolean;

  // Actions
  setTool: (t: Tool) => void;
  setColor: (c: string) => void;
  setBrushSize: (s: number) => void;
  startStroke: (p: Point) => void;
  addPoint: (p: Point) => void;
  endStroke: () => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  createRoom: (name: string, avatar: string) => Promise<void>;
  joinRoom: (code: string, name: string, avatar: string) => Promise<void>;
  leaveRoom: () => void;
  togglePanel: () => void;
  toggleShowRoomCode: () => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  toggleTheme: () => void;

  // Internal — called by yjsConnect callbacks, not by UI
  _setStrokes: (s: Stroke[]) => void;
  _setParticipants: (p: Participant[]) => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  roomCode: null,
  userName: '',
  userAvatar: '',
  userId: generateId(),
  participants: [],
  isInRoom: false,
  showRoomCode: true,
  isConnecting: false,

  tool: 'pen',
  color: COLORS[0],
  brushSize: 3,
  strokes: [],
  currentStroke: null,
  undoStack: [[]],   // non-empty so Toolbar's undoStack.length check works
  redoStack: [],

  zoom: 1,
  panX: 0,
  panY: 0,
  theme: 'light',
  isPanelOpen: false,

  // ─── Drawing ─────────────────────────────────────────────────────────────

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (brushSize) => set({ brushSize }),

  startStroke: (point) => {
    const { tool, color, brushSize } = get();
    set({
      currentStroke: {
        id: generateId(),
        points: [point],
        color: tool === 'eraser' ? 'eraser' : color,
        size: tool === 'eraser' ? brushSize * 4 : brushSize,
        tool,
      },
    });
  },

  addPoint: (point) => {
    const { currentStroke } = get();
    if (!currentStroke) return;
    set({ currentStroke: { ...currentStroke, points: [...currentStroke.points, point] } });
  },

  // endStroke pushes to Yjs — Yjs fires onStrokesChange → _setStrokes → re-renders
  endStroke: () => {
    const { currentStroke } = get();
    if (!currentStroke || currentStroke.points.length < 2) {
      set({ currentStroke: null });
      return;
    }
    yjsAddStroke(currentStroke);
    set({ currentStroke: null });
  },

  // undo/redo delegate entirely to Y.UndoManager
  undo: () => yjsUndo(),
  redo: () => yjsRedo(),
  clearCanvas: () => yjsClearCanvas(),

  // ─── Room ─────────────────────────────────────────────────────────────────

  createRoom: async (name, avatar) => {
    set({ isConnecting: true });
    try {
      const userId = get().userId;
      const color  = pickColor(userId);

      // 1. Create room in MongoDB via Express
      const { roomId } = await apiCreateRoom({ username: name, avatar, color });

      // 2. Connect Yjs WebSocket
      yjsConnect(
        roomId,
        { id: userId, name, avatar, color },
        (strokes) => get()._setStrokes(strokes),
        (participants) => get()._setParticipants(participants)
      );

      set({
        roomCode: roomId,
        userName: name,
        userAvatar: avatar,
        isInRoom: true,
        isConnecting: false,
      });
    } catch (err) {
      set({ isConnecting: false });
      throw err; // RoomLobby will catch and show a toast
    }
  },

  joinRoom: async (code, name, avatar) => {
    set({ isConnecting: true });
    try {
      const userId = get().userId;
      const color  = pickColor(userId);

      // 1. Validate room exists in MongoDB
      const { roomId } = await apiGetRoom(code.toUpperCase());

      // 2. Connect Yjs — existing strokes replay automatically via canvas-state
      yjsConnect(
        roomId,
        { id: userId, name, avatar, color },
        (strokes) => get()._setStrokes(strokes),
        (participants) => get()._setParticipants(participants)
      );

      set({
        roomCode: roomId,
        userName: name,
        userAvatar: avatar,
        isInRoom: true,
        isConnecting: false,
      });
    } catch (err) {
      set({ isConnecting: false });
      throw err;
    }
  },

  leaveRoom: () => {
    yjsDisconnect();
    set({
      roomCode: null,
      isInRoom: false,
      participants: [],
      strokes: [],
      currentStroke: null,
      undoStack: [],
      redoStack: [],
    });
  },

  // ─── Internal callbacks ───────────────────────────────────────────────────

  _setStrokes: (strokes) => set({ strokes }),
  _setParticipants: (participants) => set({ participants }),

  // ─── UI / Viewport ────────────────────────────────────────────────────────

  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
  toggleShowRoomCode: () => set((s) => ({ showRoomCode: !s.showRoomCode })),
  setZoom: (zoom) => set({ zoom: Math.min(5, Math.max(0.1, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    set({ theme: newTheme });
  },
}));