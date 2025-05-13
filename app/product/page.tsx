'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useCartContext } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import WishlistButton from '@/components/products/WishlistButton';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  stock: number;
  featured: boolean;
  categories: {
    name: string;
    slug: string;
  };
}

export default function ProductPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get('slug');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCartContext();
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchProduct(slug);
    } else {
      setLoading(false);
      router.push('/products');
    }
  }, [slug, router]);

  async function fetchProduct(productSlug: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            name,
            slug
          )
        `)
        .eq('slug', productSlug)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          router.push('/products');
          return;
        }
        throw error;
      }
      
      setProduct(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart() {
    if (!product) return;
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity,
    });
    
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
  }

  function incrementQuantity() {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  }

  function decrementQuantity() {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  }

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-16 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container max-w-6xl mx-auto py-16 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <p className="mb-8">The product you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-16 px-4">
      <Button variant="outline" size="sm" asChild className="mb-8">
        <Link href="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-2 mb-4">
            <Link 
              href={`/category?slug=${product.categories.slug}`}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {product.categories.name}
            </Link>
          </div>
          
          <p className="text-2xl font-bold mb-6">${product.price.toFixed(2)}</p>
          
          <div className="prose max-w-none mb-8">
            <p>{product.description}</p>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border rounded-md">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={incrementQuantity}
                disabled={product.stock <= quantity}
              >
                +
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {product.stock} items available
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleAddToCart} 
              disabled={product.stock === 0}
              className="flex-1"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            
            <WishlistButton 
              productId={product.id} 
              variant="outline"
              className="w-12 flex-shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
