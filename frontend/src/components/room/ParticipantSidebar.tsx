'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  useParticipants,
  useLocalParticipant,
  useChat,
  useRoomContext,
} from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import {
  MicOff,
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
  PenTool,
  Vote,
  FileText,
  Download,
  Plus,
  Volume1,
} from 'lucide-react';
import { sounds } from './SoundSynthesizer';

export interface PollOption {
  id: number;
  text: string;
  votes: string[]; // participant identities
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  creator: string;
  active: boolean;
}

export function ParticipantSidebar({
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
  const pollsRef = useRef<Poll[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  // Shared Notes State
  const [notes, setNotes] = useState('');
  const notesRef = useRef('');
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    pollsRef.current = polls;
  }, [polls]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

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

  // Sync current Polls & Notes to newly joined participants (when Host is online)
  useEffect(() => {
    if (!room || !isHost || !localParticipant) return;
    const handleParticipantConnected = () => {
      setTimeout(() => {
        try {
          if (pollsRef.current.length > 0 || notesRef.current.trim() !== '') {
            const payload = JSON.stringify({
              type: 'state_sync',
              polls: pollsRef.current,
              notes: notesRef.current,
            });
            localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
          }
        } catch {}
      }, 1200);
    };
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
    };
  }, [room, isHost, localParticipant]);

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
      } else if (data.type === 'state_sync') {
        if (Array.isArray(data.polls) && data.polls.length > 0) {
          setPolls((prev) => (prev.length === 0 ? data.polls : prev));
        }
        if (typeof data.notes === 'string' && data.notes.trim() !== '') {
          setNotes((prev) => (prev.trim() === '' ? data.notes : prev));
        }
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

      const audioTracks = displayStream.getAudioTracks();
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {}

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

