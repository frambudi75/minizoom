'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';

export default function Room() {
  const params = useParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  
  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        router.push('/login');
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
      onDisconnected={() => router.push('/dashboard')}
      data-lk-theme="default"
      style={{ height: '100vh', backgroundColor: '#0f172a' }}
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
