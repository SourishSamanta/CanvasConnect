import Canvas from './Canvas';
import Toolbar from './Toolbar';
import RoomInfo from './RoomInfo';
import ParticipantsPanel from './ParticipantsPanel';
import ZoomControls from './ZoomControls';
import ThemeToggle from './ThemeToggle';

export default function WhiteboardPage() {
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
