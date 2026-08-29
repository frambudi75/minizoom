'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  useParticipants,
  useLocalParticipant,
  useChat,
  useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { RoomEvent } from 'livekit-client';
import {
  User,
  Building2,
  ArrowRight,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  UserMinus,
  Users,
  Radio,
  Square,
  MessageSquare,
  Hand,
  Lock,
  Unlock,
  VolumeX,
  Send,
  Sparkles,
  Smile,
  Wifi,
  Sliders,
  CheckCircle,
  Volume2,
  Camera,
  Settings,
  PenTool,
  Vote,
  FileText,
  Download,
  Trash2,
  Plus,
  Palette,
  Eraser,
  X,
  Volume1
} from 'lucide-react';

// ================= Web Audio API Sound Synthesizer =================
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playJoin() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  playLeave() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(392.0, now + 0.18); // G4
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  playChat() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08); // D6
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }
}

const sounds = new SoundSynthesizer();

// ================= Floating Reactions Overlay =================
interface FloatingEmoji {
  id: string;
  emoji: string;
  sender: string;
  left: number;
}

function ReactionOverlay() {
  const room = useRoomContext();
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

  const handleDataReceived = useCallback((payload: Uint8Array, participant?: any) => {
    try {
      const text = new TextDecoder().decode(payload);
      const data = JSON.parse(text);
      if (data.type === 'reaction' && data.emoji) {
        const newEmoji: FloatingEmoji = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

function ReactionPicker() {
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

// ================= Collaborative Interactive Whiteboard =================
function WhiteboardModal({ isOpen, onClose }: { isOpen: boolean; onClose: boolean | any }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const [color, setColor] = useState('#3b82f6');
  const [lineWidth, setLineWidth] = useState(4);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  const COLORS = ['#ffffff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];

  const drawLine = useCallback((x0: number, y0: number, x1: number, y1: number, strokeColor: string, size: number, emit = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();

    if (emit && localParticipant) {
      try {
        const payload = JSON.stringify({
          type: 'wb_draw',
          x0: x0 / canvas.width,
          y0: y0 / canvas.height,
          x1: x1 / canvas.width,
          y1: y1 / canvas.height,
          color: strokeColor,
          size,
        });
        localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      } catch {}
    }
  }, [localParticipant]);

  const clearCanvas = useCallback((emit = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (emit && localParticipant) {
      try {
        const payload = JSON.stringify({ type: 'wb_clear' });
        localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      } catch {}
    }
  }, [localParticipant]);

  // Handle incoming draw data
  useEffect(() => {
    if (!room) return;
    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data.type === 'wb_draw' && canvasRef.current) {
          const w = canvasRef.current.width;
          const h = canvasRef.current.height;
          drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size, false);
        } else if (data.type === 'wb_clear') {
          clearCanvas(false);
        }
      } catch {}
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, drawLine, clearCanvas]);

  // Handle Canvas Resize
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, [isOpen]);

  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isDrawing.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const strokeColor = tool === 'eraser' ? '#0f172a' : color;
    const size = tool === 'eraser' ? lineWidth * 3 : lineWidth;

    drawLine(lastPos.current.x, lastPos.current.y, currentX, currentY, strokeColor, size, true);
    lastPos.current = { x: currentX, y: currentY };
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Minizoom-Whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Whiteboard Header & Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">Interactive Whiteboard</h3>
            <span className="text-[11px] px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full font-mono">
              Live Sync
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Color Selectors */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool('pen');
                  }}
                  className={`w-5 h-5 rounded-full transition-transform ${color === c && tool === 'pen' ? 'scale-125 ring-2 ring-blue-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Tools */}
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${tool === 'pen' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              title="Pen Tool"
            >
              <PenTool className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${tool === 'eraser' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              title="Eraser Tool"
            >
              <Eraser className="w-4 h-4" />
            </button>

            {/* Clear & Download */}
            <button
              onClick={() => clearCanvas(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-400 transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={downloadWhiteboard}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              title="Download PNG"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors ml-2"
              title="Close Whiteboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-full block"
          />
        </div>
      </div>
    </div>
  );
}

// ================= Custom Participant & Collaboration Sidebar =================
interface PollOption {
  id: number;
  text: string;
  votes: string[]; // participant identities
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  creator: string;
  active: boolean;
}

function ParticipantSidebar({
  roomId,
  livekitToken,
  initialIsLocked = false,
  onOpenWhiteboard,
}: {
  roomId: string;
  livekitToken: string;
  initialIsLocked?: boolean;
  onOpenWhiteboard: () => void;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { chatMessages, send, isSending } = useChat();
  const room = useRoomContext();

  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'polls' | 'notes'>('participants');
  const [chatInput, setChatInput] = useState('');
  const [unreadChat, setUnreadChat] = useState(0);
  const [isLocked, setIsLocked] = useState(initialIsLocked);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Polls State
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  // Shared Notes State
  const [notes, setNotes] = useState('');
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prevParticipantCount = useRef(participants.length);

  // Participant Chimes
  useEffect(() => {
    if (participants.length > prevParticipantCount.current) {
      sounds.playJoin();
    } else if (participants.length < prevParticipantCount.current) {
      sounds.playLeave();
    }
    prevParticipantCount.current = participants.length;
  }, [participants.length]);

  // Chat Chimes & Unread
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChat(0);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (chatMessages.length > 0) {
        setUnreadChat((prev) => prev + 1);
        sounds.playChat();
      }
    }
  }, [chatMessages.length, activeTab]);

  const isHost = (() => {
    if (!livekitToken) return false;
    try {
      const payload = JSON.parse(atob(livekitToken.split('.')[1]));
      return payload?.video?.roomAdmin === true;
    } catch {
      return false;
    }
  })();

  const isLocalHandRaised = (() => {
    try {
      return JSON.parse(localParticipant?.metadata || '{}')?.isHandRaised === true;
    } catch {
      return false;
    }
  })();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Handle Incoming Data for Polls & Notes
  const handleIncomingData = useCallback((payload: Uint8Array) => {
    try {
      const text = new TextDecoder().decode(payload);
      const data = JSON.parse(text);
      if (data.type === 'poll_new') {
        setPolls((prev) => [data.poll, ...prev.filter((p) => p.id !== data.poll.id)]);
      } else if (data.type === 'poll_vote') {
        setPolls((prev) =>
          prev.map((p) => {
            if (p.id !== data.pollId) return p;
            return {
              ...p,
              options: p.options.map((opt) => {
                const cleanedVotes = opt.votes.filter((id) => id !== data.voter);
                if (opt.id === data.optionId) {
                  return { ...opt, votes: [...cleanedVotes, data.voter] };
                }
                return { ...opt, votes: cleanedVotes };
              }),
            };
          })
        );
      } else if (data.type === 'notes_sync') {
        setNotes(data.content);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!room) return;
    room.on(RoomEvent.DataReceived, handleIncomingData);
    return () => {
      room.off(RoomEvent.DataReceived, handleIncomingData);
    };
  }, [room, handleIncomingData]);

  // Host Screen Recorder
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 60 } },
        audio: true,
      });

      let audioTracks = displayStream.getAudioTracks();
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {}

      let finalStream: MediaStream;
      if (micStream && micStream.getAudioTracks().length > 0 && audioTracks.length > 0) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const dest = audioCtx.createMediaStreamDestination();

        const displayAudioSource = audioCtx.createMediaStreamSource(new MediaStream(audioTracks));
        displayAudioSource.connect(dest);

        const micAudioSource = audioCtx.createMediaStreamSource(new MediaStream(micStream.getAudioTracks()));
        micAudioSource.connect(dest);

        finalStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...dest.stream.getAudioTracks(),
        ]);
      } else if (micStream && micStream.getAudioTracks().length > 0) {
        finalStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...micStream.getAudioTracks(),
        ]);
      } else {
        finalStream = displayStream;
      }

      const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
      const selectedMime = mimeTypes.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || '';

      const recorder = new MediaRecorder(finalStream, selectedMime ? { mimeType: selectedMime } : undefined);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: selectedMime || 'video/webm' });
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          a.download = `Minizoom-Recording-${roomId}-${dateStr}.webm`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 1000);
        }

        finalStream.getTracks().forEach((track) => track.stop());
        if (micStream) micStream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      displayStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') recorder.stop();
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        alert('Gagal memulai perekaman: ' + (err.message || 'Izin ditolak'));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Host Actions
  const handleMute = async (identity: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setActionLoading(`mute-${identity}`);
    try {
      await fetch(`/api/meetings/${roomId}/mute/${identity}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMuteAll = async () => {
    if (!confirm('Mute mikrofon semua peserta meeting sekaligus?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setActionLoading('mute-all');
    try {
      await fetch(`/api/meetings/${roomId}/mute-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleLock = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setActionLoading('toggle-lock');
    try {
      const res = await fetch(`/api/meetings/${roomId}/lock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsLocked(data.is_locked);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleKick = async (identity: string) => {
    if (!confirm('Keluarkan peserta ini dari meeting?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setActionLoading(`kick-${identity}`);
    try {
      await fetch(`/api/meetings/${roomId}/kick/${identity}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleVideoOff = async (identity: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setActionLoading(`video-${identity}`);
    try {
      await fetch(`/api/meetings/${roomId}/video-off/${identity}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRaiseHand = async () => {
    if (!localParticipant) return;
    try {
      const currentMeta = JSON.parse(localParticipant.metadata || '{}');
      const nextHand = !currentMeta.isHandRaised;
      await localParticipant.setMetadata(JSON.stringify({ ...currentMeta, isHandRaised: nextHand }));
    } catch {}
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;
    try {
      await send(chatInput.trim());
      setChatInput('');
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {}
  };

  // Polls Creation & Voting
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim() || !localParticipant) return;
    const validOpts = newPollOptions.filter((o) => o.trim() !== '');
    if (validOpts.length < 2) {
      alert('Minimal masukkan 2 pilihan opsi polling.');
      return;
    }

    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question: newPollQuestion.trim(),
      options: validOpts.map((text, idx) => ({ id: idx, text, votes: [] })),
      creator: localParticipant.name || 'Host',
      active: true,
    };

    setPolls((prev) => [poll, ...prev]);
    setIsCreatingPoll(false);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);

    try {
      const payload = JSON.stringify({ type: 'poll_new', poll });
      await localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    } catch {}
  };

  const handleVote = async (pollId: string, optionId: number) => {
    if (!localParticipant) return;
    const myId = localParticipant.identity;

    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          options: p.options.map((opt) => {
            const cleanedVotes = opt.votes.filter((id) => id !== myId);
            if (opt.id === optionId) {
              return { ...opt, votes: [...cleanedVotes, myId] };
            }
            return { ...opt, votes: cleanedVotes };
          }),
        };
      })
    );

    try {
      const payload = JSON.stringify({ type: 'poll_vote', pollId, optionId, voter: myId });
      await localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    } catch {}
  };

  // Notes Sync
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNotes(text);
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    notesTimeoutRef.current = setTimeout(async () => {
      if (localParticipant) {
        try {
          const payload = JSON.stringify({ type: 'notes_sync', content: text });
          await localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
        } catch {}
      }
    }, 500);
  };

  const exportNotes = () => {
    const blob = new Blob([notes], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Minizoom-Notes-${roomId}.txt`;
    a.click();
  };

  return (
    <div className="w-full md:w-84 bg-slate-900/95 backdrop-blur-md border-t md:border-t-0 md:border-l border-slate-800 flex flex-col h-[48vh] md:h-full overflow-hidden z-10 shrink-0">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1">
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-2 px-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 rounded-lg transition-all ${
            activeTab === 'participants'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="Daftar Peserta"
        >
          <Users className="w-3.5 h-3.5" />
          <span>({participants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 rounded-lg transition-all relative ${
            activeTab === 'chat'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="Live Chat"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
          {unreadChat > 0 && activeTab !== 'chat' && (
            <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold animate-pulse">
              {unreadChat}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('polls')}
          className={`flex-1 py-2 px-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 rounded-lg transition-all ${
            activeTab === 'polls'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="Live Polls"
        >
          <Vote className="w-3.5 h-3.5" />
          <span>Polls</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 px-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 rounded-lg transition-all ${
            activeTab === 'notes'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="Shared Meeting Notes"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Notes</span>
        </button>
      </div>

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Quick Interactive Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleToggleRaiseHand}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                isLocalHandRaised
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
              }`}
            >
              <Hand className={`w-4 h-4 ${isLocalHandRaised ? 'text-amber-400' : ''}`} />
              {isLocalHandRaised ? 'Lower Hand ✋' : 'Raise Hand ✋'}
            </button>

            <button
              onClick={onOpenWhiteboard}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all"
              title="Open Whiteboard"
            >
              <PenTool className="w-4 h-4 text-blue-400" />
              <span>Whiteboard</span>
            </button>
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Host Controls
                  </span>
                </div>
                <button
                  onClick={handleToggleLock}
                  disabled={actionLoading === 'toggle-lock'}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    isLocked
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                  title={isLocked ? 'Kunci aktif. Klik untuk buka' : 'Ruangan terbuka. Klik untuk kunci'}
                >
                  {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {isLocked ? 'Locked' : 'Open'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleMuteAll}
                  disabled={actionLoading === 'mute-all'}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-slate-700/60 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  Mute All
                </button>

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
                  >
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    Record
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    Stop ({formatTime(recordingTime)})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sound Notification Toggle */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Volume1 className="w-3.5 h-3.5 text-slate-400" />
              Notification Chimes
            </span>
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                sounds.enabled = next;
              }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors ${soundEnabled ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Participants List */}
          <div className="flex flex-col gap-2">
            {participants.map((p) => {
              const isHandUp = (() => {
                try {
                  return JSON.parse(p.metadata || '{}')?.isHandRaised === true;
                } catch {
                  return false;
                }
              })();

              return (
                <div
                  key={p.identity}
                  className={`flex flex-col gap-2 bg-slate-950/60 p-3 rounded-2xl border transition-all ${
                    isHandUp
                      ? 'border-amber-500/60 ring-1 ring-amber-500/40 bg-amber-950/20'
                      : 'border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {isHandUp && (
                        <span title="Hand Raised" className="text-base animate-bounce shrink-0">
                          ✋
                        </span>
                      )}
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {p.name || p.identity}
                        {p.isLocal && ' (You)'}
                      </span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {!p.isMicrophoneEnabled && (
                        <span title="Mic is muted" className="flex items-center">
                          <MicOff className="w-4 h-4 text-red-400" />
                        </span>
                      )}
                      {!p.isCameraEnabled && (
                        <span title="Camera is off" className="flex items-center">
                          <VideoOff className="w-4 h-4 text-slate-500" />
                        </span>
                      )}
                    </div>
                  </div>
                  {isHost && !p.isLocal && (
                    <div className="flex gap-1.5 mt-1">
                      <button
                        onClick={() => handleMute(p.identity)}
                        disabled={actionLoading === `mute-${p.identity}`}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 px-2 py-1.5 rounded-lg border border-amber-500/20 transition-colors"
                        title="Mute Microphone"
                      >
                        <MicOff className="w-3 h-3" /> Mute
                      </button>
                      <button
                        onClick={() => handleVideoOff(p.identity)}
                        disabled={actionLoading === `video-${p.identity}`}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 px-2 py-1.5 rounded-lg border border-slate-700 transition-colors"
                        title="Turn Off Video"
                      >
                        <VideoOff className="w-3 h-3" /> Stop Vid
                      </button>
                      <button
                        onClick={() => handleKick(p.identity)}
                        disabled={actionLoading === `kick-${p.identity}`}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 px-2 py-1.5 rounded-lg border border-red-500/20 transition-colors"
                        title="Kick Participant"
                      >
                        <UserMinus className="w-3 h-3" /> Kick
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Belum ada pesan. Mulai obrolan sekarang!
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = msg.from?.identity === localParticipant?.identity;
                const senderName = msg.from?.name || msg.from?.identity || 'Anonymous';
                const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[120px]">
                        {isMe ? 'You' : senderName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                    </div>
                    <div
                      className={`p-2.5 rounded-2xl text-xs max-w-[88%] break-words shadow-sm leading-relaxed ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-slate-950 text-slate-200 rounded-bl-xs border border-slate-800'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
            <input
              type="text"
              placeholder="Tulis pesan..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isSending}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-all shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Polls Tab */}
      {activeTab === 'polls' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-blue-400" /> Live Polls
            </h4>
            {isHost && !isCreatingPoll && (
              <button
                onClick={() => setIsCreatingPoll(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Buat Poll
              </button>
            )}
          </div>

          {isCreatingPoll && (
            <form onSubmit={handleCreatePoll} className="p-3.5 bg-slate-950 border border-blue-500/30 rounded-2xl space-y-3 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Pertanyaan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Apakah setuju dengan jadwal ini?"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Pilihan Opsi</label>
                {newPollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    required
                    placeholder={`Opsi ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newPollOptions];
                      updated[idx] = e.target.value;
                      setNewPollOptions(updated);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ))}
              </div>

              {newPollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setNewPollOptions([...newPollOptions, ''])}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                >
                  + Tambah Opsi
                </button>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Launch Poll
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingPoll(false)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          {polls.length === 0 && !isCreatingPoll && (
            <div className="text-center py-10 text-slate-500 text-xs">
              <Vote className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Belum ada polling aktif saat ini.
            </div>
          )}

          {polls.map((poll) => {
            const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
            const myVote = poll.options.find((opt) => opt.votes.includes(localParticipant?.identity || ''))?.id;

            return (
              <div key={poll.id} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-100">{poll.question}</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">Dibuat oleh {poll.creator} • {totalVotes} Suara</p>
                </div>

                <div className="space-y-2">
                  {poll.options.map((opt) => {
                    const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                    const isSelected = myVote === opt.id;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVote(poll.id, opt.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all relative overflow-hidden ${
                          isSelected
                            ? 'border-blue-500 bg-blue-600/10'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-blue-500/15 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="relative flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200 truncate">{opt.text}</span>
                          <span className="font-mono text-slate-400 text-[11px] shrink-0 ml-2">{percentage}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shared Notes Tab */}
      {activeTab === 'notes' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" /> Shared Meeting Notes
            </h4>
            <button
              onClick={exportNotes}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
              title="Download Notes as TXT"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mb-2">Notulensi tersinkronisasi otomatis antar semua peserta meeting.</p>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Tulis ringkasan hasil rapat, agenda, atau todo list di sini..."
            className="flex-1 w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}

// ================= Room Header Component =================
function RoomHeader({
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

// ================= Pre-Join Lobby Component =================
function PreJoinLobby({
  userName,
  onJoin,
}: {
  userName: string;
  onJoin: (camEnabled: boolean, micEnabled: boolean) => void;
}) {
  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup audio level meter
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const avg = sum / dataArray.length;
          setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch (err) {
        console.warn('Lobby camera/mic access failed:', err);
      }
    }

    initMedia();

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => (t.enabled = !camEnabled));
    }
    setCamEnabled(!camEnabled);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => (t.enabled = !micEnabled));
    }
    setMicEnabled(!micEnabled);
  };

  const handleEnterRoom = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onJoin(camEnabled, micEnabled);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10 flex flex-col items-center">
        <h2 className="text-xl font-bold text-slate-100 mb-1">Pre-Join Lobby</h2>
        <p className="text-xs text-slate-400 mb-6 text-center">
          Periksa kamera dan audio Anda sebelum bergabung ke meeting.
        </p>

        {/* Video Preview Box */}
        <div className="w-full aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover -scale-x-100 ${!camEnabled ? 'hidden' : ''}`}
          />
          {!camEnabled && (
            <div className="flex flex-col items-center text-slate-500">
              <VideoOff className="w-12 h-12 mb-2 opacity-50" />
              <span className="text-xs">Kamera Dimatikan</span>
            </div>
          )}

          {/* Floating Controls inside video */}
          <div className="absolute bottom-3 flex items-center gap-3">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full backdrop-blur-md transition-transform hover:scale-105 active:scale-95 shadow-lg ${
                micEnabled ? 'bg-slate-800/90 text-slate-200 border border-slate-700' : 'bg-red-600 text-white'
              }`}
              title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
            >
              {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleCam}
              className={`p-3 rounded-full backdrop-blur-md transition-transform hover:scale-105 active:scale-95 shadow-lg ${
                camEnabled ? 'bg-slate-800/90 text-slate-200 border border-slate-700' : 'bg-red-600 text-white'
              }`}
              title={camEnabled ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            >
              {camEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mic Volume Meter Bar */}
        <div className="w-full mt-4 flex items-center gap-3 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl">
          <Volume2 className={`w-4 h-4 ${micEnabled && volumeLevel > 5 ? 'text-emerald-400' : 'text-slate-500'}`} />
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 rounded-full ${volumeLevel > 50 ? 'bg-emerald-400' : 'bg-blue-500'}`}
              style={{ width: `${micEnabled ? volumeLevel : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono w-10 text-right">
            {micEnabled ? `${volumeLevel}%` : 'Muted'}
          </span>
        </div>

        {/* Enter Meeting Button */}
        <button
          onClick={handleEnterRoom}
          className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>Masuk ke Meeting</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ================= Main Room Component =================
export default function Room() {
  const params = useParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [needsGuestInfo, setNeedsGuestInfo] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestInstitution, setGuestInstitution] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lobby & Optimizer states
  const [inLobby, setInLobby] = useState(true);
  const [initialCam, setInitialCam] = useState(true);
  const [initialMic, setInitialMic] = useState(true);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setNeedsGuestInfo(true);
        return;
      }
      try {
        const res = await fetch(`/api/meetings/${params.id}/token`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Gagal masuk ke room.');
        }
        const data = await res.json();
        setToken(data.token);
        if (data.server_url) setServerUrl(data.server_url);
        if (data.is_locked !== undefined) setIsLocked(data.is_locked);
      } catch (err: any) {
        alert(err.message || 'Gagal masuk ke room.');
        router.push('/dashboard');
      }
    };
    fetchToken();
  }, [params.id, router]);

  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/meetings/${params.id}/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName, institution: guestInstitution }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Meeting room tidak ditemukan atau sedang dikunci.');
      }
      const data = await res.json();
      setToken(data.token);
      if (data.server_url) setServerUrl(data.server_url);
      if (data.is_locked !== undefined) setIsLocked(data.is_locked);
      setNeedsGuestInfo(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Room tidak tersedia.');
    } finally {
      setIsJoining(false);
    }
  };

  if (needsGuestInfo && token === '') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Join Meeting
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Silakan masukkan nama Anda untuk bergabung sebagai Tamu
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-800/80">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {errorMsg}
              </div>
            )}
            <form className="space-y-5" onSubmit={handleGuestJoin}>
              <div>
                <label className="block text-sm font-medium text-slate-300">Nama Lengkap</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700/80 rounded-xl bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Budi Santoso"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Instansi / Perusahaan</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={guestInstitution}
                    onChange={(e) => setGuestInstitution(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700/80 rounded-xl bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="PT Maju Jaya"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all disabled:opacity-50"
              >
                {isJoining ? 'Menghubungkan...' : <span className="flex items-center gap-2">Masuk Room <ArrowRight className="w-4 h-4" /></span>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (token === '' || serverUrl === '') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-sm font-mono">Menyiapkan koneksi ruang rapat...</p>
      </div>
    );
  }

  // Pre-Join Lobby Stage
  if (inLobby) {
    return (
      <PreJoinLobby
        userName={guestName || 'Host'}
        onJoin={(cam, mic) => {
          setInitialCam(cam);
          setInitialMic(mic);
          setInLobby(false);
        }}
      />
    );
  }

  return (
    <LiveKitRoom
      video={initialCam}
      audio={initialMic}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: lowDataMode ? { width: 480, height: 360 } : { width: 1280, height: 720 },
        },
      }}
      onDisconnected={() => {
        if (localStorage.getItem('token')) {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }}
      data-lk-theme="default"
      className="flex flex-col md:flex-row w-full h-[100dvh] bg-slate-950 overflow-hidden relative"
    >
      {/* Floating Reactions on Top of Video */}
      <ReactionOverlay />

      {/* Collaborative Whiteboard Canvas Modal */}
      <WhiteboardModal isOpen={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />

      {/* Main Conference Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        <RoomHeader
          roomId={params.id as string}
          lowDataMode={lowDataMode}
          setLowDataMode={setLowDataMode}
          onOpenWhiteboard={() => setWhiteboardOpen(true)}
        />
        <div className="flex-1 overflow-hidden min-h-0 relative">
          <VideoConference />
        </div>
      </div>

      {/* Collaboration & Participant Sidebar */}
      <ParticipantSidebar
        roomId={params.id as string}
        livekitToken={token}
        initialIsLocked={isLocked}
        onOpenWhiteboard={() => setWhiteboardOpen(true)}
      />
    </LiveKitRoom>
  );
}
