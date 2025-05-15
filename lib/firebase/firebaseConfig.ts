// Firebase configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Messaging imports are conditionally loaded in browser environment
let messaging: any;
let getToken: any;
let onMessage: any;

// Only import messaging in browser environment
if (typeof window !== 'undefined') {
  // Dynamic import for Firebase messaging
  import('firebase/messaging').then((module) => {
    const { getMessaging, getToken: getTokenFn, onMessage: onMessageFn } = module;
    messaging = getMessaging;
    getToken = getTokenFn;
    onMessage = onMessageFn;
  }).catch(err => {
    console.error('Error importing Firebase messaging:', err);
  });
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDScqhttw8arTOYIzG6gaUs4L4sFmpFP7U",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "e-com-55bec.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "e-com-55bec",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "e-com-55bec.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "495288878612",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:495288878612:web:1c5a20695221bf9ec48901",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-568ENVE6HG",
};

// Check if Firebase is configured
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

// Initialize Firebase
let app;
let db;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  app = null;
  db = null;
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

    // Ensure Firebase messaging is loaded
    if (!messaging || !getToken) {
      try {
        // Wait for dynamic import to complete
        await new Promise((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 10;

          const checkMessaging = () => {
            attempts++;
            if (messaging && getToken) {
              resolve(true);
            } else if (attempts >= maxAttempts) {
              reject(new Error('Timed out waiting for Firebase messaging to load'));
            } else {
              setTimeout(checkMessaging, 100);
            }
          };
          checkMessaging();
        });
      } catch (error) {
        console.error('Error loading Firebase messaging:', error);
        return null;
      }
    }

    // Get messaging instance
    const messagingInstance = messaging(app);

    // Get FCM token
    const currentToken = await getToken(messagingInstance, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BLBe_UOKjLKTgQ9iAhPQDZy9z1sJgCgQJBPvbVaFk3xLTOQQnOYlhMBAGlRVnTGzOJMgbhWJLZzJyW5DDtxrOOo',
    });

    if (!currentToken) {
      console.log('Failed to get FCM token');
      return null;
    }

    return currentToken;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Handle foreground messages
export const onMessageListener = () => {
  if (typeof window === 'undefined') return Promise.resolve(() => {});

  return new Promise((resolve, reject) => {
    // Ensure Firebase messaging is loaded
    if (!messaging || !onMessage) {
      // Wait for dynamic import to complete
      let attempts = 0;
      const maxAttempts = 10;

      const checkMessaging = () => {
        attempts++;
        if (messaging && onMessage) {
          try {
            const messagingInstance = messaging(app);
            resolve(onMessage(messagingInstance, (payload) => {
              console.log('Message received in foreground:', payload);
              return payload;
            }));
          } catch (error) {
            console.error('Error setting up message listener:', error);
            resolve(() => {});
          }
        } else if (attempts >= maxAttempts) {
          console.warn('Timed out waiting for Firebase messaging to load');
          resolve(() => {});
        } else {
          setTimeout(checkMessaging, 100);
        }
      };
      checkMessaging();
    } else {
      try {
        const messagingInstance = messaging(app);
        resolve(onMessage(messagingInstance, (payload) => {
          console.log('Message received in foreground:', payload);
          return payload;
        }));
      } catch (error) {
        console.error('Error setting up message listener:', error);
        resolve(() => {});
      }
    }
  });
};

export { app, db };
