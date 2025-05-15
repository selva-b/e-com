'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission } from '@/lib/firebase/firebaseInit';

export default function FirebasePushSubscriber() {
  const { user } = useAuth();
  const toast = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushSupported(true);
      setIsFirebaseConfigured(true);
      if (user) {
        checkSubscriptionStatus();
      }
    }
  }, [user]);

  async function checkSubscriptionStatus() {
    if (!user) return;

    try {
      // Check if user has any FCM tokens
      const { data, error } = await supabase
        .from('firebase_tokens')
        .select('id')
        .eq('user_id', user.id);

      if (error) throw error;

      setIsSubscribed(data && data.length > 0);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  }

  async function subscribeToNotifications() {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('Requesting notification permission...');

      // First try to get permission for browser notifications
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Browser notification permission granted');
        } else {
          console.log('Browser notification permission denied');
        }
      }

      // Try to get FCM token
      let token = null;
      try {
        token = await requestNotificationPermission();
      } catch (fcmError) {
        console.error('Error getting FCM token:', fcmError);
        // Continue with browser notifications only
      }

      // Get current preferences to preserve other settings
      const { data: existingPrefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Save notification preferences
      const { saveNotificationPreferences } = await import('@/lib/notifications/fallbackNotificationService');
      const prefResult = await saveNotificationPreferences(user.id, {
        email: existingPrefs?.email_enabled ?? true,
        browser: Notification.permission === 'granted',
        push: !!token,
      });

      if (!prefResult.success) {
        console.error('Error saving notification preferences:', prefResult.error);
        // Continue anyway, we'll try to save the token
      }

      // If we got an FCM token, save it
      if (token) {
        console.log('FCM token received, saving to database...');

        // Save the token to the database
        const { error } = await supabase
          .from('firebase_tokens')
          .insert([
            {
              user_id: user.id,
              token,
              device_info: {
                userAgent: navigator.userAgent,
                platform: navigator.userAgent.includes('Win') ? 'Windows' :
                          navigator.userAgent.includes('Mac') ? 'MacOS' :
                          navigator.userAgent.includes('Linux') ? 'Linux' : 'Unknown',
                language: navigator.language,
              },
            },
          ]);

        if (error) {
          console.error('Supabase error saving token:', error);
          // Continue anyway, we'll use browser notifications
        } else {
          console.log('FCM token saved successfully');
        }
      } else {
        console.log('No FCM token available, using browser notifications only');
      }

      // Mark as subscribed if either FCM or browser notifications are enabled
      const isNotificationsEnabled = !!token || Notification.permission === 'granted';
      setIsSubscribed(isNotificationsEnabled);

      if (isNotificationsEnabled) {
        toast.toast({
          title: 'Notifications Enabled',
          description: 'You will now receive notifications for important updates.',
        });
      } else {
        toast.toast({
          title: 'Notifications Limited',
          description: 'Notifications may be limited. Please check your browser settings.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error setting up notifications:', error);
      toast.toast({
        title: 'Notification Setup Issue',
        description: 'We encountered an issue setting up notifications. Email notifications will still work.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromNotifications() {
    if (!user) return;

    try {
      setIsLoading(true);

      // Delete all FCM tokens for this user
      const { error } = await supabase
        .from('firebase_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting FCM tokens:', error);
        // Continue anyway
      }

      // Get current preferences to preserve other settings
      const { data: existingPrefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Update notification preferences
      const { saveNotificationPreferences } = await import('@/lib/notifications/fallbackNotificationService');
      const result = await saveNotificationPreferences(user.id, {
        email: existingPrefs?.email_enabled ?? true, // Keep email notifications enabled
        browser: false,
        push: false,
      });

      if (!result.success) {
        console.error('Error updating notification preferences:', result.error);
        toast.toast({
          title: 'Error',
          description: 'Failed to update notification preferences, but tokens were removed',
          variant: 'destructive',
        });
      }

      setIsSubscribed(false);
      toast.toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications. Email notifications will still be sent.',
      });
    } catch (error: any) {
      console.error('Error unsubscribing from notifications:', error);
      toast.toast({
        title: 'Unsubscribe Failed',
        description: error.message || 'Failed to disable notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!pushSupported || !isFirebaseConfigured) {
    return null; // Don't show anything if push is not supported or Firebase is not configured
  }

  return (
    <div className="flex items-center gap-2">
      {isSubscribed ? (
        <Button
          variant="outline"
          size="sm"
          onClick={unsubscribeFromNotifications}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <BellOff className="h-4 w-4" />
          {isLoading ? 'Disabling...' : 'Disable'}
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={subscribeToNotifications}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          {isLoading ? 'Enabling...' : 'Enable'}
        </Button>
      )}
    </div>
  );
}
