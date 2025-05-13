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
import {
  Settings,
  Store,
  CreditCard,
  Mail,
  Bell,
  Shield,
} from 'lucide-react';

const storeSettingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeDescription: z.string(),
  contactEmail: z.string().email('Invalid email address'),
  supportPhone: z.string(),
  address: z.string(),
  currency: z.string(),
  taxRate: z.string().transform((val) => parseFloat(val)),
  shippingFee: z.string().transform((val) => parseFloat(val)),
  minOrderAmount: z.string().transform((val) => parseFloat(val)),
});

type StoreSettingsValues = z.infer<typeof storeSettingsSchema>;

const notificationSettingsSchema = z.object({
  orderNotifications: z.boolean(),
  stockAlerts: z.boolean(),
  customerSignups: z.boolean(),
  marketingEmails: z.boolean(),
});

type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

export default function SettingsPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  
  const storeForm = useForm<StoreSettingsValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName: 'E-com',
      storeDescription: 'Premium E-Commerce Store',
      contactEmail: 'contact@E-com.com',
      supportPhone: '+1 (555) 123-4567',
      address: '123 Commerce Street, Shopping District, 10001',
      currency: 'USD',
      taxRate: '10',
      shippingFee: '5',
      minOrderAmount: '50',
    },
  });
  
  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      orderNotifications: true,
      stockAlerts: true,
      customerSignups: true,
      marketingEmails: false,
    },
  });
  
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      redirect('/login');
    }
  }, [user, isAdmin, isLoading]);
  
  async function onStoreSubmit(data: StoreSettingsValues) {
    try {
      // In a real app, you would save these settings to your database
      toast({
        title: 'Settings saved',
        description: 'Store settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive',
      });
    }
  }
  
  async function onNotificationSubmit(data: NotificationSettingsValues) {
    try {
      // In a real app, you would save these settings to your database
      toast({
        title: 'Settings saved',
        description: 'Notification settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
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
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              <CardTitle>Store Settings</CardTitle>
            </div>
            <CardDescription>
              Configure your store's basic information and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...storeForm}>
              <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="space-y-4">
                <FormField
                  control={storeForm.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={storeForm.control}
                  name="storeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={storeForm.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={storeForm.control}
                    name="supportPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Phone</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={storeForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={storeForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={storeForm.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={storeForm.control}
                    name="shippingFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Fee</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={storeForm.control}
                    name="minOrderAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Order Amount</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit">Save Store Settings</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...notificationForm}>
              <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                <FormField
                  control={notificationForm.control}
                  name="orderNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Order Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications for new orders
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
                
                <FormField
                  control={notificationForm.control}
                  name="stockAlerts"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Stock Alerts</FormLabel>
                        <FormDescription>
                          Get notified when products are low in stock
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
                
                <FormField
                  control={notificationForm.control}
                  name="customerSignups"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Customer Signups</FormLabel>
                        <FormDescription>
                          Receive notifications for new customer registrations
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
                
                <FormField
                  control={notificationForm.control}
                  name="marketingEmails"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Marketing Emails</FormLabel>
                        <FormDescription>
                          Receive marketing and promotional email updates
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
                
                <Button type="submit">Save Notification Settings</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}