import Link from 'next/link';
import {
  Video,
  ArrowRight,
  Lock,
  Users,
  MonitorSmartphone,
  Play,
  ShieldCheck,
  Zap,
  Smile,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-enterprise-dark text-slate-100 selection:bg-blue-600 selection:text-white font-sans relative overflow-hidden">
      {/* Subtle clean top ambient glow (Navy/Blue only) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg tracking-tight text-white">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Video className="w-4 h-4" />
            </div>
            <span>Minizoom</span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
              v1.4.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors shadow-sm active:scale-95"
            >
              Join Workspace
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Text */}
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Minizoom v1.4.0 Enterprise</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] text-white">
              Next-generation video meetings built for speed.
            </h1>

            <p className="text-base text-slate-400 leading-relaxed max-w-xl">
              Direct in-browser WebRTC video conferencing with real-time Pre-Join lobby, in-meeting chat, screen recording, and adaptive bandwidth optimization.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/register"
                className="group flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95 shadow-md"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-semibold text-sm transition-colors active:scale-95"
              >
                Sign In to Dashboard
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" /> Secure SFU
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Multi-Guest Rooms
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Low-Data Mode
              </div>
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-emerald-400" /> Live Reactions
              </div>
            </div>
          </div>

          {/* Right Clean App Window Mockup */}
          <div className="relative w-full aspect-[4/3] max-w-[580px] mx-auto lg:mr-0">
            {/* The Clean App Window */}
            <div className="relative w-full h-full clean-card rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
              {/* Window Header */}
              <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Minizoom Room • v1.4.0</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>

              {/* Video Grid */}
              <div className="flex-1 p-3 grid grid-cols-2 gap-3 bg-slate-950">
                {/* Participant 1 */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-70"></div>
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 text-white text-[11px] px-2 py-0.5 rounded font-medium border border-slate-800">
                    Sarah Jenkins
                  </div>
                </div>

                {/* Participant 2 */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-70"></div>
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 text-white text-[11px] px-2 py-0.5 rounded font-medium border border-slate-800">
                    David Chen
                  </div>
                </div>

                {/* Participant 3 */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-70"></div>
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 text-white text-[11px] px-2 py-0.5 rounded font-medium border border-slate-800">
                    Emma Wilson
                  </div>
                </div>

                {/* Participant 4 (You) */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-blue-500/50">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 text-white text-[11px] px-2 py-0.5 rounded font-medium border border-blue-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> You (Host)
                  </div>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="h-12 border-t border-slate-800 bg-slate-950 flex items-center justify-center gap-3 px-4">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-xs">🎙️</div>
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-xs">📹</div>
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-xs">✋</div>
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-xs">💬</div>
                <div className="w-12 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-semibold">End</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
