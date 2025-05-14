'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Mail, Bell, Edit, Trash, Plus } from 'lucide-react';

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
  const { toast } = useToast();
  
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  
  const emailForm = useForm<EmailTemplateValues>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: '',
      type: 'order_placed',
      subject: '',
      body: '',
      is_active: true,
    },
  });
  
  const notificationForm = useForm<NotificationTemplateValues>({
    resolver: zodResolver(notificationTemplateSchema),
    defaultValues: {
      name: '',
      type: 'order_placed',
      title: '',
      body: '',
      is_active: true,
    },
  });
  
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
      toast({
        title: 'Error fetching templates',
        description: error.message,
        variant: 'destructive',
      });
    }
  }
  
  async function onEmailSubmit(data: EmailTemplateValues) {
    try {
      const { error } = await supabase
        .from('email_templates')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Email template created',
        description: 'The email template has been created successfully.',
      });
      
      emailForm.reset();
      setIsEmailDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      toast({
        title: 'Error creating email template',
        description: error.message,
        variant: 'destructive',
      });
    }
  }
  
  async function onNotificationSubmit(data: NotificationTemplateValues) {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Notification template created',
        description: 'The notification template has been created successfully.',
      });
      
      notificationForm.reset();
      setIsNotificationDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      toast({
        title: 'Error creating notification template',
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
              <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Email Template</DialogTitle>
                    <DialogDescription>
                      Create a new email template for notifications
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                      <FormField
                        control={emailForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Order Confirmation" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Type</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="order_placed">Order Placed</option>
                                <option value="registration">Registration</option>
                                <option value="order_status">Order Status</option>
                                <option value="password_reset">Password Reset</option>
                                <option value="custom">Custom</option>
                              </select>
                            </FormControl>
                            <FormDescription>
                              Select the type of notification this template is for
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Subject</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your order has been placed" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailForm.control}
                        name="body"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Body</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Hello {{first_name}}, your order #{{order_id}} has been placed successfully."
                                className="min-h-[200px]"
                              />
                            </FormControl>
                            <FormDescription>
                              Use {{variable_name}} for dynamic content
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailForm.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Active</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit">Create Template</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
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
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
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
              <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Notification Template</DialogTitle>
                    <DialogDescription>
                      Create a new push notification template
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Order Confirmation" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Type</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="order_placed">Order Placed</option>
                                <option value="registration">Registration</option>
                                <option value="order_status">Order Status</option>
                                <option value="stock_alert">Stock Alert</option>
                                <option value="custom">Custom</option>
                              </select>
                            </FormControl>
                            <FormDescription>
                              Select the type of notification this template is for
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notification Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Order Confirmed!" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="body"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notification Body</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Your order #{{order_id}} has been confirmed and is being processed."
                              />
                            </FormControl>
                            <FormDescription>
                              Use {{variable_name}} for dynamic content
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Active</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit">Create Template</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
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
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
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
