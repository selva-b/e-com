'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { generateSimpleReceipt } from '@/lib/pdf/generateSimpleReceipt';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Eye, Package, ShoppingBag, Download, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  products: {
    name: string;
    price: number;
    image_url: string;
  };
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  payment_id?: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const { user, profile, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/login');
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  async function fetchOrders() {
    if (!user) return;
    
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
              price,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error fetching orders',
        description: 'There was an error loading your orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function handleDownloadReceipt(order: Order) {
    if (!profile) return;
    
    try {
      setGeneratingPdf(order.id);
      generateSimpleReceipt(order, profile);
      toast({
        title: 'Receipt Downloaded',
        description: 'Your order receipt has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdf(null);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
            <CardDescription>Loading your order history...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Button asChild>
                <a href="/products">Browse Products</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              View and track your orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Order ID: {selectedOrder.id.slice(0, 8)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Date: {new Date(selectedOrder.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Badge className={getStatusColor(selectedOrder.status)}>
                                    {selectedOrder.status}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">
                                      Shipping Address
                                    </h3>
                                    <p>{selectedOrder.address}</p>
                                    <p>{selectedOrder.city}, {selectedOrder.state} {selectedOrder.postal_code}</p>
                                    <p>{selectedOrder.country}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Order Summary</h3>
                                    <div className="flex justify-between">
                                      <span>Subtotal</span>
                                      <span>${(selectedOrder.total * 0.9).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Tax</span>
                                      <span>${(selectedOrder.total * 0.1).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold mt-2">
                                      <span>Total</span>
                                      <span>${selectedOrder.total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div>
                                  <h3 className="font-semibold mb-4">Order Items</h3>
                                  <div className="space-y-4">
                                    {selectedOrder.order_items.map((item) => (
                                      <div key={item.id} className="flex gap-4">
                                        <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                          <img 
                                            src={item.products.image_url} 
                                            alt={item.products.name} 
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="font-medium">{item.products.name}</h4>
                                          <div className="flex justify-between mt-1">
                                            <span className="text-sm text-muted-foreground">
                                              Qty: {item.quantity} × ${item.price.toFixed(2)}
                                            </span>
                                            <span className="font-medium">
                                              ${(item.quantity * item.price).toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="flex justify-center gap-4">
                                  {selectedOrder.status === 'shipped' && (
                                    <Button>
                                      <Package className="mr-2 h-4 w-4" />
                                      Track Shipment
                                    </Button>
                                  )}
                                  
                                  <Button 
                                    variant="outline"
                                    onClick={() => handleDownloadReceipt(selectedOrder)}
                                    disabled={generatingPdf === selectedOrder.id}
                                  >
                                    {generatingPdf === selectedOrder.id ? (
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
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDownloadReceipt(order)}
                          disabled={generatingPdf === order.id}
                        >
                          {generatingPdf === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
