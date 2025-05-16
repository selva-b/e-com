'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/context/CartContext';
import { ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Currency } from '@/components/ui/currency';
import WishlistButton from './WishlistButton';

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
}

interface ProductCardProps {
  product: Product;
}

// Helper function to check if a product is currently on sale
function isProductOnSale(product: Product): boolean {
  if (!product.is_on_sale) return false;

  const now = new Date();
  const startDate = product.sale_start_date ? new Date(product.sale_start_date) : null;
  const endDate = product.sale_end_date ? new Date(product.sale_end_date) : null;

  // If no dates are set, consider it always on sale when is_on_sale is true
  if (!startDate && !endDate) return true;

  // Check if current time is within the sale period
  if (startDate && endDate) {
    return now >= startDate && now <= endDate;
  } else if (startDate) {
    return now >= startDate;
  } else if (endDate) {
    return now <= endDate;
  }

  return false;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartContext();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleProductClick = () => {
    router.push(`/product-details?id=${product.id}`);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/product-details?id=${product.id}`);
  };

  return (
    <Card
      className="overflow-hidden h-full transition-all duration-300 hover:shadow-lg cursor-pointer"
      onClick={handleProductClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden aspect-square">
        {/* Product Image */}
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
        />

        {/* Quick Actions Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={handleAddToCart}
            type="button"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only">Add to cart</span>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={handleQuickView}
            type="button"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Quick view</span>
          </Button>
          <WishlistButton
            productId={product.id}
            variant="secondary"
            size="icon"
            className="rounded-full"
          />
        </div>

        {/* Badges for product status */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.featured && (
            <Badge variant="secondary">
              Featured
            </Badge>
          )}

          {product.is_on_sale && isProductOnSale(product) && (
            <Badge variant="destructive" className="bg-red-500 animate-pulse">
              Flash Sale
            </Badge>
          )}

          {product.discount_percent && product.discount_percent > 0 && (
            <Badge variant="default" className="bg-green-500">
              {product.discount_percent}% OFF
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{product.description}</p>

        {/* Price display with discount */}
        <div className="flex items-center gap-2">
          {product.discount_percent && product.discount_percent > 0 ? (
            <>
              <div className="font-bold text-lg text-green-600">
                <Currency value={product.price * (1 - (product.discount_percent / 100))} />
              </div>
              <div className="text-sm text-muted-foreground line-through">
                <Currency value={product.price} />
              </div>
            </>
          ) : (
            <div className="font-bold text-lg">
              <Currency value={product.price} />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={handleAddToCart}
          disabled={product.inventory_count === 0}
          type="button"
        >
          {product.inventory_count === 0 ? 'Out Of Stock' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}