'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  useParticipants,
  useLocalParticipant,
  useChat,
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  User,
  Building2,
  ArrowRight,
  MicOff,
  VideoOff,
  UserMinus,
  Users,
  Radio,
  Square,
  Video,
  MessageSquare,
  Hand,
  Lock,
  Unlock,
  VolumeX,
  Send,
  Sparkles
} from 'lucide-react';

// Custom Participant & Chat Sidebar Component
function ParticipantSidebar({ roomId, livekitToken, initialIsLocked = false }: { roomId: string; livekitToken: string; initialIsLocked?: boolean }) {
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
                setUnreadChat(prev => prev + 1);
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
                setRecordingTime(prev => prev + 1);
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
                audio: true
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
                    ...dest.stream.getAudioTracks()
                ]);
            } else if (micStream && micStream.getAudioTracks().length > 0) {
                finalStream = new MediaStream([
                    ...displayStream.getVideoTracks(),
                    ...micStream.getAudioTracks()
                ]);
            } else {
                finalStream = displayStream;
            }

            const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
            const selectedMime = mimeTypes.find(t => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || '';

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

                finalStream.getTracks().forEach(track => track.stop());
                if (micStream) micStream.getTracks().forEach(track => track.stop());
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
                console.error("Recording error:", err);
                alert("Gagal memulai perekaman: " + (err.message || 'Izin ditolak'));
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
                headers: { Authorization: `Bearer ${token}` }
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
                headers: { Authorization: `Bearer ${token}` }
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
                headers: { Authorization: `Bearer ${token}` }
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
                headers: { Authorization: `Bearer ${token}` }
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
                headers: { Authorization: `Bearer ${token}` }
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
            console.error("Raise hand error:", err);
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
            console.error("Send chat error:", err);
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
                    {/* Quick Interactive Actions (Raise Hand) */}
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
                    </div>

                    {/* Host Meeting Controls Card */}
                    {isHost && (
                        <div className="p-3.5 bg-slate-900/90 border border-slate-700/70 rounded-2xl shadow-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-purple-400">
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
                                    title={isLocked ? "Room is locked. Click to unlock" : "Room is open. Click to lock"}
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
                        {participants.map(p => {
                            const isHandUp = (() => {
                                try {
                                    return JSON.parse(p.metadata || '{}')?.isHandRaised === true;
                                } catch {
                                    return false;
                                }
                            })();

                            return (
                                <div key={p.identity} className={`flex flex-col gap-2 bg-[#2d2d2d] p-3 rounded-xl border transition-all ${
                                    isHandUp ? 'border-amber-500/60 ring-1 ring-amber-500/40 bg-amber-950/20' : 'border-slate-700/50'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            {isHandUp && (
                                                <span title="Hand Raised" className="text-base animate-bounce shrink-0">
                                                    ✋
                                                </span>
                                            )}
                                            <span className="text-sm font-medium text-slate-200 truncate">
                                                {p.name || p.identity}
                                                {p.isLocal && " (You)"}
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
                                const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-1.5 mb-1 px-1">
                                            <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[120px]">
                                                {isMe ? 'You' : senderName}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                                        </div>
                                        <div className={`p-2.5 rounded-2xl text-xs max-w-[88%] break-words shadow-sm leading-relaxed ${
                                            isMe 
                                                ? 'bg-indigo-600 text-white rounded-br-xs' 
                                                : 'bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700/60'
                                        }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Form */}
                    <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
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


function RoomHeader({ roomId }: { roomId: string }) {
  const participants = useParticipants();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Link room: " + window.location.href);
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
          <span className="font-mono text-purple-300 truncate max-w-[120px] sm:max-w-[220px]">{roomId}</span>
        </div>
        <button
          onClick={handleCopy}
          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition-colors shrink-0"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold font-mono text-xs shadow-sm">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>{participants.length} Peserta</span>
        </span>
      </div>
    </div>
  );
}

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
  
  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setNeedsGuestInfo(true);
        return;
      }
      try {
        const res = await fetch(`/api/meetings/${params.id}/token`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to join room.");
        }
        const data = await res.json();
        setToken(data.token);
        if (data.server_url) setServerUrl(data.server_url);
        if (data.is_locked !== undefined) setIsLocked(data.is_locked);
      } catch (err: any) {
        alert(err.message || "Failed to join room.");
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
              body: JSON.stringify({ name: guestName, institution: guestInstitution })
          });
          if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.detail || 'Meeting room not found or locked.');
          }
          const data = await res.json();
          setToken(data.token);
          if (data.server_url) setServerUrl(data.server_url);
          if (data.is_locked !== undefined) setIsLocked(data.is_locked);
          setNeedsGuestInfo(false);
      } catch (err: any) {
          setErrorMsg(err.message || "Meeting room not found or unavailable.");
      } finally {
          setIsJoining(false);
      }
  };

  if (needsGuestInfo && token === '') {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
              <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
                Join Meeting
              </h2>
              <p className="mt-2 text-center text-sm text-slate-400">
                Please enter your details to join as a guest
              </p>
            </div>
      
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
              <div className="bg-slate-900/50 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-800/60 ring-1 ring-white/10">
                
                {errorMsg && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                        {errorMsg}
                    </div>
                )}
                <form className="space-y-6" onSubmit={handleGuestJoin}>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                      Full Name
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
      
                  <div>
                    <label htmlFor="institution" className="block text-sm font-medium text-slate-300">
                      Institution / Company
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        id="institution"
                        name="institution"
                        type="text"
                        required
                        value={guestInstitution}
                        onChange={(e) => setGuestInstitution(e.target.value)}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="PT Maju Jaya"
                      />
                    </div>
                  </div>
      
                  <div>
                    <button
                      type="submit"
                      disabled={isJoining}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900 transition-all hover:shadow-purple-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {isJoining ? 'Connecting...' : (
                          <span className="flex items-center gap-2">Join Room <ArrowRight className="w-4 h-4" /></span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
      );
  }

  if (token === '' || serverUrl === '') {
    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p>Connecting to secure room...</p>
        </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      onDisconnected={() => {
          if (localStorage.getItem('token')) {
              router.push('/dashboard');
          } else {
              router.push('/');
          }
      }}
      data-lk-theme="default"
      className="flex flex-col md:flex-row w-full h-[100dvh] bg-[#0f172a] overflow-hidden"
    >
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <RoomHeader roomId={params.id as string} />
        <div className="flex-1 overflow-hidden min-h-0">
          <VideoConference />
        </div>
      </div>
      <ParticipantSidebar roomId={params.id as string} livekitToken={token} initialIsLocked={isLocked} />
    </LiveKitRoom>
  );
}
