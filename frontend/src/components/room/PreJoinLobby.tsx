'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Camera,
  Volume2,
  ArrowRight,
} from 'lucide-react';

export function PreJoinLobby({
  userName,
  onJoin,
}: {
  userName: string;
  onJoin: (camEnabled: boolean, micEnabled: boolean, videoDeviceId?: string, audioDeviceId?: string) => void;
}) {
  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startMediaStream = useCallback(async (vId?: string, aId?: string, keepCam = true, keepMic = true) => {
    try {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: vId ? { deviceId: { exact: vId } } : true,
        audio: aId ? { deviceId: { exact: aId } } : true,
      });

      stream.getVideoTracks().forEach((t) => (t.enabled = keepCam));
      stream.getAudioTracks().forEach((t) => (t.enabled = keepMic));

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Enumerate devices after permission granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vids = devices.filter((d) => d.kind === 'videoinput');
      const auds = devices.filter((d) => d.kind === 'audioinput');
      setVideoDevices(vids);
      setAudioDevices(auds);

      const currentVidTrack = stream.getVideoTracks()[0];
      const currentAudTrack = stream.getAudioTracks()[0];
      if (!vId && currentVidTrack?.getSettings()?.deviceId) {
        setSelectedVideoId(currentVidTrack.getSettings().deviceId || '');
      }
      if (!aId && currentAudTrack?.getSettings()?.deviceId) {
        setSelectedAudioId(currentAudTrack.getSettings().deviceId || '');
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
  }, []);

  useEffect(() => {
    startMediaStream();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [startMediaStream]);

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

  const handleVideoDeviceChange = (newVideoId: string) => {
    setSelectedVideoId(newVideoId);
    startMediaStream(newVideoId, selectedAudioId || undefined, camEnabled, micEnabled);
  };

  const handleAudioDeviceChange = (newAudioId: string) => {
    setSelectedAudioId(newAudioId);
    startMediaStream(selectedVideoId || undefined, newAudioId, camEnabled, micEnabled);
  };

  const handleEnterRoom = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onJoin(camEnabled, micEnabled, selectedVideoId || undefined, selectedAudioId || undefined);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10 flex flex-col items-center">
        <h2 className="text-xl font-bold text-slate-100 mb-1">Pre-Join Lobby</h2>
        <p className="text-xs text-slate-400 mb-6 text-center">
          Halo <strong className="text-slate-200">{userName}</strong>, periksa kamera dan audio Anda sebelum bergabung.
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

        {/* Device Selectors (Camera & Microphone) */}
        {(videoDevices.length > 0 || audioDevices.length > 0) && (
          <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl">
              <Camera className="w-4 h-4 text-blue-400 shrink-0" />
              <select
                value={selectedVideoId}
                onChange={(e) => handleVideoDeviceChange(e.target.value)}
                className="w-full bg-transparent text-slate-200 focus:outline-none truncate text-xs"
                title="Pilih Kamera"
              >
                {videoDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId} className="bg-slate-900 text-slate-200">
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl">
              <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
              <select
                value={selectedAudioId}
                onChange={(e) => handleAudioDeviceChange(e.target.value)}
                className="w-full bg-transparent text-slate-200 focus:outline-none truncate text-xs"
                title="Pilih Mikrofon"
              >
                {audioDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId} className="bg-slate-900 text-slate-200">
                    {d.label || `Microphone ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Mic Volume Meter Bar */}
        <div className="w-full mt-3 flex items-center gap-3 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl">
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

