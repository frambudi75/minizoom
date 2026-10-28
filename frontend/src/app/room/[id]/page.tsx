'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { User, Building2, ArrowRight } from 'lucide-react';
import { ReactionOverlay } from '@/components/room/ReactionOverlay';
import { WhiteboardModal } from '@/components/room/WhiteboardModal';
import { RoomHeader } from '@/components/room/RoomHeader';
import { PreJoinLobby } from '@/components/room/PreJoinLobby';
import { ParticipantSidebar } from '@/components/room/ParticipantSidebar';

export default function Room() {
  const params = useParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [needsGuestInfo, setNeedsGuestInfo] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestInstitution, setGuestInstitution] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lobby & Optimizer states
  const [inLobby, setInLobby] = useState(true);
  const [initialCam, setInitialCam] = useState(true);
  const [initialMic, setInitialMic] = useState(true);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | undefined>(undefined);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | undefined>(undefined);
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
        if (data.is_host !== undefined) setIsHost(Boolean(data.is_host));
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
      setIsHost(false);
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
        userName={guestName || 'Peserta'}
        onJoin={(cam, mic, vDevId, aDevId) => {
          setInitialCam(cam);
          setInitialMic(mic);
          setSelectedVideoDeviceId(vDevId);
          setSelectedAudioDeviceId(aDevId);
          setInLobby(false);
        }}
      />
    );
  }

  return (
    <LiveKitRoom
      video={initialCam ? (selectedVideoDeviceId ? { deviceId: selectedVideoDeviceId } : true) : false}
      audio={initialMic ? (selectedAudioDeviceId ? { deviceId: selectedAudioDeviceId } : true) : false}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          deviceId: selectedVideoDeviceId,
          resolution: lowDataMode ? { width: 480, height: 360 } : { width: 1280, height: 720 },
        },
        audioCaptureDefaults: {
          deviceId: selectedAudioDeviceId,
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
      <WhiteboardModal
        isOpen={whiteboardOpen}
        onClose={() => setWhiteboardOpen(false)}
        isHost={isHost}
      />

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
