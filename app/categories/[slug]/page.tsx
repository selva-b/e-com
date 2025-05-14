import CategoryDetailClient from '@/components/categories/CategoryDetailClient';
import { createClient } from '@supabase/supabase-js';

// Configure for static export
export const dynamic = 'force-static';

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate static params for all categories
export async function generateStaticParams() {
  try {
    const { data } = await supabase.from('categories').select('slug');
    
    return (data || []).map((category) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default function CategoryDetailPage({ params }: { params: { slug: string } }) {
  return <CategoryDetailClient slug={params.slug} />;
}
