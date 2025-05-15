'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import ProductCard from '@/components/products/ProductCard';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function FlashSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextSaleDate, setNextSaleDate] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchFlashSaleProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_on_sale', true)
          .order('sale_end_date', { ascending: true });

        if (error) throw error;

        // Filter products that are currently on sale or will be on sale soon
        const now = new Date();
        const activeProducts = data.filter(product => {
          if (!product.is_on_sale) return false;
          
          const startDate = product.sale_start_date ? new Date(product.sale_start_date) : null;
          const endDate = product.sale_end_date ? new Date(product.sale_end_date) : null;
          
          // Include products that are currently on sale
          if (isProductOnSale(product)) return true;
          
          // Include products that will be on sale within the next 7 days
          if (startDate && startDate > now) {
            const daysUntilStart = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilStart <= 7;
          }
          
          return false;
        });

        setProducts(activeProducts);

        // Find the next upcoming sale
        const upcomingSales = data
          .filter(product => product.is_on_sale && product.sale_start_date && new Date(product.sale_start_date) > now)
          .sort((a, b) => new Date(a.sale_start_date!).getTime() - new Date(b.sale_start_date!).getTime());

        if (upcomingSales.length > 0) {
          setNextSaleDate(new Date(upcomingSales[0].sale_start_date!));
        }
      } catch (error) {
        console.error('Error fetching flash sale products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFlashSaleProducts();
  }, []);

  // Animation variants for products
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin mx-auto" />
        <p className="mt-4 text-lg">Loading flash sale products...</p>
      </div>
    );
  }

  // Group products by their status (current sale or upcoming)
  const currentSaleProducts = products.filter(product => isProductOnSale(product));
  const upcomingProducts = products.filter(product => !isProductOnSale(product));

  return (
    <div className="container mx-auto py-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg mb-10">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          {/* Animated beams */}
          <motion.div
            className="absolute top-0 left-1/4 w-1 h-full bg-red-300 opacity-30"
            animate={{
              height: ['0%', '100%', '0%'],
              top: ['0%', '0%', '100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop'
            }}
          />
          <motion.div
            className="absolute top-0 left-2/4 w-1 h-full bg-red-300 opacity-30"
            animate={{
              height: ['0%', '100%', '0%'],
              top: ['0%', '0%', '100%']
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatType: 'loop',
              delay: 0.3
            }}
          />
          <motion.div
            className="absolute top-0 left-3/4 w-1 h-full bg-red-300 opacity-30"
            animate={{
              height: ['0%', '100%', '0%'],
              top: ['0%', '0%', '100%']
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              repeatType: 'loop',
              delay: 0.6
            }}
          />
        </div>
        <div className="relative py-16 px-8 text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Flash Sale
          </motion.h1>
          <p className="text-xl md:text-2xl mb-6 max-w-2xl mx-auto">
            Limited time offers on our best products. Grab them before they're gone!
          </p>
          {nextSaleDate && !currentSaleProducts.length && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
              <p className="text-lg font-semibold">Next sale starts on:</p>
              <p className="text-2xl font-bold">{nextSaleDate.toLocaleDateString()} at {nextSaleDate.toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Current Flash Sale Products */}
      {currentSaleProducts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">
            <motion.span
              className="inline-block"
              animate={{ color: ['#ef4444', '#f87171', '#ef4444'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Active Flash Sales
            </motion.span>
          </h2>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {currentSaleProducts.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Upcoming Flash Sale Products */}
      {upcomingProducts.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-6 text-center">Upcoming Flash Sales</h2>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {upcomingProducts.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <div className="relative">
                  <ProductCard product={product} />
                  {product.sale_start_date && (
                    <div className="absolute top-0 left-0 right-0 bg-black/70 text-white p-2 text-center text-sm">
                      Starts: {new Date(product.sale_start_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* No products message */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">No flash sales available at the moment</h2>
          <p className="text-muted-foreground">
            Check back soon for exciting deals and limited-time offers!
          </p>
        </div>
      )}
    </div>
  );
}
