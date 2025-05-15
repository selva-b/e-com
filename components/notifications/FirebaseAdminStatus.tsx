'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function FirebaseAdminStatus() {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Checking Firebase Admin SDK status...');
  const [details, setDetails] = useState<any>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    setStatus('loading');
    setMessage('Checking Firebase Admin SDK status...');
    setDetails(null);

    try {
      // Make a request to the test API
      const response = await fetch('/api/test-firebase-push/status');
      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        setStatus('success');
        setMessage('Firebase Admin SDK is properly configured and ready to use.');
        setDetails(data);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to check Firebase Admin SDK status.');
        setDetails(data);
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while checking Firebase Admin SDK status.');
      setDetails({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firebase Admin SDK Status</CardTitle>
        <CardDescription>Check the status of the Firebase Admin SDK configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'loading' ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>{message}</span>
          </div>
        ) : status === 'success' ? (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              {message}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {details && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Details:</h4>
            <pre className="text-xs overflow-auto p-2 bg-background rounded">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Troubleshooting Steps:</h4>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Check that your Firebase service account credentials are correctly set in your environment variables.</li>
              <li>Verify that the Firebase project has Cloud Messaging API enabled.</li>
              <li>Make sure the service account has the necessary permissions to send messages.</li>
              <li>Run the test script: <code>node scripts/test-firebase-admin.js</code></li>
              <li>Check server logs for more detailed error information.</li>
            </ol>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={checkStatus} 
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Status Again'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
