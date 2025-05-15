'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect, useRouter } from 'next/navigation';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  image_url: z.string().url('Must be a valid URL'),
  inventory_count: z.string().min(1, 'Inventory count is required'),
  category_id: z.string().min(1, 'Category is required'),
  featured: z.boolean().default(false),
  discount_percent: z.string().optional(),
  is_on_sale: z.boolean().default(false),
  sale_start_date: z.string().optional(),
  sale_end_date: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  inventory_count: number;
  category_id: string;
  slug: string;
  featured: boolean;
  discount_percent?: number | null;
  is_on_sale?: boolean;
  sale_start_date?: string | null;
  sale_end_date?: string | null;
  categories?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function ProductsPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '0',
      image_url: '',
      inventory_count: '0',
      category_id: '',
      featured: false,
      discount_percent: '0',
      is_on_sale: false,
      sale_start_date: '',
      sale_end_date: '',
    },
  });

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      redirect('/login');
    }
  }, [user, isAdmin, isLoading]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)');

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching products',
        description: error.message || 'Failed to fetch products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) throw error;
      setCategories(data as Category[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching categories',
        description: error.message || 'Failed to fetch categories',
        variant: 'destructive',
      });
    }
  }

  async function onSubmit(data: ProductFormValues) {
    try {
      // Convert string values to numbers for database
      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        image_url: data.image_url,
        inventory_count: parseInt(data.inventory_count),
        category_id: data.category_id,
        featured: data.featured,
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
        discount_percent: data.discount_percent ? parseFloat(data.discount_percent) : 0,
        is_on_sale: data.is_on_sale,
        sale_start_date: data.sale_start_date ? new Date(data.sale_start_date).toISOString() : null,
        sale_end_date: data.sale_end_date ? new Date(data.sale_end_date).toISOString() : null,
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast({
        title: 'Product created',
        description: 'The product has been created successfully.',
      });

      form.reset();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Product deleted',
        description: 'The product has been deleted successfully.',
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error deleting product',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setProductToDelete(null);
    }
  }

  function handleEdit(product: Product) {
    // Navigate to the edit page with the product ID
    router.push(`/admin/products/edit?id=${product.id}`);
  }

  if (isLoading || loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inventory_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured Product</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Display this product on the homepage
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter discount percentage (0-100)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_on_sale"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Flash Sale</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Mark this product as being on flash sale
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sale_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        When the flash sale starts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sale_end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        When the flash sale ends
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Create Product
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No products found. Add your first product to get started.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.categories?.name}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.inventory_count}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the product
                              "{product.name}" and remove it from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
