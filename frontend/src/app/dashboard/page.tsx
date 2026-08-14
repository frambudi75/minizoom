'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Video, Users, CheckCircle, Plus, LogOut, Calendar, Clock, LayoutDashboard, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingLoading, setMeetingLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [scheduleData, setScheduleData] = useState({ title: '', scheduled_at: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const resMe = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!resMe.ok) throw new Error();
        const userData = await resMe.json();
        setUser(userData);

        if (userData.role === 'superadmin') {
          const resAdmin = await fetch('/api/admin/users/pending', { headers: { Authorization: `Bearer ${token}` } });
          setPendingUsers(await resAdmin.json());
        }

        const resMeetings = await fetch('/api/meetings', { headers: { Authorization: `Bearer ${token}` } });
        setMeetings(await resMeetings.json());

      } catch (err) {
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const approveUser = async (userId: number) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/users/approve/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    setPendingUsers(pendingUsers.filter(u => u.id !== userId));
  };

  const createInstantMeeting = async () => {
    setMeetingLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch('/api/meetings/instant', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    router.push(`/room/${data.room_id}`);
  };

  const scheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setMeetingLoading(true);
    const token = localStorage.getItem('token');
    const payload = {
        title: scheduleData.title,
        scheduled_at: new Date(scheduleData.scheduled_at).toISOString()
    };
    await fetch('/api/meetings/schedule', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    const resMeetings = await fetch('/api/meetings', { headers: { Authorization: `Bearer ${token}` } });
    setMeetings(await resMeetings.json());
    setScheduleData({ title: '', scheduled_at: '' });
    setActiveTab('overview');
    setMeetingLoading(false);
  };

  const copyLink = (roomId: string) => {
      // Insecure contexts (like standard http without localhost) might block clipboard
      // but standard fallback
      try {
          const url = `${window.location.origin}/room/${roomId}`;
          navigator.clipboard.writeText(url);
          setCopiedId(roomId);
          setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
          alert(`Failed to copy automatically. Please copy this link manually:\n\n${window.location.origin}/room/${roomId}`);
      }
  };

  const deleteMeeting = async (roomId: string) => {
      if (!confirm('Are you sure you want to delete this meeting?')) return;
      const token = localStorage.getItem('token');
      await fetch(`/api/meetings/${roomId}`, { 
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(meetings.filter(m => m.room_id !== roomId));
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/30 flex-col hidden md:flex">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800 text-blue-400">
            <Video className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">Minizoom</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <LayoutDashboard className="w-5 h-5" /> Overview
            </button>
            <button onClick={() => setActiveTab('schedule')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <Calendar className="w-5 h-5" /> Schedule
            </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-xl mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    {user?.name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
                </div>
            </div>
            <button onClick={() => { localStorage.removeItem('token'); router.push('/'); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                <LogOut className="w-5 h-5" /> Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10 md:hidden">
            <div className="flex items-center gap-2 text-blue-400">
                <Video className="w-6 h-6" />
                <span className="font-bold text-lg tracking-tight">Minizoom</span>
            </div>
            <button onClick={() => { localStorage.removeItem('token'); router.push('/'); }} className="p-2 text-red-400">
              <LogOut className="w-5 h-5" />
            </button>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {activeTab === 'overview' && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold">Welcome back, {user?.name.split(' ')[0]}!</h1>
                            <button onClick={createInstantMeeting} disabled={meetingLoading} className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                                <Plus className="w-4 h-4" />
                                {meetingLoading ? 'Creating...' : 'Instant Meeting'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-300">
                                    <Clock className="w-5 h-5" /> Your Scheduled Meetings
                                </h2>
                                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl">
                                    {meetings.length === 0 ? (
                                        <div className="text-center py-10 text-slate-500 text-sm">
                                            No meetings scheduled yet. <br/> Switch to the Schedule tab to plan one!
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {meetings.map((m: any) => (
                                                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl gap-4 hover:border-slate-700 transition-colors">
                                                    <div>
                                                        <h4 className="font-medium text-slate-200">{m.title}</h4>
                                                        <p className="text-sm text-slate-400 mt-1">
                                                            {new Date(m.scheduled_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0 items-center">
                                                        <button onClick={() => deleteMeeting(m.room_id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ring-1 ring-transparent hover:ring-red-500/20" title="Delete Meeting">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => copyLink(m.room_id)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors text-slate-300 ring-1 ring-slate-700 w-24 text-center">
                                                            {copiedId === m.room_id ? 'Copied!' : 'Copy Link'}
                                                        </button>
                                                        <Link href={`/room/${m.room_id}`} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors text-white text-center shadow-lg shadow-emerald-900/20">
                                                            Join
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {user?.role === 'superadmin' && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-400">
                                        <Users className="w-5 h-5" /> Pending Approvals
                                    </h2>
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
                                        {pendingUsers.length === 0 ? (
                                            <div className="text-center py-8 text-slate-500 text-sm">
                                                All caught up.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {pendingUsers.map(u => (
                                                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                                                        <div className="overflow-hidden">
                                                            <p className="font-medium text-sm text-slate-200 truncate">{u.name}</p>
                                                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                                        </div>
                                                        <button onClick={() => approveUser(u.id)} className="p-2 ml-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors flex-shrink-0" title="Approve">
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'schedule' && (
                    <div className="max-w-xl mx-auto mt-4 sm:mt-10">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-blue-500/20">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <h1 className="text-3xl font-bold">Schedule a Meeting</h1>
                            <p className="text-slate-400 mt-2">Set up a video conference for later.</p>
                        </div>

                        <form onSubmit={scheduleMeeting} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-300 ml-1">Meeting Title</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-100" 
                                        placeholder="Weekly Sync"
                                        value={scheduleData.title}
                                        onChange={(e) => setScheduleData({...scheduleData, title: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-300 ml-1">Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full px-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-100 style-date" 
                                        value={scheduleData.scheduled_at}
                                        onChange={(e) => setScheduleData({...scheduleData, scheduled_at: e.target.value})}
                                        required 
                                    />
                                </div>
                                <button type="submit" disabled={meetingLoading} className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-2xl font-semibold transition-all shadow-lg active:scale-95">
                                    {meetingLoading ? 'Scheduling...' : 'Save Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
