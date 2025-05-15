'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
  price: z.number().min(1, 'Price is required'),
  image_url: z.string().url('Must be a valid URL'),
  inventory_count: z.number().min(1, 'Inventory count is required'),
  category_id: z.string().min(1, 'Category is required'),
  featured: z.boolean().default(false),
  stock: z.number().optional(),
  slug: z.string().min(1, 'Slug is required'),
  discount_percent: z.string().optional(),
  is_on_sale: z.boolean().default(false),
  sale_start_date: z.string().optional(),
  sale_end_date: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function EditProductPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
      stock: '0',
      slug: '',
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
    if (productId) {
      fetchProduct(productId);
    } else {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'No product ID provided',
        variant: 'destructive',
      });
      router.push('/admin/products');
    }

    fetchCategories();
  }, [productId, router]);

  async function fetchProduct(id: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        form.setValue('name', data.name);
        form.setValue('description', data.description);
        form.setValue('price', data.price);
        form.setValue('image_url', data.image_url);
        form.setValue('inventory_count', data.inventory_count);
        form.setValue('category_id', data.category_id);
        form.setValue('featured', data.featured);
        form.setValue('stock', data.stock);
        form.setValue('slug', data.slug);
        form.setValue('discount_percent', data.discount_percent?.toString() || '0');
        form.setValue('is_on_sale', data.is_on_sale || false);
        form.setValue('sale_start_date', data.sale_start_date ? new Date(data.sale_start_date).toISOString().split('T')[0] : '');
        form.setValue('sale_end_date', data.sale_end_date ? new Date(data.sale_end_date).toISOString().split('T')[0] : '');
      }
    } catch (error: any) {
      toast({
        title: 'Error fetching product',
        description: error.message || 'Failed to fetch product',
        variant: 'destructive',
      });
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

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
    if (!productId) return;

    try {
      setSaving(true);

      // Convert string values to numbers for database
      const productData = {
        name: data.name,
        description: data.description,
        price: data.price,
        image_url: data.image_url,
        inventory_count: data.inventory_count,
        category_id: data.category_id,
        featured: data.featured,
        stock: data.stock,
        slug: data.slug,
        discount_percent: data.discount_percent ? parseFloat(data.discount_percent) : 0,
        is_on_sale: data.is_on_sale,
        sale_start_date: data.sale_start_date ? new Date(data.sale_start_date).toISOString() : null,
        sale_end_date: data.sale_end_date ? new Date(data.sale_end_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Product updated',
        description: 'The product has been updated successfully.',
      });

      router.push('/admin/products');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!productId) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Product deleted',
        description: 'The product has been deleted successfully.',
      });

      router.push('/admin/products');
    } catch (error: any) {
      toast({
        title: 'Error deleting product',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    }
  }

  if (isLoading || loading) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Update the product information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            URL-friendly version of the name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock</FormLabel>
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
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Featured Product</FormLabel>
                          <FormDescription>
                            Display this product on the homepage
                          </FormDescription>
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
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Flash Sale</FormLabel>
                          <FormDescription>
                            Mark this product as being on flash sale
                          </FormDescription>
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

                  <div className="flex justify-between pt-4">
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Product
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product
                            and remove it from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Product Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-md overflow-hidden bg-muted mb-4">
                {form.watch('image_url') ? (
                  <img
                    src={form.watch('image_url')}
                    alt={form.watch('name')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No image</p>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-lg">{form.watch('name') || 'Product Name'}</h3>

              <p className="text-2xl font-bold my-2">
                ${parseFloat(form.watch('price') || '0').toFixed(2)}
              </p>

              <div className="text-sm text-muted-foreground mt-4">
                <p><strong>Inventory:</strong> {form.watch('inventory_count') || '0'}</p>
                <p><strong>Stock:</strong> {form.watch('stock') || '0'}</p>
                <p><strong>Featured:</strong> {form.watch('featured') ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
