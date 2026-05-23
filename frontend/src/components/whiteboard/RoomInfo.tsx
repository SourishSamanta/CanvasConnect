import { Copy, Eye, EyeOff, LogOut } from 'lucide-react';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import { toast } from 'sonner';

export default function RoomInfo() {
  const { roomCode, showRoomCode, toggleShowRoomCode, leaveRoom } = useWhiteboardStore();

  if (!roomCode) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  return (
    <div className="fixed top-4 left-4 z-30 toolbar-float rounded-xl border border-border px-3 py-2 flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Room:</span>
      <span className="text-sm font-mono font-semibold tracking-wider text-foreground">
        {showRoomCode ? roomCode : '••••••'}
      </span>
      <button
        onClick={toggleShowRoomCode}
        className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        {showRoomCode ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button
        onClick={copyCode}
        className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Copy size={14} />
      </button>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={leaveRoom}
        className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
