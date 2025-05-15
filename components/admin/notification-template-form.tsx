'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Template name must be at least 2 characters.',
  }),
  type: z.enum(['email', 'push']),
  subject: z.string().min(2, {
    message: 'Subject must be at least 2 characters.',
  }).optional(),
  emailContent: z.string().optional(),
  pushContent: z.string().optional(),
  event: z.enum(['order_placed', 'order_shipped', 'order_delivered', 'registration', 'password_reset']),
  isActive: z.boolean().default(true),
});

type NotificationTemplateFormValues = z.infer<typeof formSchema>;

// Default values for the form
const defaultValues: Partial<NotificationTemplateFormValues> = {
  name: '',
  type: 'email',
  subject: '',
  emailContent: '',
  pushContent: '',
  event: 'order_placed',
  isActive: true,
};

interface NotificationTemplateFormProps {
  initialData?: Partial<NotificationTemplateFormValues>;
  onSubmit: (data: NotificationTemplateFormValues) => void;
  isLoading?: boolean;
}

export function NotificationTemplateForm({
  initialData,
  onSubmit,
  isLoading = false,
}: NotificationTemplateFormProps) {
  const [activeTab, setActiveTab] = useState<string>(initialData?.type || 'email');
  const toast = useToast();

  // Initialize the form
  const form = useForm<NotificationTemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || defaultValues,
  });

  // Handle form submission
  const handleSubmit = (data: NotificationTemplateFormValues) => {
    onSubmit(data);
    toast.toast({
      title: 'Template saved',
      description: 'Your notification template has been saved successfully.',
    });
  };

  // Available variables for templates
  const availableVariables = {
    order_placed: ['customer_name', 'order_id', 'order_total', 'order_items', 'payment_method'],
    order_shipped: ['customer_name', 'order_id', 'tracking_number', 'shipping_method', 'estimated_delivery'],
    order_delivered: ['customer_name', 'order_id', 'delivery_date'],
    registration: ['customer_name', 'verification_link'],
    password_reset: ['customer_name', 'reset_link'],
  };

  // Get variables based on selected event
  const getVariablesForEvent = (event: string) => {
    return availableVariables[event as keyof typeof availableVariables] || [];
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Notification Template</CardTitle>
            <CardDescription>
              Create or edit notification templates for emails and push notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Order Confirmation" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this template.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Trigger</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('emailContent', '');
                        form.setValue('pushContent', '');
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="order_placed">Order Placed</SelectItem>
                        <SelectItem value="order_shipped">Order Shipped</SelectItem>
                        <SelectItem value="order_delivered">Order Delivered</SelectItem>
                        <SelectItem value="registration">User Registration</SelectItem>
                        <SelectItem value="password_reset">Password Reset</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      When this notification will be sent.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Type</FormLabel>
                    <FormControl>
                      <Tabs
                        defaultValue={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setActiveTab(value);
                        }}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="email">Email</TabsTrigger>
                          <TabsTrigger value="push">Push Notification</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {activeTab === 'email' && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Your order has been confirmed" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Content</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ''}
                            onChange={field.onChange}
                            minHeight="400px"
                          />
                        </FormControl>
                        <FormDescription>
                          Available variables: {getVariablesForEvent(form.getValues('event')).map(v => `${'{{'} ${v} ${'}}'}`).join(', ')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {activeTab === 'push' && (
                <FormField
                  control={form.control}
                  name="pushContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Push Notification Content</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          minHeight="200px"
                        />
                      </FormControl>
                      <FormDescription>
                        Available variables: {getVariablesForEvent(form.getValues('event')).map(v => `${'{{'} ${v} ${'}}'}`).join(', ')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button">Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Template'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
