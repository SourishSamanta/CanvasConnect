import { useWhiteboardStore } from '@/stores/whiteboardStore';
import RoomLobby from '@/components/whiteboard/RoomLobby';
import WhiteboardPage from '@/components/whiteboard/WhiteboardPage';

const Index = () => {
  const isInRoom = useWhiteboardStore((s) => s.isInRoom);
  return isInRoom ? <WhiteboardPage /> : <RoomLobby />;
};

export default Index;
