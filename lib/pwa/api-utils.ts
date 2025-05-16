'use client';

/**
 * Enhanced fetch function for PWA that handles service worker caching issues
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise with the fetch response
 */
export async function pwaFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Add cache-busting for GET requests in PWA context
  const isPWA = typeof window !== 'undefined' && 
    (window.matchMedia('(display-mode: standalone)').matches || 
     window.matchMedia('(display-mode: minimal-ui)').matches);
  
  // Create a new URL object
  const urlObj = new URL(url, window.location.origin);
  
  // For GET requests in PWA mode, add a cache-busting parameter
  if (isPWA && (!options.method || options.method === 'GET')) {
    urlObj.searchParams.set('_pwa', Date.now().toString());
  }
  
  // Ensure headers are set correctly
  const headers = new Headers(options.headers || {});
  
  // Add cache control headers for PWA context
  if (isPWA) {
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
  }
  
  // Create new options with updated headers
  const newOptions = {
    ...options,
    headers
  };
  
  // Add credentials to ensure cookies are sent
  if (!newOptions.credentials) {
    newOptions.credentials = 'include';
  }
  
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const response = await fetch(urlObj.toString(), {
      ...newOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Check if the response came from the service worker cache
    const isFromCache = response.headers.get('X-From-Service-Worker-Cache') === 'true';
    
    // If it's from cache and we're in PWA mode, we might want to refresh in the background
    if (isFromCache && isPWA) {
      console.log('Response came from service worker cache, refreshing in background');
      
      // Trigger a background refresh
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'REFRESH_CACHE',
          url: urlObj.toString()
        });
      }
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // If we're in PWA mode and offline, show a user-friendly message
    if (isPWA && !navigator.onLine) {
      console.error('Network request failed while offline:', error);
      
      // Create a custom response for offline scenarios
      return new Response(
        JSON.stringify({
          error: 'You are currently offline. Please check your connection and try again.',
          offline: true
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

/**
 * Check if the app is running as a PWA
 * @returns boolean indicating if the app is running in PWA mode
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true // iOS Safari
  );
}
