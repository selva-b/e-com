'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Mail, Bell, Edit, Trash, Plus } from 'lucide-react';
import * as z from 'zod';

// No need for generateStaticParams since we're not using static export

// Email template schema
const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  is_active: z.boolean().default(true),
});

type EmailTemplateValues = z.infer<typeof emailTemplateSchema>;

// Notification template schema
const notificationTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  is_active: z.boolean().default(true),
});

type NotificationTemplateValues = z.infer<typeof notificationTemplateSchema>;

export default function TemplatesPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [emailTemplates, setEmailTemplates] = useState([]);
  const [notificationTemplates, setNotificationTemplates] = useState([]);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      redirect('/');
    }

    fetchTemplates();
  }, [isLoading, isAdmin]);

  async function fetchTemplates() {
    try {
      // Fetch email templates
      const { data: emailData, error: emailError } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (emailError) throw emailError;
      setEmailTemplates(emailData || []);

      // Fetch notification templates
      const { data: notificationData, error: notificationError } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (notificationError) throw notificationError;
      setNotificationTemplates(notificationData || []);
    } catch (error) {
      toast.toast({
        title: 'Error fetching templates',
        description: error.message,
        variant: 'destructive',
      });
    }
  }



  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notification Templates</h1>
      </div>

      <Tabs defaultValue="email">
        <TabsList className="mb-4">
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="notification">Push Notification Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Manage email templates for different notifications
                </CardDescription>
              </div>
              <Button
                className="flex items-center gap-2"
                onClick={() => router.push('/admin/templates/create')}
              >
                <Plus className="h-4 w-4" />
                Add Template
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.type}</TableCell>
                      <TableCell>{template.subject}</TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/templates/edit/${template.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this template?')) {
                                const { error } = await supabase
                                  .from('email_templates')
                                  .delete()
                                  .eq('id', template.id);

                                if (error) {
                                  toast.toast({
                                    title: 'Error',
                                    description: 'Failed to delete template.',
                                    variant: 'destructive',
                                  });
                                } else {
                                  toast.toast({
                                    title: 'Template deleted',
                                    description: 'The template has been deleted successfully.',
                                  });
                                  fetchTemplates();
                                }
                              }
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Push Notification Templates</CardTitle>
                <CardDescription>
                  Manage push notification templates for different events
                </CardDescription>
              </div>
              <Button
                className="flex items-center gap-2"
                onClick={() => router.push('/admin/templates/create')}
              >
                <Plus className="h-4 w-4" />
                Add Template
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.type}</TableCell>
                      <TableCell>{template.title}</TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/templates/edit/${template.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this template?')) {
                                const { error } = await supabase
                                  .from('notification_templates')
                                  .delete()
                                  .eq('id', template.id);

                                if (error) {
                                  toast.toast({
                                    title: 'Error',
                                    description: 'Failed to delete template.',
                                    variant: 'destructive',
                                  });
                                } else {
                                  toast.toast({
                                    title: 'Template deleted',
                                    description: 'The template has been deleted successfully.',
                                  });
                                  fetchTemplates();
                                }
                              }
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
