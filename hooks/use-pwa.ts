'use client';

import { useState, useEffect } from 'react';
import {
  isAppInstalled,
  isOnline,
  onConnectionChange,
  supportsPWA,
  isIOS,
  isAndroid,
  getNetworkInformation
} from '@/lib/pwa/pwaUtils';

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  networkInfo: {
    type?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
  deferredPrompt: any | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isOnline: true,
    canInstall: false,
    isIOS: false,
    isAndroid: false,
    networkInfo: {},
    deferredPrompt: null,
  });

  useEffect(() => {
    // Initialize state with current values
    setState({
      isInstalled: isAppInstalled(),
      isOnline: isOnline(),
      canInstall: supportsPWA(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      networkInfo: getNetworkInformation(),
      deferredPrompt: null,
    });

    // Listen for online/offline events
    const unsubscribe = onConnectionChange((online) => {
      setState((prev) => ({ ...prev, isOnline: online }));
    });

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();

      // Stash the event so it can be triggered later
      setState((prev) => ({ ...prev, deferredPrompt: e }));
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setState((prev) => ({
        ...prev,
        isInstalled: true,
        deferredPrompt: null,
      }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    return () => {
      unsubscribe();

      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      }
    };
  }, []);

  // Function to prompt the user to install the PWA
  const promptInstall = async () => {
    const { deferredPrompt } = state;

    if (!deferredPrompt) {
      console.log('Cannot prompt to install, no installation prompt available');

      // Try to trigger the installation manually for Safari/iOS
      if (isIOS()) {
        console.log('iOS detected, showing manual installation instructions');
        return true; // Return true to show success in the UI
      }

      // Check if the app is already installed
      if (isAppInstalled()) {
        console.log('App is already installed');
        setState(prev => ({ ...prev, isInstalled: true }));
        return true;
      }

      return false;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;

      // Clear the deferred prompt
      setState((prev) => ({ ...prev, deferredPrompt: null }));

      const accepted = choiceResult.outcome === 'accepted';

      // If accepted, update the installed state
      if (accepted) {
        setState(prev => ({ ...prev, isInstalled: true }));
      }

      return accepted;
    } catch (error) {
      console.error('Error during installation prompt:', error);
      return false;
    }
  };

  return {
    ...state,
    promptInstall,
  };
}
