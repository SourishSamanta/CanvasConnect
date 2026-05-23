const BASE = import.meta.env.VITE_SERVER_URL; // e.g. https://xxx.up.railway.app

export interface RoomMeta {
  roomId: string;
  name: string;
  userCount?: number;
}

// Called when user clicks "Create Room"
export async function apiCreateRoom(payload: {
  username: string;
  avatar: string;
  color: string;
}): Promise<RoomMeta> {
  const res = await fetch(`${BASE}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create room');
  return res.json();
}

// Called when user clicks "Join Room" — validates the code exists
export async function apiGetRoom(roomId: string): Promise<RoomMeta> {
  const res = await fetch(`${BASE}/api/rooms/${roomId}`);
  if (!res.ok) throw new Error('Room not found');
  return res.json();
}