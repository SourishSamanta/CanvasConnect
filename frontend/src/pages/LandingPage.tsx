import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import {
  Sparkles, ArrowRight, Zap, Users, Shield, History, Palette,
  CheckCircle, Play, Layers, MousePointer2, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LandingPage() {
  const navigate = useNavigate();
  const { createRoom, isConnecting, userName, userAvatar } = useWhiteboardStore();
  const [quickRoomName, setQuickRoomName] = useState('');

  const handleQuickCreate = async () => {
    try {
      const title = quickRoomName.trim() || 'Instant Session';
      const roomId = await createRoom(title, 'grid');
      toast.success(`Created board: ${title}`);
      navigate(`/board/${roomId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create board');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
          {/* Background Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary/20 via-indigo-500/20 to-purple-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold tracking-wide mb-6 shadow-xs animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Real-Time Multi-User Collaboration Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6">
              Brainstorm, Draw & Sync with{' '}
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Zero Friction.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed mb-10">
              The modern collaborative whiteboard built for remote teams, quick discussions, and visual thinking.
              Saved automatically, rejoinable anytime.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
              <Button
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/profile')}
                className="w-full sm:w-auto h-12 px-6 rounded-xl border-border hover:bg-accent font-medium flex items-center justify-center gap-2"
              >
                <span>Customize Profile</span>
                <span className="text-base">{userAvatar}</span>
              </Button>
            </div>

            {/* Quick Instant Session Creator Box */}
            <div className="max-w-md mx-auto p-2.5 rounded-2xl bg-card border border-border/80 shadow-xl shadow-foreground/5 backdrop-blur-md flex items-center gap-2 mb-16">
              <input
                type="text"
                value={quickRoomName}
                onChange={(e) => setQuickRoomName(e.target.value)}
                placeholder="Enter board title (e.g. Design Sync)"
                className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground/70"
                onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
              />
              <Button
                onClick={handleQuickCreate}
                disabled={isConnecting}
                className="rounded-xl px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 whitespace-nowrap shadow-sm"
              >
                {isConnecting ? 'Creating...' : '+ Instant Board'}
              </Button>
            </div>

            {/* Hero Visual Mockup Preview */}
            <div className="relative max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-2xl p-4 sm:p-6 overflow-hidden group">
              <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-mono text-muted-foreground">room/A3BX9K — Live Canvas Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    3 Active Peers
                  </span>
                </div>
              </div>

              {/* Canvas Preview Mock Content */}
              <div className="relative h-64 sm:h-80 w-full rounded-xl bg-accent/30 border border-dashed border-border/60 flex items-center justify-center overflow-hidden">
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#8882_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* Simulated Sketches & Shapes */}
                <svg className="absolute inset-0 w-full h-full text-primary/40 pointer-events-none">
                  <path d="M 120 100 Q 200 40 320 120 T 500 150" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <rect x="180" y="80" width="140" height="90" rx="12" fill="none" stroke="hsl(199, 89%, 48%)" strokeWidth="3" strokeDasharray="6 6" />
                  <circle cx="550" cy="180" r="45" fill="none" stroke="hsl(280, 67%, 55%)" strokeWidth="3" />
                </svg>

                {/* Simulated Cursors */}
                <div className="absolute top-16 left-1/3 flex items-center gap-1 bg-sky-500 text-white px-2 py-1 rounded-lg text-xs font-medium shadow-md animate-bounce">
                  <MousePointer2 className="w-3.5 h-3.5 fill-current" />
                  <span>Alex 🐱</span>
                </div>
                <div className="absolute bottom-20 right-1/4 flex items-center gap-1 bg-purple-500 text-white px-2 py-1 rounded-lg text-xs font-medium shadow-md">
                  <MousePointer2 className="w-3.5 h-3.5 fill-current" />
                  <span>Sarah 🦊</span>
                </div>

                {/* Center Callout */}
                <div className="z-10 text-center px-4 py-3 rounded-2xl bg-background/90 backdrop-blur-md border border-border shadow-lg max-w-sm">
                  <h3 className="text-sm font-semibold text-foreground">Interactive Whiteboard Studio</h3>
                  <p className="text-xs text-muted-foreground mt-1">Real-time Yjs CRDT synchronization with persistent session history</p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                    className="mt-3 text-xs h-8 px-4 rounded-lg bg-primary text-primary-foreground font-medium"
                  >
                    Open Live Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-16 md:py-24 bg-card/40 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need for collaborative drawing
              </h2>
              <p className="text-muted-foreground mt-3 text-base">
                Engineered for speed, stability, and effortless session management.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-xs hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Real-Time Yjs Sync</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Conflict-free collaborative drawing powered by Yjs WebSockets. See edits and cursors live instantly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-xs hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Saved Dashboard History</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every board you join or exit is saved to your personal dashboard. Rejoin and edit previous boards anytime.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-xs hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Custom Avatars & Profiles</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Personalize your identity with fun avatar emojis, custom cursor colors, and canvas style preferences.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-xs hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Canvas Templates</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Choose from Engineering Grid, Dot Matrix, Dark Mode, or Blank Whiteboard templates for any discussion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* User Experience CTA Section */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-purple-600 p-8 sm:p-12 md:p-16 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#ffffff22,transparent)] pointer-events-none" />
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Ready to start your next session?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto text-base sm:text-lg mb-8 font-medium">
              Create a new room in one click or join an existing board with room code.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 h-12 rounded-xl bg-white text-primary hover:bg-white/90 font-bold shadow-lg transition-all hover:scale-105"
              >
                Launch Dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/profile')}
                className="w-full sm:w-auto px-8 h-12 rounded-xl border-white/40 text-white hover:bg-white/10 font-semibold"
              >
                Edit My Profile
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>CanvasConnect Collaborative Whiteboard</span>
          </div>
          <p>© {new Date().getFullYear()} CanvasConnect. Real-time visual workspace.</p>
        </div>
      </footer>
    </div>
  );
}
