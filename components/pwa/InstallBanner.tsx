'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if the banner was previously closed
    const bannerClosed = localStorage.getItem('pwa-banner-closed') === 'true';

    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    // Only show the banner if it wasn't closed before and the app is not installed
    if (!bannerClosed && !isStandalone) {
      // Delay showing the banner for better user experience
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const closeBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-closed', 'true');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('Installation prompt not available');
      return;
    }

    // Show the installation prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);

    // If the user accepted the prompt, hide the banner
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      id="pwa-install-banner"
      className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 flex items-center justify-between z-50 shadow-lg"
    >
      <div className="flex items-center space-x-4">
        <div className="hidden sm:block">
          <img
            src="/icons/icon-72x72.png"
            alt="E-com logo"
            className="w-10 h-10 rounded-md"
          />
        </div>
        <div>
          <h3 className="font-semibold">Install E-com App</h3>
          <p className="text-sm opacity-90">Add to your home screen for a better experience</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          size="sm"
          className="close-banner"
          onClick={closeBanner}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="install-pwa bg-white hover:bg-white/90"
          onClick={handleInstallClick}
        >
          <Download className="h-4 w-4 mr-2" />
          Install
        </Button>
      </div>
    </div>
  );
}
