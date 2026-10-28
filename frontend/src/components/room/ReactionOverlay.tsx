'use client';
import { useEffect, useState, useCallback } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { Smile } from 'lucide-react';

export interface FloatingEmoji {
  id: string;
  emoji: string;
  sender: string;
  left: number;
}

export function ReactionOverlay() {
  const room = useRoomContext();
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

  const handleDataReceived = useCallback((payload: Uint8Array, participant?: any) => {
    try {
      const text = new TextDecoder().decode(payload);
      const data = JSON.parse(text);
      if (data.type === 'reaction' && data.emoji) {
        const newEmoji: FloatingEmoji = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          emoji: data.emoji,
          sender: data.sender || participant?.name || 'Someone',
          left: Math.floor(Math.random() * 60) + 20,
        };
        setEmojis((prev) => [...prev, newEmoji]);
        setTimeout(() => {
          setEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
        }, 3200);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!room) return;
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, handleDataReceived]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {emojis.map((item) => (
        <div
          key={item.id}
          className="absolute bottom-16 animate-float-up flex flex-col items-center select-none"
          style={{ left: `${item.left}%` }}
        >
          <span className="text-3xl sm:text-4xl filter drop-shadow-md">{item.emoji}</span>
          <span className="text-[10px] bg-slate-950/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/60 font-medium whitespace-nowrap mt-0.5">
            {item.sender}
          </span>
        </div>
      ))}
    </div>
  );
}

const REACTION_EMOJIS = ['👍', '❤️', '👏', '😂', '🎉', '🔥', '🚀'];

export function ReactionPicker() {
  const { localParticipant } = useLocalParticipant();
  const [open, setOpen] = useState(false);

  const sendReaction = async (emoji: string) => {
    if (!localParticipant) return;
    try {
      const payload = JSON.stringify({
        type: 'reaction',
        emoji,
        sender: localParticipant.name || 'You',
      });
      const data = new TextEncoder().encode(payload);
      await localParticipant.publishData(data, { reliable: true });
    } catch (err) {
      console.error('Failed to send reaction:', err);
    }
  };

  return (
    <div className="relative">
      {open && (
        <div className="absolute bottom-full mb-2 right-0 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex gap-1 z-50 animate-in fade-in slide-in-from-bottom-2">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                sendReaction(emoji);
                setOpen(false);
              }}
              className="text-xl p-1.5 hover:scale-125 transition-transform hover:bg-slate-800 rounded-xl"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs font-semibold text-slate-300 transition-colors shadow-sm"
        title="Send Floating Reaction"
      >
        <Smile className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline">React</span>
      </button>
    </div>
  );
}

