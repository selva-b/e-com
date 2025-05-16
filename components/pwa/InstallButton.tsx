'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Check } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

interface InstallButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  text?: string;
}

export default function InstallButton({
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  text = 'Install App',
}: InstallButtonProps) {
  const { isInstalled, canInstall, deferredPrompt, promptInstall, isIOS } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Don't show the button if the app is already installed
  if (isInstalled) {
    return null;
  }

  // For debugging purposes, always show the button even if installation is not supported
  // This helps with testing the UI in development
  // In production, you might want to uncomment the following:
  // if (!canInstall && !isIOS) {
  //   return null;
  // }

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      if (isIOS) {
        // For iOS, we can't automatically install, so we show instructions
        alert('To install this app on iOS: tap the share button and then "Add to Home Screen"');
        console.log('iOS installation instructions shown');
        setInstallSuccess(true);
      } else if (deferredPrompt) {
        // For other browsers that support installation
        console.log('Prompting install with:', deferredPrompt);
        const installed = await promptInstall();
        console.log('Installation result:', installed);
        setInstallSuccess(installed);
      } else {
        // For browsers that don't support installation or when deferredPrompt is not available
        console.log('Installation not supported or deferredPrompt not available');
        alert('To install this app: tap the menu button in your browser and select "Add to Home Screen" or "Install"');
        setInstallSuccess(true);
      }
    } catch (error) {
      console.error('Error during installation:', error);
      alert('There was an error installing the app. Please try again later.');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleInstall}
      disabled={isInstalling || installSuccess}
      id="add-to-home"
    >
      {showIcon && (
        installSuccess ? (
          <Check className="h-4 w-4 mr-2" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )
      )}
      {installSuccess ? 'Added to Home Screen' : text}
    </Button>
  );
}
