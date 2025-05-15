'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function NotificationTester() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  async function testEmailNotification() {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to test notifications',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setTestResult(null);

      const response = await fetch(`/api/test-notifications?email=${user.email}&testType=email`);
      const result = await response.json();

      setTestResult(result);

      if (response.ok) {
        toast({
          title: 'Email Notification Sent',
          description: 'A test email notification has been sent to your email address',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send email notification',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error testing email notification:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email notification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function testPushNotification() {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to test notifications',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setTestResult(null);

      const response = await fetch(`/api/test-notifications?userId=${user.id}&testType=push`);
      const result = await response.json();

      setTestResult(result);

      if (response.ok) {
        toast({
          title: 'Push Notification Sent',
          description: 'A test push notification has been sent to your device',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send push notification',
          variant: 'destructive',
        });
      }
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
  }

  async function testAllNotifications() {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to test notifications',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setTestResult(null);

      const response = await fetch(`/api/test-notifications?userId=${user.id}&email=${user.email}&testType=all`);
      const result = await response.json();

      setTestResult(result);

      if (response.ok) {
        toast({
          title: 'Notifications Sent',
          description: 'Test notifications have been sent via email and push',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send notifications',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error testing notifications:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Test Notifications</CardTitle>
        <CardDescription>
          Send test notifications to verify your notification settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            onClick={testEmailNotification}
            disabled={isLoading || !user}
            className="w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Email Notification
          </Button>
          <Button
            onClick={testPushNotification}
            disabled={isLoading || !user}
            className="w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Push Notification
          </Button>
          <Button
            onClick={testAllNotifications}
            disabled={isLoading || !user}
            className="w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test All Notifications
          </Button>
        </div>

        {testResult && (
          <div className="mt-4 rounded-md bg-muted p-4">
            <h3 className="mb-2 font-medium">Test Result:</h3>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Note: You must enable notifications in your account settings to receive push notifications.
      </CardFooter>
    </Card>
  );
}
