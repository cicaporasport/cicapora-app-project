'use client';

import { useEffect, useState } from 'react';

export default function StandaloneGuard({ children }: { children: React.ReactNode }) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const checkAccess = () => {
      // === 1. Cek link khusus ===
      const urlParams = new URLSearchParams(window.location.search);
      const hasSpecialAccess = urlParams.get('access') === 'cicapore2026';

      // Simpan di localStorage supaya tidak perlu pakai parameter terus
      if (hasSpecialAccess) {
        localStorage.setItem('special_access', 'true');
      }

      const hasSavedAccess = localStorage.getItem('special_access') === 'true';

      // === 2. Cek standalone / TWA ===
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      const isTWA = document.referrer.includes('android-app://');
      const isFromInstalledApp = isStandalone || isTWA;

      // Izinkan jika: dari APK ATAU punya akses khusus
      const allowed = isFromInstalledApp || hasSpecialAccess || hasSavedAccess;

      setIsAllowed(allowed);
    };

    checkAccess();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-lg">Memuat...</p>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Akses Ditolak</h1>
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

  return <>{children}</>;
}
