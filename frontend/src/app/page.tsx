import Link from 'next/link';
import { Video, ArrowRight, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-950 text-slate-50">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/50 text-blue-400 text-sm font-medium mb-8 backdrop-blur-md shadow-lg shadow-black/20">
          <Video className="w-4 h-4" />
          <span>Minizoom is now live for Beta</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
          High-performance <br /> video meetings.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Connect with up to 50 participants simultaneously. 
          Experience crystal-clear audio and video powered by our advanced WebRTC infrastructure.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/register" className="group flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/20 ring-1 ring-blue-500/50">
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="flex items-center justify-center px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-semibold transition-all duration-300 border border-slate-700/50 hover:scale-105 active:scale-95 shadow-lg">
            Sign In
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/50 backdrop-blur-md shadow-xl transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 text-blue-400 ring-1 ring-blue-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-100">Lightning Fast</h3>
            <p className="text-slate-400 leading-relaxed">Powered by FastAPI and Next.js for sub-second responses and seamless UI.</p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/50 backdrop-blur-md shadow-xl transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 text-purple-400 ring-1 ring-purple-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-100">Admin Approval</h3>
            <p className="text-slate-400 leading-relaxed">Secure by design. All new accounts require superadmin approval to join.</p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/50 backdrop-blur-md shadow-xl transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 text-emerald-400 ring-1 ring-emerald-500/20">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-100">WebRTC SFU</h3>
            <p className="text-slate-400 leading-relaxed">Dedicated LiveKit servers routing your video and audio with lowest latency.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
