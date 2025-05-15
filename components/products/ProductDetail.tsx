'use client';

import { useState, useEffect } from 'react';
import { useCartContext } from '@/context/CartContext';
import { Minus, Plus, ShoppingCart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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

interface ProductDetailProps {
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

// Flash Sale Countdown Component
function FlashSaleCountdown({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Clean up
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="mt-2 flex items-center">
      <Clock className="h-4 w-4 mr-2 text-red-600" />
      <div className="flex gap-2 text-sm font-medium text-red-600">
        <div className="flex flex-col items-center">
          <span className="text-lg">{timeLeft.days}</span>
          <span className="text-xs">days</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="text-xs">hrs</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="text-xs">mins</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="text-xs">secs</span>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addToCart } = useCartContext();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      inventory_count: product.inventory_count,
      quantity,
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
      duration: 3000,
    });
  };

  const incrementQuantity = () => {
    if (quantity < product.inventory_count) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

          {/* Price display with discount */}
          <div className="flex items-center gap-3 mb-4">
            {product.discount_percent && product.discount_percent > 0 ? (
              <>
                <p className="text-2xl font-semibold text-green-600">
                  <Currency value={product.price * (1 - (product.discount_percent / 100))} />
                </p>
                <p className="text-xl text-muted-foreground line-through">
                  <Currency value={product.price} />
                </p>
                <Badge className="bg-green-500 ml-2">
                  {product.discount_percent}% OFF
                </Badge>
              </>
            ) : (
              <p className="text-2xl font-semibold">
                <Currency value={product.price} />
              </p>
            )}
          </div>

          {/* Flash Sale Countdown */}
          {product.is_on_sale && isProductOnSale(product) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-600 font-semibold mb-1">
                <Badge variant="destructive" className="bg-red-500 animate-pulse">Flash Sale</Badge>
                <span>Limited Time Offer!</span>
              </div>
              {product.sale_start_date && new Date() < new Date(product.sale_start_date) && (
                <p className="text-sm text-red-600">
                  Sale starts: {new Date(product.sale_start_date).toLocaleString()}
                </p>
              )}
              {product.sale_end_date && (
                <div>
                  <p className="text-sm text-red-600">
                    Sale ends: {new Date(product.sale_end_date).toLocaleString()}
                  </p>
                  <FlashSaleCountdown endDate={new Date(product.sale_end_date)} />
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-600">{product.description}</p>
          </div>

          {/* Inventory Status */}
          <div className="mb-6">
            <p className={`${product.inventory_count > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
              {product.inventory_count > 0
                ? `In Stock (${product.inventory_count} available)`
                : 'Out of Stock'}
            </p>
          </div>

          {/* Quantity Selector */}
          {product.inventory_count > 0 && (
            <div className="flex items-center mb-6">
              <span className="mr-4 font-medium">Quantity:</span>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={incrementQuantity}
                  disabled={quantity >= product.inventory_count}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <div className="flex gap-4 mb-8">
            <Button
              className="flex-1"
              size="lg"
              onClick={handleAddToCart}
              disabled={product.inventory_count === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {product.inventory_count === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <WishlistButton
              productId={product.id}
              variant="outline"
              size="lg"
              className=""
            />
          </div>

          {/* Product Information Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="py-4">
              <p>{product.description}</p>
            </TabsContent>
            <TabsContent value="details" className="py-4">
              <ul className="list-disc pl-5 space-y-2">
                <li>Product ID: {product.id}</li>
                <li>SKU: {product.slug}</li>
                <li>{product.featured ? 'Featured Product' : 'Standard Product'}</li>
              </ul>
            </TabsContent>
            <TabsContent value="shipping" className="py-4">
              <p>Standard shipping: 3-5 business days</p>
              <p>Express shipping: 1-2 business days</p>
              <p>Free shipping on orders over $50</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
