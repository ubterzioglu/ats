'use client';

import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';

export function PWAInit() {
  const [offline, setOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.warn('SW registration failed:', err));
    }

    // Offline detection
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    setOffline(!navigator.onLine);

    // PWA install prompt
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);

      // Show install banner if not already dismissed
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    const prompt = installPrompt as BeforeInstallPromptEvent;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  return (
    <>
      {/* Offline Banner */}
      {offline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          You are offline — resume editing and scoring still work without internet
        </div>
      )}

      {/* Install PWA Banner */}
      {showInstallBanner && (
        <div className="install-banner">
          <div className="rounded-xl bg-gray-900 border border-gray-700 shadow-2xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-sm">ATS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Install ATS Optimizer</p>
              <p className="text-xs text-gray-400">Works offline · No app store needed</p>
            </div>
            <button
              onClick={handleInstall}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismissInstall}
              className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
