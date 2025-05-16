'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Check initial online status
    setIsOffline(!navigator.onLine);
    
    // Handle online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      // Hide the indicator after a delay
      setTimeout(() => setIsVisible(false), 2000);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setIsVisible(true);
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Only show the indicator when offline
  useEffect(() => {
    if (isOffline) {
      setIsVisible(true);
    }
  }, [isOffline]);
  
  return (
    <div 
      className={cn(
        'fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center z-50 transition-transform duration-300',
        isVisible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      <WifiOff className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium">
        {isOffline 
          ? 'You are offline. Some features may be unavailable.' 
          : 'You are back online!'}
      </span>
    </div>
  );
}
