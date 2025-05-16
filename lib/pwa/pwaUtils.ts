'use client';

/**
 * Check if the app is running in standalone mode (installed as PWA)
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true // iOS Safari
  );
}

/**
 * Check if the app is running on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if the app is running on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent);
}

/**
 * Check if the browser supports service workers
 */
export function supportsServiceWorker(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'serviceWorker' in navigator;
}

/**
 * Check if the browser supports PWA installation
 */
export function supportsPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return supportsServiceWorker() && 'BeforeInstallPromptEvent' in window;
}

/**
 * Check if the user is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  
  return navigator.onLine;
}

/**
 * Register a callback for online/offline events
 */
export function onConnectionChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Get the current network information (if available)
 */
export function getNetworkInformation(): {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
} {
  if (typeof window === 'undefined') return {};
  
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
  
  if (!connection) return {};
  
  return {
    type: connection.type,
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}
