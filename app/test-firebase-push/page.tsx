'use client';

import { useAuth } from '@/context/AuthContext';
import FirebasePushTester from '@/components/notifications/FirebasePushTester';
import EmailTester from '@/components/notifications/EmailTester';
import FirebaseAdminStatus from '@/components/notifications/FirebaseAdminStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function TestFirebasePushPage() {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to access notification settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="text-primary hover:underline">
              Go to Login Page
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">{isAdmin ? "Test Notifications" : "Notification Settings"}</h1>

      {isAdmin ? (
        <Tabs defaultValue="firebase-push">
          <TabsList className="mb-4">
            <TabsTrigger value="firebase-push">Push Notifications</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="admin-status">Admin Status</TabsTrigger>
            <TabsTrigger value="info">Information</TabsTrigger>
          </TabsList>

          <TabsContent value="firebase-push">
            <FirebasePushTester />
          </TabsContent>

          <TabsContent value="email">
            <EmailTester />
          </TabsContent>

          <TabsContent value="admin-status">
            <FirebaseAdminStatus />
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Notifications System</CardTitle>
                <CardDescription>How notifications work in the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Firebase Push Notifications</h3>
                  <p>
                    Firebase Cloud Messaging (FCM) allows you to send push notifications to users across different platforms.
                    Here's how it works:
                  </p>

                  <ol className="list-decimal pl-5 space-y-2 mt-2">
                    <li>
                      <strong>Permission Request:</strong> The user grants notification permission in their browser.
                    </li>
                    <li>
                      <strong>Token Registration:</strong> A unique FCM token is generated for the user's device and saved in the database.
                    </li>
                    <li>
                      <strong>Sending Notifications:</strong> The server uses Firebase Admin SDK to send notifications to the registered tokens.
                    </li>
                    <li>
                      <strong>Receiving Notifications:</strong> Firebase delivers the notification to the user's device, even when the browser is closed.
                    </li>
                  </ol>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Email Notifications</h3>
                  <p>
                    Email notifications are sent using Nodemailer with customizable templates stored in the database.
                    Here's how it works:
                  </p>

                  <ol className="list-decimal pl-5 space-y-2 mt-2">
                    <li>
                      <strong>Template Selection:</strong> The system selects the appropriate email template based on the notification type.
                    </li>
                    <li>
                      <strong>Variable Replacement:</strong> Template variables are replaced with actual values (e.g., order ID, customer name).
                    </li>
                    <li>
                      <strong>Email Sending:</strong> The email is sent using the configured SMTP server.
                    </li>
                    <li>
                      <strong>Logging:</strong> All email sending attempts are logged in the database for tracking and debugging.
                    </li>
                  </ol>
                </div>

                <div className="bg-muted p-4 rounded-md mt-6">
                  <h4 className="font-medium mb-2">Troubleshooting:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Make sure notifications are enabled in your browser settings</li>
                    <li>Check that you've granted permission when prompted</li>
                    <li>Ensure your device has an active internet connection</li>
                    <li>Check spam folders for email notifications</li>
                    <li>Verify that email templates exist in the database</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage your notification preferences here. You can enable or disable push notifications
                and register your devices to receive important updates about your orders and account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Push notifications allow us to send you important updates about your orders, account activity,
                and special promotions. You can receive these notifications even when you're not actively using our website.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                To receive notifications, you need to:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground mb-4">
                <li>Enable push notifications using the toggle below</li>
                <li>Register your device by granting permission when prompted</li>
                <li>Make sure notifications are enabled in your browser settings</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                You can register multiple devices to receive notifications on all your devices.
              </p>
            </CardContent>
          </Card>

          <FirebasePushTester />
        </>
      )}
    </div>
  );
}
