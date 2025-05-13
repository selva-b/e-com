'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCartContext } from '@/context/CartContext';
import { redirect, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import Script from 'next/script';

// Define the form schema
const checkoutSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface Address {
  id: string;
  user_id: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export default function CheckoutPage() {
  const { user, profile, isLoading } = useAuth();
  const { cart, cartTotal, clearCart } = useCartContext();
  const [address, setAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    },
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        redirect('/login');
      } else if (cart.length === 0) {
        redirect('/cart');
      }
    }
  }, [user, isLoading, cart]);

  useEffect(() => {
    if (user) {
      fetchAddress();
    }
  }, [user]);

  async function fetchAddress() {
    if (!user) return;
    
    try {
      setAddressLoading(true);
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setAddress(data);
        form.reset({
          address: data.address,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country,
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    } finally {
      setAddressLoading(false);
    }
  }

  async function onSubmit(data: CheckoutFormValues) {
    if (!user) return;
    
    try {
      setProcessingPayment(true);
      
      // For demo purposes, we'll create a simulated order ID
      // In a production environment, you would create an order via Razorpay's API
      const orderId = `order_${Date.now()}`;
      const amount = Math.round(cartTotal * 100); // Razorpay expects amount in paise
      
      // Initialize Razorpay payment
      if (typeof window.Razorpay !== 'undefined') {
        const options = {
          key: 'rzp_test_3eVIB91QVNpqhz', // Your Razorpay Key ID
          amount: amount,
          currency: 'INR',
          name: 'E-com Store',
          description: 'Purchase from E-com',
          // order_id: orderId, // Comment this out for testing as it requires a real Razorpay order
          handler: function(response: any) {
            // Handle successful payment
            handlePaymentSuccess(response, data);
          },
          prefill: {
            name: `${profile?.first_name} ${profile?.last_name}`,
            email: profile?.email,
          },
          modal: {
            ondismiss: function() {
              setProcessingPayment(false);
            }
          },
          theme: {
            color: '#3B82F6',
          },
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function(response: any) {
          handlePaymentFailure(response);
        });
        razorpay.open();
      } else {
        toast({
          title: 'Payment Error',
          description: 'Razorpay failed to load. Please try again.',
          variant: 'destructive',
        });
        setProcessingPayment(false);
      }
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'An error occurred during payment processing',
        variant: 'destructive',
      });
      setProcessingPayment(false);
    }
  }

  async function handlePaymentSuccess(response: any, addressData: CheckoutFormValues) {
    try {
      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id,
          status: 'processing',
          total: cartTotal,
          address: addressData.address,
          city: addressData.city,
          state: addressData.state,
          postal_code: addressData.postal_code,
          country: addressData.country,
          payment_id: response.razorpay_payment_id || `payment_${Date.now()}`,
          order_id: response.razorpay_order_id || `order_${Date.now()}`,
        }])
        .select('id')
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Clear cart
      clearCart();
      
      // Redirect to success page
      router.push(`/order-success?id=${orderData.id}`);
    } catch (error: any) {
      toast({
        title: 'Order Error',
        description: error.message || 'Failed to create order',
        variant: 'destructive',
      });
      router.push('/order-failure');
    }
  }

  function handlePaymentFailure(response: any) {
    toast({
      title: 'Payment Failed',
      description: response.error?.description || 'Your payment has failed. Please try again.',
      variant: 'destructive',
    });
    setProcessingPayment(false);
    router.push('/order-failure');
  }

  if (isLoading || addressLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading checkout...</p>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
      
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
                <CardDescription>
                  Enter your shipping details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="NY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="10001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="United States" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-6" 
                      disabled={processingPayment || !razorpayLoaded}
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Proceed to Payment'
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
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="flex flex-col gap-4 pt-4">
                <div className="flex justify-between w-full">
                  <p>Subtotal</p>
                  <p>${(cartTotal * 0.9).toFixed(2)}</p>
                </div>
                <div className="flex justify-between w-full">
                  <p>Tax (10%)</p>
                  <p>${(cartTotal * 0.1).toFixed(2)}</p>
                </div>
                <div className="flex justify-between w-full font-bold">
                  <p>Total</p>
                  <p>${cartTotal.toFixed(2)}</p>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

// Add Razorpay to the Window interface
declare global {
  interface Window {
    Razorpay: any;
  }
}
