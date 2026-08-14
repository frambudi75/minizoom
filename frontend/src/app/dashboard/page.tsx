'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Video, Users, CheckCircle, Plus, LogOut, Calendar, Clock, LayoutDashboard, Trash2, Settings } from 'lucide-react';

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
    smtp_server: '', smtp_port: 587, smtp_username: '', smtp_password: '', smtp_from: '', discord_webhook_url: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

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

          const resAllUsers = await fetch('/api/admin/users/all', { headers: { Authorization: `Bearer ${token}` } });
          setAllUsers(await resAllUsers.json());

          const resSettings = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } });
          if(resSettings.ok) {
              setSettings(await resSettings.json());
          }
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
    
    // update in all users list
    setAllUsers(allUsers.map(u => u.id === userId ? { ...u, status: 'approved' } : u));
  };

  const toggleUserRole = async (userId: number, currentRole: string) => {
    const token = localStorage.getItem('token');
    const newRole = currentRole === 'superadmin' ? 'user' : 'superadmin';
    await fetch(`/api/admin/users/role/${userId}?role=${newRole}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    
    setAllUsers(allUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const token = localStorage.getItem('token');
    await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings)
    });
    setSavingSettings(false);
    alert('Settings saved successfully!');
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
            {user?.role === 'superadmin' && (
                <>
                <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-purple-600/10 text-purple-400 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                    <Users className="w-5 h-5" /> Users
                </button>
                <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-orange-600/10 text-orange-400 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                    <Settings className="w-5 h-5" /> Settings
                </button>
                </>
            )}
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
                {activeTab === 'users' && user?.role === 'superadmin' && (
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <Users className="w-6 h-6 text-purple-500" /> User Management
                            </h1>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-400 text-sm">
                                            <th className="pb-3 px-4 font-medium">Name</th>
                                            <th className="pb-3 px-4 font-medium">Email</th>
                                            <th className="pb-3 px-4 font-medium">Status</th>
                                            <th className="pb-3 px-4 font-medium">Role</th>
                                            <th className="pb-3 px-4 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {allUsers.map((u: any) => (
                                            <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="py-4 px-4 text-slate-200 font-medium">{u.name}</td>
                                                <td className="py-4 px-4 text-slate-400 text-sm">{u.email}</td>
                                                <td className="py-4 px-4">
                                                    {u.status === 'approved' ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {u.role === 'superadmin' ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Superadmin</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">User</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    {u.id !== user.id && (
                                                        <button 
                                                            onClick={() => toggleUserRole(u.id, u.role)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${u.role === 'superadmin' ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-purple-600/20 text-purple-400 border-purple-500/30 hover:bg-purple-600/30'}`}
                                                        >
                                                            {u.role === 'superadmin' ? 'Demote to User' : 'Make Admin'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && user?.role === 'superadmin' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <Settings className="w-6 h-6 text-orange-500" /> System Settings
                            </h1>
                        </div>

                        <form onSubmit={saveSettings} className="space-y-6">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                                <h2 className="text-lg font-semibold text-slate-200 mb-6 border-b border-slate-800 pb-4">Email Notifications (SMTP)</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-300 ml-1">SMTP Server</label>
                                        <input type="text" className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100" 
                                            placeholder="smtp.example.com" value={settings.smtp_server} onChange={e => setSettings({...settings, smtp_server: e.target.value})} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-300 ml-1">SMTP Port</label>
                                        <input type="number" className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100" 
                                            placeholder="587" value={settings.smtp_port} onChange={e => setSettings({...settings, smtp_port: parseInt(e.target.value) || 587})} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-300 ml-1">SMTP Username</label>
                                        <input type="text" className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100" 
                                            placeholder="user@example.com" value={settings.smtp_username} onChange={e => setSettings({...settings, smtp_username: e.target.value})} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-300 ml-1">SMTP Password</label>
                                        <input type="password" className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100" 
                                            placeholder="********" value={settings.smtp_password} onChange={e => setSettings({...settings, smtp_password: e.target.value})} />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-300 ml-1">Sender Email (From)</label>
                                        <input type="email" className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100" 
                                            placeholder="noreply@minizoom.local" value={settings.smtp_from} onChange={e => setSettings({...settings, smtp_from: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                                <h2 className="text-lg font-semibold text-slate-200 mb-6 border-b border-slate-800 pb-4">Discord Integration</h2>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-300 ml-1">Webhook URL</label>
                                    <input type="text" className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-100" 
                                        placeholder="https://discord.com/api/webhooks/..." value={settings.discord_webhook_url} onChange={e => setSettings({...settings, discord_webhook_url: e.target.value})} />
                                </div>
                            </div>

                            <button type="submit" disabled={savingSettings} className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 text-white rounded-2xl font-semibold transition-all shadow-lg active:scale-95">
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
