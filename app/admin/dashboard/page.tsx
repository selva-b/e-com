'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateSetting, getSetting } from '@/lib/services/settings-service';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Package, ShoppingCart, Users, DollarSign, Zap, Loader2 } from 'lucide-react';

interface OrderData {
  name: string;
  sales: number;
}

export default function AdminDashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalCategories: 0,
  });
  const [ordersData, setOrdersData] = useState<OrderData[]>([]);
  const [flashSaleEnabled, setFlashSaleEnabled] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      redirect('/login');
    }
  }, [user, isAdmin, isLoading]);

  // Fetch flash sale status
  useEffect(() => {
    const fetchFlashSaleStatus = async () => {
      try {
        // Get the setting directly from the settings service
        const value = await getSetting('show_flash_sale_section');
        setFlashSaleEnabled(value === 'true');
      } catch (error) {
        console.error('Error fetching flash sale status:', error);
      }
    };

    fetchFlashSaleStatus();
  }, []);

  // Toggle flash sale section
  const toggleFlashSale = async () => {
    try {
      setToggleLoading(true);

      // Update the setting directly in the database
      await updateSetting('show_flash_sale_section', (!flashSaleEnabled).toString());

      // Update the local state
      setFlashSaleEnabled(!flashSaleEnabled);

      // Show success message
      toast({
        title: 'Flash Sale Section Updated',
        description: `Flash sale section has been ${!flashSaleEnabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error: any) {
      console.error('Error toggling flash sale:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while updating flash sale section',
        variant: 'destructive',
      });
    } finally {
      setToggleLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch data asynchronously
      const { data: salesData } = await supabase.from('orders').select('total_amount').single();
      const totalSales = salesData ? salesData.total_amount : 0;

      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      const { count: totalCategories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Update the stats state
      setStats({
        totalSales: totalSales || 0,
        totalOrders: totalOrders || 0,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        totalCategories: totalCategories || 0,
      });

      // Simulated sales data
      setOrdersData([
        { name: 'Jan', sales: 4000 },
        { name: 'Feb', sales: 3000 },
        { name: 'Mar', sales: 5000 },
        { name: 'Apr', sales: 2780 },
        { name: 'May', sales: 1890 },
        { name: 'Jun', sales: 2390 },
        { name: 'Jul', sales: 3490 },
      ]);
    };

    fetchData();
  }, []); // Empty dependency array to run only once

  // Category distribution data
  const categoryData = [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 25 },
    { name: 'Home & Kitchen', value: 20 },
    { name: 'Beauty', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>



      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="p-4 bg-primary/10 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
              <h3 className="text-2xl font-bold">${stats.totalSales.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="p-4 bg-primary/10 rounded-full mr-4">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <h3 className="text-2xl font-bold">{stats.totalOrders}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="p-4 bg-primary/10 rounded-full mr-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
              <h3 className="text-2xl font-bold">{stats.totalCustomers}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="p-4 bg-primary/10 rounded-full mr-4">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <h3 className="text-2xl font-bold">{stats.totalProducts}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
 {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flash Sale Section</CardTitle>
              <CardDescription>
                Toggle the flash sale section on the home page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className={`h-5 w-5 ${flashSaleEnabled ? 'text-red-500' : 'text-muted-foreground'}`} />
                  <span>{flashSaleEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <Switch
                  checked={flashSaleEnabled}
                  onCheckedChange={toggleFlashSale}
                  disabled={toggleLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.location.href = '/admin/flash-sale-settings'}
              >
                Manage Flash Sale Settings
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      {/* Charts */}
      <Tabs defaultValue="sales" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ordersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--chart-1))"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
