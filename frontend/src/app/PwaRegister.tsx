'use client';
import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Daftarkan Service Worker dan periksa update
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service worker registered successfully:', reg.scope);
          reg.update();
        })
        .catch((err) => {
          console.warn('[PWA] Service worker registration failed:', err);
        });
    }

    // Tangkap event beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Deteksi jika sudah di-install
    window.addEventListener('appinstalled', () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('[PWA] Minizoom installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Untuk meng-install Minizoom di perangkat Anda:\n\n• Android: Ketuk menu titik tiga (⋮) di Chrome lalu pilih 'Tambahkan ke Layar Utama' / 'Install App'\n• iPhone: Ketuk ikon Bagikan (Share) di Safari lalu pilih 'Tambah ke Layar Utama'\n• Laptop/PC: Klik ikon Install (⬇️) di samping address bar Chrome/Edge.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-blue-500/40 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Install Minizoom</h4>
            <p className="text-[11px] text-slate-400">Akses meeting lebih cepat tanpa browser</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            Install
          </button>
          <button
            onClick={() => setShowInstallBanner(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
