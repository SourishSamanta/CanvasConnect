import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import RoomInfo from './RoomInfo';
import ParticipantsPanel from './ParticipantsPanel';
import ZoomControls from './ZoomControls';
import ThemeToggle from './ThemeToggle';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WhiteboardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { roomCode, joinRoom, isConnecting, isInRoom } = useWhiteboardStore();

  useEffect(() => {
    if (roomId && (!isInRoom || roomCode !== roomId.toUpperCase())) {
      joinRoom(roomId).catch((err) => {
        toast.error(err.message || 'Could not join room');
        navigate('/dashboard');
      });
    }
  }, [roomId, isInRoom, roomCode, joinRoom, navigate]);

  if (isConnecting || !isInRoom) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-lg flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-bold">Connecting to Whiteboard...</span>
            <span className="text-xs font-mono text-muted-foreground">Room ID: {roomId?.toUpperCase()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <Canvas />
      <Toolbar />
      <RoomInfo />
      <ParticipantsPanel />
      <ZoomControls />
      <ThemeToggle />
    </div>
  );
}
