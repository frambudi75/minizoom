'use client';
import { useState } from 'react';
import { useParticipants } from '@livekit/components-react';
import { PenTool, Wifi, Users } from 'lucide-react';
import { ReactionPicker } from './ReactionOverlay';

export function RoomHeader({
  roomId,
  lowDataMode,
  setLowDataMode,
  onOpenWhiteboard,
}: {
  roomId: string;
  lowDataMode: boolean;
  setLowDataMode: (v: boolean) => void;
  onOpenWhiteboard: () => void;
}) {
  const participants = useParticipants();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Link room: ' + window.location.href);
    }
  };

  return (
    <div className="h-12 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300 z-10 shrink-0">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Room:</span>
          <span className="font-mono text-blue-400 truncate max-w-[110px] sm:max-w-[200px]">{roomId}</span>
        </div>
        <button
          onClick={handleCopy}
          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition-colors shrink-0"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Whiteboard Button */}
        <button
          onClick={onOpenWhiteboard}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-blue-400 border border-slate-700 text-xs font-semibold transition-colors"
          title="Open Interactive Whiteboard"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Whiteboard</span>
        </button>

        {/* Low Data Mode Toggle */}
        <button
          onClick={() => setLowDataMode(!lowDataMode)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
            lowDataMode
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
          }`}
          title={lowDataMode ? 'Mode Hemat Kuota Aktif' : 'Aktifkan Mode Hemat Kuota'}
        >
          <Wifi className="w-3 h-3" />
          <span className="hidden sm:inline">{lowDataMode ? 'Low-Data: ON' : 'Low-Data'}</span>
        </button>

        {/* Emoji Reactions Picker */}
        <ReactionPicker />

        {/* Real-time Participant Count */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold font-mono text-xs shadow-sm">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>{participants.length} Peserta</span>
        </span>
      </div>
    </div>
  );
}

