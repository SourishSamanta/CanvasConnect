const BASE = import.meta.env.VITE_SERVER_URL || '';

export interface RoomMeta {
  roomId: string;
  name: string;
  description?: string;
  template?: string;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
  strokeCount?: number;
}

export async function apiFetchRooms(): Promise<RoomMeta[]> {
  try {
    const res = await fetch(`${BASE}/api/rooms`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function apiCreateRoom(payload: {
  name?: string;
  description?: string;
  template?: string;
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

export async function apiGetRoom(roomId: string): Promise<RoomMeta> {
  const res = await fetch(`${BASE}/api/rooms/${roomId}`);
  if (!res.ok) throw new Error('Room not found');
  return res.json();
}

export async function apiUpdateRoom(roomId: string, updates: Partial<RoomMeta>): Promise<RoomMeta> {
  const res = await fetch(`${BASE}/api/rooms/${roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update room');
  return res.json();
}

export async function apiDeleteRoom(roomId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/rooms/${roomId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete room');
}