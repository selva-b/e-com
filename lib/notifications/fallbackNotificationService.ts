'use client';

import { supabase } from '@/lib/supabase/client';

// Interface for notification preferences
export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  push: boolean;
}

// Interface for notification data
export interface FallbackNotificationData {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
}

// Save notification preferences
export const saveNotificationPreferences = async (
  userId: string,
  preferences: NotificationPreferences
) => {
  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert([
        {
          user_id: userId,
          email_enabled: preferences.email,
          browser_enabled: preferences.browser,
          push_enabled: preferences.push,
        },
      ]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return { success: false, error };
  }
};

// Get notification preferences
export const getNotificationPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return default preferences if none found
    if (!data) {
      return {
        success: true,
        preferences: {
          email: true,
          browser: true,
          push: true,
        },
      };
    }

    return {
      success: true,
      preferences: {
        email: data.email_enabled,
        browser: data.browser_enabled,
        push: data.push_enabled,
      },
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return {
      success: false,
      error,
      preferences: {
        email: true,
        browser: true,
        push: true,
      },
    };
  }
};

// Show browser notification
export const showBrowserNotification = async (
  title: string,
  options: NotificationOptions
) => {
  try {
    if (typeof window === 'undefined') return { success: false };

    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return { success: false };
    }

    // Request permission if needed
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return { success: false };
      }
    }

    // Show notification
    const notification = new Notification(title, options);
    
    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Navigate to URL if provided
      if (options.data && options.data.url) {
        window.location.href = options.data.url;
      }
    };

    return { success: true };
  } catch (error) {
    console.error('Error showing browser notification:', error);
    return { success: false, error };
  }
};

// Save notification to database for later retrieval
export const saveNotificationToDatabase = async (notification: FallbackNotificationData) => {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .insert([
        {
          user_id: notification.userId,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: notification.data || {},
          is_read: false,
        },
      ]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving notification to database:', error);
    return { success: false, error };
  }
};

// Get user notifications
export const getUserNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, notifications: data };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return { success: false, error, notifications: [] };
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
};
