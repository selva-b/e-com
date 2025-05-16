'use client';

import dynamic from 'next/dynamic';

// Dynamically import the PWA components to avoid hydration issues
const InstallBanner = dynamic(() => import('@/components/pwa/InstallBanner'), {
  ssr: false,
});

const OfflineIndicator = dynamic(() => import('@/components/pwa/OfflineIndicator'), {
  ssr: false,
});

export default function PWAComponents() {
  return (
    <>
      <OfflineIndicator />
      <InstallBanner />
    </>
  );
}
