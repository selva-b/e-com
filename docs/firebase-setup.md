# Firebase Setup for Push Notifications

This guide will help you set up Firebase for push notifications in your e-commerce application.

## Prerequisites

1. A Google account
2. A Firebase project (you can create one for free)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "E-commerce App")
4. Follow the setup wizard to create your project

## Step 2: Register Your Web App

1. In the Firebase Console, click on your project
2. Click on the web icon (</>) to add a web app
3. Enter a nickname for your app (e.g., "E-commerce Web App")
4. Check the box for "Also set up Firebase Hosting" if you plan to use it
5. Click "Register app"
6. Copy the Firebase configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## Step 3: Enable Firebase Cloud Messaging

1. In the Firebase Console, go to "Build" > "Cloud Messaging"
2. Click "Set up Cloud Messaging"
3. Follow the setup wizard to enable Cloud Messaging

## Step 4: Generate a VAPID Key

1. In the Firebase Console, go to "Project settings" > "Cloud Messaging"
2. Scroll down to the "Web configuration" section
3. Click "Generate key pair" under "Web Push certificates"
4. Copy the generated key

## Step 5: Set Up Firebase Admin SDK

1. In the Firebase Console, go to "Project settings" > "Service accounts"
2. Click "Generate new private key"
3. Save the JSON file securely
4. Extract the following values from the JSON file:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 6: Update Your Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_firebase_vapid_key

# Firebase Admin Configuration
FIREBASE_ADMIN_PROJECT_ID=your_firebase_admin_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_firebase_admin_client_email
FIREBASE_ADMIN_PRIVATE_KEY=your_firebase_admin_private_key
FIREBASE_ADMIN_DATABASE_URL=your_firebase_admin_database_url
```

Replace the placeholder values with the actual values from your Firebase project.

## Step 7: Create Required Database Tables

Run the SQL script in `scripts/init-notification-tables.sql` to create the required tables for the notification system.

## Step 8: Test Push Notifications

1. Start your application
2. Go to the account page
3. Click "Enable Notifications" to subscribe to push notifications
4. Test sending a notification from the admin dashboard

## Troubleshooting

### Push Notifications Not Working

1. Check that all Firebase environment variables are set correctly
2. Make sure you've enabled Cloud Messaging in your Firebase project
3. Verify that the VAPID key is correct
4. Check browser console for any errors
5. Ensure that the service worker is registered correctly

### Firebase Admin SDK Not Working

1. Make sure the private key is properly formatted (it should include newlines)
2. Check that the project ID and client email are correct
3. Verify that the Firebase Admin SDK is properly initialized

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
