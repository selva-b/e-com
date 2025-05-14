import { supabase } from '@/lib/supabase/client';
import { sendEmail, EmailTemplateType } from '@/lib/email/emailService';

// Import Firebase Admin only on the server side
let admin: any;
if (typeof window === 'undefined') {
  import('@/lib/firebase/firebaseAdmin').then((module) => {
    admin = module.default;
  }).catch(err => {
    console.error('Error importing Firebase Admin:', err);
  });
}

// Notification types
export type NotificationType = 'order_placed' | 'registration' | 'order_status' | 'stock_alert' | 'custom';

// Interface for notification data
export interface NotificationData {
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

// Function to replace variables in template
export const replaceTemplateVariables = (template: string, variables: Record<string, string | number>) => {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }

  return result;
};

// Send push notification to a specific user
export const sendPushNotification = async (userId: string, title: string, body: string, data: Record<string, string> = {}) => {
  try {
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      console.log('Push notifications can only be sent from the server side');
      return { success: false, error: 'Push notifications can only be sent from the server side' };
    }

    // Ensure Firebase Admin is loaded
    if (!admin) {
      // Wait for dynamic import to complete
      await new Promise<void>((resolve) => {
        const checkAdmin = () => {
          if (admin) {
            resolve();
          } else {
            setTimeout(checkAdmin, 100);
          }
        };
        checkAdmin();
      });
    }

    // Get user's FCM tokens from database
    const { data: tokens, error } = await supabase
      .from('firebase_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error) throw error;

    if (!tokens || tokens.length === 0) {
      console.log(`No FCM tokens found for user: ${userId}`);
      return { success: false, error: 'No FCM tokens found for user' };
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
    const response = await admin.messaging().sendMulticast(message);

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

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);

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

    return { success: false, error };
  }
};

// Send notification (email and/or push)
export const sendNotification = async (notificationData: NotificationData) => {
  try {
    const results: any = { push: null, email: null };

    // Get user profile for email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', notificationData.userId)
      .single();

    if (profileError) throw profileError;

    // Send push notification if requested
    if (notificationData.push) {
      results.push = await sendPushNotification(
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
      results.email = await sendEmail({
        to: profile.email,
        subject: notificationData.title,
        templateType: emailTemplateType,
        variables: emailVariables,
      });
    }

    return results;
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }
};
