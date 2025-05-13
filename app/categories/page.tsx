'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Configure for static export
export const dynamic = 'force-static';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-16 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">Shop by Category</h1>
      
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No categories found.</p>
          <Button asChild>
            <Link href="/products">Browse All Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden flex flex-col h-full">
              <div className="aspect-video relative overflow-hidden bg-muted">
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="object-cover w-full h-full transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-muted-foreground">{category.name}</span>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              {category.description && (
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">{category.description}</p>
                </CardContent>
              )}
              <CardFooter className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={`/category?slug=${category.slug}`}>View Products</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
