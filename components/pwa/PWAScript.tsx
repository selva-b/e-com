'use client';

import Script from 'next/script';

export default function PWAScript() {
  return (
    <Script
      id="pwa-register"
      src="/pwa-register.js"
      strategy="lazyOnload"
    />
  );
}
