import Link from 'next/link';
import {
  Video,
  ArrowRight,
  Lock,
  Users,
  MonitorSmartphone,
  Play,
  Sparkles,
  ShieldCheck,
  Zap,
  Radio,
  Smile,
  Sliders
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-tech-pattern text-slate-100 selection:bg-indigo-600 selection:text-white font-sans relative overflow-hidden">
      {/* Dynamic Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/3 translate-y-1/3 w-[650px] h-[650px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none animate-drift-slow" />
      <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Cyber Grid Overlay */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-35 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_40%,#000_70%,transparent_100%)]" />

      {/* Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight text-white">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Video className="w-4 h-4" />
            </div>
            <span>Minizoom</span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full">
              v1.4.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-800/50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-900/30 active:scale-95 hover:-translate-y-0.5"
            >
              Join Workspace
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-28 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Text */}
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Minizoom v1.4.0 Active (Build 2026-08)</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
              Next-gen meetings <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                built for high speed.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
              Zero downloads. Zero lag. Minizoom powers enterprise WebRTC video conferences with Pre-Join Lobby preview, in-meeting floating reactions, and low-data bandwidth optimization directly in your browser.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/register"
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-sm transition-all duration-200 active:scale-95 shadow-xl shadow-indigo-900/40 hover:-translate-y-0.5"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95"
              >
                Sign In to Dashboard
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" /> End-to-End SFU
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Up to 50+ Guests
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Low-Data Adaptive
              </div>
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-emerald-400" /> Live Reactions
              </div>
            </div>
          </div>

          {/* Right 3D Mockup */}
          <div className="relative w-full aspect-[4/3] max-w-[600px] mx-auto lg:mr-0 perspective-[2000px]">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-pink-600/20 rounded-full blur-3xl -z-10 opacity-70"></div>

            {/* The Glass App Window */}
            <div className="relative w-full h-full glass-panel rounded-3xl shadow-2xl overflow-hidden transform-gpu rotate-y-[-4deg] rotate-x-[4deg] hover:rotate-0 transition-transform duration-700 ease-out flex flex-col border border-slate-700/60">
              {/* Window Header */}
              <div className="h-10 border-b border-slate-800/80 flex items-center justify-between px-4 bg-slate-950/80">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Minizoom Secure SFU Room • v1.4.0</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              {/* Video Grid */}
              <div className="flex-1 p-3 grid grid-cols-2 gap-3 bg-slate-950/90">
                {/* Participant 1 */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-slate-800">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-60"></div>
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-white text-[11px] px-2 py-0.5 rounded-md font-medium border border-slate-700/60">
                    Sarah Jenkins
                  </div>
                </div>

                {/* Participant 2 */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-900/60 to-slate-900 border border-slate-800">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-60"></div>
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-white text-[11px] px-2 py-0.5 rounded-md font-medium border border-slate-700/60">
                    David Chen
                  </div>
                  <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-md border border-slate-700/60 text-emerald-400 text-xs">
                    🎉
                  </div>
                </div>

                {/* Participant 3 */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/60 to-slate-900 border border-slate-800">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-60"></div>
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-white text-[11px] px-2 py-0.5 rounded-md font-medium border border-slate-700/60">
                    Emma Wilson
                  </div>
                </div>

                {/* Participant 4 (You) */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-indigo-500 shadow-inner">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50"></div>
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-white text-[11px] px-2 py-0.5 rounded-md font-semibold border border-indigo-500/50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> You (Host)
                  </div>
                </div>
              </div>

              {/* Bottom Control Mockup */}
              <div className="h-14 border-t border-slate-800 bg-slate-950 flex items-center justify-center gap-3 px-6">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 text-xs">🎙️</div>
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 text-xs">📹</div>
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-xs">✋</div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs">🚀</div>
                <div className="w-10 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white text-xs font-bold">End</div>
              </div>
            </div>

            {/* Floating Live Badge */}
            <div
              className="absolute -bottom-5 -left-6 glass-panel p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce hover:animate-none border border-slate-700/80"
              style={{ animationDuration: '3.5s' }}
            >
              <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                <Play className="w-4 h-4 ml-0.5 fill-emerald-400 text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-100">Live WebRTC Session</p>
                <p className="text-[10px] text-slate-400 font-mono">Minizoom SFU • Ultra Low Latency</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
