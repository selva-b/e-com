'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission } from '@/lib/firebase/firebaseInit';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function FirebasePushTester() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isToggleLoading, setIsToggleLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [tokenStatus, setTokenStatus] = useState<any>(null);

  // Fetch token status when component mounts
  useEffect(() => {
    if (user) {
      fetchTokenStatus();
    }
  }, [user]);

  // Function to fetch token status
  const fetchTokenStatus = async () => {
    if (!user) return;

    try {
      setIsStatusLoading(true);

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(`/api/firebase-tokens/status?userId=${user.id}`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response from token status API:', errorData);
          toast({
            title: 'Error',
            description: errorData.error || 'Failed to fetch token status',
            variant: 'destructive',
          });
          return;
        }

        const data = await response.json();
        setTokenStatus(data.data);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        // Handle abort errors differently
        if (fetchError.name === 'AbortError') {
          console.error('Fetch request timed out');
          toast({
            title: 'Request Timeout',
            description: 'The request to fetch token status timed out. Please try again.',
            variant: 'destructive',
          });
        } else {
          console.error('Fetch error:', fetchError);
          toast({
            title: 'Error',
            description: 'Failed to connect to the server. Please check your connection.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error in fetchTokenStatus:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsStatusLoading(false);
    }
  };

  // Function to request permission and get FCM token
  const requestPermission = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to request notification permission',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsTokenLoading(true);

      // Request permission and get token
      const token = await requestNotificationPermission();

      if (!token) {
        toast({
          title: 'Permission Denied',
          description: 'Notification permission was denied or token could not be retrieved',
          variant: 'destructive',
        });
        return;
      }

      // Save token to database
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
        console.error('Error saving token:', error);
        toast({
          title: 'Error',
          description: 'Failed to save notification token',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Permission Granted',
        description: 'Notification permission granted and token saved',
      });

      // Refresh token status
      fetchTokenStatus();
    } catch (error: any) {
      console.error('Error requesting permission:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to request notification permission',
        variant: 'destructive',
      });
    } finally {
      setIsTokenLoading(false);
    }
  };

  // Function to toggle push notification preference
  const togglePushNotifications = async (enabled: boolean) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to change notification preferences',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsToggleLoading(true);

      // Get current preferences to preserve other settings
      const { data: existingPrefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Import the saveNotificationPreferences function
      const { saveNotificationPreferences } = await import('@/lib/notifications/fallbackNotificationService');

      // Use the existing preferences or set defaults
      const result = await saveNotificationPreferences(user.id, {
        email: existingPrefs?.email_enabled ?? true,
        browser: existingPrefs?.browser_enabled ?? true,
        push: enabled,
      });

      if (!result.success) {
        console.error('Error updating notification preferences:', result.error);
        toast({
          title: 'Error',
          description: 'Failed to update notification preferences',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Preferences Updated',
        description: `Push notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
      });

      // Refresh token status
      fetchTokenStatus();
    } catch (error: any) {
      console.error('Error toggling push notifications:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notification preferences',
        variant: 'destructive',
      });
    } finally {
      setIsToggleLoading(false);
    }
  };

  // Function to test Firebase push notification
  const testFirebasePush = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to test push notifications',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setTestResult(null);

      const response = await fetch(`/api/test-firebase-push?userId=${user.id}`);
      const result = await response.json();

      setTestResult(result);

      if (response.ok && result.success) {
        toast({
          title: 'Push Notification Sent',
          description: `Successfully sent to ${result.result.successCount} device(s)`,
        });
      } else if (response.ok && result.databaseOnly) {
        toast({
          title: 'Notification Saved',
          description: 'No FCM tokens found. Notification saved to database only.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send push notification',
          variant: 'destructive',
        });
      }

      // Refresh token status after sending notification
      fetchTokenStatus();
    } catch (error: any) {
      console.error('Error testing push notification:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send push notification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Firebase Push Notification Tester</CardTitle>
          <CardDescription>You must be logged in to test push notifications</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isAdmin ? "Firebase Push Notification Tester" : "Push Notification Settings"}
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? "Test Firebase push notifications for your account"
            : "Enable or disable push notifications for your account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Status Section - Shown to both admin and regular users */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Notification Status</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTokenStatus}
              disabled={isStatusLoading}
              className="h-8 px-2"
            >
              {isStatusLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isStatusLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Loading status...</span>
            </div>
          ) : tokenStatus ? (
            <div className="bg-muted p-3 rounded-md text-sm">
              {/* Push Notification Toggle - Shown to both admin and regular users */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {tokenStatus.pushEnabled ? (
                    <Bell className="h-4 w-4 text-primary" />
                  ) : (
                    <BellOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>Push Notifications:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="push-notifications"
                    checked={tokenStatus.pushEnabled}
                    onCheckedChange={togglePushNotifications}
                    disabled={isToggleLoading}
                  />
                  {isToggleLoading && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                </div>
              </div>

              {/* Device Registration Status - Shown to both admin and regular users */}
              <div className="flex items-center justify-between py-2">
                <span>Registered Devices:</span>
                <Badge variant={tokenStatus.tokensCount > 0 ? "default" : "destructive"}>
                  {tokenStatus.tokensCount}
                </Badge>
              </div>

              {/* Admin-only detailed device information */}
              {isAdmin && tokenStatus.tokensCount > 0 && (
                <div className="mt-2 text-xs">
                  <p className="font-medium mb-1">Registered Devices:</p>
                  <ul className="space-y-1">
                    {tokenStatus.tokens.map((token: any, index: number) => (
                      <li key={index} className="flex items-center justify-between">
                        <span>
                          {token.device_info?.platform || 'Unknown'}
                          {token.device_info?.browser ? ` (${token.device_info.browser})` : ''}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(token.created_at).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No status information available</p>
          )}
        </div>

        {/* Device Registration - Shown to both admin and regular users */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            {isAdmin
              ? "Register this device to receive push notifications:"
              : "Register this device to receive notifications about your orders and account:"}
          </p>
          <Button
            onClick={requestPermission}
            disabled={isTokenLoading}
            variant="outline"
          >
            {isTokenLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting...
              </>
            ) : (
              'Register This Device'
            )}
          </Button>
        </div>

        {/* Test Notification Button - Admin only */}
        {isAdmin && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Test sending a push notification:
            </p>
            <Button
              onClick={testFirebasePush}
              disabled={isLoading || (tokenStatus && tokenStatus.tokensCount === 0)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Test Firebase Push Notification'
              )}
            </Button>
          </div>
        )}

        {/* Test Result - Admin only */}
        {isAdmin && testResult && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Test Result:</h4>
            <pre className="text-xs overflow-auto p-2 bg-background rounded">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {isAdmin
          ? "Note: Make sure you have allowed notifications in your browser settings."
          : "Note: You will only receive notifications if you have registered your device and enabled notifications."}
      </CardFooter>
    </Card>
  );
}
