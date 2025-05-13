'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ProductDetail from '@/components/products/ProductDetail';
import { Skeleton } from '@/components/ui/skeleton';

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
}

export default function ProductDetailsPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) {
        setError('Product ID is required');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) {
          throw error;
        }

        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-xl">{error || 'Product not found'}</p>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Product Image Skeleton */}
        <Skeleton className="aspect-square w-full rounded-lg" />

        {/* Product Details Skeleton */}
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-6 w-1/3" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-12" />
          </div>
          <div className="pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
