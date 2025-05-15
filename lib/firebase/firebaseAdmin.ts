import * as admin from 'firebase-admin';

// Function to initialize Firebase Admin
const initializeFirebaseAdmin = () => {
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
    console.log('Initializing Firebase Admin SDK...');

    // Get service account credentials from environment variables
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const databaseURL = process.env.FIREBASE_ADMIN_DATABASE_URL;

    // Log credential availability (without exposing sensitive data)
    console.log('Firebase Admin credentials check:');
    console.log('- Project ID:', projectId ? 'Available' : 'Missing');
    console.log('- Client Email:', clientEmail ? 'Available' : 'Missing');
    console.log('- Private Key:', privateKey ? 'Available (length: ' + privateKey.length + ')' : 'Missing');
    console.log('- Database URL:', databaseURL ? 'Available' : 'Missing');

    // Check if we have all required credentials
    if (!projectId || !clientEmail || !privateKey) {
      console.error('Missing Firebase Admin credentials in environment variables');
      throw new Error('Missing Firebase Admin credentials. Check your environment variables.');
    }

    // Prepare the service account object
    const serviceAccount = {
      projectId,
      clientEmail,
      // Replace escaped newlines with actual newlines
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL,
    });

    console.log('Firebase Admin SDK initialized successfully');

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

// Initialize Firebase Admin with error handling
let firebaseAdmin: typeof admin;

try {
  firebaseAdmin = initializeFirebaseAdmin();
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK. Push notifications will not work.');
  // Provide a fallback admin object that will throw clear errors when used
  firebaseAdmin = admin;
}

export default firebaseAdmin;
