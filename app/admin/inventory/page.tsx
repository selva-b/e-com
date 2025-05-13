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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Package, AlertTriangle, Search } from 'lucide-react';

export default function InventoryPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      redirect('/login');
    }
  }, [user, isAdmin, isLoading]);
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('inventory_count', { ascending: true });
        
      if (error) throw error;
      setProducts(data);
    } catch (error) {
      toast({
        title: 'Error fetching inventory',
        description: error.message,
        variant: 'destructive',
      });
    }
  }
  
  async function updateInventory(productId: string, newCount: number) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ inventory_count: newCount })
        .eq('id', productId);
        
      if (error) throw error;
      
      toast({
        title: 'Inventory updated',
        description: 'The inventory count has been updated successfully.',
      });
      
      fetchProducts();
    } catch (error) {
      toast({
        title: 'Error updating inventory',
        description: error.message,
        variant: 'destructive',
      });
    }
  }
  
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.categories.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const lowStockProducts = products.filter((product) => product.inventory_count < 10);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-card p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Total Products</h3>
          </div>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold">Low Stock Items</h3>
          </div>
          <p className="text-2xl font-bold">{lowStockProducts.length}</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="flex items-center gap-3">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.id.slice(0, 8)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{product.categories.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={product.inventory_count}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value);
                        if (newCount >= 0) {
                          updateInventory(product.id, newCount);
                        }
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">units</span>
                  </div>
                </TableCell>
                <TableCell>
                  {product.inventory_count === 0 ? (
                    <Badge variant="destructive">Out of Stock</Badge>
                  ) : product.inventory_count < 10 ? (
                    <Badge variant="warning">Low Stock</Badge>
                  ) : (
                    <Badge variant="success">In Stock</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newCount = parseInt(prompt('Enter new stock level:', product.inventory_count.toString()) || '0');
                      if (newCount >= 0) {
                        updateInventory(product.id, newCount);
                      }
                    }}
                  >
                    Update Stock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}