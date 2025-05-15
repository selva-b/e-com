import { NextResponse } from 'next/server';
import firebaseAdmin from '@/lib/firebase/firebaseAdminWithServiceAccount';
import { existsSync } from 'fs';

export async function GET() {
  try {
    // Check if service account file exists
    const serviceAccountPath = process.cwd() + '/firebase-service-account.json';
    const serviceAccountExists = existsSync(serviceAccountPath);

    // Check if Firebase Admin is properly initialized
    if (!firebaseAdmin.apps || firebaseAdmin.apps.length === 0) {
      console.error('Firebase Admin SDK is not properly initialized');
      return NextResponse.json(
        {
          status: 'error',
          error: 'Firebase Admin SDK is not properly initialized. Check server logs for details.',
          firebaseStatus: 'not_initialized',
          serviceAccountFile: {
            path: serviceAccountPath,
            exists: serviceAccountExists
          },
          environmentCheck: {
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID ? 'Available' : 'Missing',
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'Available' : 'Missing',
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'Available (length: ' +
              (process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0) + ')' : 'Missing',
            databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL ? 'Available' : 'Missing',
          }
        },
        { status: 500 }
      );
    }

    // Try to access the messaging service
    try {
      const messaging = firebaseAdmin.messaging();

      // Return success response
      return NextResponse.json({
        status: 'ok',
        message: 'Firebase Admin SDK is properly configured and ready to use.',
        firebaseStatus: 'initialized',
        appCount: firebaseAdmin.apps.length,
        serviceAccountFile: {
          path: serviceAccountPath,
          exists: serviceAccountExists
        },
        environmentCheck: {
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID ? 'Available' : 'Missing',
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'Available' : 'Missing',
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'Available (length: ' +
            (process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0) + ')' : 'Missing',
          databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL ? 'Available' : 'Missing',
        }
      });
    } catch (error: any) {
      // Return error response
      console.error('Firebase messaging service error:', error);
      return NextResponse.json(
        {
          status: 'error',
          error: 'Firebase messaging service error: ' + error.message,
          firebaseStatus: 'error',
          errorDetails: {
            name: error.name,
            message: error.message,
            code: error.code,
          },
          serviceAccountFile: {
            path: serviceAccountPath,
            exists: serviceAccountExists
          },
          environmentCheck: {
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID ? 'Available' : 'Missing',
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'Available' : 'Missing',
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'Available (length: ' +
              (process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0) + ')' : 'Missing',
            databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL ? 'Available' : 'Missing',
          }
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error checking Firebase Admin SDK status:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Error checking Firebase Admin SDK status: ' + error.message,
        errorDetails: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }
      },
      { status: 500 }
    );
  }
}
