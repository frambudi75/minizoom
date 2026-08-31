'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Video, ArrowRight, Mail, Lock } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const form = new URLSearchParams();
      form.append('username', cleanEmail);
      form.append('password', formData.password);

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Email atau password salah, atau akun belum disetujui.');
      }
      
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa koneksi Anda.');
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
              v{APP_VERSION}
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-xs text-slate-400 mt-1">Sign in to your Minizoom account</p>
        </div>

        <div className="clean-card p-6 sm:p-8 rounded-2xl shadow-xl relative">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 text-xs font-medium text-center">
              {error}
            </div>
          )}
          
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-xs">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Request access
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
