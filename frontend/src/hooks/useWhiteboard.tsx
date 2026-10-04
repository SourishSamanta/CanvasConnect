import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Stroke, Participant } from '@/stores/whiteboardStore';

// One shared instance per session — created when joining, destroyed on leave
let doc: Y.Doc | null = null;
let provider: WebsocketProvider | null = null;
let yStrokes: Y.Array<Stroke> | null = null;
let undoManager: Y.UndoManager | null = null;

const WS_URL = import.meta.env.VITE_SERVER_URL.replace(/^http/, 'ws');
//  http://localhost:3001  →  ws://localhost:3001
// https://xxx.railway.app → wss://xxx.railway.app

export function yjsConnect(
  roomId: string,
  user: { id: string; name: string; avatar: string; color: string },
  onStrokesChange: (strokes: Stroke[]) => void,
  onParticipantsChange: (participants: Participant[]) => void
) {
  // Clean up any previous session
  yjsDisconnect();

  doc = new Y.Doc();

  // Connect to your Express server's /ws path
  provider = new WebsocketProvider(`${WS_URL}/ws`, roomId, doc);

  // The shared strokes array — this is the source of truth for the canvas
  yStrokes = doc.getArray<Stroke>('strokes');

  // UndoManager tracks only our own changes
  undoManager = new Y.UndoManager(yStrokes);

  // Set this user's presence — visible to everyone in the room
  provider.awareness.setLocalState({
    user: { id: user.id, name: user.name, avatar: user.avatar, color: user.color },
    cursor: null,
  });

  // Fire onStrokesChange whenever anyone (including us) adds/removes strokes
  yStrokes.observe(() => {
    onStrokesChange(yStrokes!.toArray());
  });

  // Fire onParticipantsChange whenever anyone joins, leaves, or moves cursor
  provider.awareness.on('change', () => {
    const states = Array.from(provider!.awareness.getStates().entries());
    const participants: Participant[] = states
      .filter(([, state]) => state?.user) // skip empty states
      .map(([clientId, state]) => ({
        id: state.user.id,
        name: state.user.name,
        avatar: state.user.avatar,
        cursorColor: state.user.color,
        cursor: state.cursor ?? undefined,
        isActive: true,
        // tag our own entry so ParticipantsPanel can show "(you)"
        _clientId: clientId,
      }));
    onParticipantsChange(participants);
  });

  // Trigger initial stroke load (catch-up for late joiners)
  onStrokesChange(yStrokes.toArray());
}

export function yjsDisconnect() {
  undoManager?.destroy();
  provider?.destroy();
  doc?.destroy();
  doc = null;
  provider = null;
  yStrokes = null;
  undoManager = null;
}

// Called by Canvas when a stroke is finished
export function yjsAddStroke(stroke: Stroke) {
  yStrokes?.push([stroke]);
}

// Called when a stroke/element is moved or modified
export function yjsUpdateStroke(stroke: Stroke) {
  if (!yStrokes || !doc) return;
  const arr = yStrokes.toArray();
  const index = arr.findIndex((s) => s.id === stroke.id);
  if (index !== -1) {
    doc.transact(() => {
      yStrokes!.delete(index, 1);
      yStrokes!.insert(index, [stroke]);
    });
  }
}

// Called when multiple strokes are moved/modified simultaneously
export function yjsUpdateStrokes(strokesToUpdate: Stroke[]) {
  if (!yStrokes || !doc || strokesToUpdate.length === 0) return;
  const updateMap = new Map(strokesToUpdate.map((s) => [s.id, s]));
  const arr = yStrokes.toArray();
  doc.transact(() => {
    for (let i = 0; i < arr.length; i++) {
      const s = arr[i];
      if (updateMap.has(s.id)) {
        yStrokes!.delete(i, 1);
        yStrokes!.insert(i, [updateMap.get(s.id)!]);
      }
    }
  });
}

// Called when strokes array is replaced (e.g. real eraser trimming/deletion)
export function yjsSetStrokes(newStrokes: Stroke[]) {
  if (!yStrokes || !doc) return;
  doc.transact(() => {
    yStrokes!.delete(0, yStrokes!.length);
    yStrokes!.insert(0, newStrokes);
  });
}

// Called by Toolbar undo button
export function yjsUndo() {
  undoManager?.undo();
}

// Called by Toolbar redo button
export function yjsRedo() {
  undoManager?.redo();
}

// Called by Toolbar clear button — deletes all strokes for everyone
export function yjsClearCanvas() {
  if (!yStrokes) return;
  doc!.transact(() => {
    yStrokes!.delete(0, yStrokes!.length);
  });
}

// Called by Canvas on pointer move — broadcasts cursor to others
export function yjsUpdateCursor(x: number, y: number) {
  provider?.awareness.setLocalStateField('cursor', { x, y });
}

// Called by Canvas on pointer leave — hides cursor from others
export function yjsClearCursor() {
  provider?.awareness.setLocalStateField('cursor', null);
}

// Returns awareness client ID so we can identify "ourselves" in the participants list
export function yjsClientId(): number | null {
  return provider?.awareness.clientID ?? null;
}