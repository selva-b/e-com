'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartContext } from '@/context/CartContext';
import { ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartContext();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-lg">
      <Link
        href={`/product-details?id=${product.id}`}
        className="block"
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
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="sr-only">Add to cart</span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              asChild
            >
              <Link href={`/product-details?id=${product.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">Quick view</span>
              </Link>
            </Button>
            <WishlistButton
              productId={product.id}
              variant="secondary"
              size="icon"
              className="rounded-full"
            />
          </div>

          {/* Badge for featured products */}
          {product.featured && (
            <Badge
              className="absolute top-2 left-2"
              variant="secondary"
            >
              Featured
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{product.description}</p>
          <p className="font-bold text-lg">${product.price.toFixed(2)}</p>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={product.inventory_count === 0} // Optionally disable button if out of stock
          >
            {product.inventory_count === 0 ? 'Out Of Stock' : 'Add to Cart'}
          </Button>
        </CardFooter>

      </Link>
    </Card>
  );
}