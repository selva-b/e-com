'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
  productId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function WishlistButton({ 
  productId, 
  variant = 'secondary',
  size = 'icon',
  className = 'rounded-full'
}: WishlistButtonProps) {
  const { user, isLoading } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      checkWishlistStatus();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [user, isLoading, productId]);

  async function checkWishlistStatus() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user?.id)
        .eq('product_id', productId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setIsInWishlist(!!data);
      if (data) {
        setWishlistItemId(data.id);
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to add items to your wishlist.',
        duration: 3000,
      });
      router.push('/login');
      return;
    }
    
    try {
      if (isInWishlist && wishlistItemId) {
        // Remove from wishlist
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('id', wishlistItemId);
        
        if (error) throw error;
        
        setIsInWishlist(false);
        setWishlistItemId(null);
        
        toast({
          title: 'Removed from wishlist',
          description: 'The item has been removed from your wishlist.',
          duration: 3000,
        });
      } else {
        // Add to wishlist
        const { data, error } = await supabase
          .from('wishlist')
          .insert([{
            user_id: user.id,
            product_id: productId,
          }])
          .select('id')
          .single();
        
        if (error) throw error;
        
        setIsInWishlist(true);
        if (data) {
          setWishlistItemId(data.id);
        }
        
        toast({
          title: 'Added to wishlist',
          description: 'The item has been added to your wishlist.',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({
        title: 'Error',
        description: 'There was an error updating your wishlist. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${isInWishlist ? 'text-red-500 hover:text-red-600' : ''}`}
      onClick={toggleWishlist}
      disabled={loading}
    >
      <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
      <span className="sr-only">
        {isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      </span>
    </Button>
  );
}
