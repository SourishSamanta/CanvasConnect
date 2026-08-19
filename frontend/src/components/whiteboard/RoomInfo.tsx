import { Copy, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function RoomInfo() {
  const navigate = useNavigate();
  const { roomCode, roomName, showRoomCode, toggleShowRoomCode, leaveRoom } = useWhiteboardStore();

  if (!roomCode) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  const handleExitToDashboard = () => {
    leaveRoom();
    navigate('/dashboard');
  };

  return (
    <div className="fixed top-4 left-4 z-30 toolbar-float rounded-2xl border border-border/80 px-3.5 py-2 flex items-center gap-3 backdrop-blur-md bg-background/90 shadow-md">
      {/* Back to Dashboard Button */}
      <button
        onClick={handleExitToDashboard}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-accent hover:bg-accent/80 text-foreground transition-colors"
        title="Leave session and return to Dashboard"
      >
        <ArrowLeft size={14} />
        <span>Dashboard</span>
      </button>

      <div className="w-px h-4 bg-border" />

      {/* Room Title */}
      <div className="flex flex-col">
        <span className="text-xs font-bold text-foreground max-w-[150px] sm:max-w-[200px] truncate leading-none">
          {roomName || 'Canvas Session'}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
          ID: {showRoomCode ? roomCode : '••••••'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 pl-1">
        <button
          onClick={toggleShowRoomCode}
          className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Toggle visibility"
        >
          {showRoomCode ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={copyCode}
          className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Copy room code"
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
  );
}
