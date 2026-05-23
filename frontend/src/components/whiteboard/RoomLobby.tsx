import { useState } from 'react';
import { useWhiteboardStore, AVAILABLE_AVATARS } from '@/stores/whiteboardStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function RoomLobby() {
  const { createRoom, joinRoom, isConnecting } = useWhiteboardStore(); // ← isConnecting added
  const [mode, setMode]       = useState<'select' | 'create' | 'join'>('select');
  const [name, setName]       = useState('');
  const [avatar, setAvatar]   = useState(AVAILABLE_AVATARS[0]);
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = async () => {        // ← now async
    if (!name.trim()) return;
    try {
      if (mode === 'create') {
        await createRoom(name.trim(), avatar);
      } else if (mode === 'join') {
        if (!roomCode.trim()) return;
        await joinRoom(roomCode.trim(), name.trim(), avatar);
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong');
    }
  };

  // UI is 100% identical to what Lovable built — only the button shows a spinner
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-bg">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">✏️ Drawboard</h1>
          <p className="text-sm text-muted-foreground mt-2">Real-time collaborative whiteboard</p>
        </div>

        <div className="bg-background rounded-2xl border border-border shadow-sm p-6 space-y-5">
          {mode === 'select' ? (
            <div className="space-y-3">
              <button onClick={() => setMode('create')} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Create a Room
              </button>
              <button onClick={() => setMode('join')} className="w-full py-3 rounded-xl border border-border text-foreground font-medium hover:bg-accent transition-colors">
                Join a Room
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setMode('select')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Your Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name"
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" maxLength={20} />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Pick an Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_AVATARS.map((a) => (
                    <button key={a} onClick={() => setAvatar(a)}
                      className={cn('w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all border-2',
                        avatar === a ? 'border-foreground bg-accent scale-110' : 'border-transparent hover:bg-accent')}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'join' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Room Code</label>
                  <input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. A3BX9K"
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={8} />
                </div>
              )}

              <button onClick={handleSubmit}
                disabled={isConnecting || !name.trim() || (mode === 'join' && !roomCode.trim())}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {isConnecting ? 'Connecting…' : mode === 'create' ? 'Create Room' : 'Join Room'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}