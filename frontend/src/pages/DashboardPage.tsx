import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import UpgradePlanModal from '@/components/auth/UpgradePlanModal';
import { useWhiteboardStore, CanvasTemplate, BoardItem } from '@/stores/whiteboardStore';
import { useAuthStore } from '@/stores/authStore';
import { apiFetchRooms } from '@/lib/api';
import {
  Plus, Search, Star, Trash2, Edit3, Copy, Clock,
  Sparkles, Grid, CircleDot, FileText, Moon, LayoutGrid, Check, Crown, Zap, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    userName, userAvatar, userTagline, boardHistory,
    createRoom, joinRoom, isConnecting, saveBoardToHistory,
    removeBoardFromHistory, toggleBoardFavorite, updateBoardTitle,
  } = useWhiteboardStore();

  const { user, boardLimit, setBoardLimitCount, openAuthModal, isAuthenticated } = useAuthStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const [quickCodeInput, setQuickCodeInput] = useState('');

  // New Board Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CanvasTemplate>('grid');

  // Rename Board Modal
  const [editingBoard, setEditingBoard] = useState<{ roomId: string; name: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Check query params for ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Sync rooms from backend REST API on mount / auth change
  useEffect(() => {
    if (!isAuthenticated) {
      const raw = localStorage.getItem('canvasconnect_user_boards');
      if (raw) {
        try {
          const guestBoards = JSON.parse(raw);
          useWhiteboardStore.setState({ boardHistory: guestBoards });
          setBoardLimitCount(guestBoards.length);
        } catch {
          useWhiteboardStore.setState({ boardHistory: [] });
          setBoardLimitCount(0);
        }
      } else {
        useWhiteboardStore.setState({ boardHistory: [] });
        setBoardLimitCount(0);
      }
    } else {
      apiFetchRooms().then((backendRooms) => {
        if (Array.isArray(backendRooms)) {
          const userBoards: BoardItem[] = backendRooms.map((r) => ({
            id: r.roomId,
            roomId: r.roomId,
            name: r.name,
            template: (r.template as CanvasTemplate) || 'grid',
            createdAt: r.createdAt || new Date().toISOString(),
            updatedAt: r.updatedAt || new Date().toISOString(),
            strokeCount: r.strokeCount || 0,
            isFavorite: r.isFavorite || false,
          }));
          useWhiteboardStore.setState({ boardHistory: userBoards });
          setBoardLimitCount(backendRooms.length);
        }
      });
    }
  }, [isAuthenticated, setBoardLimitCount]);

  // Filtered boards
  const filteredBoards = boardHistory.filter((board) => {
    const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          board.roomId.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'favorites') return matchesSearch && board.isFavorite;
    return matchesSearch;
  });

  // Sort by updatedAt descending
  const sortedBoards = [...filteredBoards].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  // Handlers
  const handleCreateNewBoard = async () => {
    try {
      const title = newTitle.trim() || 'Untitled Session';
      const roomId = await createRoom(title, selectedTemplate);
      toast.success(`Created board "${title}"!`);
      setIsModalOpen(false);
      setNewTitle('');
      navigate(`/board/${roomId}`);
    } catch (err: any) {
      if (err.limitReached) {
        setIsModalOpen(false);
        setIsUpgradeModalOpen(true);
        toast.error(err.message || 'Board limit reached for your plan!');
      } else {
        toast.error(err.message || 'Failed to create board');
      }
    }
  };

  const handleJoinByCode = async (code: string) => {
    if (!code.trim()) return;
    try {
      await joinRoom(code.trim());
      toast.success(`Joined room ${code.toUpperCase()}`);
      navigate(`/board/${code.trim().toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Room not found');
    }
  };

  const handleRejoinBoard = async (board: BoardItem) => {
    try {
      await joinRoom(board.roomId);
      navigate(`/board/${board.roomId}`);
    } catch (err: any) {
      toast.error(err.message || 'Could not rejoin room');
    }
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success(`Copied room code: ${code}`);
  };

  const handleRenameSubmit = async () => {
    if (!editingBoard || !renameInput.trim()) return;
    try {
      await updateBoardTitle(editingBoard.roomId, renameInput.trim());
      toast.success('Board renamed');
      setEditingBoard(null);
    } catch (err: any) {
      toast.error('Failed to rename board');
    }
  };

  const handleDeleteBoard = async (roomId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await removeBoardFromHistory(roomId);
      toast.success('Board removed from history');
    }
  };

  const getTemplateIcon = (tpl: CanvasTemplate) => {
    switch (tpl) {
      case 'dots': return <CircleDot className="w-4 h-4 text-indigo-500" />;
      case 'blank': return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'dark': return <Moon className="w-4 h-4 text-amber-500" />;
      default: return <Grid className="w-4 h-4 text-primary" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  };

  const userPlan = user?.plan || 'free';
  const planLimits: Record<string, number> = { free: 3, plus: 10, premium: 20 };
  const currentLimit = boardLimit.limit || planLimits[userPlan] || 3;
  const usedCount = boardHistory.length;
  const usagePercentage = Math.min(100, Math.round((usedCount / currentLimit) * 100));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar onOpenNewBoardModal={() => setIsModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-card via-card to-accent/40 border border-border/80 p-6 sm:p-8 shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 via-indigo-500/20 to-purple-500/20 border border-border/60 flex items-center justify-center text-3xl shadow-inner">
              {user?.avatar || userAvatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Welcome back, {user?.name || userName}!
                </h1>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{userTagline || 'Ready to sketch ideas today?'}</p>
            </div>
          </div>

          {/* Stats Bar & Plan Usage Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-background/70 backdrop-blur-md p-4 rounded-2xl border border-border/60 self-stretch md:self-auto">
            <div className="flex items-center gap-4 sm:gap-6 justify-around w-full sm:w-auto">
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{boardHistory.length}</div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Boards</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-xl font-bold text-primary">
                  {boardHistory.filter(b => b.isFavorite).length}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Favorites</div>
              </div>
            </div>

            {/* Plan Limit Progress Bar */}
            <div className="w-full sm:w-48 pl-0 sm:pl-4 sm:border-l border-border/60 flex flex-col gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="capitalize flex items-center gap-1 text-foreground">
                  {userPlan === 'premium' ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : userPlan === 'plus' ? <Zap className="w-3.5 h-3.5 text-indigo-500" /> : <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />}
                  {userPlan} Plan
                </span>
                <span className={usedCount >= currentLimit ? 'text-destructive font-black' : 'text-muted-foreground'}>
                  {usedCount} / {currentLimit}
                </span>
              </div>
              {/* Progress bar line */}
              <div className="w-full h-2 rounded-full bg-accent overflow-hidden">
                <div
                  style={{ width: `${usagePercentage}%` }}
                  className={`h-full transition-all duration-500 rounded-full ${
                    usedCount >= currentLimit ? 'bg-destructive' : usagePercentage > 70 ? 'bg-amber-500' : 'bg-primary'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="text-[10px] font-semibold text-primary hover:underline text-left mt-0.5"
              >
                {usedCount >= currentLimit ? '⚠️ Limit Reached — Upgrade Plan' : 'Change Plan Limits →'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Join & Search Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-accent/40 p-1 rounded-xl border border-border/40 self-start">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Boards ({boardHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'favorites' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Favorites ({boardHistory.filter(b => b.isFavorite).length})
            </button>
          </div>

          {/* Search Box & Quick Join Code */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boards..."
                className="pl-9 h-10 rounded-xl bg-card border-border text-sm"
              />
            </div>

            {/* Quick Join Box */}
            <div className="flex items-center gap-2 w-full sm:w-auto bg-card border border-border/80 p-1 rounded-xl shadow-xs">
              <input
                value={quickCodeInput}
                onChange={(e) => setQuickCodeInput(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                maxLength={8}
                className="w-28 px-3 py-1 text-xs font-mono tracking-wider uppercase bg-transparent focus:outline-none placeholder:text-muted-foreground/60"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode(quickCodeInput)}
              />
              <Button
                size="sm"
                onClick={() => handleJoinByCode(quickCodeInput)}
                disabled={isConnecting || !quickCodeInput.trim()}
                className="h-8 rounded-lg px-3 text-xs bg-accent hover:bg-accent/80 text-foreground font-medium"
              >
                Join
              </Button>
            </div>

            {/* + New Board Button */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto h-10 px-5 rounded-xl bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Board</span>
            </Button>
          </div>
        </div>

        {/* Board Cards Grid */}
        {sortedBoards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBoards.map((board) => (
              <div
                key={board.roomId}
                onClick={() => handleRejoinBoard(board)}
                className="group relative rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                {/* Board Preview Header Box */}
                <div className={`relative h-40 w-full p-4 flex flex-col justify-between overflow-hidden ${
                  board.template === 'dark' ? 'bg-zinc-900 text-white' :
                  board.template === 'dots' ? 'bg-slate-50 dark:bg-zinc-900/60' :
                  board.template === 'blank' ? 'bg-white dark:bg-zinc-950' :
                  'bg-sky-50/50 dark:bg-zinc-900/40'
                }`}>
                  {/* Pattern BG */}
                  {board.template === 'dots' && (
                    <div className="absolute inset-0 bg-[radial-gradient(#8884_1px,transparent_1px)] [background-size:12px_12px] opacity-60" />
                  )}
                  {board.template === 'grid' && (
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8881_1px,transparent_1px),linear-gradient(to_bottom,#8881_1px,transparent_1px)] bg-[size:16px_16px]" />
                  )}

                  {/* Card Top Actions */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-background/80 backdrop-blur-md border border-border/60 text-foreground shadow-xs">
                      {board.roomId}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBoardFavorite(board.roomId);
                      }}
                      className="p-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-border/60 text-muted-foreground hover:text-amber-400 transition-colors"
                      title="Favorite Board"
                    >
                      <Star className={`w-4 h-4 ${board.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Card Center Canvas Preview Mock */}
                  <div className="relative z-10 flex items-center justify-center opacity-80 group-hover:scale-105 transition-transform duration-300">
                    <div className="px-3 py-1.5 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 text-xs font-medium flex items-center gap-2 shadow-sm">
                      {getTemplateIcon(board.template)}
                      <span className="capitalize text-muted-foreground text-[11px]">{board.template} Canvas</span>
                    </div>
                  </div>

                  {/* Stroke indicator */}
                  <div className="relative z-10 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(board.updatedAt)}
                    </span>
                    <span className="bg-background/80 backdrop-blur-xs px-2 py-0.5 rounded-md font-mono text-[10px]">
                      {board.strokeCount ?? 0} strokes
                    </span>
                  </div>
                </div>

                {/* Board Info & Footer */}
                <div className="p-4 bg-card flex items-center justify-between border-t border-border/40">
                  <div className="min-w-0 flex-1 mr-2">
                    <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {board.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Code: <span className="font-mono">{board.roomId}</span>
                    </p>
                  </div>

                  {/* Actions Dropdown / Quick Buttons */}
                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleCopyCode(board.roomId, e)}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBoard({ roomId: board.roomId, name: board.name });
                        setRenameInput(board.name);
                      }}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Rename Board"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteBoard(board.roomId, board.name, e)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete Board"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-border/80 bg-card/40 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/60 flex items-center justify-center text-muted-foreground mb-4">
              <LayoutGrid className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No boards found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              {searchQuery ? `No boards match "${searchQuery}"` : 'You haven\'t created or joined any whiteboard sessions yet.'}
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-primary text-primary-foreground font-semibold px-6 py-2 shadow-md"
            >
              + Create First Board
            </Button>
          </div>
        )}
      </main>

      {/* New Board Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
              Create New Board Session
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Board Title</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Architecture Brainstorming"
                className="rounded-xl h-11 bg-background"
                maxLength={40}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Select Template</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'grid', label: 'Grid Paper', icon: Grid, desc: 'Classic math grid' },
                  { id: 'dots', label: 'Dot Matrix', icon: CircleDot, desc: 'Clean dot layout' },
                  { id: 'blank', label: 'Blank White', icon: FileText, desc: 'Plain canvas' },
                  { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Sleek dark theme' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id as CanvasTemplate)}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      selectedTemplate === tpl.id
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-border/60 hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <tpl.icon className="w-4 h-4 text-primary" />
                      {selectedTemplate === tpl.id && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="text-xs font-bold text-foreground mt-1">{tpl.label}</span>
                    <span className="text-[10px] text-muted-foreground">{tpl.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewBoard}
              disabled={isConnecting}
              className="rounded-xl bg-primary text-primary-foreground font-medium px-5"
            >
              {isConnecting ? 'Creating...' : 'Create & Launch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Board Dialog */}
      <Dialog open={!!editingBoard} onOpenChange={() => setEditingBoard(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Rename Board</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Board title"
              className="rounded-xl h-10 bg-background"
              maxLength={40}
            />
          </div>
          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditingBoard(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} className="rounded-xl bg-primary text-primary-foreground">
              Save Title
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
