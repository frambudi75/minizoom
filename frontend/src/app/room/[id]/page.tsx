'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { User, Building2, ArrowRight, MicOff, VideoOff, UserMinus, Users, Radio, Square, Download, Video } from 'lucide-react';
import { useRef } from 'react';

// Custom Participant Sidebar Component
function ParticipantSidebar({ roomId, livekitToken }: { roomId: string; livekitToken: string }) {
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    
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

    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // ================= Host Browser Screen & Audio Recorder =================
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Format detik ke format mm:ss / hh:mm:ss
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
            // Minta izin share tab / screen browser beserta audio
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: true
            });

            // Coba rekam juga mic host secara paralel
            let audioTracks = displayStream.getAudioTracks();
            let micStream: MediaStream | null = null;
            try {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (e) {
                // Mic ditolak/tidak ada, lanjut dengan display stream
            }

            let finalStream: MediaStream;
            if (micStream && micStream.getAudioTracks().length > 0 && audioTracks.length > 0) {
                // Mix display audio + mic audio menggunakan Web Audio API
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

            // Pilih MIME Type yang didukung browser
            const mimeTypes = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm',
                'video/mp4'
            ];
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

                // Stop semua tracks
                finalStream.getTracks().forEach(track => track.stop());
                if (micStream) micStream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
            };

            // Jika user menghentikan share lewat banner browser native
            displayStream.getVideoTracks()[0].onended = () => {
                if (recorder.state !== 'inactive') {
                    recorder.stop();
                }
            };

            recorder.start(1000); // chunk tiap 1 detik
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

    const handleMute = async (identity: string) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Sesi login telah berakhir. Silakan login kembali.');
            return;
        }
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
            console.error(err);
            alert('Gagal menghubungi server untuk mute peserta.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleKick = async (identity: string) => {
        if (!confirm('Yakin ingin mengeluarkan peserta ini dari meeting?')) return;
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Sesi login telah berakhir. Silakan login kembali.');
            return;
        }
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
            console.error(err);
            alert('Gagal menghubungi server untuk kick peserta.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleVideoOff = async (identity: string) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Sesi login telah berakhir. Silakan login kembali.');
            return;
        }
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
            console.error(err);
            alert('Gagal menghubungi server untuk matikan video peserta.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="w-full md:w-80 bg-[#1e1e1e] border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col h-[40vh] md:h-full overflow-y-auto z-10 shrink-0">
            {/* Host Meeting Recorder Section */}
            {isHost && (
                <div className="mb-6 p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                Meeting Recorder
                            </span>
                        </div>
                        {isRecording && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-medium">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                REC {formatTime(recordingTime)}
                            </div>
                        )}
                    </div>

                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-md shadow-red-900/20 active:scale-[0.98]"
                        >
                            <Radio className="w-4 h-4 animate-pulse" />
                            Start Recording
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-md shadow-amber-900/20 active:scale-[0.98]"
                        >
                            <Square className="w-3.5 h-3.5 fill-white" />
                            Stop & Save to Device
                        </button>
                    )}

                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed text-center">
                        {isRecording
                            ? "Rekaman sedang berjalan. Klik stop untuk mengunduh file video (.webm)."
                            : "Rekam layar & audio meeting, file otomatis tersimpan di browser Anda."}
                    </p>
                </div>
            )}

            <h3 className="text-slate-100 font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> 
                Participants ({participants.length})
            </h3>
            <div className="flex flex-col gap-3">
                {participants.map(p => (
                    <div key={p.identity} className="flex flex-col gap-2 bg-[#2d2d2d] p-3 rounded-xl border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-200 truncate">
                                {p.name || p.identity}
                                {p.isLocal && " (You)"}
                            </span>
                            <div className="flex gap-1">
                                {!p.isMicrophoneEnabled && (
                                    <span title="Mic is muted" className="flex items-center">
                                        <MicOff className="w-4 h-4 text-red-400 shrink-0" />
                                    </span>
                                )}
                                {!p.isCameraEnabled && (
                                    <span title="Camera is off" className="flex items-center">
                                        <VideoOff className="w-4 h-4 text-slate-500 shrink-0" />
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
                ))}
            </div>
        </div>
    );
}


export default function Room() {
  const params = useParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
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
        if (!res.ok) throw new Error();
        const data = await res.json();
        setToken(data.token);
        if (data.server_url) {
          setServerUrl(data.server_url);
        }
      } catch (err) {
        alert("Failed to join room. It may not exist or you lack permission.");
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
          if (!res.ok) throw new Error('Meeting not found');
          const data = await res.json();
          setToken(data.token);
          if (data.server_url) {
            setServerUrl(data.server_url);
          }
          setNeedsGuestInfo(false);
      } catch (err) {
          setErrorMsg("Meeting room not found or unavailable.");
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
      <div className="flex-1 overflow-hidden min-h-0">
        <VideoConference />
      </div>
      <ParticipantSidebar roomId={params.id as string} livekitToken={token} />
    </LiveKitRoom>
  );
}
