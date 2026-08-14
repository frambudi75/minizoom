'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { User, Building2, ArrowRight } from 'lucide-react';

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
      serverUrl="wss://minizoom-befa1owr.livekit.cloud"
      connect={true}
      onDisconnected={() => {
          if (localStorage.getItem('token')) {
              router.push('/dashboard');
          } else {
              router.push('/');
          }
      }}
      data-lk-theme="default"
      style={{ height: '100vh', backgroundColor: '#0f172a' }}
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
