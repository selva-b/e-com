'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmailTester() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [templateType, setTemplateType] = useState('order_status');
  const [testResult, setTestResult] = useState<any>(null);

  // Initialize email with user's email if available
  useState(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  });

  // Function to test email
  const testEmail = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Email address is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setTestResult(null);

      const response = await fetch(`/api/test-email?email=${encodeURIComponent(email)}&templateType=${templateType}`);
      const result = await response.json();

      setTestResult(result);

      if (response.ok && result.success) {
        toast({
          title: 'Email Sent',
          description: `Test email has been sent to ${email}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send test email',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error testing email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notification Tester</CardTitle>
        <CardDescription>Test email notifications with different templates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="template-type">Template Type</Label>
          <Select value={templateType} onValueChange={setTemplateType}>
            <SelectTrigger id="template-type">
              <SelectValue placeholder="Select template type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order_status">Order Status Update</SelectItem>
              <SelectItem value="order_placed">Order Placed</SelectItem>
              <SelectItem value="registration">Registration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={testEmail} 
          disabled={isLoading || !email}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Test Email'
          )}
        </Button>

        {testResult && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Test Result:</h4>
            <pre className="text-xs overflow-auto p-2 bg-background rounded">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Note: Make sure your email templates are properly configured in the database.
      </CardFooter>
    </Card>
  );
}
