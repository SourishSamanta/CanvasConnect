import { Users, X } from 'lucide-react';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import { cn } from '@/lib/utils';

export default function ParticipantsPanel() {
  const { participants, isPanelOpen, togglePanel, userId } = useWhiteboardStore();

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={togglePanel}
        className="fixed top-4 right-4 z-30 toolbar-float rounded-xl border border-border p-2 flex items-center gap-2 text-sm hover:bg-accent transition-colors"
      >
        <Users size={16} />
        <span className="font-medium">{participants.length}</span>
      </button>

      {/* Panel */}
      {isPanelOpen && (
        <div className="fixed top-0 right-0 z-40 h-full w-72 bg-background border-l border-border shadow-xl animate-slide-in-right">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-sm">Participants ({participants.length})</h2>
            <button
              onClick={togglePanel}
              className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3 space-y-1">
            {participants.map((p) => (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                  p.id === userId ? 'bg-accent' : 'hover:bg-accent/50'
                )}
              >
                <span className="text-xl">{p.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {p.name}
                    {p.id === userId && (
                      <span className="text-xs text-muted-foreground ml-1">(you)</span>
                    )}
                  </p>
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: p.cursorColor }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
