'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { EmailTemplateForm } from '@/components/admin/email-template-form';
import { NotificationTemplateForm } from '@/components/admin/notification-template-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// No need for generateStaticParams since we're not using static export

export default function CreateTemplatePage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth();
  const toast = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [templateType, setTemplateType] = useState<'email' | 'notification'>('email');

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  // If still loading or not admin, don't render the page
  if (isLoading || !isAdmin) {
    return null;
  }

  // Handle email template submission
  const handleEmailSubmit = async (data: any) => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('email_templates')
        .insert([
          {
            name: data.name,
            type: data.type,
            subject: data.subject,
            body: data.body,
            is_active: data.isActive,
          }
        ]);

      if (error) throw error;

      toast.toast({
        title: 'Template created',
        description: 'The email template has been created successfully.',
      });

      router.push('/admin/templates');
    } catch (error) {
      console.error('Error creating email template:', error);
      toast.toast({
        title: 'Error',
        description: 'Failed to create email template.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle notification template submission
  const handleNotificationSubmit = async (data: any) => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('notification_templates')
        .insert([
          {
            name: data.name,
            type: data.event,
            title: data.subject || data.name,
            body: data.type === 'email' ? data.emailContent : data.pushContent,
            is_active: data.isActive,
          }
        ]);

      if (error) throw error;

      toast.toast({
        title: 'Template created',
        description: 'The notification template has been created successfully.',
      });

      router.push('/admin/templates');
    } catch (error) {
      console.error('Error creating notification template:', error);
      toast.toast({
        title: 'Error',
        description: 'Failed to create notification template.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/templates')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Create Template</h1>
      </div>

      <Tabs defaultValue="email" onValueChange={(value) => setTemplateType(value as 'email' | 'notification')}>
        <TabsList className="mb-6">
          <TabsTrigger value="email">Email Template</TabsTrigger>
          <TabsTrigger value="notification">Notification Template</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <EmailTemplateForm
            onSubmit={handleEmailSubmit}
            isLoading={isSaving}
          />
        </TabsContent>

        <TabsContent value="notification">
          <NotificationTemplateForm
            onSubmit={handleNotificationSubmit}
            isLoading={isSaving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
