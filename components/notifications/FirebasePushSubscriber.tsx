'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission } from '@/lib/firebase/firebaseConfig';

export default function FirebasePushSubscriber() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushSupported(true);
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

      // Request permission and get FCM token
      const token = await requestNotificationPermission();

      if (!token) {
        throw new Error('Failed to get notification permission or FCM token');
      }

      // Save the token to the database
      const { error } = await supabase
        .from('firebase_tokens')
        .insert([
          {
            user_id: user.id,
            token,
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
            },
          },
        ]);

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive push notifications for important updates.',
      });
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Subscription Failed',
        description: error.message || 'Failed to enable push notifications. Please try again.',
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

      if (error) throw error;

      setIsSubscribed(false);
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.',
      });
    } catch (error: any) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: 'Unsubscribe Failed',
        description: error.message || 'Failed to disable push notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!pushSupported) {
    return null; // Don't show anything if push is not supported
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
          {isLoading ? 'Disabling...' : 'Disable Notifications'}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={subscribeToNotifications}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          {isLoading ? 'Enabling...' : 'Enable Notifications'}
        </Button>
      )}
    </div>
  );
}
