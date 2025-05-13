'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useCartContext } from '@/context/CartContext';
import Link from 'next/link';

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

interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products: Product;
}

export default function WishlistPage() {
  const { user, isLoading } = useAuth();
  const { addToCart } = useCartContext();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/login');
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  async function fetchWishlist() {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          products:product_id (*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast({
        title: 'Error fetching wishlist',
        description: 'There was an error loading your wishlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWishlist(itemId: string) {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
      
      toast({
        title: 'Item removed',
        description: 'The item has been removed from your wishlist.',
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'Error removing item',
        description: 'There was an error removing the item. Please try again.',
        variant: 'destructive',
      });
    }
  }

  function handleAddToCart(product: Product) {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      inventory_count: product.inventory_count,
    });
    
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
      duration: 3000,
    });
  }

  if (isLoading || loading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle>My Wishlist</CardTitle>
            <CardDescription>Loading your wishlist...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
      
      {wishlistItems.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-4">
                Save items you love to your wishlist and revisit them anytime.
              </p>
              <Button asChild>
                <a href="/products">Browse Products</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-48 h-48 bg-muted overflow-hidden flex-shrink-0">
                  <img 
                    src={item.products.image_url} 
                    alt={item.products.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="flex-1 p-6">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <Link 
                        href={`/product-details?id=${item.products.id}`}
                        className="text-xl font-semibold hover:underline"
                      >
                        {item.products.name}
                      </Link>
                      <p className="text-muted-foreground mt-2 line-clamp-2">
                        {item.products.description}
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xl font-bold">${item.products.price.toFixed(2)}</p>
                        <p className={item.products.inventory_count > 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.products.inventory_count > 0 ? 'In Stock' : 'Out of Stock'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => handleAddToCart(item.products)}
                          disabled={item.products.inventory_count === 0}
                          className="flex-1"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => removeFromWishlist(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
