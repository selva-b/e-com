'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  description: string;
}

export default function NavbarSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search when clicking outside
  useOnClickOutside(searchRef, () => setIsOpen(false));

  // Toggle the search dialog with keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search for products when the debounced query changes
  useEffect(() => {
    if (!debouncedQuery || !isOpen) {
      setProducts([]);
      return;
    }

    const searchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, slug, price, image_url, description')
          .ilike('name', `%${debouncedQuery}%`)
          .limit(10);

        if (error) throw error;
        setProducts(data || []);
      } catch (error: any) {
        console.error('Error searching products:', error);
        toast({
          title: 'Search Error',
          description: 'Failed to search products. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [debouncedQuery, isOpen, toast]);

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/product?slug=${product.slug}`);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="relative" ref={searchRef}>
      <Button
        variant="outline"
        size="sm"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search products...</span>
        <span className="sr-only">Search products</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-full min-w-[300px] max-w-md rounded-md border bg-background shadow-lg z-50">
          <div className="flex items-center border-b p-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            
            {!loading && query && products.length === 0 && (
              <div className="py-6 text-center text-sm">No products found.</div>
            )}
            
            {!loading && products.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Products
                </div>
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="flex-shrink-0 rounded-md overflow-hidden w-10 h-10 bg-muted">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <Search className="h-4 w-4 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden text-left">
                      <span className="font-medium truncate">{product.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {product.description?.substring(0, 50)}
                        {product.description?.length > 50 ? '...' : ''}
                      </span>
                    </div>
                    <span className="font-medium">{formatPrice(product.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
