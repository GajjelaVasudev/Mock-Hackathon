import React, { createContext, useContext, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
  dismissPrompt: () => void;
  isPromptDismissed: boolean;
  isIOS: boolean;
}

const PWAContext = createContext<PWAContextType>({
  isOnline: true,
  isInstallable: false,
  isInstalled: false,
  promptInstall: async () => false,
  dismissPrompt: () => {},
  isPromptDismissed: false,
  isIOS: false,
});

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState<boolean>(() => {
    return localStorage.getItem('bnhs_pwa_dismissed') === 'true';
  });

  // Detect iOS Safari
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Check standalone / installed mode
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = () => checkStandalone();
    mediaQuery.addEventListener?.('change', handleDisplayChange);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice && !(window.navigator as any).standalone);

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Install prompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[BNHS PWA] App was installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener?.('change', handleDisplayChange);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[BNHS PWA] User accepted the installation');
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[BNHS PWA] User dismissed the installation');
        dismissPrompt();
        return false;
      }
    } catch (err) {
      console.error('[BNHS PWA] Error during prompt:', err);
      return false;
    }
  };

  const dismissPrompt = () => {
    setIsPromptDismissed(true);
    localStorage.setItem('bnhs_pwa_dismissed', 'true');
  };

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        isInstallable: !!deferredPrompt && !isInstalled,
        isInstalled,
        promptInstall,
        dismissPrompt,
        isPromptDismissed,
        isIOS,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => useContext(PWAContext);
