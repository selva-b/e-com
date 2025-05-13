'use client';

import { useCartContext } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

interface ProductPageProps {
  product: Product;
}

// Client-side component for product interactivity
export default function ProductPage({ product }: ProductPageProps) {
  const { addToCart } = useCartContext();
  const { toast } = useToast();
  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      inventory_count: product.inventory_count,
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
      duration: 3000,
    });
  };

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleAddToCart}
        disabled={product.inventory_count === 0}
      >
        Quick Add to Cart
      </Button>
    </div>
  );
}
