'use client';

import { useEffect, useState } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NetworkStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function NetworkStatus({ 
  showDetails = false,
  className = '',
}: NetworkStatusProps) {
  const { isOnline, networkInfo } = usePWA();
  const [visible, setVisible] = useState(true);
  
  // Hide after 5 seconds if online
  useEffect(() => {
    if (isOnline && !showDetails) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [isOnline, showDetails]);
  
  if (!visible) {
    return null;
  }
  
  // Format connection type for display
  const getConnectionQuality = () => {
    if (!isOnline) return 'Offline';
    
    const { effectiveType } = networkInfo;
    
    if (!effectiveType) return 'Connected';
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'Poor';
      case '3g':
        return 'Fair';
      case '4g':
        return 'Good';
      default:
        return 'Connected';
    }
  };
  
  // Get color based on connection quality
  const getStatusColor = () => {
    if (!isOnline) return 'destructive';
    
    const { effectiveType } = networkInfo;
    
    if (!effectiveType) return 'default';
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'destructive';
      case '3g':
        return 'warning';
      case '4g':
        return 'success';
      default:
        return 'default';
    }
  };
  
  const quality = getConnectionQuality();
  const color = getStatusColor();
  
  return (
    <div className={cn('flex items-center', className)}>
      <Badge variant={color as any} className="flex items-center gap-1">
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span>{quality}</span>
      </Badge>
      
      {showDetails && isOnline && networkInfo.effectiveType && (
        <div className="ml-2 text-xs text-muted-foreground">
          {networkInfo.effectiveType.toUpperCase()}
          {networkInfo.downlink && ` • ${networkInfo.downlink.toFixed(1)} Mbps`}
          {networkInfo.rtt && ` • ${networkInfo.rtt}ms`}
          {networkInfo.saveData && (
            <span className="ml-1 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Data Saver
            </span>
          )}
        </div>
      )}
    </div>
  );
}
