'use client';

import { useState } from 'react';
import { useCartContext } from '@/context/CartContext';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface ProductDetailProps {
  product: Product;
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
          <p className="text-2xl font-semibold mb-4">${product.price.toFixed(2)}</p>

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
