'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { EmailTemplateForm } from '@/components/admin/email-template-form';
import { NotificationTemplateForm } from '@/components/admin/notification-template-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define template types
interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  title: string;
  body: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const toast = useToast();

  // Store the ID in a ref to prevent re-renders
  const idRef = useRef<string | null>(null);
  if (idRef.current === null) {
    idRef.current = Array.isArray(params.id) ? params.id[0] : params.id as string;
  }

  // Use refs to track component state
  const fetchInProgressRef = useRef(false);
  const componentMountedRef = useRef(true);
  const hasLoadedDataRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templateType, setTemplateType] = useState<'email' | 'notification'>('email');
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null);
  const [notificationTemplate, setNotificationTemplate] = useState<NotificationTemplate | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  // Set up component mounted ref
  useEffect(() => {
    // Set the ref to true when component mounts
    componentMountedRef.current = true;

    // Cleanup function to set ref to false when component unmounts
    return () => {
      componentMountedRef.current = false;
    };
  }, []);

  // Fetch template data
  useEffect(() => {
    // Don't fetch if not admin or still loading auth
    if (!idRef.current || authLoading || !isAdmin) {
      return;
    }

    // Prevent duplicate fetches and avoid re-fetching if data is already loaded
    if (fetchInProgressRef.current || hasLoadedDataRef.current) {
      console.log('Fetch already in progress or data already loaded, skipping...');
      return;
    }

    // Set fetch in progress
    fetchInProgressRef.current = true;

    const fetchTemplate = async () => {
      console.log('Starting fetch for template ID:', idRef.current);
      setIsLoading(true);

      try {
        // Try to fetch from email_templates
        const { data: emailData, error: emailError } = await supabase
          .from('email_templates')
          .select('*')
          .eq('id', idRef.current)
          .single();

        // Check if component is still mounted
        if (!componentMountedRef.current) {
          console.log('Component unmounted, aborting state updates');
          return;
        }

        if (emailError && emailError.code !== 'PGRST116') {
          // PGRST116 is the error code for "no rows returned"
          console.error('Error fetching email template:', emailError);
          throw emailError;
        }

        if (emailData) {
          console.log('Found email template:', emailData);
          setEmailTemplate(emailData as EmailTemplate);
          setTemplateType('email');
          setIsLoading(false);
          hasLoadedDataRef.current = true;
          return;
        }

        // If not found, try notification_templates
        const { data: notificationData, error: notificationError } = await supabase
          .from('notification_templates')
          .select('*')
          .eq('id', idRef.current)
          .single();

        // Check if component is still mounted
        if (!componentMountedRef.current) {
          console.log('Component unmounted, aborting state updates');
          return;
        }

        if (notificationError && notificationError.code !== 'PGRST116') {
          console.error('Error fetching notification template:', notificationError);
          throw notificationError;
        }

        if (notificationData) {
          console.log('Found notification template:', notificationData);
          setNotificationTemplate(notificationData as NotificationTemplate);
          setTemplateType('notification');
          setIsLoading(false);
          hasLoadedDataRef.current = true;
          return;
        }

        // If neither found, show error
        console.log('No template found with ID:', idRef.current);
        toast.toast({
          title: 'Template not found',
          description: 'The requested template could not be found.',
          variant: 'destructive',
        });
        router.push('/admin/templates');
      } catch (error: any) {
        // Check if component is still mounted
        if (!componentMountedRef.current) {
          console.log('Component unmounted, aborting error handling');
          return;
        }

        console.error('Error fetching template:', error);
        toast.toast({
          title: 'Error',
          description: error.message || 'Failed to load template data.',
          variant: 'destructive',
        });
        router.push('/admin/templates');
      } finally {
        if (componentMountedRef.current) {
          setIsLoading(false);
        }
        // Reset fetch in progress flag
        fetchInProgressRef.current = false;
      }
    };

    // Execute fetch
    fetchTemplate();

    // No cleanup needed here as we're using refs
  }, [isAdmin, authLoading, router, toast]);

  // Handle email template submission
  const handleEmailSubmit = async (data: any) => {
    // Check if component is still mounted
    if (!componentMountedRef.current || !idRef.current) return;

    setIsSaving(true);

    try {
      const templateId = idRef.current;

      console.log('Updating email template with ID:', templateId);
      console.log('Update data:', data);

      const { error } = await supabase
        .from('email_templates')
        .update({
          name: data.name,
          type: data.type,
          subject: data.subject,
          body: data.body,
          is_active: data.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      // Check if component is still mounted
      if (!componentMountedRef.current) return;

      if (error) {
        console.error('Supabase error updating email template:', error);
        throw error;
      }

      console.log('Email template updated successfully');

      toast.toast({
        title: 'Template updated',
        description: 'The email template has been updated successfully.',
      });

      router.push('/admin/templates');
    } catch (error: any) {
      // Check if component is still mounted
      if (!componentMountedRef.current) return;

      console.error('Error updating email template:', error);
      toast.toast({
        title: 'Error',
        description: error.message || 'Failed to update email template.',
        variant: 'destructive',
      });
    } finally {
      if (componentMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  // Handle notification template submission
  const handleNotificationSubmit = async (data: any) => {
    // Check if component is still mounted
    if (!componentMountedRef.current || !idRef.current) return;

    setIsSaving(true);

    try {
      const templateId = idRef.current;

      console.log('Updating notification template with ID:', templateId);
      console.log('Update data:', data);

      const { error } = await supabase
        .from('notification_templates')
        .update({
          name: data.name,
          type: data.event,
          title: data.subject,
          body: data.type === 'email' ? data.emailContent : data.pushContent,
          is_active: data.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      // Check if component is still mounted
      if (!componentMountedRef.current) return;

      if (error) {
        console.error('Supabase error updating notification template:', error);
        throw error;
      }

      console.log('Notification template updated successfully');

      toast.toast({
        title: 'Template updated',
        description: 'The notification template has been updated successfully.',
      });

      router.push('/admin/templates');
    } catch (error: any) {
      // Check if component is still mounted
      if (!componentMountedRef.current) return;

      console.error('Error updating notification template:', error);
      toast.toast({
        title: 'Error',
        description: error.message || 'Failed to update notification template.',
        variant: 'destructive',
      });
    } finally {
      if (componentMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold">Edit Template</h1>
      </div>

      {templateType === 'email' && emailTemplate && (
        <EmailTemplateForm
          initialData={{
            name: emailTemplate.name,
            type: emailTemplate.type,
            subject: emailTemplate.subject,
            body: emailTemplate.body,
            isActive: emailTemplate.is_active,
          }}
          onSubmit={handleEmailSubmit}
          isLoading={isSaving}
        />
      )}

      {templateType === 'notification' && notificationTemplate && (
        <NotificationTemplateForm
          initialData={{
            name: notificationTemplate.name,
            type: notificationTemplate.type === 'push' ? 'push' : 'email',
            // Cast the type to the expected enum values
            event: (notificationTemplate.type as 'order_placed' | 'order_shipped' | 'order_delivered' | 'registration' | 'password_reset'),
            subject: notificationTemplate.title,
            emailContent: notificationTemplate.type !== 'push' ? notificationTemplate.body : '',
            pushContent: notificationTemplate.type === 'push' ? notificationTemplate.body : '',
            isActive: notificationTemplate.is_active,
          }}
          onSubmit={handleNotificationSubmit}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
