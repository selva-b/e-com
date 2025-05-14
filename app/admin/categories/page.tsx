'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().url('Must be a valid URL').optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

export default function CategoriesPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      image: '',
    },
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user || !isAdmin) {
        redirect('/login');
      }
    }
  }, [user, isAdmin, isLoading]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchCategories();
    }
  }, [user, isAdmin]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching categories',
        description: error.message || 'Failed to fetch categories',
        variant: 'destructive',
      });
    }
  }

  async function onSubmit(data: CategoryFormValues) {
    try {
      if (isEditing && selectedCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: data.name,
            description: data.description || null,
            image: data.image || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedCategory.id);
          
        if (error) throw error;
        
        toast({
          title: 'Category updated',
          description: 'The category has been updated successfully.',
        });
      } else {
        const slug = data.name.toLowerCase().replace(/\s+/g, '-');
        
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: data.name,
            slug,
            description: data.description || null,
            image: data.image || null,
          }]);
          
        if (error) throw error;
        
        toast({
          title: 'Category created',
          description: 'The category has been created successfully.',
        });
      }
      
      form.reset();
      setIsEditing(false);
      setSelectedCategory(null);
      fetchCategories();
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
      // Check if category has products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id);
      
      if (productsError) throw productsError;
      
      if (products && products.length > 0) {
        toast({
          title: 'Cannot delete category',
          description: 'This category has products associated with it. Remove the products first.',
          variant: 'destructive',
        });
        return;
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Category deleted',
        description: 'The category has been deleted successfully.',
      });
      
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Error deleting category',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    }
  }

  function handleEdit(category: Category) {
    setIsEditing(true);
    setSelectedCategory(category);
    
    form.setValue('name', category.name);
    form.setValue('description', category.description || '');
    form.setValue('image', category.image || '');
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Category Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage your product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Category' : 'Add Category'}</CardTitle>
              <CardDescription>
                {isEditing ? 'Update category details' : 'Create a new category'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Category name" {...field} />
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
                          <Textarea 
                            placeholder="Category description" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2">
                    <Button type="submit">
                      {isEditing ? 'Update Category' : 'Create Category'}
                    </Button>
                    
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedCategory(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
