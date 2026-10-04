import { create } from 'zustand';
import { apiCreateRoom, apiGetRoom, apiUpdateRoom, apiDeleteRoom } from '@/lib/api';
import {
  yjsConnect, yjsDisconnect, yjsAddStroke, yjsUpdateStroke, yjsUpdateStrokes, yjsSetStrokes,
  yjsUndo, yjsRedo, yjsClearCanvas,
} from '@/hooks/useWhiteboard';

export type Tool = 'select' | 'hand' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'note' | 'laser';
export type Theme = 'light' | 'dark';
export type CanvasTemplate = 'grid' | 'dots' | 'blank' | 'dark';

export interface Point { x: number; y: number }

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  tool: Tool;
  text?: string;
  fillColor?: string;
  fontSize?: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  cursorColor: string;
  cursor?: Point;
  isActive: boolean;
}

export interface BoardItem {
  id: string;
  roomId: string;
  name: string;
  description?: string;
  template: CanvasTemplate;
  createdAt: string;
  updatedAt: string;
  strokeCount: number;
  isFavorite?: boolean;
  strokes?: Stroke[];
}

const COLORS = ['#1e1e1e', '#ffffff', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#f5c211', '#7048e8'];
const NOTE_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff', '#fed7aa'];
const CURSOR_COLORS = [
  'hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)',
  'hsl(25, 95%, 53%)',  'hsl(280, 67%, 55%)', 'hsl(340, 82%, 52%)',
  'hsl(262, 83%, 58%)', 'hsl(330, 81%, 60%)'
];
const AVATARS = [
  '🎨','🚀','🐱','🦊','🐼','🦁','🦄','🤖','⚡','🔮','🧠','💡',
  '🐶','🐸','🐨','🐯','🐰','🐻','🐵','👾','🔥','🌈','💎','✨'
];

export const AVAILABLE_COLORS = COLORS;
export const AVAILABLE_NOTE_COLORS = NOTE_COLORS;
export const AVAILABLE_CURSOR_COLORS = CURSOR_COLORS;
export const AVAILABLE_AVATARS = AVATARS;

function generateId() { return Math.random().toString(36).substring(2, 9); }

function pickColor(userId: string) {
  const i = userId.charCodeAt(0) % CURSOR_COLORS.length;
  return CURSOR_COLORS[i];
}

const STORAGE_PROFILE_KEY = 'canvasconnect_user_profile';
const STORAGE_BOARDS_KEY  = 'canvasconnect_user_boards';

const defaultProfile = {
  userName: 'Creative Explorer',
  userAvatar: '🎨',
  userTagline: 'Visual Collaboration Enthusiast',
  cursorColor: 'hsl(199, 89%, 48%)',
  preferredTheme: 'light' as Theme,
  preferredTemplate: 'grid' as CanvasTemplate,
};

function getInitialProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Failed to parse user profile:', err);
  }
  return defaultProfile;
}

function getInitialBoards(): BoardItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_BOARDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse boards history:', err);
  }
  return [];
}

interface WhiteboardState {
  // User Profile
  userId: string;
  userName: string;
  userAvatar: string;
  userTagline: string;
  cursorColor: string;
  preferredTheme: Theme;
  preferredTemplate: CanvasTemplate;

  // Saved Board History
  boardHistory: BoardItem[];

  // Room State
  roomCode: string | null;
  roomName: string;
  roomTemplate: CanvasTemplate;
  participants: Participant[];
  isInRoom: boolean;
  showRoomCode: boolean;
  isConnecting: boolean;

  // Drawing State
  tool: Tool;
  color: string;
  fillColor: string;
  fontSize: number;
  brushSize: number;
  strokes: Stroke[];
  currentStroke: Stroke | null;
  selectedStrokeIds: string[];
  canUndo: boolean;
  canRedo: boolean;

  // Viewport
  zoom: number;
  panX: number;
  panY: number;
  theme: Theme;
  isPanelOpen: boolean;

  // User Profile Actions
  updateUserProfile: (profile: Partial<typeof defaultProfile>) => void;

  // Board Actions
  saveBoardToHistory: (board: Partial<BoardItem> & { roomId: string; name: string }) => void;
  removeBoardFromHistory: (roomId: string) => Promise<void>;
  toggleBoardFavorite: (roomId: string) => void;
  updateBoardTitle: (roomId: string, newTitle: string) => Promise<void>;

  // Room & Drawing Actions
  setTool: (t: Tool) => void;
  setColor: (c: string) => void;
  setFillColor: (c: string) => void;
  setFontSize: (s: number) => void;
  setBrushSize: (s: number) => void;
  setSelectedStrokeIds: (ids: string[]) => void;
  deleteSelectedStrokes: () => void;
  duplicateSelectedStrokes: () => void;
  changeSelectedStrokesColor: (color: string) => void;
  updateStrokeText: (id: string, text: string) => void;
  updateStroke: (stroke: Stroke) => void;
  updateStrokes: (strokes: Stroke[]) => void;
  setStrokes: (strokes: Stroke[]) => void;
  eraseAtPoint: (center: Point, radius: number) => boolean;
  startStroke: (p: Point) => void;
  addPoint: (p: Point) => void;
  endStroke: () => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  createRoom: (name?: string, template?: CanvasTemplate) => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => void;
  togglePanel: () => void;
  toggleShowRoomCode: () => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  toggleTheme: () => void;

  // Internal Callbacks
  _setStrokes: (s: Stroke[]) => void;
  _setParticipants: (p: Participant[]) => void;
  _setUndoRedoState: (canUndo: boolean, canRedo: boolean) => void;
}

const initialProfile = getInitialProfile();

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  // Profile
  userId: generateId(),
  userName: initialProfile.userName,
  userAvatar: initialProfile.userAvatar,
  userTagline: initialProfile.userTagline,
  cursorColor: initialProfile.cursorColor,
  preferredTheme: initialProfile.preferredTheme,
  preferredTemplate: initialProfile.preferredTemplate,

  // Boards
  boardHistory: getInitialBoards(),

  // Room
  roomCode: null,
  roomName: 'Untitled Session',
  roomTemplate: 'grid',
  participants: [],
  isInRoom: false,
  showRoomCode: true,
  isConnecting: false,

  // Drawing
  tool: 'pen',
  color: COLORS[0],
  fillColor: NOTE_COLORS[0],
  fontSize: 18,
  brushSize: 3,
  strokes: [],
  currentStroke: null,
  selectedStrokeIds: [],
  canUndo: false,
  canRedo: false,

  // Viewport
  zoom: 1,
  panX: 0,
  panY: 0,
  theme: initialProfile.preferredTheme || 'light',
  isPanelOpen: false,

  // ─── Profile Management ───────────────────────────────────────────────────

  updateUserProfile: (profileUpdates) => {
    set((state) => {
      const updated = {
        userName: profileUpdates.userName ?? state.userName,
        userAvatar: profileUpdates.userAvatar ?? state.userAvatar,
        userTagline: profileUpdates.userTagline ?? state.userTagline,
        cursorColor: profileUpdates.cursorColor ?? state.cursorColor,
        preferredTheme: profileUpdates.preferredTheme ?? state.preferredTheme,
        preferredTemplate: profileUpdates.preferredTemplate ?? state.preferredTemplate,
      };
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save profile updates:', err);
      }
      return updated;
    });
  },

  // ─── Board Management ─────────────────────────────────────────────────────

  saveBoardToHistory: (boardData) => {
    set((state) => {
      const existingIndex = state.boardHistory.findIndex(b => b.roomId === boardData.roomId);
      const now = new Date().toISOString();
      const currentStrokes = boardData.strokes || state.strokes;

      let updatedList: BoardItem[];
      if (existingIndex >= 0) {
        updatedList = [...state.boardHistory];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          name: boardData.name || updatedList[existingIndex].name,
          template: boardData.template || updatedList[existingIndex].template,
          strokeCount: boardData.strokeCount ?? currentStrokes.length,
          updatedAt: now,
          strokes: currentStrokes.length > 0 ? currentStrokes : updatedList[existingIndex].strokes || [],
        };
      } else {
        const newBoard: BoardItem = {
          id: generateId(),
          roomId: boardData.roomId,
          name: boardData.name || 'Untitled Board',
          description: boardData.description || '',
          template: boardData.template || state.preferredTemplate || 'grid',
          createdAt: boardData.createdAt || now,
          updatedAt: now,
          strokeCount: currentStrokes.length,
          isFavorite: false,
          strokes: currentStrokes,
        };
        updatedList = [newBoard, ...state.boardHistory];
      }

      try {
        localStorage.setItem(STORAGE_BOARDS_KEY, JSON.stringify(updatedList));
      } catch (err) {
        console.warn('Failed to save boards to storage:', err);
      }

      return { boardHistory: updatedList };
    });
  },

  removeBoardFromHistory: async (roomId) => {
    try {
      await apiDeleteRoom(roomId);
    } catch (err) {
      console.warn('Failed to delete room on backend:', err);
    }
    set((state) => {
      const filtered = state.boardHistory.filter(b => b.roomId !== roomId);
      try {
        localStorage.setItem(STORAGE_BOARDS_KEY, JSON.stringify(filtered));
      } catch (err) {
        console.warn('Failed to save updated boards list:', err);
      }
      return { boardHistory: filtered };
    });
  },

  toggleBoardFavorite: (roomId) => {
    set((state) => {
      const updated = state.boardHistory.map(b => b.roomId === roomId ? { ...b, isFavorite: !b.isFavorite } : b);
      try {
        localStorage.setItem(STORAGE_BOARDS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save favorite toggle:', err);
      }
      return { boardHistory: updated };
    });
  },

  updateBoardTitle: async (roomId, newTitle) => {
    try {
      await apiUpdateRoom(roomId, { name: newTitle });
    } catch (err) {
      console.warn('Failed to update room title on backend:', err);
    }
    set((state) => {
      const updated = state.boardHistory.map(b => b.roomId === roomId ? { ...b, name: newTitle, updatedAt: new Date().toISOString() } : b);
      try {
        localStorage.setItem(STORAGE_BOARDS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save updated board title:', err);
      }
      return { boardHistory: updated };
    });
  },

  // ─── Drawing Controls ─────────────────────────────────────────────────────

  setTool: (tool) => {
    set({ tool });
    if (tool !== 'select') {
      set({ selectedStrokeIds: [] });
    }
  },
  setColor: (color) => set({ color }),
  setFillColor: (fillColor) => set({ fillColor }),
  setFontSize: (fontSize) => set({ fontSize }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setSelectedStrokeIds: (selectedStrokeIds) => set({ selectedStrokeIds }),

  deleteSelectedStrokes: () => {
    const { strokes, selectedStrokeIds } = get();
    if (selectedStrokeIds.length === 0) return;
    const remaining = strokes.filter((s) => !selectedStrokeIds.includes(s.id));
    set({ strokes: remaining, selectedStrokeIds: [] });
    yjsSetStrokes(remaining);
  },

  duplicateSelectedStrokes: () => {
    const { strokes, selectedStrokeIds } = get();
    if (selectedStrokeIds.length === 0) return;
    const newStrokes: Stroke[] = [];
    const newIds: string[] = [];
    for (const s of strokes) {
      if (selectedStrokeIds.includes(s.id)) {
        const dupId = generateId();
        newIds.push(dupId);
        newStrokes.push({
          ...s,
          id: dupId,
          points: s.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
        });
      }
    }
    const combined = [...strokes, ...newStrokes];
    set({ strokes: combined, selectedStrokeIds: newIds });
    yjsSetStrokes(combined);
  },

  changeSelectedStrokesColor: (color: string) => {
    const { strokes, selectedStrokeIds } = get();
    if (selectedStrokeIds.length === 0) return;
    const updated = strokes.map((s) =>
      selectedStrokeIds.includes(s.id) ? { ...s, color } : s
    );
    set({ strokes: updated });
    yjsSetStrokes(updated);
  },

  updateStrokeText: (id: string, text: string) => {
    const { strokes } = get();
    const updated = strokes.map((s) => (s.id === id ? { ...s, text } : s));
    set({ strokes: updated });
    const target = updated.find((s) => s.id === id);
    if (target) yjsUpdateStroke(target);
  },

  updateStroke: (updatedStroke) => {
    set((state) => ({
      strokes: state.strokes.map((s) => (s.id === updatedStroke.id ? updatedStroke : s)),
    }));
    yjsUpdateStroke(updatedStroke);
  },
  setStrokes: (strokes) => {
    set({ strokes });
    yjsSetStrokes(strokes);
  },

  eraseAtPoint: (center, radius) => {
    const { strokes } = get();
    let modified = false;
    const newStrokes: Stroke[] = [];

    function distToSegment(p: Point, v: Point, w: Point) {
      const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
      if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }

    for (const stroke of strokes) {
      if (stroke.tool === 'eraser') continue;

      const isShapeOrText =
        stroke.tool === 'rectangle' ||
        stroke.tool === 'circle' ||
        stroke.tool === 'line' ||
        stroke.tool === 'arrow' ||
        stroke.tool === 'text' ||
        stroke.tool === 'note';

      if (isShapeOrText) {
        const pts = stroke.points;
        let touched = false;
        if (pts.length >= 1 && Math.hypot(pts[0].x - center.x, pts[0].y - center.y) <= radius) {
          touched = true;
        } else if (pts.length >= 2) {
          if (stroke.tool === 'circle') {
            const r = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            const dist = Math.hypot(center.x - pts[0].x, center.y - pts[0].y);
            if (Math.abs(dist - r) <= radius || dist <= radius) touched = true;
          } else {
            if (distToSegment(center, pts[0], pts[1]) <= radius) touched = true;
          }
        }

        if (touched) {
          modified = true;
        } else {
          newStrokes.push(stroke);
        }
      } else {
        // Freehand pen stroke trimming
        const segments: Point[][] = [];
        let currentSeg: Point[] = [];

        for (const pt of stroke.points) {
          const dist = Math.hypot(pt.x - center.x, pt.y - center.y);
          if (dist > radius) {
            currentSeg.push(pt);
          } else {
            if (currentSeg.length >= 2) {
              segments.push(currentSeg);
            }
            currentSeg = [];
          }
        }
        if (currentSeg.length >= 2) {
          segments.push(currentSeg);
        }

        if (segments.length === 1 && segments[0].length === stroke.points.length) {
          newStrokes.push(stroke);
        } else {
          modified = true;
          for (let i = 0; i < segments.length; i++) {
            newStrokes.push({
              ...stroke,
              id: i === 0 ? stroke.id : generateId(),
              points: segments[i],
            });
          }
        }
      }
    }

    if (modified) {
      set({ strokes: newStrokes });
      yjsSetStrokes(newStrokes);
    }
    return modified;
  },

  startStroke: (point) => {
    const { tool, color, fillColor, fontSize, brushSize } = get();
    if (tool === 'select' || tool === 'eraser' || tool === 'hand') return;

    const isShape = tool === 'rectangle' || tool === 'circle' || tool === 'line' || tool === 'arrow';
    const isTextOrNote = tool === 'text' || tool === 'note';
    const points = (isShape || isTextOrNote) ? [point, point] : [point];

    set({
      currentStroke: {
        id: generateId(),
        points,
        color: color,
        fillColor: tool === 'note' ? fillColor || '#fef08a' : undefined,
        fontSize: tool === 'text' || tool === 'note' ? fontSize || 18 : undefined,
        text: tool === 'text' ? 'Type text...' : tool === 'note' ? 'Sticky note...' : undefined,
        size: brushSize,
        tool,
      },
    });
  },

  addPoint: (point) => {
    const { currentStroke } = get();
    if (!currentStroke) return;
    const isShape =
      currentStroke.tool === 'rectangle' ||
      currentStroke.tool === 'circle' ||
      currentStroke.tool === 'line' ||
      currentStroke.tool === 'arrow' ||
      currentStroke.tool === 'text' ||
      currentStroke.tool === 'note';
    if (isShape) {
      set({ currentStroke: { ...currentStroke, points: [currentStroke.points[0], point] } });
    } else {
      set({ currentStroke: { ...currentStroke, points: [...currentStroke.points, point] } });
    }
  },

  endStroke: () => {
    const { currentStroke, roomCode, roomName } = get();
    if (!currentStroke) return;
    if (currentStroke.tool !== 'text' && currentStroke.tool !== 'note' && currentStroke.points.length < 2) {
      set({ currentStroke: null });
      return;
    }
    yjsAddStroke(currentStroke);
    set({ currentStroke: null });

    if (roomCode) {
      get().saveBoardToHistory({ roomId: roomCode, name: roomName, strokes: get().strokes });
    }
  },

  undo: () => yjsUndo(),
  redo: () => yjsRedo(),
  clearCanvas: () => yjsClearCanvas(),

  // ─── Room Connection ──────────────────────────────────────────────────────

  createRoom: async (name?: string, template?: CanvasTemplate) => {
    set({ isConnecting: true });
    try {
      const { userName, userAvatar, cursorColor, userId } = get();
      const finalName = name?.trim() || 'Interactive Canvas Session';
      const finalTemplate = template || get().preferredTemplate || 'grid';

      const roomMeta = await apiCreateRoom({
        name: finalName,
        template: finalTemplate,
        username: userName,
        avatar: userAvatar,
        color: cursorColor || pickColor(userId),
      });

      const roomId = roomMeta.roomId.toUpperCase();

      // 1. Set room state & clear canvas for new session BEFORE connecting Yjs
      set({
        roomCode: roomId,
        roomName: finalName,
        roomTemplate: finalTemplate,
        isInRoom: true,
        isConnecting: false,
        strokes: [],
        selectedStrokeIds: [],
        currentStroke: null,
      });

      // 2. Connect Yjs for this room
      yjsConnect(
        roomId,
        { id: userId, name: userName, avatar: userAvatar, color: cursorColor || pickColor(userId) },
        (strokes) => get()._setStrokes(strokes),
        (participants) => get()._setParticipants(participants),
        (canUndo, canRedo) => get()._setUndoRedoState(canUndo, canRedo)
      );

      get().saveBoardToHistory({
        roomId,
        name: finalName,
        template: finalTemplate,
        strokeCount: 0,
      });

      return roomId;
    } catch (err) {
      set({ isConnecting: false });
      throw err;
    }
  },

  joinRoom: async (code: string) => {
    set({ isConnecting: true });
    try {
      const { userName, userAvatar, cursorColor, userId } = get();
      const cleanCode = code.trim().toUpperCase();

      const roomMeta = await apiGetRoom(cleanCode);

      // 1. Set room state & reset stroke state BEFORE connecting Yjs
      set({
        roomCode: roomMeta.roomId,
        roomName: roomMeta.name || 'Joined Canvas',
        roomTemplate: (roomMeta.template as CanvasTemplate) || 'grid',
        isInRoom: true,
        isConnecting: false,
        strokes: [],
        selectedStrokeIds: [],
        currentStroke: null,
      });

      // 2. Connect Yjs for this room
      yjsConnect(
        roomMeta.roomId,
        { id: userId, name: userName, avatar: userAvatar, color: cursorColor || pickColor(userId) },
        (strokes) => get()._setStrokes(strokes),
        (participants) => get()._setParticipants(participants),
        (canUndo, canRedo) => get()._setUndoRedoState(canUndo, canRedo)
      );

      get().saveBoardToHistory({
        roomId: roomMeta.roomId,
        name: roomMeta.name || 'Joined Canvas',
        template: (roomMeta.template as CanvasTemplate) || 'grid',
      });
    } catch (err) {
      set({ isConnecting: false });
      throw err;
    }
  },

  leaveRoom: () => {
    const { roomCode, roomName, roomTemplate, strokes } = get();
    if (roomCode) {
      get().saveBoardToHistory({
        roomId: roomCode,
        name: roomName,
        template: roomTemplate,
        strokeCount: strokes.length,
        strokes,
      });
    }

    yjsDisconnect();

    set({
      roomCode: null,
      roomName: 'Untitled Session',
      isInRoom: false,
      participants: [],
      strokes: [],
      currentStroke: null,
      selectedStrokeIds: [],
      canUndo: false,
      canRedo: false,
    });
  },

  // ─── Internal Callbacks ───────────────────────────────────────────────────

  _setStrokes: (strokes) => set({ strokes }),

  _setParticipants: (participants) => set({ participants }),
  _setUndoRedoState: (canUndo, canRedo) => set({ canUndo, canRedo }),

  // ─── Viewport & Theme ─────────────────────────────────────────────────────

  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
  toggleShowRoomCode: () => set((s) => ({ showRoomCode: !s.showRoomCode })),
  setZoom: (zoom) => set({ zoom: Math.min(5, Math.max(0.1, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    const defaultThemeColor = newTheme === 'light' ? '#1e1e1e' : '#ffffff';
    set({ theme: newTheme, color: defaultThemeColor });
  },
}));