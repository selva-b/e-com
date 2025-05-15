import CategoryDetailClient from '@/components/categories/CategoryDetailClient';
import { createClient } from '@/lib/supabase/server';

// Configure for static export
export const dynamic = 'force-static';

// Generate static params for all categories
export async function generateStaticParams() {
  try {
    // Create a server-side Supabase client
    const supabase = createClient();

    const { data } = await supabase.from('categories').select('slug');

    return (data || []).map((category) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Make the component async to properly handle params
export default async function CategoryDetailPage({ params }: { params: { slug: string } }) {
  // Await the params to ensure they're fully resolved
  const slug = await Promise.resolve(params.slug);

  return <CategoryDetailClient slug={slug} />;
}
