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
  Sparkles,
  KeyRound,
  User as UserIcon,
  Copy,
  Lock,
  Mail,
  Send,
  X,
  AlertTriangle
} from 'lucide-react';
import { APP_VERSION, BUILD_DATE } from '@/lib/version';

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

  // Settings state
  const [settings, setSettings] = useState({
    smtp_server: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from: '',
    discord_webhook_url: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  // Reset Password Modal (for Admin)
  const [resetModal, setResetModal] = useState<{ open: boolean; user: any | null; newPassword: string; loading: boolean; error: string; success: string }>({
    open: false,
    user: null,
    newPassword: '',
    loading: false,
    error: '',
    success: '',
  });

  // Profile tab state
  const [profileForm, setProfileForm] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileStats, setProfileStats] = useState<{ pmr_room_id?: string; total_meetings?: number }>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        setProfileForm((prev) => ({ ...prev, name: userData.name }));

        // Fetch user profile stats
        fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => (r.ok ? r.json() : null))
          .then((pData) => {
            if (pData) {
              setProfileStats({
                pmr_room_id: pData.pmr_room_id,
                total_meetings: pData.total_meetings,
              });
            }
          })
          .catch(() => {});

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

  const deleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete user "${userName}" and all their meetings?`)) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setAllUsers(allUsers.filter((u) => u.id !== userId));
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      alert(`User ${userName} has been deleted.`);
    } else {
      const data = await res.json();
      alert(data.detail || 'Failed to delete user');
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModal.user) return;
    if (resetModal.newPassword.length < 6) {
      setResetModal((prev) => ({ ...prev, error: 'Password must be at least 6 characters' }));
      return;
    }

    setResetModal((prev) => ({ ...prev, loading: true, error: '', success: '' }));
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/users/${resetModal.user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_password: resetModal.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to reset password');

      setResetModal((prev) => ({
        ...prev,
        loading: false,
        success: `Password for ${prev.user.name} successfully updated!`,
        newPassword: '',
      }));
      setTimeout(() => {
        setResetModal({ open: false, user: null, newPassword: '', loading: false, error: '', success: '' });
      }, 1800);
    } catch (err: any) {
      setResetModal((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (profileForm.newPassword) {
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileMsg({ type: 'error', text: 'New password and confirmation do not match!' });
        return;
      }
      if (!profileForm.currentPassword) {
        setProfileMsg({ type: 'error', text: 'Current password is required to change password.' });
        return;
      }
    }

    setProfileSaving(true);
    const token = localStorage.getItem('token');
    try {
      const payload: any = { name: profileForm.name };
      if (profileForm.newPassword) {
        payload.current_password = profileForm.currentPassword;
        payload.new_password = profileForm.newPassword;
      }

      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update profile');

      setUser((prev: any) => ({ ...prev, name: data.name }));
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setProfileSaving(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsFeedback(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSettingsFeedback({ type: 'success', text: 'System settings saved successfully!' });
    } catch (err: any) {
      setSettingsFeedback({ type: 'error', text: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const testEmail = async () => {
    setTestingEmail(true);
    setSettingsFeedback(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send test email');
      setSettingsFeedback({ type: 'success', text: `Email Test: ${data.message}` });
    } catch (err: any) {
      setSettingsFeedback({ type: 'error', text: `Email Test: ${err.message}` });
    } finally {
      setTestingEmail(false);
    }
  };

  const testDiscord = async () => {
    setTestingDiscord(true);
    setSettingsFeedback(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/settings/test-discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send test Discord notification');
      setSettingsFeedback({ type: 'success', text: `Discord Test: ${data.message}` });
    } catch (err: any) {
      setSettingsFeedback({ type: 'error', text: `Discord Test: ${err.message}` });
    } finally {
      setTestingDiscord(false);
    }
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
      alert(`Copy manually: ${window.location.origin}/room/${roomId}`);
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
            {systemInfo?.app_version ? `v${systemInfo.app_version}` : `v${APP_VERSION}`}
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
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            My Profile
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

        {/* User Profile Card (Clickable to open profile) */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className="w-full flex items-center gap-3 p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl transition-colors text-left"
            title="View Profile Settings"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 font-mono capitalize truncate">{user?.role}</p>
            </div>
          </button>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
              title="Profile"
            >
              <UserIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/');
              }}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Overview Tab */}
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

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2.5 text-white">
                    <UserIcon className="w-5 h-5 text-blue-400" /> Account Profile
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">Manage your personal account information and security credentials.</p>
                </div>

                {profileMsg && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                      profileMsg.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                {/* Profile Overview Card */}
                <div className="clean-card p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <h2 className="text-lg font-bold text-white truncate">{user?.name}</h2>
                      <p className="text-xs text-slate-400 font-mono truncate">{user?.email}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-blue-600/15 text-blue-400 border border-blue-500/30">
                          {user?.role}
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Verified Account
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Meetings Hosted</span>
                      <span className="font-bold text-slate-200 text-base">{profileStats.total_meetings || 0}</span>
                    </div>
                    {profileStats.pmr_room_id && (
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Personal Room</span>
                        <button
                          onClick={() => copyLink(profileStats.pmr_room_id!)}
                          className="text-blue-400 hover:text-blue-300 font-mono text-[11px] flex items-center gap-1 mt-0.5"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === profileStats.pmr_room_id ? 'Copied!' : 'Copy PMR Link'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Profile Form */}
                <form onSubmit={handleUpdateProfile} className="clean-card p-6 rounded-2xl space-y-5">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2.5">
                    Personal Information
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 ml-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100 text-xs"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 ml-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 text-xs cursor-not-allowed font-mono"
                        value={user?.email || ''}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 ml-1">Email address is fixed and cannot be modified.</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2.5 pt-3">
                    Change Password <span className="text-slate-500 font-normal text-xs">(Leave blank to keep unchanged)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="font-semibold text-slate-300 ml-1">Current Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100 text-xs"
                          placeholder="Required only if changing password"
                          value={profileForm.currentPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 ml-1">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100 text-xs"
                          placeholder="Min. 6 characters"
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 ml-1">Confirm New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100 text-xs"
                          placeholder="Re-type new password"
                          value={profileForm.confirmPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm active:scale-95"
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
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
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage accounts, approve requests, reset passwords, and delete users.
                  </p>
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
                              <div className="flex justify-end items-center gap-1.5">
                                {u.status === 'pending' && (
                                  <button
                                    onClick={() => approveUser(u.id)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                                  >
                                    Approve
                                  </button>
                                )}

                                {/* Reset Password Button */}
                                <button
                                  onClick={() => setResetModal({ open: true, user: u, newPassword: '', loading: false, error: '', success: '' })}
                                  className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors border border-slate-700/60"
                                  title={`Reset Password for ${u.name}`}
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                {/* Toggle Role Button */}
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

                                {/* Delete User Button */}
                                {u.id !== user.id && (
                                  <button
                                    onClick={() => deleteUser(u.id, u.name)}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-slate-700/60"
                                    title={`Delete user ${u.name}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
                        v{systemInfo?.app_version || APP_VERSION} ({systemInfo?.build_date || BUILD_DATE})
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
                  {/* Feedback Banner */}
                  {settingsFeedback && (
                    <div
                      className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 border ${
                        settingsFeedback.type === 'success'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-300 border-red-500/30'
                      }`}
                    >
                      {settingsFeedback.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{settingsFeedback.text}</span>
                    </div>
                  )}

                  {/* SMTP Card */}
                  <div className="clean-card p-5 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <h2 className="text-sm font-bold text-slate-200">Email Notifications (SMTP)</h2>
                        <p className="text-[11px] text-slate-400">Support Port 465 (SSL) & Port 587/25 (STARTTLS)</p>
                      </div>
                      <button
                        type="button"
                        onClick={testEmail}
                        disabled={testingEmail}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 active:scale-95 self-start sm:self-auto"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {testingEmail ? 'Sending Test...' : 'Test SMTP Email'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-300 ml-1">SMTP Server</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100"
                          placeholder="mail.example.com"
                          value={settings.smtp_server}
                          onChange={(e) => setSettings({ ...settings, smtp_server: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-300 ml-1">SMTP Port (465 = SSL, 587 = TLS)</label>
                        <input
                          type="number"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100"
                          placeholder="465"
                          value={settings.smtp_port}
                          onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 465 })}
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <h2 className="text-sm font-bold text-slate-200">Discord Integration</h2>
                        <p className="text-[11px] text-slate-400">Receive new user registrations in your Discord channel</p>
                      </div>
                      <button
                        type="button"
                        onClick={testDiscord}
                        disabled={testingDiscord}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 active:scale-95 self-start sm:self-auto"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {testingDiscord ? 'Sending...' : 'Test Discord Webhook'}
                      </button>
                    </div>

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
                    {savingSettings ? 'Saving Settings...' : 'Save Settings'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Admin Reset Password Modal */}
      {resetModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="clean-card w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">Reset Password</h3>
              </div>
              <button
                onClick={() => setResetModal({ open: false, user: null, newPassword: '', loading: false, error: '', success: '' })}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <p>
                Set a new password for <strong className="text-white">{resetModal.user?.name}</strong> (<span className="font-mono text-slate-400">{resetModal.user?.email}</span>).
              </p>
            </div>

            {resetModal.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 text-xs">
                {resetModal.error}
              </div>
            )}

            {resetModal.success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-400 text-xs">
                {resetModal.success}
              </div>
            )}

            <form onSubmit={handleAdminResetPassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 ml-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min. 6 chars)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-100"
                  value={resetModal.newPassword}
                  onChange={(e) => setResetModal({ ...resetModal, newPassword: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModal({ open: false, user: null, newPassword: '', loading: false, error: '', success: '' })}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetModal.loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-sm"
                >
                  {resetModal.loading ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
