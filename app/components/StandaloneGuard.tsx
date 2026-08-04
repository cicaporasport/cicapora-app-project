'use client';

import { useEffect, useState } from 'react';

export default function StandaloneGuard({ children }: { children: React.ReactNode }) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // === 1. Blokir Install Prompt ===
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Mencegah browser menampilkan tombol Install
      // console.log('Install prompt diblokir');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // === 2. Deteksi apakah diizinkan ===
    const checkAccess = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true; // iOS

      const isTWA = document.referrer.includes('android-app://'); // PWA Builder / TWA
      const isFromInstalledApp = isStandalone || isTWA;

      // Deteksi tambahan (lebih ketat)
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const hasDisplayMode = window.matchMedia('(display-mode: standalone)').matches;

      // Hanya izinkan jika benar-benar dari app yang terinstall
      const allowed = isFromInstalledApp;

      setIsAllowed(allowed);
    };

    checkAccess();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Loading state
  if (isAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-lg">Memuat...</p>
      </div>
    );
  }

  // Kalau dibuka di browser biasa
  if (!isAllowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            Akses Ditolak
          </h1>
          <p className="text-gray-300 mb-3">
            Aplikasi ini <strong>hanya dapat digunakan</strong> melalui aplikasi yang sudah diinstall (APK).
          </p>
          <p className="text-sm text-gray-500">
            Silakan buka melalui aplikasi resmi CICAPORA.
          </p>
        </div>
      </div>
    );
  }

  // Diizinkan → tampilkan aplikasi
  return <>{children}</>;
}