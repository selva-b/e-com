import { NextResponse } from 'next/server';
import firebaseAdmin from '@/lib/firebase/firebaseAdminWithServiceAccount';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const title = url.searchParams.get('title') || 'Test Firebase Push Notification';
    const body = url.searchParams.get('body') || `This is a test Firebase push notification sent at ${new Date().toLocaleTimeString()}.`;

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Get user profile for notification
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    // Get user's FCM tokens from database
    const { data: tokens, error: tokenError } = await supabase
      .from('firebase_tokens')
      .select('token, created_at')
      .eq('user_id', userId);

    // Check if tokens exist
    if (tokenError) {
      console.error('Error fetching FCM tokens:', tokenError);
      return NextResponse.json(
        { error: 'Error fetching FCM tokens', details: tokenError.message },
        { status: 500 }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No FCM tokens found for user: ${userId}`);

      // Save notification to database for later retrieval
      await supabase.from('user_notifications').insert([
        {
          user_id: userId,
          title,
          body,
          type: 'test',
          data: {
            test: 'true',
            timestamp: new Date().toISOString(),
            url: '/account'
          },
          is_read: false,
        },
      ]);

      return NextResponse.json({
        success: false,
        message: 'No FCM tokens found for this user',
        databaseOnly: true,
        tokensFound: 0,
      });
    }

    // Extract token strings and log them for debugging
    const tokenStrings = tokens.map(t => t.token);
    console.log(`Found ${tokenStrings.length} FCM tokens for user ${userId}`);

    // Create custom data payload
    const data = {
      test: 'true',
      timestamp: new Date().toISOString(),
      url: '/account',
      user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'User'
    };

    // Prepare notification message
    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens: tokenStrings,
    };

    // Send notification using Firebase Admin
    console.log('Sending Firebase push notification...');

    // Check if Firebase Admin is properly initialized
    if (!firebaseAdmin.apps || firebaseAdmin.apps.length === 0) {
      console.error('Firebase Admin SDK is not properly initialized');
      return NextResponse.json(
        {
          error: 'Firebase Admin SDK is not properly initialized. Check server logs for details.',
          firebaseStatus: 'not_initialized'
        },
        { status: 500 }
      );
    }

    // Get the response from the try block
    let response;
    try {
      // Get the messaging service
      const messaging = firebaseAdmin.messaging();
      console.log('Firebase messaging service obtained successfully');

      // Send the multicast message
      response = await messaging.sendMulticast(message);
      console.log('Firebase push notification response:', response);
    } catch (firebaseError: any) {
      console.error('Firebase messaging error:', firebaseError);

      // Log the error in the database with error handling
      try {
        await supabase.from('notification_logs').insert([
          {
            user_id: userId,
            title,
            body,
            type: 'test',
            status: 'failed',
            error_message: firebaseError.message || 'Firebase messaging error',
          },
        ]);
        console.log('Error logged successfully in notification_logs table');
      } catch (logError) {
        console.error('Error logging notification error in database:', logError);
        // Continue execution even if logging fails
      }

      // Save notification to database for notification center anyway with error handling
      try {
        await supabase.from('user_notifications').insert([
          {
            user_id: userId,
            title,
            body,
            type: 'test',
            data: {
              ...data,
              error: 'Failed to send push notification',
              error_message: firebaseError.message || 'Firebase messaging error',
            },
            is_read: false,
          },
        ]);
        console.log('Error notification saved successfully to user_notifications table');
      } catch (saveError) {
        console.error('Error saving notification error to database:', saveError);
        // Continue execution even if saving fails
      }

      // Return detailed error information
      return NextResponse.json(
        {
          error: 'Firebase messaging error',
          details: firebaseError.message,
          code: firebaseError.code,
          errorInfo: firebaseError.errorInfo,
          firebaseStatus: 'error',
          databaseLogged: true,
        },
        { status: 500 }
      );
    }

    // If we got here, we have a response

    // Log notification in database with error handling
    try {
      await supabase.from('notification_logs').insert([
        {
          user_id: userId,
          title,
          body,
          type: 'test',
          status: response.successCount > 0 ? 'sent' : 'failed',
          success_count: response.successCount,
          failure_count: response.failureCount,
        },
      ]);
      console.log('Notification logged successfully in notification_logs table');
    } catch (logError) {
      console.error('Error logging notification in database:', logError);
      // Continue execution even if logging fails
    }

    // Save notification to database for notification center with error handling
    try {
      await supabase.from('user_notifications').insert([
        {
          user_id: userId,
          title,
          body,
          type: 'test',
          data,
          is_read: false,
        },
      ]);
      console.log('Notification saved successfully to user_notifications table');
    } catch (saveError) {
      console.error('Error saving notification to database:', saveError);
      // Continue execution even if saving fails
    }

    // Check for failures and log them
    const failureDetails = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failureDetails.push({
            token: tokenStrings[idx].substring(0, 10) + '...',
            error: resp.error ? resp.error.message : 'Unknown error'
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Firebase push notification test completed',
      result: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        tokensTotal: tokenStrings.length,
        failureDetails: failureDetails.length > 0 ? failureDetails : undefined,
      },
    });
  } catch (error: any) {
    console.error('Error testing Firebase push notification:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to test Firebase push notification',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
