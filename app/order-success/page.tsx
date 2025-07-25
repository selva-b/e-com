'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { generateSimpleReceipt } from '@/lib/pdf/generateSimpleReceipt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, CheckCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
  payment_id?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  order_items: OrderItem[];
}

// Component that uses useSearchParams
function OrderSuccessContent() {
  const { user, profile, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/login');
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
    }
  }, [user, orderId]);

  async function fetchOrder() {
    if (!user || !orderId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products:product_id (
              name,
              image_url
            )
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadReceipt() {
    if (!order || !profile) return;
    
    try {
      setGeneratingPdf(true);
      generateSimpleReceipt(order, profile);
      setTimeout(() => {
        setGeneratingPdf(false);
      }, 1000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setGeneratingPdf(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
        <p className="mb-8">We couldn't find the order you're looking for.</p>
        <Button asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Order Successful!</h1>
        <p className="text-muted-foreground">
          Thank you for your purchase. Your order has been received.
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-medium">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment ID</p>
              <p className="font-medium">{order.payment_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{order.status}</p>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.products.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t mt-6 pt-6">
            <div className="flex justify-between mb-2">
              <p>Subtotal</p>
              <p>${(order.total * 0.9).toFixed(2)}</p>
            </div>
            <div className="flex justify-between mb-2">
              <p>Tax (10%)</p>
              <p>${(order.total * 0.1).toFixed(2)}</p>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <p>Total</p>
              <p>${order.total.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleDownloadReceipt} disabled={generatingPdf}>
          {generatingPdf ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </>
          )}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/orders">
            <ShoppingBag className="mr-2 h-4 w-4" />
            View All Orders
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Loading fallback component
function OrderSuccessLoading() {
  return (
    <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
      <div className="text-center mb-8">
        <div className="h-16 w-16 mx-auto mb-4 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 rounded mx-auto animate-pulse" />
      </div>
      <div className="bg-gray-50 rounded-lg p-8 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <p className="mt-4 text-muted-foreground">Loading order details...</p>
    </div>
  );
}

// Main component that wraps everything in Suspense
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<OrderSuccessLoading />}>
      <OrderSuccessContent />
    </Suspense>
  );
}
