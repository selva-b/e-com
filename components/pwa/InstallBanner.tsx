'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Check if the banner was previously closed
    const bannerClosed = localStorage.getItem('pwa-banner-closed') === 'true';
    
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Only show the banner if it wasn't closed before and the app is not installed
    if (!bannerClosed && !isStandalone) {
      // Delay showing the banner for better user experience
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const closeBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-closed', 'true');
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
          className="install-pwa bg-white text-primary hover:bg-white/90"
        >
          <Download className="h-4 w-4 mr-2" />
          Install
        </Button>
      </div>
    </div>
  );
}
