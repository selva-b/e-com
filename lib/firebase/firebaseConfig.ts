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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

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
      // Wait for dynamic import to complete
      await new Promise(resolve => {
        const checkMessaging = () => {
          if (messaging && getToken) {
            resolve(true);
          } else {
            setTimeout(checkMessaging, 100);
          }
        };
        checkMessaging();
      });
    }

    // Get messaging instance
    const messagingInstance = messaging(app);

    // Get FCM token
    const currentToken = await getToken(messagingInstance, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
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
      const checkMessaging = () => {
        if (messaging && onMessage) {
          const messagingInstance = messaging(app);
          resolve(onMessage(messagingInstance, (payload) => {
            console.log('Message received in foreground:', payload);
            return payload;
          }));
        } else {
          setTimeout(checkMessaging, 100);
        }
      };
      checkMessaging();
    } else {
      const messagingInstance = messaging(app);
      resolve(onMessage(messagingInstance, (payload) => {
        console.log('Message received in foreground:', payload);
        return payload;
      }));
    }
  });
};

export { app, db };
