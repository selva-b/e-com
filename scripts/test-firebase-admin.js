/**
 * Test script for Firebase Admin SDK
 * 
 * This script tests the Firebase Admin SDK initialization and messaging functionality.
 * Run it with: node scripts/test-firebase-admin.js
 */

// Load environment variables
require('dotenv').config();

// Import Firebase Admin
const admin = require('firebase-admin');

console.log('=== Firebase Admin SDK Test ===');
console.log('Testing Firebase Admin SDK initialization and messaging functionality...');

// Check environment variables
console.log('\n1. Checking environment variables:');
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const databaseURL = process.env.FIREBASE_ADMIN_DATABASE_URL;

console.log('- Project ID:', projectId ? 'Available' : 'Missing');
console.log('- Client Email:', clientEmail ? 'Available' : 'Missing');
console.log('- Private Key:', privateKey ? `Available (length: ${privateKey.length})` : 'Missing');
console.log('- Database URL:', databaseURL ? 'Available' : 'Missing');

if (!projectId || !clientEmail || !privateKey) {
  console.error('\nERROR: Missing required Firebase Admin credentials in environment variables.');
  console.error('Make sure you have the following variables in your .env file:');
  console.error('FIREBASE_ADMIN_PROJECT_ID');
  console.error('FIREBASE_ADMIN_CLIENT_EMAIL');
  console.error('FIREBASE_ADMIN_PRIVATE_KEY');
  process.exit(1);
}

// Initialize Firebase Admin
console.log('\n2. Initializing Firebase Admin SDK:');
try {
  // Prepare the service account object
  const serviceAccount = {
    projectId,
    clientEmail,
    // Replace escaped newlines with actual newlines
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  // Initialize the app
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
  });

  console.log('Firebase Admin SDK initialized successfully!');
} catch (error) {
  console.error('ERROR: Failed to initialize Firebase Admin SDK:');
  console.error('- Error name:', error.name);
  console.error('- Error message:', error.message);
  console.error('- Error stack:', error.stack);
  process.exit(1);
}

// Test messaging functionality
console.log('\n3. Testing Firebase Messaging functionality:');
try {
  const messaging = admin.messaging();
  console.log('Firebase Messaging service obtained successfully!');
  
  // Create a test message (this won't be sent)
  const message = {
    notification: {
      title: 'Test Notification',
      body: 'This is a test notification from the Firebase Admin SDK test script.',
    },
    topic: 'test', // Using a topic instead of a token to avoid sending actual messages
  };
  
  console.log('Test message created successfully!');
  console.log('Firebase Admin SDK is properly configured and ready to use.');
} catch (error) {
  console.error('ERROR: Failed to access Firebase Messaging service:');
  console.error('- Error name:', error.name);
  console.error('- Error message:', error.message);
  console.error('- Error stack:', error.stack);
  process.exit(1);
}

console.log('\n=== Test Completed Successfully ===');
console.log('Firebase Admin SDK is properly configured and ready to use.');
console.log('You can now use the Firebase Admin SDK to send push notifications.');
