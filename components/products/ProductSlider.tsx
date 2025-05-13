'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface ProductSliderProps {
  type: 'featured' | 'newest' | 'category';
  categoryId?: string;
}

// Sample placeholder products
const placeholderProducts = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'Immersive sound quality with noise cancellation.',
    price: 249.99,
    image_url: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=600',
    inventory_count: 25,
    category_id: '1',
    slug: 'premium-wireless-headphones',
    featured: true
  },
  {
    id: '2',
    name: 'Designer Leather Wallet',
    description: 'Handcrafted genuine leather wallet with RFID protection.',
    price: 89.99,
    image_url: 'https://images.pexels.com/photos/2079170/pexels-photo-2079170.jpeg?auto=compress&cs=tinysrgb&w=600',
    inventory_count: 50,
    category_id: '5',
    slug: 'designer-leather-wallet',
    featured: true
  },
  {
    id: '3',
    name: 'Smart Fitness Watch',
    description: 'Track your fitness goals with this advanced smart watch.',
    price: 199.99,
    image_url: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=600',
    inventory_count: 15,
    category_id: '1',
    slug: 'smart-fitness-watch',
    featured: false
  },
  {
    id: '4',
    name: 'Luxury Silk Scarf',
    description: 'Elegant hand-painted silk scarf made from premium materials.',
    price: 129.99,
    image_url: 'https://images.pexels.com/photos/6192587/pexels-photo-6192587.jpeg?auto=compress&cs=tinysrgb&w=600',
    inventory_count: 20,
    category_id: '2',
    slug: 'luxury-silk-scarf',
    featured: true
  },
  {
    id: '5',
    name: 'Portable Bluetooth Speaker',
    description: 'Waterproof speaker with 24-hour battery life.',
    price: 79.99,
    image_url: 'https://images.pexels.com/photos/1860817/pexels-photo-1860817.jpeg?auto=compress&cs=tinysrgb&w=600',
    inventory_count: 40,
    category_id: '1',
    slug: 'portable-bluetooth-speaker',
    featured: true
  },
  {
    id: '6',
    name: 'Organic Cotton T-Shirt',
    description: 'Sustainably sourced cotton t-shirt with minimalist design.',
    price: 34.99,
    image_url: 'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=600',
    inventory_count: 100,
    category_id: '2',
    slug: 'organic-cotton-t-shirt',
    featured: false
  }
];

export default function ProductSlider({ type, categoryId }: ProductSliderProps) {
  const [products, setProducts] = useState<Product[]>(placeholderProducts);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const productsPerView = {
    sm: 1,
    md: 2,
    lg: 4
  };
  
  useEffect(() => {
    async function fetchProducts() {
      try {
        let query = supabase.from('products').select('*');
        
        if (type === 'featured') {
          query = query.eq('featured', true);
        } else if (type === 'newest') {
          query = query.order('created_at', { ascending: false }).limit(12);
        } else if (type === 'category' && categoryId) {
          query = query.eq('category_id', categoryId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Keep using placeholder data if there's an error
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, [type, categoryId]);
  
  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? Math.max(0, products.length - productsPerView.lg) : prevIndex - 1
    );
  };
  
  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= products.length - productsPerView.lg ? 0 : prevIndex + 1
    );
  };
  
  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / productsPerView.lg)}%)` }}
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0 p-2"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
      
      {products.length > productsPerView.lg && (
        <div className="flex justify-end mt-6 gap-2">
          <Button 
            onClick={handlePrevious}
            variant="outline"
            size="icon"
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button 
            onClick={handleNext}
            variant="outline"
            size="icon"
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      )}
    </div>
  );
}