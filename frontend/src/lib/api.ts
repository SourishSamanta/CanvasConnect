const BASE = import.meta.env.VITE_SERVER_URL || '';

export interface UserAuth {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'plus' | 'premium';
  avatar: string;
  createdAt?: string;
}

export interface BoardLimitInfo {
  limit: number;
  current: number;
}

export interface AuthResponse {
  token: string;
  user: UserAuth;
  boardLimit: BoardLimitInfo;
}

export interface RoomMeta {
  roomId: string;
  owner?: string;
  name: string;
  description?: string;
  template?: string;
  isFavorite?: boolean;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
  strokeCount?: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('canvasconnect_auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ─── AUTH APIS ─────────────────────────────────────────────────────────────

export async function apiSignup(data: {
  name: string;
  email: string;
  password: string;
  plan?: string;
  avatar?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Signup failed');
  return json;
}

export async function apiLogin(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Login failed');
  return json;
}

export async function apiGetMe(): Promise<{ user: UserAuth; boardLimit: BoardLimitInfo }> {
  const res = await fetch(`${BASE}/api/auth/me`, {
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch user');
  return json;
}

export async function apiUpdatePlan(plan: 'free' | 'plus' | 'premium'): Promise<{ user: UserAuth; boardLimit: BoardLimitInfo; message: string }> {
  const res = await fetch(`${BASE}/api/auth/plan`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ plan }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update plan');
  return json;
}

// ─── ROOM APIS ─────────────────────────────────────────────────────────────

export async function apiFetchRooms(): Promise<RoomMeta[]> {
  try {
    const res = await fetch(`${BASE}/api/rooms`, {
      headers: getAuthHeaders(),
    });
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
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.error || 'Failed to create room');
    (err as any).limitReached = json.limitReached;
    (err as any).limit = json.limit;
    (err as any).plan = json.plan;
    throw err;
  }
  return json;
}

export async function apiGetRoom(roomId: string): Promise<RoomMeta> {
  const res = await fetch(`${BASE}/api/rooms/${roomId}`, {
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Room not found');
  return json;
}

export async function apiUpdateRoom(roomId: string, updates: Partial<RoomMeta>): Promise<RoomMeta> {
  const res = await fetch(`${BASE}/api/rooms/${roomId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update room');
  return json;
}

export async function apiDeleteRoom(roomId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/rooms/${roomId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete room');
}