'use client';

import { useEffect, useState } from 'react';

export default function StandaloneGuard({ children }: { children: React.ReactNode }) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // === 1. Blokir Install Prompt ===
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // === 2. Deteksi apakah diizinkan ===
    const checkAccess = () => {
      // Izinkan selalu saat development (localhost)
      const isLocalhost = 
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (isLocalhost) {
        setIsAllowed(true);
        return;
      }

      // Di production, hanya izinkan jika standalone / TWA
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      const isTWA = document.referrer.includes('android-app://');
      const isFromInstalledApp = isStandalone || isTWA;

      setIsAllowed(isFromInstalledApp);
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

  // Kalau dibuka di browser biasa (production)
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
