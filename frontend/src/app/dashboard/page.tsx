'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Video,
  Users,
  CheckCircle,
  Plus,
  LogOut,
  Calendar,
  Clock,
  LayoutDashboard,
  Trash2,
  Settings,
  Server,
  ShieldCheck,
  Activity,
  Sparkles,
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingLoading, setMeetingLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [scheduleData, setScheduleData] = useState({ title: '', scheduled_at: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    smtp_server: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from: '',
    discord_webhook_url: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);

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

        // Fetch system version info
        fetch('/api/system/status')
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data) setSystemInfo(data);
          })
          .catch(() => {});

        if (userData.role === 'superadmin') {
          const resAdmin = await fetch('/api/admin/users/pending', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resAdmin.ok) setPendingUsers(await resAdmin.json());

          const resAllUsers = await fetch('/api/admin/users/all', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resAllUsers.ok) setAllUsers(await resAllUsers.json());

          const resSettings = await fetch('/api/admin/settings', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resSettings.ok) {
            setSettings(await resSettings.json());
          }
        }

        const resMeetings = await fetch('/api/meetings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resMeetings.ok) setMeetings(await resMeetings.json());
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
    await fetch(`/api/admin/users/approve/${userId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
    setAllUsers(allUsers.map((u) => (u.id === userId ? { ...u, status: 'approved' } : u)));
  };

  const toggleUserRole = async (userId: number, currentRole: string) => {
    const token = localStorage.getItem('token');
    const newRole = currentRole === 'superadmin' ? 'user' : 'superadmin';
    await fetch(`/api/admin/users/role/${userId}?role=${newRole}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setAllUsers(allUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const token = localStorage.getItem('token');
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
    setSavingSettings(false);
    alert('Settings saved successfully!');
  };

  const createInstantMeeting = async () => {
    setMeetingLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/meetings/instant', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to create meeting');
      const data = await res.json();
      router.push(`/room/${data.room_id}`);
    } catch (err) {
      alert('Gagal membuat meeting. Coba lagi.');
      setMeetingLoading(false);
    }
  };

  const openPersonalMeetingRoom = async () => {
    setMeetingLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/meetings/pmr', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch PMR');
      const data = await res.json();
      router.push(`/room/${data.room_id}`);
    } catch (err) {
      alert('Gagal membuka Personal Meeting Room. Coba lagi.');
      setMeetingLoading(false);
    }
  };

  const scheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setMeetingLoading(true);
    const token = localStorage.getItem('token');
    try {
      const payload = {
        title: scheduleData.title,
        scheduled_at: new Date(scheduleData.scheduled_at).toISOString(),
      };
      const res = await fetch('/api/meetings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to schedule meeting');
      const resMeetings = await fetch('/api/meetings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resMeetings.ok) setMeetings(await resMeetings.json());
      setScheduleData({ title: '', scheduled_at: '' });
      setActiveTab('overview');
    } catch (err) {
      alert('Gagal menjadwalkan meeting. Coba lagi.');
    } finally {
      setMeetingLoading(false);
    }
  };

  const copyLink = (roomId: string) => {
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
      headers: { Authorization: `Bearer ${token}` },
    });
    setMeetings(meetings.filter((m) => m.room_id !== roomId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tech-pattern flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm font-mono text-slate-400">Loading Minizoom Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tech-pattern text-slate-50 flex relative overflow-hidden">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none animate-drift-slow" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Cyber Grid Overlay */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-30 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,#000_70%,transparent_100%)]" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-2xl flex-col hidden md:flex z-20 relative">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Video className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200">
              Minizoom
            </span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full">
            {systemInfo?.app_version ? `v${systemInfo.app_version}` : 'v1.3'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'schedule'
                ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            Schedule
          </button>

          {user?.role === 'superadmin' && (
            <>
              <div className="pt-4 pb-1 px-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Administration</span>
              </div>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/15 text-purple-300 border border-purple-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4 text-purple-400" />
                Users
                {pendingUsers.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/15 text-orange-300 border border-orange-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4 text-orange-400" />
                Settings
              </button>
            </>
          )}
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/30">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[11px] text-indigo-400 font-mono capitalize truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-20 md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
              <Video className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">Minizoom</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/');
            }}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Welcome Banner & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold mb-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      Workspace Ready
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
                      Welcome back, {user?.name.split(' ')[0]}!
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Host virtual conferences, manage schedules, and collaborate smoothly in real-time.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5 relative z-10">
                    <button
                      onClick={openPersonalMeetingRoom}
                      disabled={meetingLoading}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/90 hover:bg-purple-900/30 text-purple-300 border border-purple-500/30 rounded-2xl font-bold text-xs transition-all shadow-md active:scale-95 hover:border-purple-400/50"
                      title="Start your permanent Personal Meeting Room"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Personal Room
                    </button>
                    <button
                      onClick={createInstantMeeting}
                      disabled={meetingLoading}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-indigo-900/40 active:scale-95 hover:-translate-y-0.5"
                    >
                      <Plus className="w-4 h-4" />
                      {meetingLoading ? 'Creating...' : 'Instant Meeting'}
                    </button>
                  </div>
                </div>

                {/* Main Overview Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Scheduled Meetings (2 cols) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold flex items-center gap-2 text-slate-200">
                        <Clock className="w-4 h-4 text-indigo-400" /> Scheduled Meetings
                      </h2>
                      <span className="text-xs text-slate-400 font-mono">{meetings.length} Total</span>
                    </div>

                    <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-3">
                      {meetings.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                          <Calendar className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                          <p>No meetings scheduled yet.</p>
                          <button
                            onClick={() => setActiveTab('schedule')}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
                          >
                            Schedule a new session →
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {meetings.map((m: any) => (
                            <div
                              key={m.id}
                              className="glass-panel-interactive flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl gap-4"
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-semibold text-slate-100 text-sm">{m.title}</h4>
                                  {m.is_pmr && (
                                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                                      PMR
                                    </span>
                                  )}
                                  {m.active_participants > 0 ? (
                                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                      {m.active_participants} Online
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      • 0 Participants
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  {new Date(m.scheduled_at).toLocaleString()}
                                </p>
                              </div>

                              <div className="flex gap-2 shrink-0 items-center">
                                <button
                                  onClick={() => deleteMeeting(m.room_id)}
                                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                  title="Delete Meeting"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => copyLink(m.room_id)}
                                  className="px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 rounded-xl text-xs font-medium transition-colors text-slate-300 border border-slate-700/60"
                                >
                                  {copiedId === m.room_id ? 'Copied!' : 'Copy Link'}
                                </button>
                                <Link
                                  href={`/room/${m.room_id}`}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-bold transition-all text-white shadow-md shadow-emerald-900/30 flex items-center gap-1.5"
                                >
                                  <span>Join</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Approvals Widget (1 col) */}
                  {user?.role === 'superadmin' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold flex items-center gap-2 text-purple-300">
                          <Users className="w-4 h-4 text-purple-400" /> Pending Approvals
                        </h2>
                        {pendingUsers.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            {pendingUsers.length} Action Needed
                          </span>
                        )}
                      </div>

                      <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-3">
                        {pendingUsers.length === 0 ? (
                          <div className="text-center py-10 text-slate-500 text-xs space-y-1">
                            <CheckCircle className="w-7 h-7 mx-auto opacity-30 text-emerald-400" />
                            <p className="font-semibold text-slate-400">All caught up!</p>
                            <p className="text-[11px]">No pending registrations.</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {pendingUsers.map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl gap-2 hover:border-purple-500/30 transition-colors"
                              >
                                <div className="overflow-hidden space-y-0.5">
                                  <p className="font-bold text-xs text-slate-100 truncate">{u.name}</p>
                                  <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
                                </div>
                                <button
                                  onClick={() => approveUser(u.id)}
                                  className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1 shadow-sm"
                                  title="Approve User"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Approve
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

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600/20 to-blue-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30 shadow-lg shadow-indigo-900/20">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Schedule a Meeting</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Set up a future room with unique credentials & instant link sharing.
                  </p>
                </div>

                <form onSubmit={scheduleMeeting} className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 ml-1">Meeting Title</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 bg-slate-950/60 border border-slate-700/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 text-sm shadow-inner"
                      placeholder="e.g. Weekly Product Sync"
                      value={scheduleData.title}
                      onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 ml-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-3.5 bg-slate-950/60 border border-slate-700/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 text-sm shadow-inner"
                      value={scheduleData.scheduled_at}
                      onChange={(e) => setScheduleData({ ...scheduleData, scheduled_at: e.target.value })}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={meetingLoading}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/40 active:scale-95"
                  >
                    {meetingLoading ? 'Scheduling...' : 'Save & Create Link'}
                  </button>
                </form>
              </div>
            )}

            {/* Users Tab (Superadmin) */}
            {activeTab === 'users' && user?.role === 'superadmin' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold flex items-center gap-3 text-white">
                      <Users className="w-6 h-6 text-purple-400" /> User Management
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Manage accounts, approve requests, and assign superadmin roles.</p>
                  </div>
                </div>

                <div className="glass-panel rounded-3xl p-6 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold">
                          <th className="pb-3 px-4">Name</th>
                          <th className="pb-3 px-4">Email</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 px-4">Role</th>
                          <th className="pb-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {allUsers.map((u: any) => (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-4 text-slate-100 font-bold">{u.name}</td>
                            <td className="py-4 px-4 text-slate-400 font-mono">{u.email}</td>
                            <td className="py-4 px-4">
                              {u.status === 'approved' ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {u.role === 'superadmin' ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  Superadmin
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                                  User
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                {u.status === 'pending' && (
                                  <button
                                    onClick={() => approveUser(u.id)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                                  >
                                    Approve
                                  </button>
                                )}
                                {u.id !== user.id && (
                                  <button
                                    onClick={() => toggleUserRole(u.id, u.role)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                                      u.role === 'superadmin'
                                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                        : 'bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30'
                                    }`}
                                  >
                                    {u.role === 'superadmin' ? 'Demote to User' : 'Make Admin'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab (Superadmin) */}
            {activeTab === 'settings' && user?.role === 'superadmin' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold flex items-center gap-3 text-white">
                      <Settings className="w-6 h-6 text-orange-400" /> System Settings
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Configure global notification servers & inspect system health.</p>
                  </div>
                  {systemInfo && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Release v{systemInfo.app_version}
                    </div>
                  )}
                </div>

                {/* System Status Card */}
                <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2.5">
                      <Server className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-base font-bold text-slate-100">Live Environment Status</h2>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Operational
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <p className="text-slate-400 font-medium">Application Build</p>
                      <p className="text-sm font-bold text-slate-100 mt-1 font-mono">
                        v{systemInfo?.app_version || '1.3.0'} ({systemInfo?.build_date || '2026-08'})
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <p className="text-slate-400 font-medium">WebRTC SFU Mode</p>
                      <p className="text-sm font-bold text-indigo-400 mt-1 truncate">
                        {systemInfo?.livekit_mode || 'LiveKit Cloud'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 sm:col-span-2">
                      <p className="text-slate-400 font-medium mb-2">Active Modules</p>
                      <div className="flex flex-wrap gap-2">
                        {(systemInfo?.features || [
                          'Pre-Join Lobby',
                          'Low-Data Optimizer',
                          'Floating Reactions',
                          'Persistent Volume Storage',
                          'In-App SMTP & Discord',
                        ]).map((feat: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings Form */}
                <form onSubmit={saveSettings} className="space-y-6">
                  {/* SMTP Card */}
                  <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
                    <h2 className="text-base font-bold text-slate-200 border-b border-slate-800/80 pb-3">
                      Email Notifications (SMTP)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-300 ml-1">SMTP Server</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100"
                          placeholder="smtp.example.com"
                          value={settings.smtp_server}
                          onChange={(e) => setSettings({ ...settings, smtp_server: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-300 ml-1">SMTP Port</label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100"
                          placeholder="587"
                          value={settings.smtp_port}
                          onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-300 ml-1">SMTP Username</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100"
                          placeholder="user@example.com"
                          value={settings.smtp_username}
                          onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-300 ml-1">SMTP Password</label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100"
                          placeholder="••••••••"
                          value={settings.smtp_password}
                          onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-semibold text-slate-300 ml-1">Sender Email (From)</label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100"
                          placeholder="noreply@minizoom.local"
                          value={settings.smtp_from}
                          onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Discord Card */}
                  <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
                    <h2 className="text-base font-bold text-slate-200 border-b border-slate-800/80 pb-3">
                      Discord Integration
                    </h2>
                    <div className="space-y-1.5 text-xs">
                      <label className="font-semibold text-slate-300 ml-1">Webhook URL</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={settings.discord_webhook_url}
                        onChange={(e) => setSettings({ ...settings, discord_webhook_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-orange-900/40 active:scale-95"
                  >
                    {savingSettings ? 'Saving Settings...' : 'Save Settings'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
