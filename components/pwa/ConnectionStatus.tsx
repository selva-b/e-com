'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

export default function ConnectionStatus() {
  const { isOnline } = usePWA();
  const [showMessage, setShowMessage] = useState(false);
  const [apiStatus, setApiStatus] = useState<'ok' | 'error' | 'checking'>('checking');

  // Check if APIs are working
  useEffect(() => {
    if (!isOnline) {
      setApiStatus('error');
      setShowMessage(true);
      return;
    }

    const checkApiStatus = async () => {
      try {
        // Simple API endpoint to test connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('/api/pwa-status', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('PWA API status check:', data);
          setApiStatus('ok');
          setShowMessage(false);
        } else {
          console.error('API status check returned error:', response.status);
          setApiStatus('error');
          setShowMessage(true);
        }
      } catch (error) {
        console.error('API connectivity test failed:', error);
        setApiStatus('error');
        setShowMessage(true);
      }
    };

    // Check API status when online status changes
    if (isOnline) {
      checkApiStatus();
    }

    // Set up interval to periodically check API status
    const intervalId = setInterval(() => {
      if (isOnline) {
        checkApiStatus();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [isOnline]);

  // Hide message after 5 seconds if everything is OK
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (apiStatus === 'ok' && showMessage) {
      timeoutId = setTimeout(() => {
        setShowMessage(false);
      }, 5000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [apiStatus, showMessage]);

  if (!showMessage) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-3 z-50 flex items-center justify-between ${
      !isOnline ? 'bg-destructive text-destructive-foreground' :
      apiStatus === 'error' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
    }`}>
      <div className="flex items-center">
        {!isOnline ? (
          <WifiOff className="h-5 w-5 mr-2" />
        ) : apiStatus === 'error' ? (
          <AlertCircle className="h-5 w-5 mr-2" />
        ) : (
          <Wifi className="h-5 w-5 mr-2" />
        )}
        <span className="text-sm font-medium">
          {!isOnline
            ? 'You are offline. Some features may be unavailable.'
            : apiStatus === 'error'
            ? 'API connectivity issues. Try refreshing the page.'
            : 'Connected to network and APIs.'
          }
        </span>
      </div>
      <button
        onClick={() => setShowMessage(false)}
        className="text-sm underline"
      >
        Dismiss
      </button>
    </div>
  );
}
