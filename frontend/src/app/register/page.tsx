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
      // Panggil API Backend FastAPI
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 text-slate-50 px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-6">
            <Video className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight">Minizoom</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-white">Create an account</h1>
          <p className="text-slate-400">Join the waitlist. Admin approval required.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 p-8 rounded-3xl shadow-2xl">
          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">{error}</div>}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-slate-100 placeholder:text-slate-500" 
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-slate-100 placeholder:text-slate-500" 
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-slate-100 placeholder:text-slate-500" 
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
              className="mt-4 group flex items-center justify-center gap-2 w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-2xl font-semibold transition-all duration-300 active:scale-[0.98] shadow-lg shadow-purple-900/20 ring-1 ring-purple-500/50"
            >
              {loading ? 'Creating...' : 'Sign Up'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
