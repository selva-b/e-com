import { supabase } from '@/lib/supabase/client';
import ProductCard from '@/components/products/ProductCard';
import ProductPage from '@/components/products/ProductPage';

// Configure for static export
export const dynamic = 'force-static';

// Server-side rendering for all products
export default async function ProductsPage() {
  const { data, error } = await supabase
    .from('products')
    .select('*');  // Fetch all products for static paths

  if (error) {
    console.error('Error fetching products:', error);
    return <div className="container mx-auto py-10">Error loading products</div>;
  }

  // If no products, show a message
  if (data.length === 0) {
    return <div className="container mx-auto py-10">No products available</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">All Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.map((product) => (
          <div key={product.id} className="product-card">
            <ProductCard product={product} />
            <div className="client-component-wrapper" data-product-id={product.id}>
              {/* This div will be hydrated with the client component */}
              <ProductPage product={product} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
