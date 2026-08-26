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
import { User, Building2, ArrowRight, MicOff, VideoOff, UserMinus, Users } from 'lucide-react';

// Custom Participant Sidebar Component
function ParticipantSidebar({ roomId, livekitToken }: { roomId: string; livekitToken: string }) {
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    
    // Cek apakah user ini host/superadmin dari LiveKit token (bukan backend JWT)
    // LiveKit token mengandung payload.video.roomAdmin = true untuk host & superadmin
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
            <h3 className="text-slate-100 font-semibold mb-6 flex items-center gap-2">
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

  if (token === '') {
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
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880"}
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
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
