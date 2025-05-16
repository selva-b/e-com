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
  
  // Don't show the button if the app is already installed or can't be installed
  if (isInstalled || (!canInstall && !isIOS)) {
    return null;
  }
  
  const handleInstall = async () => {
    setIsInstalling(true);
    
    if (isIOS) {
      // For iOS, we can't automatically install, so we show instructions
      // This would typically open a modal with instructions
      console.log('iOS installation instructions should be shown');
      setInstallSuccess(true);
    } else if (deferredPrompt) {
      // For other browsers that support installation
      const installed = await promptInstall();
      setInstallSuccess(installed);
    }
    
    setIsInstalling(false);
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
