'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  inventory_count: number;
  slug: string;
  featured: boolean;
}

export default function CategoryDetailClient({ slug }: { slug: string }) {
  const router = useRouter();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (slug) {
      fetchCategoryAndProducts(slug);
    } else {
      setLoading(false);
      // If no slug is provided, redirect to categories page
      router.push('/categories');
    }
  }, [slug, router]);

  async function fetchCategoryAndProducts(categorySlug: string) {
    try {
      setLoading(true);

      // Fetch category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .single();

      if (categoryError) {
        if (categoryError.code === 'PGRST116') {
          // No category found with this slug
          router.push('/categories');
          return;
        }
        throw categoryError;
      }

      setCategory(categoryData);

      // Fetch products for this category
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryData.id)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error: any) {
      toast.toast({
        title: 'Error',
        description: error.message || 'Failed to fetch category data',
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
        <p className="mt-2">Loading products...</p>
      </div>
    );
  }

  if (!category) {
    // If category is not found, redirect to the categories page
    useEffect(() => {
      if (!loading) {
        router.push('/categories');
      }
    }, [loading, router]);

    return (
      <div className="container max-w-7xl mx-auto py-16 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-16 px-4">
      <div className="mb-8">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href="/categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Link>
        </Button>

        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-2">{category.description}</p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No products found in this category.</p>
          <Button asChild>
            <Link href="/products">Browse All Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
