'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerClasses = fullScreen
    ? 'flex flex-col justify-center items-center min-h-screen'
    : 'flex flex-col justify-center items-center py-8';

  return (
    <div className={cn(containerClasses, className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin mb-2')} />
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  );
}
