import { useWhiteboardStore } from '@/stores/whiteboardStore';
import { yjsClientId } from '@/hooks/useWhiteboard';

export default function RemoteCursors() {
  const { participants, userId } = useWhiteboardStore();
  const myClientId = yjsClientId();

  return (
    <>
      {participants
        .filter((p) => p.id !== userId && p.cursor)
        .map((p) => (
          <div
            key={p.id}
            className="pointer-events-none absolute z-50 flex items-center gap-1"
            style={{ left: p.cursor!.x, top: p.cursor!.y, transform: 'translate(0, -100%)' }}
          >
            {/* Cursor dot */}
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: p.cursorColor }}
            />
            {/* Name tag */}
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-md text-white shadow-md"
              style={{ backgroundColor: p.cursorColor }}
            >
              {p.avatar} {p.name}
            </span>
          </div>
        ))}
    </>
  );
}