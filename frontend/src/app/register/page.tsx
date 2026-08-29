'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Video, ArrowRight, Mail, Lock, User } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Pendaftaran gagal');
      
      if (data.role === 'superadmin') {
        alert("Pendaftaran berhasil! Sebagai akun pendaftar pertama, Anda otomatis menjadi Superadmin.");
      } else {
        alert("Pendaftaran berhasil! Akun Anda berstatus 'User Biasa' dan sedang menunggu persetujuan (approval) dari Superadmin.");
      }
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-enterprise-dark text-slate-100 px-4">
      {/* Clean ambient top light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="z-10 w-full max-w-md relative">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 shadow-sm text-slate-300 hover:text-white transition-colors mb-5">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <Video className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">Minizoom</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Registration
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create an account
          </h1>
          <p className="text-xs text-slate-400 mt-1">Join the workspace. Superadmin approval required.</p>
        </div>

        <div className="clean-card p-6 sm:p-8 rounded-2xl shadow-xl relative">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 ml-0.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-100 placeholder:text-slate-500 text-xs shadow-sm" 
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 ml-0.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-100 placeholder:text-slate-500 text-xs shadow-sm" 
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 ml-0.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type="password" 
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-100 placeholder:text-slate-500 text-xs shadow-sm" 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm active:scale-[0.98]"
            >
              <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-xs">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
