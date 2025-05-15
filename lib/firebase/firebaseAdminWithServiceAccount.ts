import * as admin from 'firebase-admin';
import { join } from 'path';

// Path to the service account key file
const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');

// Function to initialize Firebase Admin with service account file
const initializeFirebaseAdminWithServiceAccount = () => {
  // Only initialize on the server side and if not already initialized
  if (typeof window !== 'undefined') {
    console.log('Firebase Admin SDK can only be initialized on the server side');
    return admin;
  }

  if (admin.apps.length > 0) {
    console.log('Firebase Admin SDK already initialized');
    return admin;
  }

  try {
    console.log('Initializing Firebase Admin SDK with service account file...');
    
    // Initialize the app with the service account file
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`,
    });

    console.log('Firebase Admin SDK initialized successfully with service account file!');
    
    // Verify that the messaging service is available
    const messaging = admin.messaging();
    console.log('Firebase Messaging service is available');
    
    return admin;
  } catch (error) {
    console.error('Firebase Admin initialization error:');
    if (error instanceof Error) {
      console.error('- Error name:', error.name);
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
    } else {
      console.error('- Unknown error:', String(error));
    }
    
    // Re-throw the error to make it clear that initialization failed
    throw error;
  }
};

// Initialize Firebase Admin with service account file
let firebaseAdminWithServiceAccount: typeof admin;

try {
  firebaseAdminWithServiceAccount = initializeFirebaseAdminWithServiceAccount();
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK with service account file. Push notifications will not work.');
  // Provide a fallback admin object that will throw clear errors when used
  firebaseAdminWithServiceAccount = admin;
}

export default firebaseAdminWithServiceAccount;
