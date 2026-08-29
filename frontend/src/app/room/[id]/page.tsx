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
  Settings
} from 'lucide-react';

// ================= Floating Reactions Overlay =================
interface FloatingEmoji {
  id: string;
  emoji: string;
  sender: string;
  left: number; // percentage across screen
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
          left: Math.floor(Math.random() * 60) + 20, // 20% to 80%
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

// ================= Reaction Picker =================
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
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border shadow-sm ${
          open
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
        }`}
        title="Send Reaction"
      >
        <Smile className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline">React</span>
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl flex gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                sendReaction(emoji);
                setOpen(false);
              }}
              className="text-xl p-2 hover:bg-slate-800 rounded-xl transition-transform hover:scale-125 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ================= Custom Participant & Chat Sidebar Component =================
function ParticipantSidebar({
  roomId,
  livekitToken,
  initialIsLocked = false,
}: {
  roomId: string;
  livekitToken: string;
  initialIsLocked?: boolean;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { chatMessages, send, isSending } = useChat();

  const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('participants');
  const [chatInput, setChatInput] = useState('');
  const [unreadChat, setUnreadChat] = useState(0);
  const [isLocked, setIsLocked] = useState(initialIsLocked);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Cek apakah user ini host/superadmin dari LiveKit token
  const isHost = (() => {
    if (!livekitToken) return false;
    try {
      const payload = JSON.parse(atob(livekitToken.split('.')[1]));
      return payload?.video?.roomAdmin === true;
    } catch {
      return false;
    }
  })();

  // Status Raise Hand user lokal
  const isLocalHandRaised = (() => {
    try {
      return JSON.parse(localParticipant?.metadata || '{}')?.isHandRaised === true;
    } catch {
      return false;
    }
  })();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Track unread messages saat tab bukan chat
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChat(0);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (chatMessages.length > 0) {
        setUnreadChat((prev) => prev + 1);
      }
    }
  }, [chatMessages.length, activeTab]);

  // ================= Host Browser Screen & Audio Recorder =================
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
        console.error('Recording error:', err);
        alert('Gagal memulai perekaman: ' + (err.message || 'Izin ditolak'));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // ================= Host Controls =================
  const handleMute = async (identity: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setActionLoading(`mute-${identity}`);
    try {
      const res = await fetch(`/api/meetings/${roomId}/mute/${identity}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Gagal mute: ${data.detail || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      alert('Gagal menghubungi server untuk mute peserta.');
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
      const res = await fetch(`/api/meetings/${roomId}/mute-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Gagal mute all: ${data.detail || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      alert('Gagal menghubungi server.');
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
    } catch (err) {
      alert('Gagal mengubah status kunci ruangan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleKick = async (identity: string) => {
    if (!confirm('Yakin ingin mengeluarkan peserta ini dari meeting?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setActionLoading(`kick-${identity}`);
    try {
      const res = await fetch(`/api/meetings/${roomId}/kick/${identity}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Gagal kick: ${data.detail || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      alert('Gagal menghubungi server untuk kick peserta.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVideoOff = async (identity: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setActionLoading(`video-${identity}`);
    try {
      const res = await fetch(`/api/meetings/${roomId}/video-off/${identity}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Gagal matikan video: ${data.detail || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      alert('Gagal menghubungi server untuk matikan video peserta.');
    } finally {
      setActionLoading(null);
    }
  };

  // ================= Raise Hand =================
  const handleToggleRaiseHand = async () => {
    if (!localParticipant) return;
    try {
      const currentMeta = JSON.parse(localParticipant.metadata || '{}');
      const nextHand = !currentMeta.isHandRaised;
      await localParticipant.setMetadata(JSON.stringify({ ...currentMeta, isHandRaised: nextHand }));
    } catch (err) {
      console.error('Raise hand error:', err);
    }
  };

  // ================= Send Chat Message =================
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;
    try {
      await send(chatInput.trim());
      setChatInput('');
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Send chat error:', err);
    }
  };

  return (
    <div className="w-full md:w-80 bg-[#1e1e1e] border-t md:border-t-0 md:border-l border-slate-800 flex flex-col h-[45vh] md:h-full overflow-hidden z-10 shrink-0">
      {/* Sidebar Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/50">
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'participants'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Participants ({participants.length})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all relative ${
            activeTab === 'chat'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          In-Meeting Chat
          {unreadChat > 0 && activeTab !== 'chat' && (
            <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
              {unreadChat}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'participants' ? (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Quick Interactive Actions (Raise Hand + Reactions) */}
          <div className="flex gap-2">
            <button
              onClick={handleToggleRaiseHand}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                isLocalHandRaised
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Hand className={`w-4 h-4 ${isLocalHandRaised ? 'text-amber-400' : ''}`} />
              {isLocalHandRaised ? 'Lower Hand ✋' : 'Raise Hand ✋'}
            </button>
            <ReactionPicker />
          </div>

          {/* Host Meeting Controls Card */}
          {isHost && (
            <div className="p-3.5 bg-slate-900/90 border border-slate-700/70 rounded-2xl shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Host Controls</span>
                </div>
                <button
                  onClick={handleToggleLock}
                  disabled={actionLoading === 'toggle-lock'}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    isLocked
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                  title={isLocked ? 'Room is locked. Click to unlock' : 'Room is open. Click to lock'}
                >
                  {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {isLocked ? 'Locked' : 'Open'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleMuteAll}
                  disabled={actionLoading === 'mute-all'}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
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

          {/* Participants List */}
          <div className="flex flex-col gap-2.5">
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
                  className={`flex flex-col gap-2 bg-[#2d2d2d] p-3 rounded-xl border transition-all ${
                    isHandUp
                      ? 'border-amber-500/60 ring-1 ring-amber-500/40 bg-amber-950/20'
                      : 'border-slate-700/50'
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
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleMute(p.identity)}
                        disabled={actionLoading === `mute-${p.identity}`}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 disabled:opacity-50 px-2 py-1.5 rounded-md transition-colors"
                        title="Mute Microphone"
                      >
                        <MicOff className="w-3 h-3" /> {actionLoading === `mute-${p.identity}` ? '...' : 'Mute'}
                      </button>
                      <button
                        onClick={() => handleVideoOff(p.identity)}
                        disabled={actionLoading === `video-${p.identity}`}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 disabled:opacity-50 px-2 py-1.5 rounded-md transition-colors"
                        title="Turn Off Video"
                      >
                        <VideoOff className="w-3 h-3" /> {actionLoading === `video-${p.identity}` ? '...' : 'Stop Vid'}
                      </button>
                      <button
                        onClick={() => handleKick(p.identity)}
                        disabled={actionLoading === `kick-${p.identity}`}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50 px-2 py-1.5 rounded-md transition-colors"
                        title="Kick Participant"
                      >
                        <UserMinus className="w-3 h-3" /> {actionLoading === `kick-${p.identity}` ? '...' : 'Kick'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Chat Tab */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Chat Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No messages yet. Say hello!
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
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700/60'
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

          {/* Chat Input Form */}
          <form
            onSubmit={handleSendChat}
            className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isSending}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shrink-0 active:scale-95"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ================= Room Header with Low Data Mode =================
function RoomHeader({
  roomId,
  lowDataMode,
  setLowDataMode,
}: {
  roomId: string;
  lowDataMode: boolean;
  setLowDataMode: (val: boolean) => void;
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
    <div className="h-12 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300 z-10 shrink-0">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Room:</span>
          <span className="font-mono text-slate-200 truncate max-w-[100px] sm:max-w-[200px]">{roomId}</span>
        </div>
        <button
          onClick={handleCopy}
          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition-colors shrink-0"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* Low-Data Mode Optimizer Button */}
        <button
          onClick={() => setLowDataMode(!lowDataMode)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
            lowDataMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title={
            lowDataMode
              ? 'Low-Data Mode active: Lower video resolution to save bandwidth'
              : 'Click to enable Low-Data Mode for unstable connections'
          }
        >
          <Wifi className={`w-3.5 h-3.5 ${lowDataMode ? 'text-amber-400' : ''}`} />
          <span className="hidden sm:inline">{lowDataMode ? 'Low Data (On)' : 'Normal Data'}</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold font-mono text-xs shadow-sm">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>{participants.length} Peserta</span>
        </span>
      </div>
    </div>
  );
}

// ================= Pre-Join Lobby (Audio & Video Test Screen) =================
interface PreJoinProps {
  roomId: string;
  initialName?: string;
  initialInstitution?: string;
  isLoggedIn: boolean;
  onJoin: (settings: { micEnabled: boolean; videoEnabled: boolean; name?: string; institution?: string }) => void;
}

function PreJoinLobby({ roomId, initialName = '', initialInstitution = '', isLoggedIn, onJoin }: PreJoinProps) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [guestName, setGuestName] = useState(initialName);
  const [guestInstitution, setGuestInstitution] = useState(initialInstitution);
  const [micLevel, setMicLevel] = useState(0);

  // Device selections
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Setup preview stream
  const startPreview = async () => {
    // Stop old stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
        video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Audio Meter
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }

      // Enumerate available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputDevices(devices.filter((d) => d.kind === 'audioinput'));
      setVideoInputDevices(devices.filter((d) => d.kind === 'videoinput'));
    } catch (err) {
      console.warn('Lobby camera/mic preview permission denied or unavailable:', err);
    }
  };

  useEffect(() => {
    startPreview();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [selectedAudioId, selectedVideoId]);

  // Toggle video track on/off in preview
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = videoEnabled;
      });
    }
  }, [videoEnabled]);

  // Toggle audio track on/off in preview
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = micEnabled;
      });
    }
    if (!micEnabled) setMicLevel(0);
  }, [micEnabled]);

  const handleJoinClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn && !guestName.trim()) {
      alert('Mohon isi nama lengkap Anda sebelum bergabung.');
      return;
    }

    // Stop lobby stream before entering room
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    onJoin({
      micEnabled,
      videoEnabled,
      name: guestName,
      institution: guestInstitution,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Pre-Join Lobby
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Ready to join the meeting?</h1>
          <p className="text-sm text-slate-400 font-mono">Room ID: {roomId}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Video Preview & Audio Meter (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="relative aspect-video bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center group">
              {videoEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-2xl">
                    {guestName ? guestName.charAt(0).toUpperCase() : <VideoOff className="w-8 h-8 text-slate-600" />}
                  </div>
                  <span className="text-xs font-medium">Camera is turned off</span>
                </div>
              )}

              {/* In-Preview Quick Toggles */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/60 shadow-xl">
                <button
                  type="button"
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`p-3 rounded-xl transition-all shadow-md active:scale-95 ${
                    micEnabled
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                  title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={`p-3 rounded-xl transition-all shadow-md active:scale-95 ${
                    videoEnabled
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                  title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {videoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-3 rounded-xl transition-all shadow-md active:scale-95 ${
                    showSettings ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Device Settings"
                >
                  <Sliders className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mic Volume Level Visualizer */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
              <Volume2 className={`w-4 h-4 shrink-0 ${micEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
              <div className="flex-1 flex gap-1 h-2 items-center bg-slate-950 rounded-full px-1 overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-75"
                  style={{ width: `${micEnabled ? micLevel : 0}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
                {micEnabled ? `${micLevel}%` : 'Off'}
              </span>
            </div>

            {/* Device Settings Drawer */}
            {showSettings && (
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    Camera Device
                  </label>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {videoInputDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera (${d.deviceId.slice(0, 5)})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    Microphone Device
                  </label>
                  <select
                    value={selectedAudioId}
                    onChange={(e) => setSelectedAudioId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {audioInputDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone (${d.deviceId.slice(0, 5)})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Right: User Information & Join Action (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                {isLoggedIn ? 'Joining as Member' : 'Guest Registration'}
              </h2>

              {!isLoggedIn ? (
                <form id="joinForm" onSubmit={handleJoinClick} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Your Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Institution / Company (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={guestInstitution}
                        onChange={(e) => setGuestInstitution(e.target.value)}
                        placeholder="e.g. PT Maju Bersama"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                  <p className="text-xs text-slate-400">Logged in account:</p>
                  <p className="text-base font-bold text-slate-100">{initialName || 'Host / Registered User'}</p>
                  <p className="text-xs text-emerald-400 font-medium">✓ Authentication verified</p>
                </div>
              )}

              {/* Status summary */}
              <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-800/50 space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Microphone:</span>
                  <span className={micEnabled ? 'text-emerald-400 font-medium' : 'text-red-400'}>
                    {micEnabled ? 'Unmuted' : 'Muted'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Camera:</span>
                  <span className={videoEnabled ? 'text-emerald-400 font-medium' : 'text-red-400'}>
                    {videoEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleJoinClick}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 active:scale-95 hover:-translate-y-0.5"
            >
              <span>Join Meeting Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [inLobby, setInLobby] = useState(true);

  // Initial media preferences from Lobby
  const [initialAudio, setInitialAudio] = useState(true);
  const [initialVideo, setInitialVideo] = useState(true);

  // Performance / Low data mode toggle
  const [lowDataMode, setLowDataMode] = useState(false);

  useEffect(() => {
    const checkAuthAndPrepare = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setIsLoggedIn(true);
        try {
          const res = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUserName(data.name);
          }
        } catch {}
      }
    };
    checkAuthAndPrepare();
  }, []);

  const handleLobbyJoin = async (settings: {
    micEnabled: boolean;
    videoEnabled: boolean;
    name?: string;
    institution?: string;
  }) => {
    setInitialAudio(settings.micEnabled);
    setInitialVideo(settings.videoEnabled);

    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // Fetch token for logged in user
      try {
        const res = await fetch(`/api/meetings/${params.id}/token`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Gagal masuk ke ruang meeting.');
        }
        const data = await res.json();
        setToken(data.token);
        if (data.server_url) setServerUrl(data.server_url);
        if (data.is_locked !== undefined) setIsLocked(data.is_locked);
        setInLobby(false);
      } catch (err: any) {
        alert(err.message || 'Gagal masuk meeting.');
        router.push('/dashboard');
      }
    } else {
      // Guest Join
      try {
        const res = await fetch(`/api/meetings/${params.id}/guest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: settings.name,
            institution: settings.institution || 'Guest',
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Ruang meeting tidak ditemukan atau sedang dikunci.');
        }
        const data = await res.json();
        setToken(data.token);
        if (data.server_url) setServerUrl(data.server_url);
        if (data.is_locked !== undefined) setIsLocked(data.is_locked);
        setInLobby(false);
      } catch (err: any) {
        alert(err.message || 'Gagal bergabung sebagai tamu.');
      }
    }
  };

  // Render Pre-Join Lobby first
  if (inLobby) {
    return (
      <PreJoinLobby
        roomId={params.id as string}
        initialName={userName}
        isLoggedIn={isLoggedIn}
        onJoin={handleLobbyJoin}
      />
    );
  }

  if (token === '' || serverUrl === '') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="font-medium text-sm">Connecting to secure WebRTC room...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={initialVideo}
      audio={initialAudio}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: true,
          videoSimulcastLayers: lowDataMode ? [] : undefined,
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
      className="flex flex-col md:flex-row w-full h-[100dvh] bg-[#0f172a] overflow-hidden relative"
    >
      <ReactionOverlay />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        <RoomHeader
          roomId={params.id as string}
          lowDataMode={lowDataMode}
          setLowDataMode={setLowDataMode}
        />
        <div className="flex-1 overflow-hidden min-h-0">
          <VideoConference />
        </div>
      </div>

      <ParticipantSidebar
        roomId={params.id as string}
        livekitToken={token}
        initialIsLocked={isLocked}
      />
    </LiveKitRoom>
  );
}
