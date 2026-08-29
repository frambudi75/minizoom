import Link from 'next/link';
import { Video, ArrowRight, Lock, Users, MonitorSmartphone, Play } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      {/* Navbar */}
      <nav className="border-b border-slate-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-indigo-950">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-inner shadow-indigo-400/20">
              <Video className="w-5 h-5" />
            </div>
            Minizoom
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Log in
            </Link>
            <Link href="/register" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-95">
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              v1.4.0 Active
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Meetings that <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">just work.</span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-xl">
              No downloads. No complicated setups. Minizoom gives your team a dedicated, lightning-fast virtual room directly in the browser. 
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="group flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold transition-all duration-200 active:scale-95 shadow-xl shadow-slate-900/10">
                Start your first meeting
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-6 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Secure SFU
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Up to 50 guests
              </div>
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="w-4 h-4" /> Any device
              </div>
            </div>
          </div>

          {/* Right CSS Mockup */}
          <div className="relative w-full aspect-[4/3] max-w-[600px] mx-auto lg:mr-0 perspective-[2000px]">
            {/* Background blobs for depth */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-100 via-purple-50 to-pink-50 rounded-full blur-3xl -z-10 opacity-70"></div>
            
            {/* The "App Window" */}
            <div className="relative w-full h-full bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/30 border border-slate-800 overflow-hidden transform-gpu rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out flex flex-col">
              
              {/* Window Header */}
              <div className="h-10 border-b border-slate-800 flex items-center px-4 gap-2 bg-slate-900/50">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>

              {/* Video Grid */}
              <div className="flex-1 p-3 grid grid-cols-2 gap-3 bg-black">
                
                {/* Participant 1 */}
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-600 shadow-inner">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50"></div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-medium border border-white/10">
                    Sarah Jenkins
                  </div>
                </div>

                {/* Participant 2 */}
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 shadow-inner">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50"></div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-medium border border-white/10">
                    David Chen
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-md border border-white/10 text-red-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                  </div>
                </div>

                {/* Participant 3 */}
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 shadow-inner">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50"></div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-medium border border-white/10">
                    Emma Wilson
                  </div>
                </div>

                {/* Participant 4 (You) */}
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 shadow-inner border-2 border-indigo-500">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-40"></div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-medium border border-white/10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> You
                  </div>
                </div>

              </div>

              {/* Bottom Controls */}
              <div className="h-16 border-t border-slate-800 bg-slate-950 flex items-center justify-center gap-4 px-6">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg></div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect></svg></div>
                <div className="w-12 h-10 rounded-full bg-red-500 flex items-center justify-center text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="22" y1="2" x2="2" y2="22"></line></svg></div>
              </div>
            </div>
            
            {/* Floating Element */}
            <div className="absolute -bottom-6 -left-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce hover:animate-none" style={{ animationDuration: '3s' }}>
               <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                 <Play className="w-5 h-5 ml-1" />
               </div>
               <div>
                 <p className="text-sm font-bold text-slate-900">Recording started</p>
                 <p className="text-xs text-slate-500">By Superadmin</p>
               </div>
            </div>
            
          </div>

        </div>
      </main>

    </div>
  );
}
