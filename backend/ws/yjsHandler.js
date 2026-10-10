const WebSocket = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const Room = require('../models/Room');

// Install these:
// npm install yjs y-protocols lib0

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

// In-memory store: roomId → { ydoc, awareness, clients: Set }
const rooms = new Map();

async function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    const ydoc = new Y.Doc();
    
    // Load from DB
    try {
      const roomDoc = await Room.findOne({ roomId });
      if (roomDoc && roomDoc.documentState) {
        Y.applyUpdate(ydoc, roomDoc.documentState);
      }
    } catch (err) {
      console.error('Error loading room state from DB:', err);
    }
    
    // Persist to DB on update (debounced)
    let saveTimeout = null;
    ydoc.on('update', (update) => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        try {
          const state = Y.encodeStateAsUpdate(ydoc);
          await Room.updateOne({ roomId }, { documentState: Buffer.from(state) });
        } catch (err) {
          console.error('Error saving room state to DB:', err);
        }
      }, 2000);
    });

    const awareness = new awarenessProtocol.Awareness(ydoc);
    rooms.set(roomId, { ydoc, awareness, clients: new Set() });
  }
  return rooms.get(roomId);
}

function send(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message, (err) => { if (err) console.error('Send error:', err); });
  }
}

function setupYjsWebSocket(wss) {
  wss.on('connection', async (ws, req) => {
    // Room ID is the last part of the URL path: /ws/ROOM_ID
    const url = new URL(req.url, 'http://localhost');
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const roomId = (pathSegments.length >= 2 ? pathSegments[1] : pathSegments[0] || 'DEFAULT').toUpperCase();
    console.log(`Client connected to room: ${roomId}`);


    const room = await getOrCreateRoom(roomId);
    const { ydoc, awareness, clients } = room;

    clients.add(ws);
    ws.binaryType = 'arraybuffer';

    // 1. Send full document state to the new client (catch-up)
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, ydoc);
    send(ws, encoding.toUint8Array(encoder));

    // 2. Send current awareness states (other users' cursors/presence)
    const awarenessStates = awareness.getStates();
    if (awarenessStates.size > 0) {
      const enc = encoding.createEncoder();
      encoding.writeVarUint(enc, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        enc,
        awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys()))
      );
      send(ws, encoding.toUint8Array(enc));
    }

    // Handle incoming messages
    ws.on('message', (rawMsg) => {
      const msg = new Uint8Array(rawMsg);
      const decoder = decoding.createDecoder(msg);
      const encoder = encoding.createEncoder();
      const messageType = decoding.readVarUint(decoder);

      if (messageType === MESSAGE_SYNC) {
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, ydoc, ws);

        // If there's a reply (sync step 2), send it back to this client only
        if (encoding.length(encoder) > 1) {
          send(ws, encoding.toUint8Array(encoder));
        }

        // Broadcast updates to all OTHER clients in this room
        if (syncMessageType === syncProtocol.messageYjsSyncStep2 || syncMessageType === syncProtocol.messageYjsUpdate) {
          clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(msg);
            }
          });
        }
      } else if (messageType === MESSAGE_AWARENESS) {
        // Broadcast awareness (cursors, presence) to everyone else
        const update = decoding.readVarUint8Array(decoder);
        awarenessProtocol.applyAwarenessUpdate(awareness, update, ws);
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            const enc = encoding.createEncoder();
            encoding.writeVarUint(enc, MESSAGE_AWARENESS);
            encoding.writeVarUint8Array(enc, update);
            client.send(encoding.toUint8Array(enc));
          }
        });
      }
    });

    // Cleanup on disconnect
    ws.on('close', () => {
      clients.delete(ws);
      awarenessProtocol.removeAwarenessStates(awareness, [ydoc.clientID], null);

      // Optional: clean up empty rooms to free memory
      if (clients.size === 0) {
        rooms.delete(roomId);
      }
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error in room ${roomId}:`, err);
      clients.delete(ws);
    });
  });
}

module.exports = setupYjsWebSocket;