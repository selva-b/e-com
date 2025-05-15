'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { redirect } from 'next/navigation';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Save } from 'lucide-react';
import { Currency } from '@/components/ui/currency';

const currencySchema = z.object({
  code: z.string().min(1, 'Currency code is required'),
  symbol: z.string().min(1, 'Currency symbol is required'),
  position: z.enum(['before', 'after']),
  decimalSeparator: z.string().min(1, 'Decimal separator is required').max(1, 'Must be a single character'),
  thousandSeparator: z.string().min(1, 'Thousand separator is required').max(1, 'Must be a single character'),
  decimalPlaces: z.string().transform((val) => parseInt(val, 10)),
});

type CurrencyFormValues = z.infer<typeof currencySchema>;

export default function CurrencySettingsPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const { settings, updateSettings, formatCurrency } = useCurrency();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      code: settings.code,
      symbol: settings.symbol,
      position: settings.position,
      decimalSeparator: settings.decimalSeparator,
      thousandSeparator: settings.thousandSeparator,
      decimalPlaces: settings.decimalPlaces.toString(),
    },
  });
  
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      redirect('/login');
    }
  }, [user, isAdmin, isLoading]);
  
  useEffect(() => {
    // Update form values when settings are loaded
    form.reset({
      code: settings.code,
      symbol: settings.symbol,
      position: settings.position,
      decimalSeparator: settings.decimalSeparator,
      thousandSeparator: settings.thousandSeparator,
      decimalPlaces: settings.decimalPlaces.toString(),
    });
  }, [settings, form]);
  
  async function onSubmit(data: CurrencyFormValues) {
    try {
      setSaving(true);
      
      await updateSettings({
        code: data.code,
        symbol: data.symbol,
        position: data.position,
        decimalSeparator: data.decimalSeparator,
        thousandSeparator: data.thousandSeparator,
        decimalPlaces: data.decimalPlaces,
      });
      
      toast({
        title: 'Currency settings saved',
        description: 'Your currency settings have been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message || 'An error occurred while saving settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Currency Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Currency Configuration</CardTitle>
              </div>
              <CardDescription>
                Configure how currency is displayed throughout your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Code</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="USD">USD - US Dollar</option>
                              <option value="EUR">EUR - Euro</option>
                              <option value="GBP">GBP - British Pound</option>
                              <option value="INR">INR - Indian Rupee</option>
                              <option value="JPY">JPY - Japanese Yen</option>
                              <option value="CNY">CNY - Chinese Yuan</option>
                              <option value="AUD">AUD - Australian Dollar</option>
                              <option value="CAD">CAD - Canadian Dollar</option>
                            </select>
                          </FormControl>
                          <FormDescription>
                            The three-letter ISO code for your currency
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Symbol</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="₹" />
                          </FormControl>
                          <FormDescription>
                            The symbol used to represent your currency (e.g., $, €, ₹)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Symbol Position</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="before" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Before amount (e.g., ₹100)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="after" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                After amount (e.g., 100₹)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="decimalSeparator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Decimal Separator</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={1} />
                          </FormControl>
                          <FormDescription>
                            Character to separate decimal part (e.g., .)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="thousandSeparator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thousand Separator</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={1} />
                          </FormControl>
                          <FormDescription>
                            Character to separate thousands (e.g., ,)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="decimalPlaces"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Decimal Places</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="4"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of decimal places to show
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                How your currency will be displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-md">
                <p className="text-sm text-muted-foreground mb-1">Product Price:</p>
                <p className="text-2xl font-bold">
                  <Currency value={1299.99} />
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <p className="text-sm text-muted-foreground mb-1">Order Total:</p>
                <p className="text-xl font-semibold">
                  <Currency value={9876.54} />
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <p className="text-sm text-muted-foreground mb-1">Shipping Fee:</p>
                <p className="text-base">
                  <Currency value={150} />
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
