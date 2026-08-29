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
  ChevronRight,
  Sparkles
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
      <div className="min-h-screen bg-enterprise-dark flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-slate-400">Loading Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-enterprise-dark text-slate-100 flex relative overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950/90 flex-col hidden md:flex z-20 relative">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Video className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">Minizoom</span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded">
            {systemInfo?.app_version ? `v${systemInfo.app_version}` : 'v1.4.0'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'schedule'
                ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </button>

          {user?.role === 'superadmin' && (
            <>
              <div className="pt-4 pb-1 px-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Administration</span>
              </div>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'users'
                    ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Users
                {pendingUsers.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-3 p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 font-mono capitalize truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950 sticky top-0 z-20 md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
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
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl clean-card">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Workspace Active
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Welcome back, {user?.name.split(' ')[0]}!
                    </h1>
                    <p className="text-xs text-slate-400">
                      Host virtual conferences and manage meeting schedules in real-time.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={openPersonalMeetingRoom}
                      disabled={meetingLoading}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs transition-colors active:scale-95"
                      title="Start your permanent Personal Meeting Room"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Personal Room
                    </button>
                    <button
                      onClick={createInstantMeeting}
                      disabled={meetingLoading}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      {meetingLoading ? 'Creating...' : 'Instant Meeting'}
                    </button>
                  </div>
                </div>

                {/* Main Overview Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Scheduled Meetings (2 cols) */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                        <Clock className="w-4 h-4 text-blue-400" /> Scheduled Meetings
                      </h2>
                      <span className="text-xs text-slate-400 font-mono">{meetings.length} Total</span>
                    </div>

                    <div className="clean-card rounded-2xl p-5 shadow-sm space-y-3">
                      {meetings.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                          <Calendar className="w-7 h-7 mx-auto opacity-30 text-slate-400" />
                          <p>No meetings scheduled yet.</p>
                          <button
                            onClick={() => setActiveTab('schedule')}
                            className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4"
                          >
                            Schedule a new session →
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {meetings.map((m: any) => (
                            <div
                              key={m.id}
                              className="clean-card-interactive flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl gap-3"
                            >
                              <div className="space-y-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-semibold text-slate-100 text-xs sm:text-sm">{m.title}</h4>
                                  {m.is_pmr && (
                                    <span className="px-2 py-0.5 text-[9px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded">
                                      PMR
                                    </span>
                                  )}
                                  {m.active_participants > 0 ? (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                      {m.active_participants} Online
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      • 0 Participants
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  {new Date(m.scheduled_at).toLocaleString()}
                                </p>
                              </div>

                              <div className="flex gap-2 shrink-0 items-center">
                                <button
                                  onClick={() => deleteMeeting(m.room_id)}
                                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Delete Meeting"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => copyLink(m.room_id)}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors text-slate-300 border border-slate-700"
                                >
                                  {copiedId === m.room_id ? 'Copied!' : 'Copy Link'}
                                </button>
                                <Link
                                  href={`/room/${m.room_id}`}
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold transition-colors text-white flex items-center gap-1"
                                >
                                  <span>Join</span>
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approvals Widget (1 col) */}
                  {user?.role === 'superadmin' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                          <Users className="w-4 h-4 text-slate-400" /> Pending Approvals
                        </h2>
                        {pendingUsers.length > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                            {pendingUsers.length}
                          </span>
                        )}
                      </div>

                      <div className="clean-card rounded-2xl p-4 space-y-2.5">
                        {pendingUsers.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-xs space-y-1">
                            <CheckCircle className="w-6 h-6 mx-auto opacity-30 text-emerald-400" />
                            <p className="font-medium text-slate-400">All caught up</p>
                            <p className="text-[11px]">No pending registrations.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {pendingUsers.map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl gap-2"
                              >
                                <div className="overflow-hidden space-y-0.5">
                                  <p className="font-semibold text-xs text-slate-100 truncate">{u.name}</p>
                                  <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
                                </div>
                                <button
                                  onClick={() => approveUser(u.id)}
                                  className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors shrink-0"
                                >
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
              <div className="max-w-xl mx-auto space-y-5">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-blue-600/15 text-blue-400 rounded-xl flex items-center justify-center mx-auto border border-blue-500/20">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Schedule a Meeting</h1>
                  <p className="text-xs text-slate-400">
                    Set up a scheduled video conference room with instant link sharing.
                  </p>
                </div>

                <form onSubmit={scheduleMeeting} className="clean-card p-6 rounded-2xl space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 ml-1">Meeting Title</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-100 text-xs"
                      placeholder="e.g. Weekly Team Sync"
                      value={scheduleData.title}
                      onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 ml-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-100 text-xs"
                      value={scheduleData.scheduled_at}
                      onChange={(e) => setScheduleData({ ...scheduleData, scheduled_at: e.target.value })}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={meetingLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm active:scale-95"
                  >
                    {meetingLoading ? 'Scheduling...' : 'Save & Create Link'}
                  </button>
                </form>
              </div>
            )}

            {/* Users Tab (Superadmin) */}
            {activeTab === 'users' && user?.role === 'superadmin' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2.5 text-white">
                    <Users className="w-5 h-5 text-blue-400" /> User Management
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">Manage accounts, approve requests, and assign superadmin roles.</p>
                </div>

                <div className="clean-card rounded-2xl p-5 overflow-hidden">
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
                          <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4 text-slate-100 font-semibold">{u.name}</td>
                            <td className="py-3 px-4 text-slate-400 font-mono">{u.email}</td>
                            <td className="py-3 px-4">
                              {u.status === 'approved' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {u.role === 'superadmin' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                  Superadmin
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                  User
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                {u.status === 'pending' && (
                                  <button
                                    onClick={() => approveUser(u.id)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                                  >
                                    Approve
                                  </button>
                                )}
                                {u.id !== user.id && (
                                  <button
                                    onClick={() => toggleUserRole(u.id, u.role)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                                      u.role === 'superadmin'
                                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                        : 'bg-blue-600/15 text-blue-300 border-blue-500/30 hover:bg-blue-600/25'
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
              <div className="max-w-3xl mx-auto space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold flex items-center gap-2.5 text-white">
                      <Settings className="w-5 h-5 text-slate-300" /> System Settings
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">Global SMTP and Discord notifications configuration.</p>
                  </div>
                  {systemInfo && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                      Release v{systemInfo.app_version}
                    </div>
                  )}
                </div>

                {/* System Status Card */}
                <div className="clean-card p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-400" />
                      <h2 className="text-sm font-bold text-slate-100">Environment Status</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Operational
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-slate-400">Application Version</p>
                      <p className="text-xs font-bold text-slate-100 mt-0.5 font-mono">
                        v{systemInfo?.app_version || '1.4.0'} ({systemInfo?.build_date || '2026-08-29'})
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-slate-400">WebRTC SFU Mode</p>
                      <p className="text-xs font-bold text-blue-400 mt-0.5 truncate">
                        {systemInfo?.livekit_mode || 'LiveKit Cloud'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 sm:col-span-2">
                      <p className="text-slate-400 mb-2">Installed Features</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(systemInfo?.features || [
                          'Pre-Join Lobby',
                          'Low-Data Optimizer',
                          'Floating Reactions',
                          'Persistent Volume Storage',
                          'SMTP & Discord Notifications',
                        ]).map((feat: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            <ShieldCheck className="w-3 h-3 text-blue-400" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings Form */}
                <form onSubmit={saveSettings} className="space-y-4">
                  {/* SMTP Card */}
                  <div className="clean-card p-5 rounded-2xl space-y-4">
                    <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2.5">
                      Email Notifications (SMTP)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-300 ml-1">SMTP Server</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100"
                          placeholder="smtp.example.com"
                          value={settings.smtp_server}
                          onChange={(e) => setSettings({ ...settings, smtp_server: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-300 ml-1">SMTP Port</label>
                        <input
                          type="number"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100"
                          placeholder="587"
                          value={settings.smtp_port}
                          onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-300 ml-1">SMTP Username</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100"
                          placeholder="user@example.com"
                          value={settings.smtp_username}
                          onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-300 ml-1">SMTP Password</label>
                        <input
                          type="password"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100"
                          placeholder="••••••••"
                          value={settings.smtp_password}
                          onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="font-semibold text-slate-300 ml-1">Sender Email (From)</label>
                        <input
                          type="email"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100"
                          placeholder="noreply@minizoom.local"
                          value={settings.smtp_from}
                          onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Discord Card */}
                  <div className="clean-card p-5 rounded-2xl space-y-3">
                    <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2.5">
                      Discord Integration
                    </h2>
                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-300 ml-1">Webhook URL</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={settings.discord_webhook_url}
                        onChange={(e) => setSettings({ ...settings, discord_webhook_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm active:scale-95"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
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
