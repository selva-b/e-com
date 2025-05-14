import * as admin from 'firebase-admin';

// Check if Firebase Admin is already initialized
if (typeof window === 'undefined' && !admin.apps.length) {
  // Only initialize on the server side
  try {
    // Get service account credentials from environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Replace escaped newlines with actual newlines
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
        ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    };

    // Check if we have all required credentials
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      console.warn('Missing Firebase Admin credentials in environment variables');
    } else {
      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL,
      });
      console.log('Firebase Admin initialized successfully');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export default admin;
