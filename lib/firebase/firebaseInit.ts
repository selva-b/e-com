'use client';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDScqhttw8arTOYIzG6gaUs4L4sFmpFP7U",
  authDomain: "e-com-55bec.firebaseapp.com",
  projectId: "e-com-55bec",
  storageBucket: "e-com-55bec.firebasestorage.app",
  messagingSenderId: "495288878612",
  appId: "1:495288878612:web:1c5a20695221bf9ec48901",
  measurementId: "G-568ENVE6HG"
};

// Initialize Firebase
let app;
let analytics;

// Only initialize Firebase in the browser
if (typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    // Only initialize analytics in production
    if (process.env.NODE_ENV === 'production') {
      analytics = getAnalytics(app);
    }
    console.log('Firebase initialized successfully with new configuration');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

// Messaging imports are conditionally loaded in browser environment
let messaging: any;
let getToken: any;
let onMessage: any;
let messagingPromise: Promise<void> | null = null;

// Only import messaging in browser environment
if (typeof window !== 'undefined') {
  // Create a promise that resolves when Firebase messaging is loaded
  messagingPromise = import('firebase/messaging')
    .then((module) => {
      const { getMessaging, getToken: getTokenFn, onMessage: onMessageFn } = module;
      messaging = getMessaging;
      getToken = getTokenFn;
      onMessage = onMessageFn;
      console.log('Firebase messaging loaded successfully with new configuration');
    })
    .catch(err => {
      console.error('Error importing Firebase messaging:', err);
      // Re-throw to allow catching this error elsewhere
      throw err;
    });
}

// Request permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    if (typeof window === 'undefined') return null;

    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Wait for Firebase messaging to load
    if (messagingPromise) {
      try {
        console.log('Waiting for Firebase messaging to load...');
        await messagingPromise;
        console.log('Firebase messaging loaded, continuing...');
      } catch (error) {
        console.error('Error waiting for Firebase messaging:', error);
        return null;
      }
    }

    // Double-check that messaging and getToken are available
    if (!messaging || !getToken) {
      console.error('Firebase messaging not available after waiting');
      return null;
    }

    // Get messaging instance
    console.log('Getting messaging instance...');
    const messagingInstance = messaging(app);

    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (!registration) {
          console.log('Registering service worker...');
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service worker registered successfully');
        } else {
          console.log('Service worker already registered');
        }
      } catch (swError) {
        console.error('Error registering service worker:', swError);
      }
    }

    // Get FCM token
    console.log('Getting FCM token...');
    
    // Use a valid VAPID key from Firebase console
    const vapidKey = 'BPQYoTQlsJQeGnCB9mJwuT_We_5RQlRYXUmcCgZrUJgGUZrTvYxjI6GGpqNKjIJCGC_Z_Vg8eUJtQHjrLmjFV-A';
    console.log('Using VAPID key:', vapidKey);
    
    // Get service worker registration
    let swRegistration;
    try {
      swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!swRegistration) {
        console.log('No service worker registration found, trying to get default registration');
        swRegistration = await navigator.serviceWorker.ready;
      }
    } catch (swError) {
      console.error('Error getting service worker registration:', swError);
    }
    
    // Try to get token with different configurations
    let currentToken = null;
    
    try {
      // First attempt: with service worker registration
      if (swRegistration) {
        console.log('Attempting to get token with service worker registration');
        currentToken = await getToken(messagingInstance, {
          vapidKey,
          serviceWorkerRegistration: swRegistration,
        });
      }
    } catch (error) {
      console.error('Error getting token with service worker registration:', error);
    }
    
    // If first attempt failed, try without service worker registration
    if (!currentToken) {
      try {
        console.log('Attempting to get token without service worker registration');
        currentToken = await getToken(messagingInstance, {
          vapidKey,
        });
      } catch (error) {
        console.error('Error getting token without service worker registration:', error);
      }
    }

    if (!currentToken) {
      console.log('Failed to get FCM token');
      return null;
    }

    console.log('FCM token obtained successfully:', currentToken.substring(0, 10) + '...');
    return currentToken;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Handle foreground messages
export const onMessageListener = async () => {
  if (typeof window === 'undefined') return Promise.resolve(() => {});

  try {
    // Wait for Firebase messaging to load
    if (messagingPromise) {
      try {
        console.log('Waiting for Firebase messaging to load for message listener...');
        await messagingPromise;
        console.log('Firebase messaging loaded for message listener');
      } catch (error) {
        console.error('Error waiting for Firebase messaging for message listener:', error);
        return Promise.resolve(() => {});
      }
    }

    // Double-check that messaging and onMessage are available
    if (!messaging || !onMessage) {
      console.error('Firebase messaging not available for message listener after waiting');
      return Promise.resolve(() => {});
    }

    // Get messaging instance
    const messagingInstance = messaging(app);

    // Set up message listener
    return onMessage(messagingInstance, (payload: any) => {
      console.log('Message received in foreground:', payload);
      return payload;
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return Promise.resolve(() => {});
  }
};

export { app, analytics };
