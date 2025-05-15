import { createClient } from '@/lib/supabase/server';
import firebaseAdmin from '@/lib/firebase/firebaseAdmin';
import { sendServerEmail } from '@/lib/email/serverEmailService';
import { EmailTemplateType } from '@/lib/email/emailService';

// Notification types
export type NotificationType = 'order_placed' | 'registration' | 'order_status' | 'stock_alert' | 'custom';

// Interface for server-side notification data
export interface ServerNotificationData {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
  email?: boolean;
  push?: boolean;
}

// Function to get notification template from database
export const getNotificationTemplate = async (templateType: NotificationType) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('type', templateType)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching notification template:', error);
    return null;
  }
};

// Send push notification to a specific user
export const sendServerPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  try {
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      console.log('Push notifications can only be sent from the server side');
      return { success: false, error: 'Push notifications can only be sent from the server side' };
    }

    const supabase = createClient();

    // Get user's notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no preferences found or push is disabled, save notification to database only
    if (prefError || !preferences || !preferences.push_enabled) {
      console.log(`Push notifications disabled or no preferences for user: ${userId}`);

      // Save notification to database for later retrieval
      await supabase.from('user_notifications').insert([
        {
          user_id: userId,
          title,
          body,
          type: 'push',
          data,
          is_read: false,
        },
      ]);

      return { success: true, method: 'database_only' };
    }

    // Get user's FCM tokens from database
    const { data: tokens, error } = await supabase
      .from('firebase_tokens')
      .select('token')
      .eq('user_id', userId);

    // If no tokens found, save notification to database only
    if (error || !tokens || tokens.length === 0) {
      console.log(`No FCM tokens found for user: ${userId}`);

      // Save notification to database for later retrieval
      await supabase.from('user_notifications').insert([
        {
          user_id: userId,
          title,
          body,
          type: 'push',
          data,
          is_read: false,
        },
      ]);

      return { success: true, method: 'database_only' };
    }

    // Extract token strings
    const tokenStrings = tokens.map(t => t.token);

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
    const response = await firebaseAdmin.messaging().sendMulticast(message);

    // Log notification in database
    await supabase.from('notification_logs').insert([
      {
        user_id: userId,
        title,
        body,
        type: 'push',
        status: response.successCount > 0 ? 'sent' : 'failed',
        success_count: response.successCount,
        failure_count: response.failureCount,
      },
    ]);

    // Save notification to database for later retrieval regardless of FCM success
    await supabase.from('user_notifications').insert([
      {
        user_id: userId,
        title,
        body,
        type: 'push',
        data,
        is_read: false,
      },
    ]);

    return {
      success: true,
      fcmSuccess: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      method: 'fcm_and_database',
    };
  } catch (error: any) {
    console.error('Error sending push notification:', error);

    const supabase = createClient();

    // Log failed notification attempt
    await supabase.from('notification_logs').insert([
      {
        user_id: userId,
        title,
        body,
        type: 'push',
        status: 'failed',
        error_message: error.message,
      },
    ]);

    // Save notification to database for later retrieval even if FCM fails
    try {
      await supabase.from('user_notifications').insert([
        {
          user_id: userId,
          title,
          body,
          type: 'push',
          data,
          is_read: false,
        },
      ]);
    } catch (dbError) {
      console.error('Error saving notification to database:', dbError);
    }

    return { success: true, fcmSuccess: false, error: error.message, method: 'database_only' };
  }
};

// Send notification (email and/or push) from server-side
export const sendServerNotification = async (notificationData: ServerNotificationData) => {
  try {
    const results: any = { push: null, email: null };
    const supabase = createClient();

    // Get user profile for email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', notificationData.userId)
      .single();

    if (profileError) throw profileError;

    // Send push notification if requested
    if (notificationData.push) {
      results.push = await sendServerPushNotification(
        notificationData.userId,
        notificationData.title,
        notificationData.body,
        notificationData.data || {}
      );
    }

    // Send email notification if requested
    if (notificationData.email && profile?.email) {
      // Map notification type to email template type
      const emailTemplateType = notificationData.type as EmailTemplateType;

      // Prepare variables for email
      const emailVariables = {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        ...notificationData.data,
      };

      // Send email
      results.email = await sendServerEmail({
        to: profile.email,
        subject: notificationData.title,
        templateType: emailTemplateType,
        variables: emailVariables,
      });
    }

    return results;
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};
