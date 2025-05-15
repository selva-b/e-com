import { NextResponse } from 'next/server';
import { sendServerEmail } from '@/lib/email/serverEmailService';
import { sendServerPushNotification, sendServerNotification } from '@/lib/notifications/serverNotificationService';
import { supabase } from '@/lib/supabase/client';


export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const email = url.searchParams.get('email');
    const type = url.searchParams.get('type') || 'test';
    const testType = url.searchParams.get('testType') || 'all'; // 'email', 'push', or 'all'

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId or email is required' },
        { status: 400 }
      );
    }

    const results: any = {};

    // Test email if requested
    if ((testType === 'email' || testType === 'all') && email) {
      console.log('Testing email notification to:', email);

      const emailResult = await sendServerEmail({
        to: email,
        templateType: 'registration', // Use a template that exists in your database
        variables: {
          first_name: 'Test',
          last_name: 'User',
          verification_link: 'https://example.com/verify',
        },
      });

      results.email = emailResult;
      console.log('Email test result:', emailResult);
    }

    // Test push notification if requested
    if ((testType === 'push' || testType === 'all') && userId) {
      console.log('Testing push notification to user:', userId);

      // Get user profile for notification
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      // Create a more detailed test notification
      const pushResult = await sendServerPushNotification(
        userId,
        'Test Push Notification',
        `This is a test push notification sent at ${new Date().toLocaleTimeString()}.`,
        {
          test: 'true',
          timestamp: new Date().toISOString(),
          url: '/account',
          user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'User'
        }
      );

      results.push = pushResult;
      console.log('Push test result:', pushResult);

      // Also log the notification to the database for the notification center
      try {
        await supabase.from('user_notifications').insert([
          {
            user_id: userId,
            title: 'Test Push Notification',
            body: `This is a test push notification sent at ${new Date().toLocaleTimeString()}.`,
            type: 'test',
            data: {
              test: 'true',
              timestamp: new Date().toISOString(),
              url: '/account'
            },
            is_read: false,
          },
        ]);
        console.log('Notification saved to database');
      } catch (dbError) {
        console.error('Error saving notification to database:', dbError);
      }
    }

    // Test combined notification if requested
    if (testType === 'all' && userId) {
      console.log('Testing combined notification to user:', userId);

      const notificationResult = await sendServerNotification({
        userId,
        title: 'Test Combined Notification',
        body: 'This is a test notification with both email and push.',
        type: 'custom',
        data: { test: 'true', timestamp: new Date().toISOString() },
        email: true,
        push: true,
      });

      results.combined = notificationResult;
      console.log('Combined test result:', notificationResult);
    }

    // If no tests were run
    if (Object.keys(results).length === 0) {
      return NextResponse.json(
        { error: 'No tests were run. Check your parameters.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification tests completed',
      results,
    });
  } catch (error: any) {
    console.error('Error testing notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test notifications' },
      { status: 500 }
    );
  }
}
