'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
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
import { Eye, User, Package, ShoppingCart } from 'lucide-react';

export default function CustomersPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      redirect('/login');
    }
  }, [user, isAdmin, isLoading]);
  
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  async function fetchCustomers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          orders (
            id,
            total,
            status,
            created_at
          )
        `)
        .eq('role', 'customer')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setCustomers(data);
    } catch (error) {
      toast({
        title: 'Error fetching customers',
        description: error.message,
        variant: 'destructive',
      });
    }
  }
  
  function calculateTotalSpent(orders) {
    return orders.reduce((total, order) => total + order.total, 0);
  }
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  {customer.first_name} {customer.last_name}
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.orders.length}</TableCell>
                <TableCell>
                  ${calculateTotalSpent(customer.orders).toFixed(2)}
                </TableCell>
                <TableCell>
                  {new Date(customer.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Customer Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-10 w-10 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold">
                              {customer.first_name} {customer.last_name}
                            </h2>
                            <p className="text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-card p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">Total Orders</h3>
                            </div>
                            <p className="text-2xl font-bold">
                              {customer.orders.length}
                            </p>
                          </div>
                          
                          <div className="bg-card p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <ShoppingCart className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">Total Spent</h3>
                            </div>
                            <p className="text-2xl font-bold">
                              ${calculateTotalSpent(customer.orders).toFixed(2)}
                            </p>
                          </div>
                          
                          <div className="bg-card p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">Member Since</h3>
                            </div>
                            <p className="text-2xl font-bold">
                              {new Date(customer.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-2">Order History</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customer.orders.map((order) => (
                                <TableRow key={order.id}>
                                  <TableCell>{order.id.slice(0, 8)}</TableCell>
                                  <TableCell>
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge>{order.status}</Badge>
                                  </TableCell>
                                  <TableCell>${order.total.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}