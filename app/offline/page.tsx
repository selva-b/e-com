import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Offline | E-com',
  description: 'You are currently offline',
};

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="p-6 bg-muted rounded-full mb-6">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h1 className="text-3xl font-bold mb-2">You're Offline</h1>
      
      <p className="text-muted-foreground mb-8 max-w-md">
        It seems you're not connected to the internet. Some features may be unavailable until you reconnect.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => window.location.reload()} 
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        
        <Button 
          variant="outline" 
          asChild
        >
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}
