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
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Template name must be at least 2 characters.',
  }),
  type: z.string().min(2, {
    message: 'Template type is required.',
  }),
  subject: z.string().min(2, {
    message: 'Subject must be at least 2 characters.',
  }),
  body: z.string().min(10, {
    message: 'Email body must be at least 10 characters.',
  }),
  isActive: z.boolean().default(true),
});

type EmailTemplateFormValues = z.infer<typeof formSchema>;

// Default values for the form
const defaultValues: Partial<EmailTemplateFormValues> = {
  name: '',
  type: 'order_placed',
  subject: '',
  body: '<p>Hello {{first_name}},</p><p>Thank you for your order!</p>',
  isActive: true,
};

interface EmailTemplateFormProps {
  initialData?: Partial<EmailTemplateFormValues>;
  onSubmit: (data: EmailTemplateFormValues) => void;
  isLoading?: boolean;
}

export function EmailTemplateForm({
  initialData,
  onSubmit,
  isLoading = false,
}: EmailTemplateFormProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const toast = useToast();

  // Initialize the form
  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || defaultValues,
  });

  // Handle form submission
  const handleSubmit = (data: EmailTemplateFormValues) => {
    onSubmit(data);
    toast.toast({
      title: 'Template saved',
      description: 'Your email template has been saved successfully.',
    });
  };

  // Available variables for templates
  const availableVariables = {
    order_placed: ['first_name', 'last_name', 'order_id', 'order_total', 'order_items', 'payment_method'],
    order_shipped: ['first_name', 'last_name', 'order_id', 'tracking_number', 'shipping_method', 'estimated_delivery'],
    order_delivered: ['first_name', 'last_name', 'order_id', 'delivery_date'],
    registration: ['first_name', 'last_name', 'verification_link'],
    password_reset: ['first_name', 'last_name', 'reset_link'],
    order_status: ['first_name', 'last_name', 'order_id', 'status'],
    customer_signups: ['customer_name', 'customer_email', 'registration_date'],
  };

  // Get variables based on selected type
  const getVariablesForType = (type: string) => {
    return availableVariables[type as keyof typeof availableVariables] || [];
  };

  // Preview the email with sample data
  const previewEmail = () => {
    let previewHtml = form.getValues('body');
    const templateType = form.getValues('type');
    const variables = getVariablesForType(templateType);

    // Replace variables with sample values
    variables.forEach(variable => {
      let sampleValue = 'Sample';

      // Provide more realistic sample values for common variables
      if (variable === 'first_name') sampleValue = 'John';
      if (variable === 'last_name') sampleValue = 'Doe';
      if (variable === 'order_id') sampleValue = '#12345';
      if (variable === 'order_total') sampleValue = '$99.99';
      if (variable === 'customer_name') sampleValue = 'John Doe';
      if (variable === 'customer_email') sampleValue = 'john.doe@example.com';
      if (variable === 'registration_date') sampleValue = new Date().toLocaleDateString();
      if (variable === 'status') sampleValue = 'Shipped';

      // Replace all occurrences of the variable
      const regex = new RegExp(`{{${variable}}}`, 'g');
      previewHtml = previewHtml.replace(regex, sampleValue);
    });

    // Open preview in a new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Preview: ${form.getValues('subject')}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #2563eb; }
            .preview-header { background: #f3f4f6; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
            .preview-content { border: 1px solid #e5e7eb; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="preview-header">
            <h2>Email Preview</h2>
            <p><strong>Subject:</strong> ${form.getValues('subject')}</p>
            <p><strong>Template:</strong> ${form.getValues('name')}</p>
          </div>
          <div class="preview-content">
            ${previewHtml}
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Email Template</CardTitle>
            <CardDescription>
              Create or edit email templates for various notifications.
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="order_placed">Order Placed</SelectItem>
                        <SelectItem value="order_shipped">Order Shipped</SelectItem>
                        <SelectItem value="order_delivered">Order Delivered</SelectItem>
                        <SelectItem value="order_status">Order Status Update</SelectItem>
                        <SelectItem value="registration">User Registration</SelectItem>
                        <SelectItem value="password_reset">Password Reset</SelectItem>
                        <SelectItem value="customer_signups">Customer Signup (Admin)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of email this template is for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Your order has been confirmed" {...field} />
                  </FormControl>
                  <FormDescription>
                    The subject line of the email. You can use variables like {'{{'} first_name {'}}'}.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Email Body</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={previewEmail}
                    >
                      Preview Email
                    </Button>
                  </div>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      minHeight="400px"
                    />
                  </FormControl>
                  <FormDescription>
                    Available variables: {getVariablesForType(form.getValues('type')).map(v => `${'{{'} ${v} ${'}}'}`).join(', ')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Enable or disable this email template.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
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
